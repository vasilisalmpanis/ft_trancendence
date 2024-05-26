from re import U
from sys import exception
from typing                     import Any
from django.db                  import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils               import timezone
from .                          import User, user_model_to_dict
import logging

logger = logging.getLogger(__name__)


class FriendRequest(models.Model):
    id = models.AutoField(primary_key=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sender")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="receiver")
    message = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=255, default="PENDING")
    class Meta:
        verbose_name = 'Friend Request'
        verbose_name_plural = 'Friend Requests'

def friend_request_model_to_dict(friend_request : FriendRequest) -> dict[Any, Any]:
    """
    Convert friend request model to dictionary
    @param friend_request: FriendRequest instance
    @return: Dictionary
    """
    return {
        "id": friend_request.id,
        "sender": user_model_to_dict(friend_request.sender),
        "receiver": user_model_to_dict(friend_request.receiver),
        "message": friend_request.message,
        "status": friend_request.status
    }