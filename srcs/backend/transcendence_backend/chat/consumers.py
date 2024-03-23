from channels.generic.websocket     import AsyncWebsocketConsumer
from users.models                   import User, user_model_to_dict
from threading                      import Lock
from typing                         import Dict, TypeVar
from .models                        import Chat, Message
from logging                        import Logger
from asgiref.sync                   import sync_to_async

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

class RoomManager(metaclass=SingletonMeta):
    rooms: Dict[str, Chat] = {}

    def get_room(self, chat_id: str) -> Chat:
        if chat_id not in self.rooms:
            self.rooms[chat_id] = Chat.objects.get(id=chat_id)
        return self.rooms[chat_id]

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        user = self.scope['user']
        try:
            chat = await sync_to_async(Chat.objects.get, thread_sensitive=True)(id=self.chat_id)
        except Chat.DoesNotExist:
            await self.send(text_data=json.dumps({
                'status': 'error',
                'message': 'Chat does not exist'
            }))
            await self.close()
            return
        participants = await sync_to_async(list)(chat.participants.all())
        if self.scope['user'] not in participants:
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
        await self.send(text_data=json.dumps({
            'status': 'connected',
            'chat_id': self.chat_id,
            'participants': [user_model_to_dict(user) for user in participants],
            'channel_name': self.channel_name,
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.chat_id,
            self.channel_name
        )
        await self.send(text_data=json.dumps({
            'status': 'disconnected',
            'chat_id': self.chat_id,
        }))

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)

        await self.channel_layer.group_send(
            self.chat_id,
            {
                'type': text_data_json['type'],
                'sender': self.scope['user'].username,
                'content': text_data_json['content']
            }
        )

    async def message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message',
            'sender': event['sender'],
            'content': event['content']
        }))

    async def game_invite(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_invite',
            'sender': event['sender'],
            'content': event['content'],
        }))