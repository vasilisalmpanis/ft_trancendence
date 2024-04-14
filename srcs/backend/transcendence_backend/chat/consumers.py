from asyncio import sleep
from channels.generic.websocket     import AsyncWebsocketConsumer
from channels.db                    import database_sync_to_async
from users.models                   import User, user_model_to_dict
from datetime                       import datetime
from threading                      import Lock
from typing                         import Dict, TypeVar, List
from .models                        import Chat, Message
from pong.models                    import Pong
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

    def get_chat_ids(self, user_id: int) -> List[int]:
        """
        Function to retrieve the chat IDs that the user is part of from the database.
        """
        user_chat_ids = list(Chat.objects.filter(participants__id=user_id).values_list('id', flat=True))
        user_chat_ids.append(0) # global chat
        return user_chat_ids

    def add_client_to_authorized_rooms(self, user_id: int, username: str, channel_name: str, chat_ids: List[int]):
        """
        Adds a channel to a room.
        Returns False if user not participant of the chat
        """
        for chat_id in chat_ids:
            self.init_room(chat_id)
            self.register_client_in_room(chat_id, channel_name, user_id, username)

    def init_room(self, chat_id: str):
        """
        Initializes a with chat_id () room in the manager
        """
        if chat_id != 0:
            chat = Chat.objects.filter(id=chat_id).first()
        if chat_id not in self.rooms.keys():
            self.rooms.setdefault(chat_id, {})
            if chat_id == 0:
                self.rooms[chat_id]['name'] = 'global'
            else:
                self.rooms[chat_id]['name'] = chat.name;

    def register_client_in_room(self, chat_id: str, channel_name: str, user_id: str, username: str):
        """
        Adds or updates user channel in room
        Returns false if user is not participant of chat in db
        """
        if 'participants' not in self.rooms[chat_id]:
            self.rooms[chat_id]['participants'] = []
        for participant in self.rooms[chat_id]['participants'].copy():
            if participant['username'] == username:
                self.rooms[chat_id]['participants'].remove(participant)
        self.rooms[chat_id]['participants'].append({'user_id': user_id, 'username': username, 'channel_name': channel_name})

    def remove_user_from_rooms(self, chat_ids: List[int], channel_name: str):
        """
        Removes user from chatroom in manager and remove room if empty
        """
        for chat_id in chat_ids:
            if chat_id in self.rooms:
                for participant in self.rooms[chat_id]['participants']:
                    if participant.get('channel_name') == channel_name:
                        self.rooms[chat_id]['participants'].remove(participant)
                if not self.rooms[chat_id]['participants']:
                    self.remove_room(chat_id)

    def remove_room(self, chat_id: str):
        """
        Removes room from manager
        """
        if chat_id in self.rooms:
            del self.rooms[chat_id]

    def get_online_friends(self, user: User) -> List[int]:
        """
        Returns a list of online friends of the user
        """
        friends_ids = list(user.friends.values_list('id', flat=True))
        online_friends_ids = []
        for participant in self.rooms[0]['participants']:
                if participant['user_id'] in friends_ids:
                    online_friends_ids.append(participant['user_id'])
        return online_friends_ids

# debug helper
    def get_room_details(self):
        room_details = {}
        for chat_id, chat_info in self.rooms.items():
            room_details[chat_id] = {
                'chat_id': chat_id,
                'name': chat_info.get('name', ''),
                'participants': chat_info.get('participants', []),
            }
        return room_details



class DirectMessageChatConsumer(AsyncWebsocketConsumer):

    _chats = DirectMessageChatroomManager()

    async def connect(self):
        await self.accept()
        self.chat_ids = await database_sync_to_async(self._chats.get_chat_ids)(self.scope['user'].id)
        await database_sync_to_async(self._chats.add_client_to_authorized_rooms)(
            self.scope['user'].id, self.scope['user'].username, self.channel_name, self.chat_ids)

        for chat_id in self.chat_ids:
            await self.channel_layer.group_add(str(chat_id), self.channel_name)
            await self.channel_layer.group_send(str(chat_id), 
                {
                    'type': 'status_update',
                    'status': 'connected',
                    'chat_id': chat_id,
                    'chat_name': self._chats.rooms[chat_id].get('name', ''),
                    'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    'sender_id': self.scope['user'].id,
                    'sender_name': self.scope['user'].username,
                })

        active_friends = await database_sync_to_async(self._chats.get_online_friends)(self.scope['user'])
        await self.send(text_data=json.dumps({
                'type': 'update_for_connecting_client',
                'status': 'connected',
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'channel_name': self.channel_name,
                'active_friends_ids': active_friends,
                'connected_chat_ids': list(self.chat_ids),
            }))


    async def disconnect(self, close_code):
        """
        Removes channel from channel layer and user from room in manager
        """
        self._chats.remove_user_from_rooms(self.chat_ids, self.channel_name)
        await self.channel_layer.group_send('0',
            {
                'type': 'status_update',
                'status': 'disconnected',
                'chat_name': self._chats.rooms[chat_id].get('name', ''),
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'sender_id': self.scope['user'].id,
                'sender_name': self.scope['user'].username,
            })
        for chat_id in self.chat_ids:
            await self.channel_layer.group_discard(str(chat_id), self.channel_name)
        await self.close()

    async def receive(self, text_data):
        """
        On receiving messages from client, create message and send to group
        plain messages are additionaly saved to db
        """
        text_data_json = json.loads(text_data)
        if text_data_json['type'] == 'plain_message':
            try:
                message = await database_sync_to_async(MessageService.create_message)(
                                    self.scope['user'], 
                                    text_data_json['chat_id'],
                                    text_data_json['content']
                                    )
                await self.channel_layer.group_send(text_data_json['chat_id'],
                    {
                        'type': 'plain_message',
                        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        'sender': message.sender.username,
                        'content': message.content,
                        'id': message.id,
                    })
            except:
                await self.send(text_data=json.dumps({
                        'status': 'error', 'message': 'Could not send message'}))
        elif text_data_json['type'] == 'status_update':
            try:
                await self.channel_layer.group_send(text_data_json['chat_id'],
                    {
                        'type': 'status_update',
                        'status': text_data_json['status'],
                        'chat_id': text_data_json['chat_id'],
                        'chat_name': text_data_json['chat_name'],
                        'timestamp': text_data_json['timestamp'],
                        'sender_id': text_data_json['sender_id'],
                        'sender_name': text_data_json['sender_name'],
                    })
            except:
                await self.send(text_data=json.dumps({
                        'status': 'error', 'message': 'Could not send status update'}))
        elif text_data_json['type'] == 'game_invite':
            try:
                await self.channel_layer.group_send(text_data_json['chat_id'],
                    {
                        'type': 'game_invite',
                        'sender': text_data_json['sender'],
                        'timestamp': text_data_json['timestamp'],
                        'game_id': text_data_json['game_id'],
                    })
            except:
                await self.send(text_data=json.dumps({
                        'status': 'error', 'message': 'Could not send game invite'}))

    async def plain_message(self, event):
        """
            On message receive from group, confirm read if recipient and send to client
        """
        if self.scope['user'].username == event['sender']:
            return
        await self.send(text_data=json.dumps({
            'type': 'plain_message',
            'id': event['id'],
            'timestamp': event['timestamp'],
            'sender': event['sender'],
            'content': event['content'],
        }))
        await database_sync_to_async(MessageService.read_message)(self.scope['user'], event['id'])

    async def status_update(self, event):
        active_friends = await database_sync_to_async(self._chats.get_online_friends)(self.scope['user'])
        if event['sender_id'] not in active_friends or self.scope['user'].id == event['sender_id']:
            return
        update_message = {
                    'type': 'status_update',
                    'status': event['status'],
                    'chat_id': event['chat_id'],
                    'chat_name': event['chat_name'],
                    'timestamp': event['timestamp'],
                    'sender_id': event['sender_id'],
                    'sender_name': event['sender_name'],
                }
        if 'participants' in event:
            update_message['participants'] = event['participants']
        await self.send(text_data=json.dumps(update_message))

    async def game_invite(self, event):
        if self.scope['user'].username == event['sender']:
            return
        await self.send(text_data=json.dumps({
            'type': 'game_invite',
            'timestamp': event['timestamp'],
            'sender': event['sender'],
            'game_id': event['game_id'],
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
                'type': 'status_update',
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
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'sender': self.scope['user'].username,
                'chat_id': self.chat_id,
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

        if text_data_json['type'] == 'plain_message':
            try:
                await self.channel_layer.group_send(
                    self.chat_id,
                    {
                        'type': text_data_json['type'],
                        'id': self.chat_id,
                        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        'sender': self.scope['user'].username,
                        'content': text_data_json['content'],
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
            'type': 'status_update',
            'status': event['status'],
            'timestamp': event['timestamp'],
            'sender': event['sender'],
            'chat_id': event['chat_id'],
        }
        if 'participants' in event:
            update_message['participants'] = event['participants']
        await self.send(text_data=json.dumps(update_message))

    async def plain_message(self, event):
        ## potentially neccessary for frontend to see also own messages
        if self.scope['user'].username == event['sender']:
            return
        await self.send(text_data=json.dumps({
                'type': 'plain_message',
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


### python server connection to test second chat member
### from websockets.sync.client import connect
### url = "ws://localhost:8000/ws/chat/dm/"
### access_token = "
### ws = connect(url, additional_headers={ "Authorization" : f'Bearer {access_token}'})
### while True:
###     print(ws.recv())
###self.close()
###ws.send("Hello")
###ws.close()