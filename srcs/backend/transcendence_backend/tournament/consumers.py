from re import T
from channels.generic.websocket						import AsyncWebsocketConsumer, AsyncConsumer
from channels.db									import database_sync_to_async
from threading                                      import Lock
from typing                                         import Dict, List, Any, TypeVar
from pong.consumers                                 import SingletonMeta
import asyncio
import json

class TournamentGroupManager(metaclass=SingletonMeta):
    _groups: Dict[str, List[str]] = {}

    def add(self, group: str, user: str):
        if group not in self._groups:
            self._groups[group] = []
        self._groups[group].append(user)
        return self._groups[group]



class TournamentConsumer(AsyncWebsocketConsumer):
    alias = 'tournament_connector'
    _groups = TournamentGroupManager()

    async def connect(self):
        await self.accept()
        user = self.scope['user']
        self.send(json.dumps({'message': 'Connected to tournament'}))

    async def receive(self, text_data):
        data = json.loads(text_data)
        if 'group' in data:
            self._groups.add(data['group'], self.scope['user'])
        self.send(json.dumps({'message': 'Received message'}))

    async def disconnect(self, close_code):
        pass

    async def notify_group(self, group: str, message: Dict[str, Any]):
        for user in self._groups[group]:
            await self.channel_layer.send(
                user,
                {
                    'type': 'send_message',
                    'message': message
                }
            )
		