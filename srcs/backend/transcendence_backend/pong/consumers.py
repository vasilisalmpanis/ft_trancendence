from threading										import Lock
from logging										import Logger
from typing											import Literal, Dict, List, TypeVar, TypedDict, NotRequired, Any
from asgiref.sync									import sync_to_async
from .services										import PongService, join_game, pause_game, resume_game
from stats.services									import StatService
from users.models									import User
from channels.generic.websocket						import AsyncWebsocketConsumer, AsyncConsumer
from channels.db									import database_sync_to_async
from autobahn.exception								import Disconnected
import math
import json
import asyncio
import time
import random

logger = Logger(__name__)

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

class GroupsManager(metaclass=SingletonMeta):
	'''Singleton to manage groups of connection channels'''

	groups: Dict[str, List[Dict[str,str]]] = {}

	def add_channel(self, game_id: str, channel_name: str, user: User, group_size: int = 2) -> bool:
		'''
		Adds channel to the group of the game
		If the group is full, returns False
		If the same user recconects through other websockets it replaces channel_name with new channel
		'''
		username = user.username
		user_id = user.id
		if self.group_full(game_id, username) and username not in [data['username'] for data in self.groups[game_id]]:
			return "False"
		self.groups.setdefault(game_id, [])
		if len(self.groups[game_id]) == 0:
			self.groups[game_id].append({channel_name : 'left', 'username': username, 'id': user_id})
		else:
			data = self.groups[game_id]
			for item in data:
				if username in item.values():
					side = 'left' if 'left' in item.values() else 'right'
					to_remove = [key for key in item.keys() if key != 'username']
					self.groups[game_id].remove(item)
					self.groups[game_id].append({channel_name : side, 'username': username, 'id': user_id})
					return to_remove[0]
				if 'left' in item.values():
					self.groups[game_id].append({channel_name : 'right', 'username': username, 'id': user_id})
					return "True"
				if 'right' in item.values():
					self.groups[game_id].append({channel_name : 'left', 'username': username, 'id': user_id})
					return "True"
		return "True"

	def get_group_name(self, channel_name: str) -> str:
		for key, val in self.groups.items():
			for item in val:
				if channel_name in item:
					return key
		return ''
	
	def side(self, game_id: str, channel_name: str) -> str:
		for item in self.groups[game_id]:
			if channel_name in item:
				return item[channel_name]
		return ''

	def group_full(self, game_id: str, username: str, group_size: int = 2) -> bool:
		if game_id not in self.groups:
			return False
		for item in self.groups[game_id]:
			if username in item.values() and len(self.groups[game_id]) == group_size:
				return True
		return len(self.groups[str(game_id)]) == group_size
	
	def group_empty(self, game_id: str) -> bool:
		return game_id not in self.groups or len(self.groups[game_id]) == 0
	
	def remove_channel(self, channel_name: str) -> None:
		for key, val in self.groups.items():
			for item in val:
				if channel_name in item:
					self.groups[key].remove(item)
					return

	def get_group(self, game_id: str) -> List[Dict[str,str]]:
		return self.groups.get(game_id, [])
			
class MovePlatform(TypedDict):
    d: str	
    message: str
    
class PongStateDict(TypedDict):
    x: float
    y: float
    paused: NotRequired[bool]
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

	def __init__(self, left: str, right: str, max_score: int) -> None:
		self.pl_s: Literal["up", "down", "stop"] = 'stop'
		self.pr_s: Literal["up", "down", "stop"] = 'stop'
		self.left = left
		self.right = right
		self._x = 50
		self._y = 50
		self._pl = 40
		self._pr = 40
		self._max_angle = 4 * math.pi / 12
		self._score_l = 0
		self._score_r = 0
		self._angle = 45
		self._pl_c = False
		self._pr_c = False
		self._score_c = False
		self._paused = False
		self._max_score = max_score

	def __iter__(self) -> 'PongState':
		return self

	def __next__(self) -> PongStateDict: # type: ignore
		if self._paused:
			return
		self._check_collisions()
		self._move()
		data = {
			'x': round(self._x, 2),
		  	'y': round(self._y, 2),
			'max_score': self._max_score
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
		self._pl_c = False
		self._pr_c = False
		self._score_c = False
		time.sleep(0.001)
		return data
	
	def get_results(self) -> Dict[str, Any]:
		return {
			's1': self._score_l,
			'left': self.left,
			's2': self._score_r,
			'right': self.right
		}

	def move_platform(self, data: MovePlatform) -> None:
		'''Moves platforms in pong game'''
		if 'd' not in data or 'message' not in data or self._paused:
			return
		if data['d'] == 'left':
			self.pl_s = data['message']
		else:
			self.pr_s = data['message']

	def _move(self) -> None:
		self._x += math.cos(self._angle)
		self._y += -math.sin(self._angle)
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
				relativeIntersectY = (self._pl + 10) - self._y
				normalizedRelativeIntersectionY = relativeIntersectY / 10
				self._angle = normalizedRelativeIntersectionY * self._max_angle
				self._x = 2
			else:
				self._x = 97
				self._score_r += 1
				self._score_c = True
				self._restart_ball()
		elif self._x >= 99:
			if self._pr - 1 < self._y < self._pr + 21:
				relativeIntersectY = (self._pr + 10) - self._y
				normalizedRelativeIntersectionY = relativeIntersectY / 10
				self._angle = math.pi - normalizedRelativeIntersectionY * self._max_angle
				self._x = 98
			else:
				self._x = 3
				self._score_l += 1
				self._score_c = True
				self._restart_ball()
		elif self._y <= 1:
			self._angle = -self._angle
			self._y = 2
		elif self._y >= 99:
			self._angle = -self._angle
			self._y = 98
	
	def _restart_ball(self) -> None:
		self._x = 50
		self._y = random.randint(30, 70)
		if random.randint(0, 1):
			self._angle = random.randint(int(3 * math.pi / 4),  int(5 * math.pi / 4))
		else:
			self._angle = random.randint(- int(math.pi / 4),  int(math.pi / 4))
	
	def _pause(self) -> None:
		self._paused = True

	def _resume(self) -> None:
		self._paused = False

class PongRunner(AsyncConsumer):

	'''Runs pong games as a background task'''

	alias = 'pong_runner'
	_games: Dict[str, PongState] = {}
	_tasks: Dict[str, asyncio.Task] = {}
  
	async def start_game(self, message: ControlMsg) -> None:
		try:
			gid = message['gid']
			data = json.loads(message.get('data', None))
			left = data[0]['id']
			right = data[1]['id']
			if self._games.get(gid, None) is not None:
				if self._games[gid]._paused:
					self._games[gid]._resume()
				return
			max_score = await database_sync_to_async(PongService.get_max_score)(int(gid))
			await database_sync_to_async(PongService.set_to_running)(int(gid))
			self._games[gid] = PongState(left, right, max_score)
			self._tasks[gid] = asyncio.ensure_future(self._run(gid))
		except Exception as e:
			logger.warn(str(e))
  
	async def stop_game(self, message: ControlMsg) -> None:
		try:
			gid = message['gid']
			status = message.get('data', None)
			if gid == '':
				return
			if gid not in self._games:
				await database_sync_to_async(PongService.finish_game)(int(gid), result=None)
				return
			result = self._games[gid].get_results()
			winner = await database_sync_to_async(PongService.finish_game)(int(gid), result=result)
			await database_sync_to_async(StatService.set_stats)(result['left'],
																result['right'],
																result['s1'],
																	result['s2'])
			if not status and gid in self._games:
				await self.channel_layer.group_send(
								gid,
								{
									'type': 'update.game.state',
									'text': json.dumps({"status": "Game over"}),
								}
							)
			if gid in self._games:
				self._tasks[gid].cancel()
				del self._tasks[gid]
				del self._games[gid]
		except Exception as e:
			logger.warn(f"{str(e)}")
			return

	async def update_platform(self, data: ControlMsg) -> None:
		'''Moves platforms in game'''
		if data['gid'] in self._games:
			self._games[data['gid']].move_platform(json.loads(data['data']))

	async def pause_game(self, message: ControlMsg) -> None:
		'''Pause game'''
		gid = message['gid']
		await database_sync_to_async(pause_game)(int(gid))
		if gid in self._games:
			self._games[gid]._pause()
			await self.channel_layer.group_send(gid, {'type': 'update.game.state', 'text': json.dumps({"status": "Paused"})})

	async def resume_game(self, message: ControlMsg) -> None:
		'''Resume game'''
		gid = message['gid']
		if gid in self._games:
			await database_sync_to_async(resume_game)(int(gid))
			self._games[gid]._resume()
		

	async def _run(self, gid: str):
		for state in self._games[gid]:
			if state:
				await self.channel_layer.group_send(
					gid,
					{
						'type': 'update.game.state',
						'text': json.dumps(state),
					}
				)
				max_score = state.get('max_score', 10)
				if state.get('s1', 0) == max_score or  state.get('s2', 0) == max_score:
					await self.stop_game({'gid': gid})
			await asyncio.sleep(0.01)

class PongConsumer(AsyncWebsocketConsumer):
	'''Communicates with clients through websockets'''
 
	alias = 'pong_connector'
	_groups = GroupsManager()
 
	async def connect(self) -> None:
		if self.scope.get('auth_protocol', False):
			await self.accept("Authorization")
		else:
			await self.accept()
		self.send(json.dumps({'message': 'Connected'}))

	async def update_game_state(self, message: Dict[str, str]) -> None:
		try:
			await self.send(message['text'])
		except Disconnected as e:
			logger.warn("Please stop")

	async def disconnect(self, close_code) -> None:
		try:
			gid = self._groups.get_group_name(self.channel_name)
			self._groups.remove_channel(self.channel_name)
			if self._groups.group_empty(gid):
				await self.channel_layer.send(
					'pong_runner',
					{
						'type': 'stop.game',
						'gid': gid,
						'data': 'Both disconnected'
					}
				)
				if self._groups.get_group_name(self.channel_name) != '':
					await self.channel_layer.group_discard(gid, self.channel_name)
			else:
				await self.channel_layer.send(
					'pong_runner',
					{
						'type': 'pause.game',
						'gid': gid
					}
				)
			await self.close()
		except Disconnected as e:
			logger.warn("Dont do this")

	async def receive(self, text_data: str) -> None:
		try:
			data = json.loads(text_data)
			if 'join' in data:
				game_id = str(data['join'])
				is_added = self._groups.add_channel(game_id, self.channel_name, self.scope['user'])
				if is_added == "False":
					await self.send(json.dumps({'error': 'Game is full'}))
					self.close()
					return
				elif is_added != "True":
					await self.channel_layer.group_discard(game_id, is_added)
				if not await sync_to_async(join_game)(self.scope['user'], int(game_id)):
					self._groups.remove_channel(self.channel_name)
					await self.send(json.dumps({'Problem': 'Connecting to game'}))
					self.close()
					return
				await self.channel_layer.group_add(game_id, self.channel_name)
				if self._groups.group_full(game_id, self.scope['user'].username):
					side = self._groups.side(game_id, self.channel_name)
					await self.send(json.dumps({'side': side}))
					await self.channel_layer.send(
						'pong_runner',
						{
							'type': 'start.game',
							'gid': game_id,
							'data' : json.dumps(self._groups.get_group(game_id))
						}
					)
			else:
				gid = self._groups.get_group_name(self.channel_name)
				if gid == '':
					return
				data['d'] = self._groups.side(gid, self.channel_name)
				text_data = json.dumps(data)
				await self.channel_layer.send(
							'pong_runner',
							{
								'type': 'update.platform',
								'data': text_data,
								'gid': self._groups.get_group_name(self.channel_name)
							}
						)
		except Exception as e:
			return await self.send(json.dumps({'error': str(e)}))
		

