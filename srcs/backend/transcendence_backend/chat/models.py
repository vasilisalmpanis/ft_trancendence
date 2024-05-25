from ast                        import mod
from email.policy               import default
from http                       import server
from django.db                  import models
from users.models.users         import User
from django.utils               import timezone
from typing                     import Any, Dict

# Create your models here.

class Chat(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    participants = models.ManyToManyField(User, related_name="chats")
    class Meta:
        verbose_name = 'Chat'
        verbose_name_plural = 'Chats'


def chat_model_to_dict(chat, user) -> Dict[Any,Any]:
    """
    Convert chat model to dict
    :param chat: Chat instance
    :return: dict
    """
    if not chat:
        return {}
    participants = chat.participants.all()
    if participants is None:
        return {}
    unread_messages_num = chat.messages.filter(read=False).exclude(sender=user.id).count()
    return {
        "id": chat.id,
        "name": chat.name,
        "unread_messages": unread_messages_num,
        "participants": [participant.id for participant in participants],
    }


class Message(models.Model):
    id = models.AutoField(primary_key=True)
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name="messages")
    timestamp = models.DateTimeField(default=timezone.now)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="messages")
    read = models.BooleanField(default=False)
    content = models.TextField()
    class Meta:
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'

def message_model_to_dict(message) -> dict:
    """
    Convert message model to dict
    :param message: Message instance
    :return: dict
    """
    return {
        "id": message.id,
        "chat_id": message.chat.id,
        "timestamp": message.timestamp,
        "sender": message.sender.username,
        "sender_name": message.sender.username,
        "read": message.read,
        "content": message.content,
    }
