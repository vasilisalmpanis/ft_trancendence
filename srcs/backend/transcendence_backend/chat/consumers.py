from channels.generic.websocket     import AsyncWebsocketConsumer
from logging                        import Logger
import asyncio, json

logger = Logger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        logger.warn(f"ChatConsumer - chat_id: {self.chat_id}")
        # await self.channel_layer.group_add(
        #     self.room_group_name,
        #     self.channel_name
        # )
        await self.accept()
        await self.send(text_data=json.dumps({'status': 'connected to ${self.chat_id}'}))

    # async def disconnect(self, close_code):
    #     await self.channel_layer.group_discard(
    #         self.room_group_name,
    #         self.channel_name
    #     )

    # async def receive(self, text_data):
    #     text_data_json = json.loads(text_data)
    #     message = text_data_json['message']

    #     await self.channel_layer.group_send(
    #         self.room_group_name,
    #         {
    #             'type': 'chat_message',
    #             'message': message
    #         }
    #     )

    # async def chat_message(self, event):
    #     message = event['message']

    #     await self.send(text_data=json.dumps({
    #         'message': message
    #     }))