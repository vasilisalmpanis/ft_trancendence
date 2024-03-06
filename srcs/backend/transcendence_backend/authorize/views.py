from django.shortcuts                   import render
from users.models                       import User
from transcendence_backend.decorators   import jwt_auth_required
from django.http                        import JsonResponse
from jwt                                import JWT
from django.conf                        import settings
from datetime                           import datetime, timedelta
from time                               import strftime
from django.contrib.auth                import authenticate
import json

# Create your views here.

def create_token(jwt : JWT, user : User, expiration : datetime) -> str:
    """
    Creates a token for the user
    """
    return jwt.create_jwt({"user_id": user.id,
                           "username": user.username,
                           "avatar": user.avatar,
                           "expires_at": strftime("%Y-%m-%d %H:%M:%S",expiration.timetuple())}
                           )

def login_user(request) -> JsonResponse:
    """
    Authenticates the user
    """
    if request.method == "GET":
        return JsonResponse({"Login": "Wrong Reuqest Method"}, status=200)
    data = json.loads(request.body)
    username = data.get("username", None)
    password = data.get("password", None)
    user = authenticate(username=username, password=password)
    if user != None:
        jwt = JWT(settings.JWT_SECRET)
        access_token = create_token(jwt=jwt, user=user, expiration=datetime.now() + timedelta(days=1))
        refresh_token = create_token(jwt=jwt, user=user, expiration=datetime.now() + timedelta(days=30))
        user.is_user_active = True
        user.last_login = datetime.now()
        user.save()
        return JsonResponse({
                                "access_token": access_token,
                                "refresh_token" : refresh_token }, status=200
                            )
    else:
        return JsonResponse({"status": "error"}, status=401)

@jwt_auth_required
def logout_user(request, user : User) -> JsonResponse:
    """
    Logs out the user
    """
    if request.method != 'POST':
        return JsonResponse({"status": "Wrong Request Method"}, status=400)
    user.is_user_active = False
    user.save()
    return JsonResponse({"status": "Logged Out"}, status=200)