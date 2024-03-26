from math import log
from re import U
from channels.generic.websocket						import AsyncWebsocketConsumer, AsyncConsumer
from channels.db									import database_sync_to_async
from typing                                         import Dict, Any
from users.models                                   import user_model_to_dict
from pong.consumers                                 import SingletonMeta
from pong.models                                    import Pong, pong_model_to_dict
from users.models                                   import User
from .models                                        import Tournament
import asyncio
import json
import random


def create_game(player1, player2):
    user1 = User.objects.get(username=player1['user'].get('username'))
    user2 = User.objects.get(username=player2['user'].get('username'))
    game = Pong.objects.create(player1=user1, player2=user2)
    game_data = pong_model_to_dict(game)
    game_data['timestamp'] = game_data['timestamp'].isoformat()
    game_data['winner'] = None
    return game_data


def finish_tournament(tournamement_id: int, winner: Dict[str, Any]):
    tournament = Tournament.objects.get(id=tournamement_id)
    tournament.winner = User.objects.get(username=winner['username'])
    tournament.status = 'closed'
    tournament.save()

class TournamentGroupManager(metaclass=SingletonMeta):
    _groups: Dict[str, Dict[Any, Any]] = {}

    def add(self, group: str, user: str):
        self._groups.setdefault(group, {})
        if "users" not in self._groups[group]:
            self._groups[group]["users"] = []
        self._groups[group]["users"].append(user)
        return self._groups[group]

    def group_size(self, group: str):
        if group not in self._groups:
            return 0
        return len(self._groups[group]["users"])
    
    def remove(self, group: str, user: str):
        if group not in self._groups:
            return
        self._groups[group]["users"] = [user for user in self._groups[group]["users"] if user != user]
    
    def get(self, group: str):
        if group not in self._groups:
            return {}
        instance = self._groups[group]
        return {
            'group': group,
            'users': [{'user': user_model_to_dict(user, avatar=False)} for user in instance['users']]
        }
    
    def is_empty(self, group: str):
        if group not in self._groups:
            return True
        if self._groups[group] == []:
            return True
        return False

import logging

logger  = logging.getLogger(__name__)

class TournamentRunner(AsyncConsumer):
    alias = 'tournament_runner'
    _tournaments: Dict[str, Any] = {}
    _tasks: Dict[str, asyncio.Task] = {}
    _groups = TournamentGroupManager()

    async def start_tournament(self, event):
        group_name = str(event['name'])
        message = json.loads(event['data'])
        users = message['users']
        
        self._tournaments.setdefault(group_name, {})
        self._tournaments[group_name]['users'] = users
        self._tournaments[group_name]['games'] = []
        self._tournaments[group_name]['next_games'] = []
        pairs = [users[i:i+2] for i in range(0, len(users), 2)]
        for pair in pairs:
            if len(pair) == 1:
                self._tournaments[group_name]['stragler'] = pair[0]
                continue
            game = await database_sync_to_async(create_game)(pair[0], pair[1])
            self._tournaments[group_name]['games'].append(game)
        logger.warn(self._tournaments[group_name])
        await self.channel_layer.group_send(
            group_name,
            {
                'type': 'send_message',
                'status' : 'tournament_starts',
                'message': {'games': self._tournaments[group_name]['games']},
                'stragler' : self._tournaments[group_name]['stragler'] if 'stragler' in self._tournaments[group_name] else None,
            }
        )


    async def game_finished(self, message):
        game_id = int(message['gid'])
        for group in self._tournaments:
            for game in self._tournaments[group]['games']:
                if game['id'] == game_id:
                    game['status'] = 'finished'
                    game['winner'] = message['winner']
                    logger.warn(self._tournaments[group])
            if len(self._tournaments[group]['games']) == 1:
                await database_sync_to_async(finish_tournament)(int(group), self._tournaments[group]['games'][0]['winner'])
                await self.channel_layer.group_send(
                    group,
                    {
                        'type': 'send_message',
                        'status' : 'tournament_ends',
                        'message': {'winner': self._tournaments[group]['games'][0]['winner']}
                    }
                )
                self._tournaments.pop(group)
                return
            if all(game['status'] == 'finished' for game in self._tournaments[group]['games']):
                winners = [game['winner'] for game in self._tournaments[group]['games']]
                random.shuffle(winners)
                if 'stragler' in self._tournaments[group]:
                    winners.insert(0, self._tournaments[group]['stragler'])
                pairs = [winners[i:i+2] for i in range(0, len(winners), 2)]
                self._tournaments[group]['games'] = []
                for pair in pairs:
                    if len(pair) == 1:
                        self._tournaments[group]['stragler'] = pair[0]
                        continue
                    game = await database_sync_to_async(create_game)(pair[0], pair[1])
                    self._tournaments[group]['games'].append(game)
                    await self.channel_layer.group_send(
                        group,
                        {
                            'type': 'send_message',
                            'status' : 'next_round',
                            'message': {'games': self._tournaments[group]['games']},
                            'stragler' : self._tournaments[group]['stragler'] if 'stragler' in self._tournaments[group] else None,
                        }
                    )


class TournamentConsumer(AsyncWebsocketConsumer):
    alias = 'tournament_connector'
    _groups = TournamentGroupManager()

    async def connect(self):
        await self.accept()
        user = self.scope['user']
        tournament = self.scope['tournament']
        group_name = str(tournament['id'])
        if self._groups.group_size(group_name) <= tournament['max_players']:
            self._groups.add(group_name, user)
        else:
            await self.close()
            return
        user_dict = user_model_to_dict(user, avatar=False)
        await self.channel_layer.group_send(
            group_name,
            {
                'type': 'send_message',
                'message': {'user_joined' : user_dict}
            }
        )
        await self.channel_layer.group_add(group_name, self.channel_name)
        group_data = self._groups.get(group_name)
        await self.send(json.dumps(group_data))
        if self._groups.group_size(group_name) == tournament['max_players']:
            await self.channel_layer.send(
                'tournament_runner',
                {
                    'type': 'start.tournament',
                    'name': group_name,
                    'data' : json.dumps(group_data)
                }
            )

    async def send_message(self, event):
        message = event
        logger.warn(f"Sending message: {message}")
        await self.send(json.dumps({'message': message}))

    async def receive(self, text_data):
        data = json.loads(text_data)

        if 'group' in data:
            self._groups.add(data['group'], self.scope['user'])
        await self.send(text_data)

    async def disconnect(self, close_code):
        user = self.scope['user']
        tournament = self.scope['tournament']
        group_name = str(tournament['id'])
        # self._groups.remove(group_name, user)
        user_dict = await database_sync_to_async(user_model_to_dict)(user, avatar=False)
        self._groups.remove(group_name, user)
        await self.channel_layer.group_discard(group_name, self.channel_name)
        await self.channel_layer.group_send(
            group_name,
            {
                'type': 'send_message',
                'message': {'user_left' : user_dict}
            }
        )
        await asyncio.sleep(0.000001)
        await self.close()

		