from ast import mod
from email.policy import default
from http import server
from django.db                  import models
from Users.models               import User
from django.utils               import timezone

# Create your models here.


class Chat(models.Model):
    id = models.AutoField(primary_key=True)
    participants = models.ManyToManyField(User, related_name="chats")
    name = models.CharField(max_length=255, null=True, blank=True)
    class Meta:
        verbose_name = 'Chat'
        verbose_name_plural = 'Chats'


class Message(models.Model):
    id = models.AutoField(primary_key=True)
    chat_id = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name="messages")
    timestamp = models.DateTimeField(default=timezone.now)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="messages")
    read = models.BooleanField(default=False)
    class Meta:
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'


