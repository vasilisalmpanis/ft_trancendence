from asyncio import sleep
from channels.generic.websocket     import AsyncWebsocketConsumer
from channels.db                    import database_sync_to_async
from datetime                       import datetime
from threading                      import Lock
from typing                         import Dict, TypeVar, List
from .models                        import Chat
from tournament.models              import Tournament
from .services                      import MessageService
from logging                        import Logger
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


class DirectMessageChatroomManager(metaclass=SingletonMeta):
    rooms: Dict[str, Dict[str, any]] = {}
    users: Dict[str, Dict[str, any]] = {}

    def get_chat_ids(self, user_id: int) -> List[int]:
        """
        Retrieve the chat ids that the user is part of from the database.
        """
        user_chat_ids = list(Chat.objects.filter(participants__id=user_id).values_list('id', flat=True))
        user_chat_ids.append(0) # global chat
        return user_chat_ids

    def add_user(self, user_id: int, username: str, channel_name: str, chat_ids: List[int]):
        """
        Adds a channel to rooms and users list.
        """
        self.users.setdefault(user_id, {})
        self.users[user_id]['username'] = username
        self.users[user_id]['channel_name'] = channel_name
        for chat_id in chat_ids:
            self.init_room(chat_id)
            self.add_participant_to_room(chat_id, user_id, channel_name)

    def remove_user(self, chat_ids: List[int], user_id: int):
        """
        Removes user from rooms and users and removes room if empty
        """
        if user_id in self.users:
            del self.users[user_id]
        for chat_id in chat_ids:
            if chat_id in self.rooms:
                for participant in self.rooms[chat_id]['participants']:
                    if participant.get('user_id') == user_id:
                        self.rooms[chat_id]['participants'].remove(participant)
                if not self.rooms[chat_id]['participants'] and chat_id != 0:
                    del self.rooms[chat_id]

    def init_room(self, chat_id: str):
        """
        Initializes or updates a room in the manager with chat_id and chat name
        """
        if chat_id != 0:
            chat = Chat.objects.filter(id=chat_id).first()
            if not chat:
                raise ValueError('Chat room with id {chat_id} does not exist')
        self.rooms.setdefault(chat_id, {})
        if chat_id == 0:
            self.rooms[chat_id]['name'] = 'global'
        else:
            self.rooms[chat_id]['name'] = chat.name;

    def add_participant_to_room(self, chat_id: str, user_id: str, channel_name: str):
        """
        Adds or updates user channel in room
        """
        if 'participants' not in self.rooms[chat_id]:
            self.rooms[chat_id]['participants'] = []
        for participant in self.rooms[chat_id]['participants'].copy():
            if participant.get('user_id') == user_id:
                self.rooms[chat_id]['participants'].remove(participant)
        self.rooms[chat_id]['participants'].append({'user_id': user_id, 'channel_name': channel_name})

    def get_friends_ids(self, user: User, filter: str) -> List[int]:
        """
        Returns a list of online friends for user
        """
        friends_ids = list(user.friends.values_list('id', flat=True))
        if filter == 'all':
            return friends_ids
        elif filter == 'online':
            online_friends_ids = []
            for participant in self.rooms[0]['participants']:
                    if participant['user_id'] in friends_ids:
                        online_friends_ids.append(participant['user_id'])
            return online_friends_ids

    def update_rooms_dict(self, chat_id: str):
        """
        Updates the rooms dict if a new chat is created while users are connected
        """
        self.init_room(chat_id)
        if chat_id != 0:
            chat = Chat.objects.filter(id=chat_id).first()
            if not chat:
                raise ValueError('Chat room with id {chat_id} does not exist')
            for participant in chat.participants.all():
                if participant.id in self.users:
                    self.add_participant_to_room(chat_id, participant.id, self.users[participant.id]['channel_name'])

    async def update_manager_dicts(self):
        """
        Updates the manager dicts with the current state of rooms
        """
        self.rooms = {}
        for user in self.users:
            chat_ids = await database_sync_to_async(self.get_chat_ids)(user)
            await database_sync_to_async(self.add_user)(user, self.users[user]['username'], self.users[user]['channel_name'], chat_ids)
    
    #debugging
    def get_users_dict(self):
        return self.users
    def get_rooms_dict(self):
        return self.rooms

class DirectMessageChatConsumer(AsyncWebsocketConsumer):

    _chats = DirectMessageChatroomManager()

    async def connect(self):
        await self.accept()
        try:
            self.chat_ids = await database_sync_to_async(self._chats.get_chat_ids)(self.scope['user'].id)
            await database_sync_to_async(self._chats.add_user)(self.scope['user'].id, self.scope['user'].username, self.channel_name, self.chat_ids)
            for chat_id in self.chat_ids:
                await self.channel_layer.group_add(str(chat_id), self.channel_name)
            await self.channel_layer.group_send('0', 
                {
                    'type': 'status.update',
                    'status': 'connected',
                    'sender_id': self.scope['user'].id,
                    'sender_name': self.scope['user'].username,
                    'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                })
            active_friends = await database_sync_to_async(self._chats.get_friends_ids)(self.scope['user'], 'online')
            await self.send(text_data=json.dumps({
                    'type': 'client.update',
                    'status': 'client connected',
                    'active_friends_ids': active_friends,
                    'chat_ids': self.chat_ids,
                    }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'status': 'error', 'message': f'Could not connect: {str(e)}'}))
            await self.close()

    async def disconnect(self, close_code):
        """
        Removes channel from channel layer and user from room in manager
        """
        await self.channel_layer.group_send('0',
            {
                'type': 'status.update',
                'status': 'disconnected',
                'sender_id': self.scope['user'].id,
                'sender_name': self.scope['user'].username,
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                })
        self._chats.remove_user(self.chat_ids, self.scope['user'].id)
        for chat_id in self.chat_ids:
            await self.channel_layer.group_discard(str(chat_id), self.channel_name)
        await self.close()

    async def receive(self, text_data):
        """
        On receiving messages from client, send to group.
        create plain_message in db
        update rooms dict if chat_id for new message is not in rooms
        """
        text_data_json = json.loads(text_data)
        if text_data_json['type'] == 'plain.message':
            try:
                if text_data_json['chat_id'] == "0":
                    raise ValueError('Sending plain messages in global chat is dissallowed.')
                # if chat_id is not in rooms, update rooms list and add both users to the room
                if self._chats.rooms.get(text_data_json['chat_id']) is None:
                    await database_sync_to_async(self._chats.update_rooms_dict)(text_data_json['chat_id'])
                for participant in self._chats.rooms[text_data_json['chat_id']]['participants']:
                    self.channel_layer.group_add(text_data_json['chat_id'], participant['channel_name'])
                message = await database_sync_to_async(MessageService.create_message)(
                                    self.scope['user'], 
                                    int(text_data_json['chat_id']),
                                    text_data_json['content']
                                    )
                await self.channel_layer.group_send(text_data_json['chat_id'],
                    {
                        'type': 'plain.message',
                        'chat_id': message.chat.id,
                        'sender_id': message.sender.id,
                        'sender_name': message.sender.username,
                        'content': message.content,
                        'message_id': message.id,
                        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    })
            except Exception as e:
                await self.send(text_data=json.dumps({
                        'status': 'error', 'message': f'Could not send message: {str(e)}'}))
        elif text_data_json['type'] == 'status_update':
            await self.channel_layer.group_send('0',
                    {
                        'type': 'status.update',
                        'status': text_data_json['status'],
                        'timestamp': text_data_json['timestamp'],
                        'sender_id': text_data_json['sender_id'],
                        'sender_name': text_data_json['sender_name'],
                        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    })
        elif text_data_json['type'] == 'game.invite':
            await self.channel_layer.group_send(text_data_json['chat_id'],
                {
                    'type': 'game.invite',
                    'chat_id': text_data_json['chat_id'],
                    'sender_id': text_data_json['sender_id'],
                    'sender_name': text_data_json['sender_name'],
                    'game_id': text_data_json['game_id'],
                    'timestamp': text_data_json['timestamp']
                })

    async def status_update(self, event):
        if self.scope['user'].id == event['sender_id']:
            return
        await self.send(text_data=json.dumps({
                    'type': 'status.update',
                    'status': event['status'],
                    'sender_id': event['sender_id'],
                    'sender_name': event['sender_name'],
                    'timestamp': event['timestamp']
                    }))

    async def manager_update(self, event):
        await self._chats.update_manager_dicts()
        await self.send(text_data=json.dumps({
            'type': 'manager.update',
            'users': self._chats.get_users_dict(),
            'rooms': self._chats.get_rooms_dict()
        }))

    async def plain_message(self, event):
        if self.scope['user'].id == event['sender_id']:
            return
        await self.send(text_data=json.dumps({
            'type': 'plain.message',
            'chat_id': event['chat_id'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'content': event['content'],
            'timestamp': event['timestamp']
        }))
        await database_sync_to_async(MessageService.read_message)(self.scope['user'], event['message_id'])

    async def game_invite(self, event):
        if self.scope['user'].id == event['sender_id']:
            return
        await self.send(text_data=json.dumps({
            'type': 'game.invite',
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'game_id': event['game_id'],
            'timestamp': event['timestamp']
        }))

class TournamentChatroomManager(metaclass=SingletonMeta):
    rooms: Dict[str, Dict[str, any]] = {}

    def add_channel_to_room(self, chat_id: str, channel_name: str, username: str) -> bool:
        """
        Adds a channel to a room.
        chat_id is the tournament id
        """
        if self.init_room(chat_id, username) is False:
            return False
        if self.register_user_in_room(chat_id, channel_name, username) is False:
            return False
        return True

    def init_room(self, chat_id: str, username: str) -> bool:
        """
        Initializes a room.
        Returns True if room is initialized or already exists in the dict
        Returns False if tournament does not exist in the db
        """
        if chat_id in self.rooms.keys():
            return True
        else:
            tournament = Tournament.objects.filter(id=chat_id).first()
            if tournament is None or tournament.status == 'finished':
                return False
            self.rooms.setdefault(chat_id, {})
            self.rooms[chat_id]['name'] = chat_id;
            return True

    def register_user_in_room(self, chat_id: str, channel_name: str, username: str) -> bool:
        """
        Adds or updates user channel in room in manager
        """
        if 'participants' not in self.rooms[chat_id]:
            self.rooms[chat_id]['participants'] = []
        for participant in self.rooms[chat_id]['participants'].copy():
            if participant['username'] == username:
                self.rooms[chat_id]['participants'].remove(participant)
        self.rooms[chat_id]['participants'].append({'channel_name': channel_name, 'username': username})
        return True

    def is_tournament_in_db(self, game_id: str) -> bool:
        """
        Checks if tournament is in the db and status in not 'finished'
        """
        tournament = Tournament.objects.filter(id=game_id).first()
        if tournament is None:
            return False
        if tournament.status == 'finished':
            return False
        return True

    def remove_room(self, chat_id: str):
        """
        Removes chatroom from manager
        """
        if chat_id in self.rooms.keys():
            del self.rooms[chat_id]
    
    def remove_user_from_room(self, chat_id: str, channel_name: str):
        """
        Removes user from chatroom in manager
        """
        if chat_id in self.rooms.keys():
            for participant in self.rooms[chat_id]['participants']:
                if participant.get('channel_name') == channel_name:
                    self.rooms[chat_id]['participants'].remove(participant)
                    return True
        return False

class TournamentChatConsumer(AsyncWebsocketConsumer):

    _lobbies = TournamentChatroomManager()

    async def connect(self):
        await self.accept()
        self.chat_id = self.scope['url_route']['kwargs']['tournament_id']
        if await database_sync_to_async(self._lobbies.is_tournament_in_db)(self.chat_id) is False:
            await self.send(text_data=json.dumps({
                'status': 'error', 'message': 'Tournament does not exist or is finished'}))
            await self.close()
            return
        if not await database_sync_to_async(self._lobbies.add_channel_to_room)(self.chat_id, self.channel_name, self.scope['user'].username):
            await self.send(text_data=json.dumps({
                'status': 'error', 'message': 'User can not be added to chatroom'}))
            await self.close()
            return
        await self.channel_layer.group_add(
            self.chat_id,
            self.channel_name
        )
        await self.channel_layer.group_send(
             self.chat_id,
             {
                'type': 'status.update',
                'status': 'connected',
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'sender': self.scope['user'].username,
                'chat_id': self.chat_id,
                'participants': self._lobbies.rooms[self.chat_id].get('participants'),
            }
        )

    async def disconnect(self, close_code):
        """
        Removes channel from channel layer
        and removes user from chatroom in manager
        """
        self._lobbies.remove_user_from_room(self.chat_id, self.channel_name)
        await self.channel_layer.group_discard(
            self.chat_id,
            self.channel_name
        )
        await self.channel_layer.group_send(
            self.chat_id,
            {
                'type': 'status_update',
                'status': 'disconnected',
                'sender': self.scope['user'].username,
                'chat_id': self.chat_id,
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            }
        )
        if not self._lobbies.rooms[self.chat_id]['participants']:
            await database_sync_to_async(self._lobbies.remove_room)(self.chat_id)
        await self.close()

    async def receive(self, text_data):
        """
        On message receive from client, create message and send to group
        """
        text_data_json = json.loads(text_data)

        if text_data_json['type'] == 'plain.message':
            try:
                await self.channel_layer.group_send(
                    text_data_json['chat_id'],
                    {
                        'type': text_data_json['type'],
                        'chat_id': text_data_json['chat_id'],
                        'sender': self.scope['user'].username,
                        'content': text_data_json['content'],
                        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    })
            except:
                await self.send(
                    text_data=json.dumps({
                        'status': 'error',
                        'message': 'Could not send message'
                    }))
                return

    async def status_update(self, event):
        update_message = {
            'type': 'status.update',
            'status': event['status'],
            'timestamp': event['timestamp'],
            'sender': event['sender'],
            'chat_id': event['chat_id'],
        }
        if 'participants' in event:
            update_message['participants'] = event['participants']
        await self.send(text_data=json.dumps(update_message))

    async def plain_message(self, event):
        if self.scope['user'].username == event['sender']:
            return
        await self.send(text_data=json.dumps({
                'type': 'plain.message',
                'tournament_id': event['id'],
                'timestamp': event['timestamp'],
                'sender': event['sender'],
                'content': event['content'],
            }))
        
    async def alert(self, event):
        if self.scope['user'].username == event['player1'] or self.scope['user'].username == event['player2']:
            await self.send(text_data=json.dumps({
                'type': 'alert',
                'status': event['status'],
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'tournament_id': event['tournament_id'],
                'player1': event['player1'],
                'player2': event['player2'],
            }))

