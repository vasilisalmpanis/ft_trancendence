from re import T
from channels.generic.websocket						import AsyncWebsocketConsumer, AsyncConsumer
from channels.db									import database_sync_to_async
from threading                                      import Lock
from typing                                         import Dict, List, Any, TypeVar
import asyncio
import json


T = TypeVar('T')

def SingletonMeta(type):
	_instances: Dict[type[T], T] = {}
	_lock: Lock = Lock()

	def __call__(cls: type[T], *args, **kwargs) -> object:
		if cls not in cls._instances:
			with cls._lock:
				if cls not in cls._instances:
					instance = super().__call__(*args, **kwargs)
					cls._instances[cls] = instance
		return cls._instances[cls]
	

def TournamentGroupManager(metaclass=SingletonMeta):
    _groups: Dict[str, List[str]] = {}

    def add(self, group: str, user: str):
        if group not in self._groups:
            self._groups[group] = []
        self._groups[group].append(user)
        return self._groups[group]



class TournamentConsumer(AsyncWebsocketConsumer):
    alias = 'tournament_connector'
    _groups = TournamentGroupManager()

    async def connect(self):
        await self.accept()
        user = self.scope['user']
        self.send(json.dumps({'message': 'Connected to tournament'}))
		