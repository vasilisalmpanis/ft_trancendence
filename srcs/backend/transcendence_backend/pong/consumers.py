import math
import json
import asyncio
from threading import Lock
from logging import Logger
from typing import Literal, Dict, List, TypeVar, TypedDict, NotRequired

from channels.generic.websocket import AsyncWebsocketConsumer, AsyncConsumer

logger = Logger(__name__)

T = TypeVar('T')
class SingletonMeta(type):
    _instances: Dict[type[T], T] = {}
    _lock: Lock = Lock()

    def __call__(cls: type[T], *args, **kwargs) -> T:
        with cls._lock:
            if cls not in cls._instances:
                instance = super().__call__(*args, **kwargs)
                cls._instances[cls] = instance
        return cls._instances[cls]

class GroupsManager(metaclass=SingletonMeta):
	'''Singleton to manage groups of connection channels'''

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

class MovePlatform(TypedDict):
    d: str
    message: str
    
class PongStateDict(TypedDict):
    x: float
    y: float
    p1: NotRequired[int]
    p2: NotRequired[int]
    s1: NotRequired[int]
    s2: NotRequired[int]
    
class ControlMsg(TypedDict):
    gid: str
    data: NotRequired[str]

class PongState:
	'''
	Pong game states generator\n
	Generates next values of ball and platform positions, and score:\n
	{
		x: float,
		y: float,
		p1: int,
		p2: int,
		s1: int,
		s2: int
	}
	'''

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

	def __next__(self) -> PongStateDict:
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

	def move_platform(self, data: MovePlatform) -> None:
		'''Moves platforms in pong game'''
		if 'd' not in data or 'message' not in data:
			return
		if data['d'] == 'left':
			self.pl_s = data['message']
		else:
			self.pr_s = data['message']

	def _move(self) -> None:
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

	def _check_collisions(self) -> None:
		if self._x <= 1:
			if self._pl - 1 < self._y < self._pl + 21:
				self._angle = self._angle - 180
				self._x = 2
				self._score_l += 1
			else:
				self._x = 97
				self._score_l -= 1
			self._score_c = True
		elif self._x >= 99:
			if self._pr - 1 < self._y < self._pr + 21:
				self._angle = self._angle - 180
				self._x = 98
				self._score_r += 1
			else:
				self._x = 3
				self._score_r -= 1
			self._score_c = True
		elif self._y <= 1:
			self._angle = -self._angle
			self._y = 2
		elif self._y >= 99:
			self._angle = -self._angle
			self._y = 98

class PongRunner(AsyncConsumer):
	'''Runs pong games as a background task'''

	alias = 'pong_runner'
	_games: Dict[str, PongState] = {}
	_tasks: Dict[str, asyncio.Task] = {}
  
	async def start_game(self, message: ControlMsg) -> None:
		logger.warn("starting game " + str(message))
		gid = message['gid']
		self._games[gid] = PongState()
		self._tasks[gid] = asyncio.ensure_future(self._run(gid))
  
	async def stop_game(self, message: ControlMsg) -> None:
		logger.warn("stopping game " + str(message))
		gid = message['gid']
		if gid in self._tasks:
			self._tasks[gid].cancel()
			del self._tasks[gid]
			del self._games[gid]

	async def update_platform(self, data: ControlMsg) -> None:
		'''Moves platforms in game'''
		self._games[data['gid']].move_platform(json.loads(data['data']))

	async def _run(self, gid: str):
		for state in self._games[gid]:
			await self.channel_layer.group_send(
	       		gid,
	        	{
					'type': 'update.game.state',
	            	'text': json.dumps(state),
	            }
	        )
			await asyncio.sleep(0.01)

class PongConsumer(AsyncWebsocketConsumer):
	'''Communicates with clients through websockets'''
 
	alias = 'pong_connector'
	_groups = GroupsManager()
 
	async def connect(self) -> None:
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

	async def update_game_state(self, message: Dict[str, str]) -> None:
		await self.send(message['text'])

	async def disconnect(self, close_code) -> None:
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

	async def receive(self, text_data: str) -> None:
		await self.channel_layer.send(
      		'pong_runner',
        	{
            	'type': 'update.platform',
             	'data': text_data,
              	'gid': self._groups.get_group_name(self.channel_name)
            }
        )
