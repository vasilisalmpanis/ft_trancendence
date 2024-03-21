from channels.generic.websocket     import AsyncWebsocketConsumer
from users.models                   import User
from chat.models                    import Chat, Message
from logging                        import Logger
import asyncio, json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_group_name = self.scope['url_route']['kwargs']['chat_id']
        # check if chat exists and user is authorized to join
        # chat gets created elsewhere, this is just for joining
        if self.chat_group_name not in Chat.objects.values_list('id', flat=True):
            await self 
        # user = self.scope['user']
        await self.channel_layer.group_add(
            self.chat_group_name,
            self.channel_name
        )
        await self.accept()
        await self.send(text_data=json.dumps({
            'status': 'connected',
            'chat_group_name': self.chat_group_name,
            'channel_name': self.channel_name,
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.chat_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        await self.send(text_data)
        message = text_data_json['message']


        await self.channel_layer.group_send(
            self.chat_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

    async def chat_message(self, event):
        message = event['message']

        await self.send(text_data=json.dumps({
            'message from server': message
        }))