from django.http                        import JsonResponse
from django.views                       import View
from django.views.decorators.http       import require_http_methods
from django.utils.decorators            import method_decorator
from transcendence_backend.decorators   import jwt_auth_required
from ..models                           import User, FriendRequest
from ..services                         import UserService, SecondFactorService
from transcendence_backend.decorators   import jwt_auth_required
from jwt                                import JWT
from chat.models                        import Chat
from stats.models                       import Stats
from django.conf                        import settings
from datetime                           import datetime, timedelta
import authorize.views
import json
import urllib.parse


def health_check(request) -> JsonResponse:
    """
    Health check for the server
    """
    health_check = {"health-check": "alive"}
    return JsonResponse(health_check, status=200)

class UserView(View):

    @jwt_auth_required()
    def get(self, request, user : User) -> JsonResponse:    
        """
        GET: Get all users with pagination
        """
        skip = int(request.GET.get("skip", 0))
        limit = int(request.GET.get("limit", 10))
        users_not_blocked_by_me = User.objects.exclude(blocked=user)
        users_not_blocked_me = User.objects.exclude(blocked_me=user)

        # Intersection of users who haven't blocked me and users whom I haven't blocked
        users = users_not_blocked_by_me.intersection(users_not_blocked_me)[skip:skip+limit]
        data = [
            {
                "name": user.username,
                "id": user.id,
                "avatar": user.avatar
            }
            for user in users
        ]
        return JsonResponse(data, status=200, safe=False)
    
    def post(self, request) -> JsonResponse:
        """
        POST: Create a new user
        """
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")
        email = data.get("email")
        isstaff =  data.get("is_staff", False)
        issuper = data.get("is_superuser", False)
        if not username or not password or not email:
            return JsonResponse({"status": "error"}, status=400)
        try:
            User.objects.create_user(username=username, 
                                     password=password, 
                                     email=email, 
                                     is_staff=isstaff, 
                                     is_superuser=issuper
                                     )
            Stats.objects.create(user=User.objects.get(username=username))
            return JsonResponse({"status": "User Created"}, status=201)
        except Exception:
            return JsonResponse({"status": "creating user"}, status=400)

@require_http_methods(["GET"])
@jwt_auth_required()
def user_by_id_view(request, user : User, id) -> JsonResponse:
    """
    Returns user data by id
    User must be authenticated to receive data
    """
    try:
        user = User.objects.get(id=id)
    except User.DoesNotExist:
        return JsonResponse({"Error" : "User Doesn't Exist"}, status=404)
    data = {
        "user id" : user.id,
        "username": user.username,
        "avatar": user.avatar,
    }
    return JsonResponse(data, safe=False)

@method_decorator(jwt_auth_required(), name="dispatch")
class CurrentUserView(View):
            
    def get(self, request, user : User) -> JsonResponse:
        """
        Returns currently logged in user data
        """
        data = {
            "username": user.username,
            "id": user.id,
            "avatar": user.avatar
        }
        return JsonResponse(data, status=200)
    
    def delete(self, request, user: User) -> JsonResponse:
        """
        Deletes currently logged in user
        """
        # Delete the user from Chat participants
        Chat.objects.filter(participants=user).delete()
        Stats.objects.get(user=user).delete()
        user.delete()
        return JsonResponse({"status": "User Deleted"}, status=200)
    
    def post(self, request, user : User) -> JsonResponse:
        """
        Updates user username, password, email, and avatar
        """
        data = json.loads(request.body)
        if "username" in data:
            user.username = data["username"]
        if "password" in data:
            user.set_password(data["password"])
        if "email" in data:
            user.email = data["email"]
        if "avatar" in data:
            user.avatar = data["avatar"]
        user.save()
        return JsonResponse({"status": "User Updated"}, status=200)

@jwt_auth_required()
def get_friends(request, user : User) -> JsonResponse:
    """
    Get all friends of currently logged in user
    """
    if request.method != "GET":
        return JsonResponse({"Error": "Wrong Request Method"}, status=400)

    try:
        skip = int(request.GET.get("skip", 0))
        limit = int(request.GET.get("limit", 10))
        friends = UserService.get_friends(user, skip, limit)
        if not friends:
            return JsonResponse({"status": "No friends"}, status=200)
        return JsonResponse(friends, status=200, safe=False)
    except Exception as e:
        return JsonResponse({"status": f"{e}"}, status=400)

@method_decorator(jwt_auth_required(), name="dispatch")    
class BlockedUsersView(View):
    def get(self, request, user : User) -> JsonResponse:
        """
        Get all blocked users of currently logged in user
        """
        if request.method != "GET":
            return JsonResponse({"Error": "Wrong Request Method"}, status=400)
        try:
            blocked_users = UserService.get_blocked_users(user)
            if not blocked_users:
                return JsonResponse({"status": "No blocked users"}, status=200)
            return JsonResponse(blocked_users, status=200, safe=False)
        except Exception as e:
            return JsonResponse({"status": f"{e}"}, status=400)
    
    def post(self, request, user : User) -> JsonResponse:
        """
        Blocks a user by user_id
        Deletes pending friend requests between the two users
        """
        if request.method != "POST":
            return JsonResponse({"Error": "Wrong Request Method"}, status=400)
        data = json.loads(request.body)
        user_id = data.get("user_id")
        if not user_id:
            return JsonResponse({"status": "error"}, status=400)
        try:
            UserService.block(user, user_id)
            return JsonResponse({"status": "User Blocked"}, status=200)
        except Exception as e:
            return JsonResponse({"status": f"{e}"}, status=400)
        
    def put(self, request, user : User) -> JsonResponse:
        """
        Unblocks a user by user_id
        """
        if request.method != "PUT":
            return JsonResponse({"Error": "Wrong Request Method"}, status=400)
        data = json.loads(request.body)
        user_id = data.get("user_id")
        if not user_id:
            return JsonResponse({"status": "error"}, status=400)
        try:
            UserService.unblock(user, user_id)
            return JsonResponse({"status": "User Unblocked"}, status=200)
        except Exception as e:
            return JsonResponse({"status": f"{e}"}, status=400)
        

def generate_2fa_qr_uri(username, secret, issuer_name="localhost"):
    # Encode issuer name and username
    issuer_name_encoded = urllib.parse.quote(issuer_name)
    username_encoded = urllib.parse.quote(username)

    # Format the URI
    uri = f"otpauth://totp/{issuer_name_encoded}:{username_encoded}?secret={secret}&issuer={issuer_name_encoded}"

    return uri

@jwt_auth_required(second_factor=True)
def verify_2fa_code(request, user : User) -> JsonResponse:
    """
    Verifies the 2fa code for the user
    :param request: Request object
    :param user: User object
    :return: JsonResponse
    """
    if request.method != 'POST':
        return JsonResponse({"status": "Wrong Request Method"}, status=400)
    if user.is_2fa_enabled:
        return JsonResponse({"status": "2FA is already enabled"}, status=400)
    data = json.loads(request.body)
    code = str(data.get("2fa_code", None))
    if code == None:
        return JsonResponse({"Error": "No code in request body"}, status=400)
    if SecondFactorService.verify_2fa(user, code):
        SecondFactorService.enable_2fa(user)
        UserService.update_last_login(user)
        jwt = JWT(settings.JWT_SECRET)
        ## TODO: Abstract creation of tokens to a separate function
        access_token = authorize.views.create_token(jwt=jwt, user=user, expiration=datetime.now() + timedelta(days=1), isa=user.last_login, second_factor=False)
        refresh_token = authorize.views.create_token(jwt=jwt, user=user, expiration=datetime.now() + timedelta(days=30), isa=user.last_login, second_factor=False)
        return JsonResponse({
                                "status": "2FA Verified",
                                "access_token": access_token,
                                "refresh_token" : refresh_token }, status=200
                            )
    else:
        return JsonResponse({"status": "2FA Not Verified"}, status=400)


@method_decorator(jwt_auth_required(), name="dispatch")
class TOPTView(View):
    def get(self, request, user : User) -> JsonResponse:
        """
        GET 2FA secret key
        :param request: Request object
        :param user: User object
        :return: JsonResponse
        """
        if not user.is_2fa_enabled:
            return JsonResponse({"status": "2FA is not enabled"}, status=400)
        return JsonResponse({"status": SecondFactorService.decrypt_otp_secret(user)}, status=200)
        # return JsonResponse({"status": generate_2fa_qr_uri(user.username, user.otp_secret)}, status=200)
        
    
    def post(self, request, user : User) -> JsonResponse:
        """
        POST: Enable 2FA for the user
        :param request: Request object
        :param user: User object
        :return: JsonResponse with TOTP Secret Key
        """
        if user.is_2fa_enabled:
            return JsonResponse({"status": "2FA is already enabled"}, status=400)
        secret = SecondFactorService.create_otp_secret(user)     
        return JsonResponse({"status": "2FA enabled", "secret": secret}, status=200)
    
    def put(self, request, user : User) -> JsonResponse:
        """
        PUT: Refreshes the clients secret
        :param request: Request object
        :param user: User object
        :return: JsonResponse with new TOTP Secret Key
        """
        if not user.is_2fa_enabled:
            return JsonResponse({"status": "2FA is not enabled"}, status=400)
        secret = SecondFactorService.create_otp_secret(user)
        # TODO : check if the code is maches to enable again
        return JsonResponse({"status": "2FA refreshed", "secret": secret}, status=200)
    
    def delete(self, request, user : User) -> JsonResponse:
        """
        DELETE Disables 2FA for the user
        :param request: Request object
        :param user: User object
        :return: JsonResponse
        """
        if not user.is_2fa_enabled:
            return JsonResponse({"status": "2FA is not enabled"}, status=400)
        if SecondFactorService.disable_2fa(user):
            return JsonResponse({"status": "2FA disabled"}, status=200)
        else:
            return JsonResponse({"status": "error"}, status=400)