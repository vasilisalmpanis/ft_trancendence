from typing                     import Any
from django.db                  import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils               import timezone
from transcendence_backend.totp import get_totp_token
from django.conf                import settings
from cryptography.fernet        import Fernet

class UserManager(BaseUserManager):
    def create_user(self, username : str = None,
                    password : str = None,
                    email : str = None,
                    **extra_fields
                    ) -> Any:
        if not username:
            raise ValueError('The Username field must be set')
        if not password:
            raise ValueError('The Password field must be set')
        
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username : str = None,
                    password : str = None,
                    email : str = None,
                    **extra_fields
                    ) -> Any:
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        
        return self.create_user(username, password,email, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=255, unique=True, blank=False)
    email = models.EmailField(max_length=255, unique=True, blank=True)
    password = models.CharField(max_length=255, blank=False)
    avatar = models.CharField(max_length=255, null=True, blank=True)
    token = models.CharField(max_length=255, null=True, blank=True)
    otp_secret = models.CharField(max_length=255, null=True, blank=True)
    is_2fa_enabled = models.BooleanField(default=False)
    is_user_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    ft_intra_id = models.IntegerField(null=True, blank=True)

    #When symmetrical=True (which is the default), Django won't 
    # use the related_name option to create a reverse relation. 
    # It automatically creates the reverse relation from "self" to "self" using the lowercased model name.
    friends = models.ManyToManyField('self', blank=True, symmetrical=True)
    blocked = models.ManyToManyField('self', related_name='blocked_me', blank=True, symmetrical=False)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.username

    def has_perm(self, perm, obj=None):
        return self.is_staff

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

def user_model_to_dict(user : "User") -> dict[str, Any]:
    if not user:
        return {}   
    return {
        "id": user.id,
        "username": user.username,
        "avatar": user.avatar
    }