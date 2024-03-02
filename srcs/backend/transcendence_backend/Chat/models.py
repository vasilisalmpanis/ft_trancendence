from ast import mod
from email.policy import default
from http import server
from statistics import mode
from django.db                  import models
from users.models               import User
from django.utils               import timezone
from django.db.models import Q

# Create your models here.


class Chat(models.Model):
    id = models.AutoField(primary_key=True)
    participants = models.ManyToManyField(User, related_name="chats")
    name = models.CharField(max_length=255, null=True, blank=True)

    def get_chat_id(user_id1, user_id2) -> int:
        chat = Chat.objects.filter(
            participants__id=user_id1
        ).filter(
            participants__id=user_id2
        ).first()
        if chat:
            return chat.id
        else:
            return None
        

    def create_chat(user1, user2, name=None):
        if user1 == user2:
            return None
        if not User.objects.filter(id=user1).exists():
            return None
        elif not User.objects.filter(id=user2).exists():
            return None
        if not name:
            name = f"{User.objects.get(id=user1).username} and {User.objects.get(id=user2).username} chat"
        chat = Chat.objects.create(name=name)
        chat.participants.add(user1)
        chat.participants.add(user2)   
        return chat
    
    def delete_chat(chat_id) -> bool:
        chat = Chat.objects.filter(id=chat_id).first()
        if chat:
            chat.delete()
            return True
        else:
            return False
        
    
    def get_chats(user_id :int, skip : int = 0, limit : int = 10) -> list:
        chats = Chat.objects.filter(participants__id=user_id)[skip:skip+limit]
        user = User.objects.get(id=user_id)
        return [
            {
                "id": chat.id,
                "name": chat.name,
                "receiver" : chat.participants.exclude(id=user_id).first().username,
                "avatar" : user.avatar,
            }
            for chat in chats
        ]
    class Meta:
        verbose_name = 'Chat'
        verbose_name_plural = 'Chats'


class Message(models.Model):
    id = models.AutoField(primary_key=True)
    chat_id = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name="messages")
    timestamp = models.DateTimeField(default=timezone.now)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="messages")
    read = models.BooleanField(default=False)

    def get_messages(chat_id, skip=0, limit=10) -> list:
        messages = Message.objects.filter(chat_id=chat_id).order_by("-timestamp")[skip:skip+limit]
        return [
            {
                "id": message.id,
                "chat_id": message.chat_id.id,
                "timestamp": message.timestamp,
                "sender": message.sender.username,
                "content": message.content,
                "read": message.read
            }
            for message in messages
        ]
    class Meta:
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'

