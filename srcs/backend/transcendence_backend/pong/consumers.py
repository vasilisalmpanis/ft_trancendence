import json
import asyncio
import math
from logging import Logger

from channels.generic.websocket import AsyncWebsocketConsumer

logger = Logger(__name__)

class PongConsumer(AsyncWebsocketConsumer):
	x = 50
	y = 50
	angle = 45
	platform_1 = 50
	platform_2 = 50
    
	async def connect(self):
		await self.accept()
		asyncio.ensure_future(self.send_updates())

	async def disconnect(self, close_code):
		pass

	async def receive(self, text_data):
		text_data_json = json.loads(text_data)
		logger.warn(text_data_json)
		message = text_data_json["message"]
		if message == 'up' and self.platform_2 > 0:
			self.platform_2 -= 5
		elif message == 'down' and self.platform_2 < 100:
			self.platform_2 += 5

	async def move_ball(self):
		self.x += 1 * math.cos(self.angle)
		self.y += 1 * math.sin(self.angle)

	async def check_collisions(self):
		if self.x <= 2:
			if self.platform_1 - 5 < self.y < self.platform_1 + 5:
				self.angle = self.angle - 180
			else:
				self.x = 97
		elif self.x >= 98:
			if self.platform_2 - 5 < self.y < self.platform_2 + 5:
				self.angle = self.angle - 180
			else:
				self.x = 3
		elif self.y <= 2 or self.y >= 98:
			self.angle = -self.angle

	async def send_updates(self):
		while True:
			await self.check_collisions()
			await self.move_ball()
			await self.send(text_data=json.dumps({'x': self.x, 'y': self.y, 'p1': int(self.platform_1), 'p2': int(self.platform_2)}))
			await asyncio.sleep(0.01)
