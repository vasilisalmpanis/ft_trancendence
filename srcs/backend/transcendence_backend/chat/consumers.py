from channels.generic.websocket     import AsyncWebsocketConsumer
from channels.db                    import database_sync_to_async
from datetime                       import datetime
from threading                      import Lock
from typing                         import Dict, TypeVar, List
from .models                        import Chat
from users.models                   import User
from users.services                 import UserService
from pong.models                    import Pong
from pong.services                  import PongService
from tournament.models              import Tournament
from .services                      import MessageService
import json
import logging 

logger = logging.getLogger(__name__)

T = TypeVar('T')
class SingletonMeta(type):
	_instances: Dict[type[T], T] = {}

	_lock: Lock = Lock()

	def __call__(cls: type[T], *args, **kwargs) -> T:
		if cls not in cls._instances:
			with cls._lock:
				if cls not in cls._instances:
					instance = super().__call__(*args, **kwargs)
					cls._instances[cls] = instance
		return cls._instances[cls]


class DirectMessageChatroomManager(metaclass=SingletonMeta):
    rooms: Dict[str, Dict[str, any]] = {}
    users: Dict[str, Dict[str, any]] = {}

    def get_chat_ids(self, user_id: int) -> List[int]:
        """
        Retrieve the chat ids that the user is part of from the database.
        """
        user_chat_ids = list(Chat.objects.filter(participants__id=user_id).values_list('id', flat=True))
        user_chat_ids.append(0) # global chat
        return user_chat_ids

    def add_user(self, user_id: int, username: str, channel_name: str, chat_ids: List[int]):
        """
        Adds a channel to rooms and users list.
        """
        self.users.setdefault(user_id, {})
        self.users[user_id]['username'] = username
        self.users[user_id]['channel_name'] = channel_name
        for chat_id in chat_ids:
            self.init_room(chat_id)
            self.add_participant_to_room(chat_id, user_id, channel_name)

    def remove_user(self, chat_ids: List[int], user_id: int):
        """
        Removes user from rooms and users and removes room if empty
        """
        if user_id in self.users:
            del self.users[user_id]
        for chat_id in chat_ids:
            if chat_id in self.rooms:
                for participant in self.rooms[chat_id]['participants']:
                    if participant.get('user_id') == user_id:
                        self.rooms[chat_id]['participants'].remove(participant)
                if not self.rooms[chat_id]['participants'] and chat_id != 0:
                    del self.rooms[chat_id]

    def init_room(self, chat_id: str):
        """
        Initializes or updates a room in the manager with chat_id and chat name
        """
        if chat_id != 0:
            chat = Chat.objects.filter(id=chat_id).first()
            if not chat:
                raise ValueError('Chat room with id {chat_id} does not exist')
        self.rooms.setdefault(chat_id, {})
        self.rooms[chat_id].setdefault('game_invite', {})
        if chat_id == 0:
            self.rooms[chat_id]['name'] = 'global'
        else:
            self.rooms[chat_id]['name'] = chat.name

    def add_participant_to_room(self, chat_id: str, user_id: str, channel_name: str):
        """
        Adds or updates user channel in room
        """
        if 'participants' not in self.rooms[chat_id]:
            self.rooms[chat_id]['participants'] = []
        for participant in self.rooms[chat_id]['participants'].copy():
            if participant.get('user_id') == user_id:
                self.rooms[chat_id]['participants'].remove(participant)
        self.rooms[chat_id]['participants'].append({'user_id': user_id, 'channel_name': channel_name})

    def get_friends_ids(self, user: User, filter: str) -> List[int]:
        """
        Returns a list of online friends for user
        """
        friends_ids = list(user.friends.values_list('id', flat=True))
        if filter == 'all':
            return friends_ids
        elif filter == 'online':
            online_friends_ids = []
            for participant in self.rooms[0]['participants']:
                    if participant['user_id'] in friends_ids:
                        online_friends_ids.append(participant['user_id'])
            return online_friends_ids

    def update_rooms_dict(self, chat_id: str):
        """
        Updates the rooms dict if a new chat is created while users are connected
        """
        self.init_room(chat_id)
        if chat_id != 0:
            chat = Chat.objects.filter(id=chat_id).first()
            if not chat:
                raise ValueError('Chat room with id {chat_id} does not exist')
            for participant in chat.participants.all():
                if participant.id in self.users:
                    self.add_participant_to_room(chat_id, participant.id, self.users[participant.id]['channel_name'])
    
    def is_in_room(self, chat_id: str, user_id: int) -> bool:
        """
        Checks if user is in room
        """
        if chat_id in self.rooms:
            for participant in self.rooms[chat_id]['participants']:
                if participant.get('user_id') == user_id:
                    return True
        return False

    async def update_manager_dicts(self):
        """
        Updates the manager dicts with the current state of rooms
        """
        self.rooms = {}
        for user in self.users:
            chat_ids = await database_sync_to_async(self.get_chat_ids)(user)
            await database_sync_to_async(self.add_user)(user, self.users[user]['username'], self.users[user]['channel_name'], chat_ids)
    
    def add_game_invite(self, chat_id: str, sender_id: int, sender_name: str):
        """
        Adds a game invite to the chatroom
        """
        if self.rooms[chat_id]['game_invite'].get('sender_id', None) is None:
            self.rooms[chat_id].setdefault('game_invite', {})
        if self.rooms[chat_id]  and self.rooms[chat_id]['game_invite'].get('sender_id') is None:
            for participant in self.rooms[chat_id]['participants']:
                if participant.get('user_id') == sender_id:
                    self.rooms[chat_id]['game_invite'] = {'sender_id': sender_id, 'sender_name': sender_name}
                    return
        raise ValueError("Invite already exists")
    
    def get_game_invites(self, user_id: int, chat_ids: List[int]) -> List[Dict[str, any]]:
        """
        Gets all active game invites for user
        """
        game_invites = []
        for chat_id in chat_ids:
            # logger.warn("\n\n\Reached here\n")

            if chat_id in self.rooms:
                game_invite = self.rooms[chat_id].get('game_invite')
            sender_id = game_invite.get('sender_id', None)
            if sender_id is not None and sender_id != user_id:
                game_invite['chat_id'] = chat_id
                game_invites.append(game_invite)
            # logger.warn(f"\n{self.rooms[chat_id]}\n")
        return game_invites
    
    def user_has_pending_outgoing_invite(self, user_id: int) -> bool:
        """
        Checks if user has pending outgoing game invite
        """
        for chat_id in self.rooms:
            game_invite = self.rooms[chat_id].get('game_invite')
            if game_invite and game_invite['sender_id'] == user_id:
                return True
        return False

import asyncio
class DirectMessageChatConsumer(AsyncWebsocketConsumer):

    _chats = DirectMessageChatroomManager()

    async def connect(self):
        if self.scope.get('auth_protocol', False):
            await self.accept("Authorization")
        else:
            await self.accept()
        try:
            self.chat_ids = await database_sync_to_async(self._chats.get_chat_ids)(self.scope['user'].id)
            await database_sync_to_async(self._chats.add_user)(self.scope['user'].id, self.scope['user'].username, self.channel_name, self.chat_ids)
            for chat_id in self.chat_ids:
                await self.channel_layer.group_add(str(chat_id), self.channel_name)
            await self.channel_layer.group_send('0',
                {
                    'type': 'status.update',
                    'status': 'connected',
                    'sender_id': self.scope['user'].id,
                    'sender_name': self.scope['user'].username,
                    'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                })
            active_friends = await database_sync_to_async(self._chats.get_friends_ids)(self.scope['user'], 'online')
            total_unread_messages = await database_sync_to_async(MessageService.get_unread_messages_count)(self.scope['user'])
            game_invites = self._chats.get_game_invites(self.scope['user'].id, self.chat_ids)

            await self.send(text_data=json.dumps({
                    'type': 'client.update',
                    'status': 'client connected',
                    'active_friends_ids': active_friends,
                    'chat_ids': self.chat_ids,
                    'total_unread_messages': total_unread_messages,
                    'chats_with_pending_game_invites': game_invites
                    }))
    
        except Exception as e:
            await self.send(text_data=json.dumps({
                'status': 'error', 'message': f'Could not connect: {str(e)}'}))
            await self.close()

    async def disconnect(self, close_code):
        """
        Removes channel from channel layer and user from room in manager
        """
        await self.channel_layer.group_send('0',
            {
                'type': 'status.update',
                'status': 'disconnected',
                'sender_id': self.scope['user'].id,
                'sender_name': self.scope['user'].username,
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                })
        self._chats.remove_user(self.chat_ids, self.scope['user'].id)
        for chat_id in self.chat_ids:
            await self.channel_layer.group_discard(str(chat_id), self.channel_name)
        await self.close()

    async def receive(self, text_data):
        """
        On receiving messages from client, send to group.
        create plain_message in db
        update rooms dict if chat_id for new message is not in rooms
        """
        text_data_json = json.loads(text_data)
        # Plain Messages
        if text_data_json['type'] == 'plain.message':
            try:
                if text_data_json['chat_id'] == "0":
                    raise ValueError('Sending plain messages in global chat is dissallowed.')
                # if chat_id is not in rooms, update rooms list and add both users to the room
                if self._chats.rooms.get(text_data_json['chat_id']) is None:
                    await database_sync_to_async(self._chats.update_rooms_dict)(text_data_json['chat_id'])
                for participant in self._chats.rooms[text_data_json['chat_id']]['participants']:
                    self.channel_layer.group_add(text_data_json['chat_id'], participant['channel_name'])
                message = await database_sync_to_async(MessageService.create_message)(
                                    self.scope['user'], 
                                    int(text_data_json['chat_id']),
                                    text_data_json['content']
                                    )
                await self.channel_layer.group_send(str(text_data_json['chat_id']),
                    {
                        'type': 'plain.message',
                        'message' : message
                    })
            except Exception as e:
                await self.send(text_data=json.dumps({
                        'status': 'error', 'message': f'Could not send message: {str(e)}'}))
                
        # Unread messages
        elif text_data_json['type'] == 'unread.messages':
            try:
                total_unread_messages = await database_sync_to_async(MessageService.get_unread_messages_count)(self.scope['user'])
                await self.send(text_data=json.dumps({
                    'type': 'unread.messages',
                    'total_unread_messages': total_unread_messages
                }))
            except Exception as e:
                await self.send(text_data=json.dumps({
                    'status': 'error', 'message': f'Could not get unread messages: {str(e)}'
                }))

        # Message Management
        elif text_data_json['type'] == 'message.management':
            try:
                ids = text_data_json.get('ids', [])
                chat_id = text_data_json.get('chat_id')
                if not chat_id or not ids or not isinstance(ids, list):
                    await self.send(text_data=json.dumps({
                        'status': 'error',
                        'message': 'invalid message id list',
                        'unprocessed_ids': ids
                        }
                        ))
                    return
                unread_messages = await database_sync_to_async(MessageService.read_messages)(self.scope['user'], ids, chat_id)
                await self.send(text_data=json.dumps({
                    'status': 'message.management',
                    'unread_messages': unread_messages[0],
                    'total_unread_messages': unread_messages[1],
                    'chat_id': chat_id,
                    'processed_ids': ids
                    }))
            except Exception as e:
                await self.send(text_data=json.dumps({
                    'status': 'error',
                    'message': f'{str(e)}'
                    }))
        # Active Friends
        elif text_data_json['type'] == 'active.friends':
            try:
                active_friends = await database_sync_to_async(self._chats.get_friends_ids)(self.scope['user'], 'online')
                await self.send(text_data=json.dumps({
                    'status': 'active.friends',
                    'active_friends_ids': active_friends
                }))
            except Exception as e:
                await self.send(text_data=json.dumps({
                    'status': 'error',
                    'message': f'Could not get active friends: {str(e)}'
                }))

        # Game Invites
        elif text_data_json['type'] == 'game.invite':
            try:
                chat_id = text_data_json['chat_id']
                # Accept
                if text_data_json['action'] == 'accept':
                    if self._chats.rooms[chat_id]['game_invite']['sender_id'] is None:
                        raise ValueError('No game invite to accept')
                    if self._chats.rooms[chat_id]['game_invite']['sender_id'] == self.scope['user'].id:
                        raise ValueError('Cannot accept own game invite')
                    if self._chats.user_has_pending_outgoing_invite(self.scope['user'].id):
                        raise ValueError('Cannot accept invite because user has pending outgoing invite')
                    else:

                        game = await database_sync_to_async(PongService.create_full_game)(self.scope['user'].id, self._chats.rooms[chat_id]['game_invite']['sender_id'])
                        asyncio.sleep(2)
                        await self.channel_layer.group_send(str(chat_id), {
                            'type': 'game.invite',
                            'action': 'accepted',
                            'chat_id': chat_id,
                            'game': game
                        })
                        self._chats.rooms[chat_id]['game_invite'] = {}

                # Decline and Delete
                if text_data_json['action'] == 'decline' or text_data_json['action'] == 'delete':
                    self._chats.rooms[chat_id]['game_invite'] = {}
                    await self.channel_layer.group_send(str(chat_id), {
                        'type': 'game.invite',
                        'action': 'deleted',
                        'chat_id': chat_id
                    })

                # Create
                if text_data_json['action'] == 'create':
                    if self._chats.user_has_pending_outgoing_invite(self.scope['user'].id):
                        raise ValueError('Cannot send a game invite because user already has pending outgoing invite')
                    self._chats.add_game_invite(chat_id, self.scope['user'].id, self.scope['user'].username)
                    await self.channel_layer.group_send(str(chat_id), {
                        'type': 'game.invite',
                        'action': 'created',
                        'chat_id': chat_id,
                        'sender_id': self.scope['user'].id,
                        'sender_name': self.scope['user'].username
                    })

            except ValueError as e:
                await self.send(text_data=json.dumps({
                    'status': 'error',
                    'chat_id': chat_id,
                        'message': f'{str(e)}'
                    }))
            except User.DoesNotExist:
                await self.send(text_data=json.dumps({
                    'status': 'error',
                    'message': 'User does not exist'
                }))
            except Exception as e:
                await self.send(text_data=json.dumps({
                    'status': 'error',
                    'message': f'Could not send game invite: {str(e)}'
                }))

    async def game_invite(self, event):
        if event['action'] == 'created':
            if self.scope['user'].id == event['sender_id']:
                return
            await self.send(text_data=json.dumps({
                'status': 'game.invite',
                'chat_id': event['chat_id'],
                'sender_id': event['sender_id'],
                'sender_name': event['sender_name'],
            }))
        if event['action'] == 'accepted':
            await self.send(text_data=json.dumps({
                'status': 'game.invite.accepted',
                'chat_id': event['chat_id'],
                'game': event['game']
            }))
        if event['action'] == 'deleted':
            await self.send(text_data=json.dumps({
                'status': 'game.invite.deleted',
                'chat_id': event['chat_id']
            }))

    async def status_update(self, event):
        try:
            await self.scope['user'].arefresh_from_db()
            if event.get('sender_id') is None:
                await self.send(text_data=json.dumps({
                    'type': 'status.update',
                    'status': 'connected',
                    'timestamp': event['timestamp'],
                    'sender': event['sender'],
                    'chat_id': event['chat_id'],
                    'participants': [event['participants'] if 'participants' in event else None]
                }))
                return
            if self.scope['user'].id == int(event['sender_id']):
                return
            data = await database_sync_to_async(UserService.are_users_friends)(self.scope['user'], int(event['sender_id']))
            if  data == False:
                return
            await self.send(text_data=json.dumps({
                        'type': 'status.update',
                        'status': event['status'],
                        'sender_id': event['sender_id'],
                        'sender_name': event['sender_name'],
                        'timestamp': event['timestamp']
                        }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'status': 'error',
                'message': f'Something broke, duh: {str(e)}'
            }))

    async def manager_update(self, event):
        # Deletion of chat
        if 'status' in event and event['status'] == 'chat.deleted':
            await self.send(text_data=json.dumps({
                'type': 'manager.update',
                'status': event['status'],
                'chat_id': event['chat_id'],
            }))
            await self.channel_layer.group_discard(str(event['chat_id']), self.channel_name)
            self._chats.remove_user([event['chat_id']], self.scope['user'].id)
            self.chat_ids.remove(event['chat_id'])

        # Creation of chat
        if 'status' in event and event['status'] == 'chat.created':
            user_id = self.scope['user'].id
            username = self.scope['user'].username
            chat_id = event['1']['id']
            self.chat_ids.append(chat_id)
            await self.channel_layer.group_add(str(chat_id), self.channel_name)
            await database_sync_to_async(self._chats.add_user)(user_id, username, self.channel_name, [chat_id])
            await self.send(text_data=json.dumps({
                'type': 'manager.update',
                'status': event['status'],
                'chat': event['1'] if user_id == event['2']['participants']['id'] else event['2'],
            }))


    async def plain_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'plain.message',
            'message': event['message']
        }))

class TournamentChatroomManager(metaclass=SingletonMeta):
    rooms: Dict[str, Dict[str, any]] = {}

    def add_channel_to_room(self, chat_id: str, channel_name: str, username: str) -> bool:
        """
        Adds a channel to a room.
        chat_id is the tournament id
        """
        if self.init_room(chat_id, username) is False:
            return False
        if self.register_user_in_room(chat_id, channel_name, username) is False:
            return False
        return True

    def init_room(self, chat_id: str, username: str) -> bool:
        """
        Initializes a room.
        Returns True if room is initialized or already exists in the dict
        Returns False if tournament does not exist in the db
        """
        room_id = 'tournament_' + chat_id
        if room_id in self.rooms.keys():
            return True
        else:
            tournament = Tournament.objects.filter(id=chat_id).first()
            if tournament is None or tournament.status == 'finished':
                return False
            self.rooms.setdefault(room_id, {})
            self.rooms[room_id]['name'] = chat_id
            return True

    def register_user_in_room(self, chat_id: str, channel_name: str, username: str) -> bool:
        """
        Adds or updates user channel in room in manager
        """
        room_id = 'tournament_' + chat_id
        if 'participants' not in self.rooms[room_id]:
            self.rooms[room_id]['participants'] = []
        for participant in self.rooms[room_id]['participants'].copy():
            if participant['username'] == username:
                self.rooms[room_id]['participants'].remove(participant)
        self.rooms[room_id]['participants'].append({'channel_name': channel_name, 'username': username})
        return True

    def is_tournament_in_db(self, game_id: str) -> bool:
        """
        Checks if tournament is in the db and status in not 'finished'
        """
        tournament = Tournament.objects.filter(id=game_id).first()
        if tournament is None:
            return False
        if tournament.status == 'finished':
            return False
        return True

    def remove_room(self, room_id: str):
        """
        Removes chatroom from manager
        """
        if room_id in self.rooms.keys():
            del self.rooms[room_id]
    
    def remove_user_from_room(self, chat_id: str, channel_name: str):
        """
        Removes user from chatroom in manager
        """
        room_id = 'tournament_' + chat_id
        if room_id in self.rooms.keys():
            for participant in self.rooms[room_id]['participants']:
                if participant.get('channel_name') == channel_name:
                    self.rooms[room_id]['participants'].remove(participant)
                    return True
        return False

class TournamentChatConsumer(AsyncWebsocketConsumer):

    _lobbies = TournamentChatroomManager()

    async def connect(self):
        if self.scope.get('auth_protocol', False):
            await self.accept("Authorization")
        else:
            await self.accept()
        self.chat_id = self.scope['url_route']['kwargs']['tournament_id']
        if await database_sync_to_async(self._lobbies.is_tournament_in_db)(self.chat_id) is False:
            await self.send(text_data=json.dumps({
                'status': 'error', 'message': 'Tournament does not exist or is finished'}))
            await self.close()
            return
        if not await database_sync_to_async(self._lobbies.add_channel_to_room)(self.chat_id, self.channel_name, self.scope['user'].username):
            await self.send(text_data=json.dumps({
                'status': 'error', 'message': 'User can not be added to chatroom'}))
            await self.close()
            return
        room_id = 'tournament_' + self.chat_id
        await self.channel_layer.group_add(
            room_id,
            self.channel_name
        )
        await self.channel_layer.group_send(
            room_id,
             {
                'type': 'status.update',
                'status': 'connected',
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'sender': self.scope['user'].username,
                'chat_id': self.chat_id,
                'participants': self._lobbies.rooms[room_id].get('participants'),
            }
        )

    async def disconnect(self, close_code):
        """
        Removes channel from channel layer
        and removes user from chatroom in manager
        """
        room_id = 'tournament_' + self.chat_id
        self._lobbies.remove_user_from_room(self.chat_id, self.channel_name)
        await self.channel_layer.group_discard(
            room_id,
            self.channel_name
        )
        await self.channel_layer.group_send(
            room_id,
            {
                'type': 'status.update',
                'status': 'disconnected',
                'sender': self.scope['user'].username,
                'chat_id': self.chat_id,
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }
        )
        if not self._lobbies.rooms[room_id]['participants']:
            await database_sync_to_async(self._lobbies.remove_room)(room_id)
        await self.close()

    async def receive(self, text_data):
        """
        On message receive from client, create message and send to group
        """
        text_data_json = json.loads(text_data)

        if text_data_json['type'] == 'plain.message':
            try:
                room_id = 'tournament_' + text_data_json['chat_id']
                await self.channel_layer.group_send(
                    room_id,
                    {
                        'type': text_data_json['type'],
                        'chat_id': text_data_json['chat_id'],
                        'sender': self.scope['user'].username,
                        'content': text_data_json['content'],
                        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    })
            except:
                await self.send(
                    text_data=json.dumps({
                        'status': 'error',
                        'message': 'Could not send message'
                    }))
                return

    async def status_update(self, event):
        update_message = {
            'type': 'status.update',
            'status': event['status'],
            'timestamp': event['timestamp'],
            'sender': event['sender'],
            'chat_id': event['chat_id'],
        }
        if 'participants' in event:
            update_message['participants'] = event['participants']
        await self.send(text_data=json.dumps(update_message))

    async def plain_message(self, event):
        if self.scope['user'].username == event['sender']:
            return
        await self.send(text_data=json.dumps({
                'type': 'plain.message',
                'tournament_id': event['chat_id'],
                'timestamp': event['timestamp'],
                'sender': event['sender'],
                'content': event['content'],
            }))
        

