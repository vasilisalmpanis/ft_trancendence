from channels.generic.websocket     import AsyncWebsocketConsumer
from channels.db                    import database_sync_to_async
from users.models                   import User, user_model_to_dict
from datetime                       import datetime
from threading                      import Lock
from typing                         import Dict, TypeVar, List
from .models                        import Chat, Message
from pong.models                    import Pong
from .services                      import ChatService, MessageService
from logging                        import Logger
import asyncio

import json

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

    def add_channel_to_room(self, chat_id: str, channel_name: str, username: str) -> bool:
        """
        Adds a channel to a room.
        Returns False if user not participant of the chat
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
        Returns False if room does not exist in the db
        """
        if chat_id not in self.rooms.keys():
            chat = Chat.objects.filter(id=chat_id).first()
            if chat is None:
                return False
            self.rooms.setdefault(chat_id, {})
            self.rooms[chat_id]['name'] = chat.name;
        return True

    def register_user_in_room(self, chat_id: str, channel_name: str, username: str) -> bool:
        """
        Adds or updates user channel in room
        Returns false if user is not participant of chat in db
        """
        chat = Chat.objects.filter(id=chat_id).first()
        if chat is None:
            return False
        db_participants = chat.participants.all()
        for db_participant in db_participants:
            if db_participant.username == username:
                if 'participants' not in self.rooms[chat_id]:
                    self.rooms[chat_id]['participants'] = []
                for room_participant in self.rooms[chat_id]['participants'].copy():
                    if room_participant['username'] == username:
                        self.rooms[chat_id]['participants'].remove(room_participant)
                self.rooms[chat_id]['participants'].append({'channel_name': channel_name, 'username': username})
                return True
        return False

    
    def is_room_in_db(self, chat_id: str) -> bool:
        """
        Checks if chatroom is in the database
        """
        return Chat.objects.filter(id=chat_id).exists()

    def remove_room(self, chat_id: str):
        """
        Removes room from manager
        """
        if chat_id in self.rooms:
            del self.rooms[chat_id]
    
    def remove_user_from_room(self, chat_id: str, channel_name: str):
        """
        Removes user from chatroom in manager
        """
        if chat_id in self.rooms:
            for participant in self.rooms[chat_id]['participants']:
                if participant.get('channel_name') == channel_name:
                    self.rooms[chat_id]['participants'].remove(participant)
                    return True
        return False

class DirectMessageChatConsumer(AsyncWebsocketConsumer):

    _chats = DirectMessageChatroomManager()

    async def connect(self):
        await self.accept()
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        if await database_sync_to_async(self._chats.is_room_in_db)(self.chat_id) is False:
            await self.send(text_data=json.dumps({
                'status': 'error',
                'message': 'Chat does not exist',
            }))
            await self.close()
            return
        if not await database_sync_to_async(self._chats.add_channel_to_room)(self.chat_id, self.channel_name, self.scope['user'].username):
            await self.send(text_data=json.dumps({
                'status': 'error',
                'message': 'User is not a member of this chat',
            }))
            await self.close()
            return
        await self.channel_layer.group_add(
            self.chat_id,
            self.channel_name
        )
        await self.channel_layer.group_send(
             self.chat_id,
             {
                'type': 'status_update',
                'status': 'connected',
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'sender': self.scope['user'].username,
                'chat_id': self.chat_id,
                'participants': self._chats.rooms[self.chat_id].get('participants'),
            }
        )

    async def disconnect(self, close_code):
        """
        Removes channel from channel layer and user from room in manager
        """
        self._chats.remove_user_from_room(self.chat_id, self.channel_name)
        await self.channel_layer.group_discard(
            self.chat_id,
            self.channel_name
        )
        await self.channel_layer.group_send(
            self.chat_id,
            {
                'type': 'status_update',
                'status': 'disconnected',
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'sender': self.scope['user'].username,
                'chat_id': self.chat_id,
            }
        )
        if not self._chats.rooms[self.chat_id]['participants']:
            await database_sync_to_async(self._chats.remove_room)(self.chat_id)
        await self.close()

    async def receive(self, text_data):
        """
        On receiving messages from client, create message and send to group
        plain messages are additionaly saved to db
        """
        text_data_json = json.loads(text_data)
        if text_data_json['type'] == 'plain_message':
            try:
                message = await database_sync_to_async(MessageService.create_dm)(
                                    self.scope['user'], 
                                    self.chat_id, 
                                    text_data_json['content']
                                    )
                await self.channel_layer.group_send(
                    self.chat_id,
                    {
                        'type': 'plain_message',
                        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        'sender': message.sender.username,
                        'content': message.content,
                    })
            except:
                await self.send(
                    text_data=json.dumps({
                        'status': 'error',
                        'message': 'Could not send message'
                    }))

        elif text_data_json['type'] == 'game_invite':
            try:
                await self.channel_layer.group_send(
                    self.chat_id,
                    {
                        'type': 'game_invite',
                        'sender': self.scope['user'].username,
                        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        'game_id': text_data_json['game_id'],
                    })
            except:
                await self.send(text_data=json.dumps({
                        'status': 'error',
                        'message': 'Could not send game invite'
                    })
                    )

    async def plain_message(self, event):
        """
            On message receive from group, confirm read if recipient
        """
        if self.scope['user'].username == event['sender']:
            return
        await self.send(text_data=json.dumps({
            'type': 'plain_message',
            'timestamp': event['timestamp'],
            'sender': event['sender'],
            'content': event['content'],
        }))
        await database_sync_to_async(MessageService.read_dm)(self.scope['user'], event['id'])

    async def status_update(self, event):
        update_message = {
                    'type': 'status_update',
                    'status': event['status'],
                    'timestamp': event['timestamp'],
                    'sender': event['sender'],
                    'chat_id': event['chat_id'],
                }
        if 'participants' in event:
            update_message['participants'] = event['participants']
        await self.send(text_data=json.dumps(update_message))

    async def game_invite(self, event):
        if self.scope['user'].username == event['sender']:
            return
        await self.send(text_data=json.dumps({
            'type': 'game_invite',
            'timestamp': event['timestamp'],
            'sender': event['sender'],
            'game_id': event['game_id'],
        }))

class GameChatroomManager(metaclass=SingletonMeta):
    _lobbies: Dict[str, Dict[str, any]] = {}

    def add_channel_to_room(self, chat_id: str, channel_name: str, username: str) -> bool:
        """
        Adds a channel to a room.
        chat_id is the game id - 
        Todo: has to become tournament id!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
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
        if chat_id in self.rooms.keys():
            return True
        else:
            game = Pong.objects.filter(id=chat_id).first()
            if game is None or game.status == 'finished':
                return False
            self.rooms.setdefault(chat_id, {})
            self.rooms[chat_id]['name'] = chat_id;
            return True

    def register_user_in_room(self, chat_id: str, channel_name: str, username: str) -> bool:
        """
        Adds or updates user channel in room in manager
        """
        if 'participants' not in self.rooms[chat_id]:
            self.rooms[chat_id]['participants'] = []
        for participant in self.rooms[chat_id]['participants'].copy():
            if participant['username'] == username:
                self.rooms[chat_id]['participants'].remove(participant)
        self.rooms[chat_id]['participants'].append({'channel_name': channel_name, 'username': username})
        return True

    def is_game_in_db(self, game_id: str) -> bool:
        """
        Checks if tournament is in the db and status in not 'finished'
        """
        game = Pong.objects.filter(id=game_id).first()
        if game is None:
            return False
        if game.status == 'finished':
            return False
        return True

    def remove_room(self, chat_id: str):
        """
        Removes chatroom from manager
        """
        if chat_id in self.rooms.keys():
            del self.rooms[chat_id]
    
    def remove_user_from_room(self, chat_id: str, channel_name: str):
        """
        Removes user from chatroom in manager
        """
        if chat_id in self.rooms.keys():
            for participant in self.rooms[chat_id]['participants']:
                if participant.get('channel_name') == channel_name:
                    self.rooms[chat_id]['participants'].remove(participant)
                    return True
        return False

class GameChatConsumer(AsyncWebsocketConsumer):

    _chats = GameChatroomManager()

    async def connect(self):
        await self.accept()
        self.chat_id = self.scope['url_route']['kwargs']['game_id']
        if await database_sync_to_async(self._chats.is_game_in_db)(self.chat_id) is False:
            await self.send(text_data=json.dumps({
                'status': 'error',
                'message': 'Game does not exist or is over, no chat available'
            }))
            await self.close()
            return
        if not await database_sync_to_async(self._chats.add_channel_to_room)(self.chat_id, self.channel_name, self.scope['user'].username):
            await self.send(text_data=json.dumps({
                'status': 'error',
                'message': 'User can not be added to chatroom'
            }))
            await self.close()
            return
        await self.channel_layer.group_add(
            self.chat_id,
            self.channel_name
        )
        await self.channel_layer.group_send(
             self.chat_id,
             {
                'type': 'status_update',
                'status': 'connected',
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'sender': self.scope['user'].username,
                'chat_id': self.chat_id,
                'participants': self._chats.rooms[self.chat_id].get('participants'),
            }
        )

    async def disconnect(self, close_code):
        """
        Removes channel from channel layer
        and removes user from chatroom in manager
        """
        self._chats.remove_user_from_room(self.chat_id, self.channel_name)
        await self.channel_layer.group_discard(
            self.chat_id,
            self.channel_name
        )
        await self.channel_layer.group_send(
            self.chat_id,
            {
                'type': 'status_update',
                'status': 'disconnected',
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'sender': self.scope['user'].username,
                'chat_id': self.chat_id,
            }
        )
        if not self._chats.rooms[self.chat_id]['participants']:
            await database_sync_to_async(self._chats.remove_room)(self.chat_id)
        await self.close()

    async def receive(self, text_data):
        """
        On message receive from client, create message and send to group
        """
        text_data_json = json.loads(text_data)

        if text_data_json['type'] == 'plain_message':
            try:
                await self.channel_layer.group_send(
                    self.chat_id,
                    {
                        'type': text_data_json['type'],
                        'id': self.chat_id,
                        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        'sender': self.scope['user'].username,
                        'content': text_data_json['content'],
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
            'type': 'status_update',
            'status': event['status'],
            'timestamp': event['timestamp'],
            'sender': event['sender'],
            'chat_id': event['chat_id'],
        }
        if 'participants' in event:
            update_message['participants'] = event['participants']
        await self.send(text_data=json.dumps(update_message))

    async def plain_message(self, event):
        """
            On message receive from group, confirm read if recipient
        """
        ## potentially neccessary for frontend to see also own messages
        if self.scope['user'].username == event['sender']:
            return
        await self.send(text_data=json.dumps({
                'type': 'plain_message',
                'id': event['id'],
                'timestamp': event['timestamp'],
                'sender': event['sender'],
                'content': event['content'],
            }))
        
    async def alert(self, event):
        if self.scope['user'].username == event['player1'] or self.scope['user'].username == event['player2']:
            await self.send(text_data=json.dumps({
                'type': 'alert',
                'status': event['status'],
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'game_id': event['game_id'],
                'player1': event['player1'],
                'player2': event['player2'],
            }))

### Todo: Fully implement alerts for game
### Todo: after merge change Game chat to Tournament chat
### Todo: Endppoint for alll chats for me with unread messages
### Todo: Endpoint for messages in chat with pagination
### Todo: Websocket only sends new messages