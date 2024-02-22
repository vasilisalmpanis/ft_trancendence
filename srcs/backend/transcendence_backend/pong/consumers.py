import json
import asyncio
import math
from logging import Logger
from typing import Literal, Dict, List

from channels.generic.websocket import AsyncWebsocketConsumer

logger = Logger(__name__)


dir_left: Literal["up", "down", "stop"] = 'stop'
dir_right: Literal["up", "down", "stop"] = 'stop'

group_id = '1'
groups: Dict[str, List[str]] = {}
tasks: Dict[str, asyncio.Task] = {}

class GroupsManager():
	group_id = '1'
	groups: Dict[str, List[str]] = {}
	tasks: Dict[str, asyncio.Task] = {}
 
	def add_channel(channel_name: str):
		pass

	def get_group(channel_name: str) -> str:
		pass

	def set_left_state(channel_name: str, state: str):
		pass

	def set_right_state(channel_name: str, state: str):
		pass

manager = GroupsManager()
class PongConsumer(AsyncWebsocketConsumer):
	x = 50
	y = 50
	angle = 45
	platform_1 = 40
	platform_2 = 40
	score_1 = 10
	score_2 = 10
	p1_change = False
	p2_change = False
	score_change = False
	game_id = '1'
 
	def __init__(self):
		logger.warn("INIT")
		super().__init__(self)

	async def connect(self):
		global group_id
		if len(groups.get(group_id, [])) < 2:
			await self.channel_layer.group_add(self.game_id, self.channel_name)
			groups.setdefault(group_id, [])
			groups[group_id].append(self.channel_name)
			await self.accept()
		logger.warn(f'game: {self.game_id}, users: {len(groups.get(group_id, []))}, channel: {self.channel_name}')
		if len(groups.get(group_id, [])) == 2:
			await self.send(json.dumps({'side':'right'}))
			tasks.setdefault(group_id, [])
			tasks[group_id] = asyncio.ensure_future(self.send_updates())
			group_id = str(int(group_id) + 1)

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(self.game_id, self.channel_name)

	async def receive(self, text_data):
		global dir_left, dir_right
		text_data_json = json.loads(text_data)
		message = text_data_json["message"]
		if text_data_json.get("d", "left") == 'left':
			if message == 'up':
				dir_left = "up"
			elif message == 'down':
				dir_left = "down"
			elif message == "stop":
				dir_left = "stop"
		else:
			if message == 'up':
				dir_right = "up"
			elif message == 'down':
				dir_right = "down"
			elif message == "stop":
				dir_right = "stop"

	async def move(self):
		self.x += math.cos(self.angle)
		self.y += math.sin(self.angle)
		if dir_left == 'up' and self.platform_1 > 0:
			self.platform_1 -= 2
			self.p1_change = True
		elif dir_left == 'down' and self.platform_1 < 80:
			self.platform_1 += 2
			self.p1_change = True
		if dir_right == 'up' and self.platform_2 > 0:
			self.platform_2 -= 2
			self.p2_change = True
		elif dir_right == 'down' and self.platform_2 < 80:
			self.platform_2 += 2
			self.p2_change = True

	async def check_collisions(self):
		if self.x <= 1:
			if self.platform_1 - 1 < self.y < self.platform_1 + 21:
				self.angle = self.angle - 180
				self.score_1 += 1
			else:
				self.x = 97
				self.score_1 -= 1
			self.score_change = True
		elif self.x >= 99:
			if self.platform_2 - 1 < self.y < self.platform_2 + 21:
				self.angle = self.angle - 180
				self.score_2 += 1
			else:
				self.x = 3
				self.score_2 -= 1
			self.score_change = True
		elif self.y <= 1 or self.y >= 99:
			self.angle = -self.angle

	async def send_updates(self):
		while True:
			await self.check_collisions()
			await self.move()
			data = {
				'x': round(self.x, 2),
              	'y': round(self.y, 2),
			}
			if self.p1_change:
				data['p1'] = int(self.platform_1)
			if self.p2_change:
				data['p2'] = int(self.platform_2)
			if self.score_change:
				data.update({
					's1': self.score_1,
					's2': self.score_2,
				})
			gid = ''
			for k, v in groups.items():
				if self.channel_name in v:
					gid = k
					break ;
			await self.channel_layer.group_send(
				gid,
       			{
              		"type": "game.update",
              		"text": json.dumps(data)
				}
          	)
			self.p1_change = False
			self.p2_change = False
			self.score_change = False
			await asyncio.sleep(0.01)
   
	async def game_update(self, event):
		await self.send(text_data=event["text"])
