from channels.generic.websocket     import AsyncWebsocketConsumer
from users.models                   import User, user_model_to_dict
from threading                      import Lock
from typing                         import Dict, TypeVar, List
from .models                        import Chat, Message
from .services                      import ChatService, MessageService
from logging                        import Logger
from channels.db                    import database_sync_to_async

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



class ChatroomManager(metaclass=SingletonMeta):
    rooms: Dict[str, Dict[str, any]] = {}

    def add_channel_to_room(self, chat_id: str, channel_name: str, username: str) -> bool:
        """
        Adds a channel to a room, if user not participant of the chat, it will return False
        updated to not use chat objects anymore
        """
        if self.init_room(chat_id, username) is False:
            return False
        if self.register_user_in_room(chat_id, channel_name, username) is False:
            return False
        return True

    def register_user_in_room(self, chat_id: str, channel_name: str, username: str) -> bool:
        """
        Checks if user is participant of chat in db and if true
        adds channel to room in manager
        """
        chat = Chat.objects.get(id=chat_id)
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

    def init_room(self, chat_id: str, username: str) -> bool:
        """
        Initializes a chatroom in the managers room dict 
        if it exists in the db but not in the dict
        Returns True if room is initialized or already exists
        Returns False if room does not exist in the db
        """
        if chat_id not in self.rooms.keys():
            chat = Chat.objects.get(id=chat_id)
            if chat is None:
                return False
            self.rooms.setdefault(chat_id, {})
            self.rooms[chat_id]['name'] = chat.name;
        return True
    
    def is_room_in_db(self, chat_id: str) -> bool:
        """
        Checks if chatroom is in the database
        """
        return Chat.objects.filter(id=chat_id).exists()

    def remove_room(self, chat_id: str):
        if chat_id in self.rooms:
            del self.rooms[chat_id]
    
    def remove_user_from_room(self, chat_id: str, channel_name: str):
        if chat_id in self.rooms:
            for participant in self.rooms[chat_id]['participants']:
                if participant.get('channel_name') == channel_name:
                    self.rooms[chat_id]['participants'].remove(participant)
                    return True
        return False

class ChatConsumer(AsyncWebsocketConsumer):

    _chats = ChatroomManager()

    async def connect(self):
        await self.accept()
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        if await database_sync_to_async(self._chats.is_room_in_db)(self.chat_id) is False:
            await self.send(text_data=json.dumps({
                'status': 'error',
                'message': 'Chat does not exist'
            }))
            await self.close()
            return
        if not await database_sync_to_async(self._chats.add_channel_to_room)(self.chat_id, self.channel_name, self.scope['user'].username):
            await self.send(text_data=json.dumps({
                'status': 'error',
                'message': 'User is not a member of this chat'
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
                'type': 'chat_status_update',
                'status': 'connected',
                'username': self.scope['user'].username,
                'chat_id': self.chat_id,
                'active_participants': self._chats.rooms[self.chat_id].get('participants'),
            }
        )

    async def disconnect(self, close_code):
        """
        Removes channel from channel layer
        and removes user from chatroom in manager
        """
        await self.channel_layer.group_send(
            self.chat_id,
            {
                'type': 'chat_status_update',
                'status': 'disconnected',
                'username': self.scope['user'].username,
                'chat_id': self.chat_id,
                'active_participants': self._chats.rooms[self.chat_id].get('participants'),
            }
        )
        await self.channel_layer.group_discard(
            self.chat_id,
            self.channel_name
        )
        self._chats.remove_user_from_room(self.chat_id, self.channel_name)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)

        message = await database_sync_to_async(MessageService.create_message)(
                            self.scope['user'], 
                            self.chat_id, 
                            text_data_json['content']
                            )
        await self.channel_layer.group_send(
            self.chat_id,
            {
                'type': text_data_json['type'],
                'message_id': message.id,
                'sender': message.sender.username,
                'content': message.content,
            }
        )

    async def chat_status_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_status_update',
            'status': event['status'],
            'username': event['username'],
            'chat_id': event['chat_id'],
            'active_participants': event['active_participants']
            }))
        await database_sync_to_async(MessageService.read_message)(self.scope['user'], event['message_id'])

    async def message(self, event):
            await database_sync_to_async(MessageService.read_message)(self.scope['user'], event['message_id'])
            await self.send(text_data=json.dumps({
            'type': 'message',
            'message_id': event['message_id'],
            'sender': event['sender'],
            'content': event['content']
        }))

    async def game_invite(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_invite',
            'sender': event['sender'],
            'content': event['content'],
        }))