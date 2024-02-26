import json
import asyncio
import math
from logging import Logger
from threading import Lock
from typing import Literal, Dict, List

from channels.generic.websocket import AsyncWebsocketConsumer, AsyncConsumer

logger = Logger(__name__)

class SingletonMeta(type):
    _instances = {}
    _lock: Lock = Lock()

    def __call__(cls, *args, **kwargs):
        with cls._lock:
            if cls not in cls._instances:
                instance = super().__call__(*args, **kwargs)
                cls._instances[cls] = instance
        return cls._instances[cls]

class GroupsManager(metaclass=SingletonMeta):
	group_id = '1'
	groups: Dict[str, List[str]] = {}
 
	def add_channel(self, channel_name: str, group_size: int = 2) -> str:
		if len(self.groups.get(self.group_id, [])) >= group_size:
			self.group_id = str(int(self.group_id) + 1)
		self.groups.setdefault(self.group_id, [])
		self.groups[self.group_id].append(channel_name)
		return self.group_id

	def get_group_name(self, channel_name: str) -> str:
		for key, val in self.groups.items():
			if channel_name in val:
				return key

	def group_full(self, group_size: int = 2) -> bool:
		return len(self.groups[self.group_id]) == group_size

class PongState:

	def __init__(self) -> None:
		self.pl_s: Literal["up", "down", "stop"] = 'stop'
		self.pr_s: Literal["up", "down", "stop"] = 'stop'
		self._x = 50
		self._y = 50
		self._pl = 40
		self._pr = 40
		self._score_l = 10
		self._score_r = 10
		self._angle = 45
		self._pl_c = False
		self._pr_c = False
		self._score_c = False

	def __iter__(self) -> 'PongState':
		return self

	def __next__(self) -> Dict[str, float]:
		self._check_collisions()
		self._move()
		data = {
			'x': round(self._x, 2),
		  	'y': round(self._y, 2),
		}
		if self._pl_c:
			data['p1'] = int(self._pl)
		if self._pr_c:
			data['p2'] = int(self._pr)
		if self._score_c:
			data.update({
				's1': self._score_l,
				's2': self._score_r,
			})
		return data

	def move_platform(self, data: Dict[str, str]) -> None:
		if 'd' not in data or 'message' not in data:
			return
		if data['d'] == 'left':
			self.pl_s = data['message']
		else:
			self.pr_s = data['message']

	def _move(self):
		self._x += math.cos(self._angle)
		self._y += math.sin(self._angle)
		if self.pl_s == 'up' and self._pl > 0:
			self._pl -= 2
			self._pl_c = True
		elif self.pl_s == 'down' and self._pl < 80:
			self._pl += 2
			self._pl_c = True
		if self.pr_s == 'up' and self._pr > 0:
			self._pr -= 2
			self._pr_c = True
		elif self.pr_s == 'down' and self._pr < 80:
			self._pr += 2
			self._pr_c = True

	def _check_collisions(self):
		if self._x <= 1:
			if self._pl - 1 < self._y < self._pl + 21:
				self._angle = self._angle - 180
				self._score_l += 1
			else:
				self._x = 97
				self._score_l -= 1
			self._score_c = True
		elif self._x >= 99:
			if self._pr - 1 < self._y < self._pr + 21:
				self._angle = self._angle - 180
				self._score_r += 1
			else:
				self._x = 3
				self._score_r -= 1
			self._score_c = True
		elif self._y <= 1 or self._y >= 99:
			self._angle = -self._angle

class PongRunner(AsyncConsumer):
	alias = 'pong_runner'
	games: Dict[str, PongState] = {}
	tasks: Dict[str, asyncio.Task] = {}
  
	async def start_game(self, message):
		logger.warn("starting game " + str(message))
		gid = message['gid']
		self.games[gid] = PongState()
		self.tasks[gid] = asyncio.ensure_future(self.run(gid))
  
	async def stop_game(self, message):
		logger.warn("stopping game " + str(message))
		gid = message['gid']
		if gid in self.tasks:
			self.tasks[gid].cancel()
			del self.tasks[gid]
			del self.games[gid]

	async def update_platform(self, data):
		self.games[data['gid']].move_platform(json.loads(data['data']))

	async def run(self, gid: str):
		for state in self.games[gid]:
			await self.channel_layer.group_send(
	       		gid,
	        	{
					'type': 'update.game.state',
	            	'text': json.dumps(state),
	            }
	        )
			await asyncio.sleep(0.01)

class PongConsumer(AsyncWebsocketConsumer):
	alias = 'pong_connector'
	_groups = GroupsManager()
 
	async def connect(self):
		gid = self._groups.add_channel(self.channel_name)
		await self.channel_layer.group_add(gid, self.channel_name)
		await self.accept()
		if self._groups.group_full():
			await self.send(json.dumps({'side':'right'}))
			await self.channel_layer.send(
       			'pong_runner',
          		{
                	'type': 'start.game',
                 	'gid': gid
                }
            )

	async def update_game_state(self, message):
		await self.send(message['text'])

	async def disconnect(self, close_code):
		gid = self._groups.get_group_name(self.channel_name)
		await self.channel_layer.send(
       		'pong_runner',
        	{
            	'type': 'stop.game',
             	'gid': gid
            }
        )
		await self.channel_layer.group_discard(gid, self.channel_name)
		await self.close()

	async def receive(self, text_data):
		await self.channel_layer.send(
      		'pong_runner',
        	{
            	'type': 'update.platform',
             	'data': text_data,
              	'gid': self._groups.get_group_name(self.channel_name)
            }
        )
