from typing                     import Any
from django.db                  import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils               import timezone
from .                              import User


class FriendRequest(models.Model):
    id = models.AutoField(primary_key=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sender")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="receiver")
    message = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=255, default="PENDING")

    def get_user_friend_requests(user_id : int, type : str) -> list:
        if type == "sent":
            friend_requests = FriendRequest.objects.filter(sender__id=user_id).filter(status="PENDING")
        else:
            friend_requests = FriendRequest.objects.filter(receiver__id=user_id).filter(status="PENDING")
        return [
            {
                "id": friend_request.id,
                "sender": friend_request.sender.username,
                "message": friend_request.message,
            }
            for friend_request in friend_requests
        ]
    
    def create_friend_request(sender_id : int, receiver_id : int, message : str = None) -> Any:
        if sender_id == receiver_id:
            return None
        if not User.objects.filter(id=sender_id).exists():
            return None
        elif not User.objects.filter(id=receiver_id).exists():
            return None
        if not message:
            message = f"{User.objects.get(id=sender_id).username} wants to be your friend"
        if FriendRequest.objects.filter(sender_id=sender_id, receiver_id=receiver_id).exists():
            return None
        friend_request = FriendRequest.objects.create(
            sender_id=sender_id,
            receiver_id=receiver_id,
            message=message
        )
        return friend_request
    
    def accept_friend_request(request_id : int, user) -> bool:
        friend_request = FriendRequest.objects.filter(id=request_id).filter(receiver=user).first()
        if not friend_request:
            return False
        if friend_request.status != "PENDING":
            return False
        sender = friend_request.sender
        receiver = friend_request.receiver
        sender.friends.add(receiver)
        receiver.friends.add(sender)
        friend_request.status = "ACCEPTED"
        friend_request.save()
        return True
    
    def decline_friend_request(request_id : int, user) -> bool:
        friend_request = FriendRequest.objects.filter(id=request_id).filter(receiver=user).first()
        if not friend_request:
            return False
        if friend_request.status != "PENDING":
            return False
        friend_request.status = "DECLINED"
        friend_request.save()
        return True
        
    def delete_friend_request(request_id : int) -> bool:
        friend_request = FriendRequest.objects.filter(id=request_id).first()
        if friend_request:
            friend_request.delete()
            return True
        else:
            return False
    class Meta:
        verbose_name = 'Friend Request'
        verbose_name_plural = 'Friend Requests'