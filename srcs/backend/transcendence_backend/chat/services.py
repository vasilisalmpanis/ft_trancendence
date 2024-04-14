from .models        import Chat, Message, chat_model_to_dict, message_model_to_dict
from users.models   import User
from typing         import List, Dict



class ChatService:
    @staticmethod
    def get_chat_id(user : User, user_id : int) -> int:
        """
        Get ID of chat between User and user_id
        :param user: User instance
        :param user_id: int
        :return: int
        """
        chat = Chat.objects.filter(participants__id=user.id).filter(participants__id=user_id).first()
        if chat:
            return chat.id
        return None
    
    @staticmethod
    def create_chat(sender : User, user_id, name=None) -> Dict[str, str]:
        """
        Create chat between two users
        :param user: User instance
        :param user_id: int
        :param name: str
        :return: Chat instance
        """
        if sender.id == user_id:
            raise ValueError("Cannot create chat with self")
        receiver = User.objects.get(id=user_id)
        if not receiver:
            raise ValueError("Receiver not found")
        if not sender.friends.filter(id=user_id).exists():
            raise ValueError("User is not your friend")
        if not name:
            name = f"{sender.username} and {receiver.username} chat"
        chat = Chat.objects.create(name=name)
        chat.participants.add(sender)
        chat.participants.add(receiver)
        return chat_model_to_dict(chat, sender)
    
    @staticmethod
    def delete_chat(user : User, chat_id : int) -> Dict[str, str]:
        """
        Delete chat by ID
        :param chat_id: int
        :return: bool
        """
        chat = Chat.objects.filter(id=chat_id, participants__id=user.id).first()
        if chat:
            response = chat_model_to_dict(chat, user)
            chat.delete()
            return response
        return {}
    
    @staticmethod
    def get_chats(user : User, skip : int = 0, limit : int = 10) -> List[Dict[str, str]]:
        """
        Get all chats for a user
        :param user: User instance
        :param skip: int
        :param limit: int
        :return: list
        """
        chats = Chat.objects.filter(participants__id=user.id)[skip:skip+limit]
        return [chat_model_to_dict(chat, user) for chat in chats]


class MessageService:
    @staticmethod
    def create_message(user : User, chat_id : int, content : str) -> Message:
        """
        Send message to chat
        :param user: User instance
        :param chat_id: int
        :param content: str
        :return: bool
        """
        chat = Chat.objects.filter(id=chat_id, participants__id=user.id).first()
        if chat:
            message = Message.objects.create(
                chat=chat,
                sender=user,
                content=content
            )
            return message
        return None

    @staticmethod
    def read_message(user : User, message_id : int) -> bool:
        """
        Mark message as read
        :param user: User instance
        :param message_id: int
        :return: bool
        """
        message = Message.objects.filter(id=message_id, chat__participants__id=user.id).first()
        if not message:
            return False
        if user.username == message.sender.username:
            return False
        message.read = True
        message.save()
        return True

    @staticmethod
    def get_messages(chat_id : int, skip=0, limit=10) -> list:
        messages = Message.objects.filter(chat__id=chat_id).order_by("-timestamp")[skip:skip+limit]
        return [
            message_model_to_dict(message)
            for message in messages
        ]

    @staticmethod
    def get_messages_by_state(chat_id : int, state : str, user : User) -> List[Dict[str, str]]:
        """
        Get all messages of "state" for chat for user me
        :param user: User instance
        :param chat_id: int
        :param state: str
        :return: list
        """
        messages = Message.objects.filter(chat__id=chat_id, read=state, chat__participants__id=user.id)
        return [
            message_model_to_dict(message) 
            for message in messages]
