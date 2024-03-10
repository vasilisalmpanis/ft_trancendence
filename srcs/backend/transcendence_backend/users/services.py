from datetime                   import datetime
from venv import logger
from .models                    import User, FriendRequest, user_model_to_dict
from django.conf                import settings
from cryptography.fernet        import Fernet
from transcendence_backend.totp import get_totp_token
import os
import base64
import logging
logger = logging.getLogger(__name__)

class UserService:
    @staticmethod
    def get_friends(user, skip : int = 0, limit : int = 10) -> list[User]:
        """
        Get friends of a user
        :param user: User instance
        :param skip: int
        :param limit: int
        :return: list[User]
        """
        friends = user.friends.all()[skip:skip+limit]
        return [
            {
                user_model_to_dict(friend)
            }
            for friend in friends
        ]
    
    @staticmethod
    def unfriend(user : User, friend_id : int) -> User:
        """
        Unfriend a user 
        :param user: User instance
        :param friend_id: int
        :return: Unfriended user instance
        """
        friend = user.friends.get(id=friend_id)
        if not friend:
            raise Exception("You are not friends with this user")
        user.friends.remove(friend)
        friend.friends.remove(user)
        return friend
    
    @staticmethod
    def block(user : User, user_id : int) -> User:
        """
        Block a user
        :param user: User instance
        :param user_id: int
        :return: Blocked user instance
        """
        user_to_block = User.objects.get(id=user_id)
        if not user_to_block:
            raise Exception("User not found")
        if user_to_block in user.friends.all():
            user.friends.remove(user_to_block)
        if user_to_block in user.blocked.all():
            raise Exception("User is already blocked")
        if user_to_block.blocked.filter(id=user.id).exists():
            raise Exception("User has already blocked you")
        if user.id == user_to_block.id:
            raise Exception("You cannot block yourself")
        user.blocked.add(user_to_block)
        FriendRequest.objects.filter(sender_id=user_to_block.id,
                                     receiver_id=user.id).delete()
        return user_to_block
    
    @staticmethod
    def unblock(user : User, user_id : int) -> User:
        """
        Unblock a user
        :param user: User instance
        :param user_id: int
        :return: Unblocked user instance
        """
        user_to_unblock = User.objects.get(id=user_id)
        if not user_to_unblock:
            raise Exception("User not found")
        if user_to_unblock not in user.blocked.all():
            raise Exception("User is not blocked")
        if user.id == user_to_unblock.id:
            raise Exception("You cannot unblock yourself")
        user.blocked.remove(user_to_unblock)
        return user_to_unblock
    
    @staticmethod
    def get_blocked_users(user : User, skip : int = 0, limit : int = 10) -> list[User]:
        """
        Get blocked users of a user
        :param user: User instance
        :param skip: int
        :param limit: int
        :return: list[User]
        """
        blocked_users = user.blocked.all()[skip:skip+limit]
        return [
            {
                "id": user.id,
                "username": user.username,
                "avatar": user.avatar
            }
            for user in blocked_users
        ]
    
    @staticmethod
    def update_last_login(user : User) -> User:
        """
        Update last login of a user
        :param user: User instance
        :return: Updated user instance
        """
        user.last_login = datetime.now()
        user.save()
        return user
    


class SecondFactorService:
    @staticmethod
    def enable_2fa(user : User) -> bool:
        """
        Enable 2fa for a user
        :param user: User instance
        :return: bool
        """
        user.is_2fa_enabled = True
        user.save()
        return True
    
    @staticmethod
    def disable_2fa(user : User) -> bool:
        """
        Disable 2fa for a user
        :param user: User instance
        :return: bool
        """
        user.otp_secret = None
        user.is_2fa_enabled = False
        user.save()
        return True
    
    @staticmethod
    def create_otp_secret(user : User) -> str:
        """
        Create otp secret for a user
        :param user: User instance
        :return: str
        """
        random = os.urandom(20).hex()
        otp = base64.b32encode(random.encode())
        key = settings.FERNET_SECRET.encode()
        f = Fernet(key)
        user.otp_secret = f.encrypt(otp).decode()
        user.save()
        return otp.decode()
    
    @staticmethod
    def verify_2fa(user : User, auth_code : str) -> bool:
        """
        Verify 2fa for a user
        :param user: User instance
        :param auth_code: str
        :return: bool
        """
        key = settings.FERNET_SECRET.encode()
        f = Fernet(key)
        otp_secret = f.decrypt(user.otp_secret.encode()).decode()
        otp_secret = otp_secret.replace("=", "")
        code = get_totp_token(otp_secret)
        logger.warn(code)
        logger.warn(otp_secret)
        if code != auth_code:
            raise Exception("Invalid 2fa code")
        return True
    
    @staticmethod
    def decrypt_otp_secret(user : User) -> str:
        """
        Decrypt otp secret for a user
        :param user: User instance
        :return: str
        """
        key = settings.FERNET_SECRET.encode()
        f = Fernet(key)
        return f.decrypt(user.otp_secret.encode()).decode()
