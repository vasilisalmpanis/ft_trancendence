from django.http                        import JsonResponse
from django.views                       import View
from django.views.decorators.csrf       import csrf_exempt
from django.views.decorators.http       import require_http_methods
from django.utils.decorators            import method_decorator
from django.contrib.auth                import authenticate, login, logout
from django.contrib.auth.decorators     import login_required
from transcendence_backend.decorators   import jwt_auth_required
from datetime                           import datetime, timedelta
from time                               import strftime
from ..models                           import User, FriendRequest
from transcendence_backend.decorators   import jwt_auth_required
from chat.models                        import Chat
from stats.models                       import Stats
from jwt                                import JWT
from django.conf                        import settings
import json


class UserView(View):

    @jwt_auth_required
    def get(self, request, user : User) -> JsonResponse:
        """
        GET: Get all users with pagination
        """
        skip = int(request.GET.get("skip", 0))
        limit = int(request.GET.get("limit", 10))
        users_not_blocked_by_me = User.objects.exclude(blocked=user)
        users_not_blocked_me = User.objects.exclude(blocked_me=user)

        # Intersection of users who haven't blocked me and users whom I haven't blocked
        users = users_not_blocked_by_me.intersection(users_not_blocked_me)
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
            return JsonResponse({"status": "error"}, status=400)

@require_http_methods(["GET"])
@jwt_auth_required
def user_by_id_view(request, user : User, id) -> JsonResponse:
    """
    Returns user data by id
    User must be authenticated to receive data
    """
    try:
        user = User.objects.get(id=id)
    except User.DoesNotExist:
        return JsonResponse({}, status=404)
    data = {
        "user id" : user.id,
        "username": user.username,
        "avatar": user.avatar,
    }
    return JsonResponse(data, safe=False)

def health_check(request) -> JsonResponse:
    """
    Health check for the server
    """
    health_check = {"health-check": "alive"}
    return JsonResponse(health_check, status=200)

@method_decorator(jwt_auth_required, name="dispatch")
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
    
    def delete(self, request) -> JsonResponse:
        """
        Deletes currently logged in user
        """
        user = request.user
        # Delete the user from Chat participants
        Chat.objects.filter(participants=user).delete()
        Stats.objects.get(user=user).delete()
        user.delete()
        return JsonResponse({"status": "User Deleted"}, status=200)
    
    def post(self, request) -> JsonResponse:
        """
        Updates user username, password, email, and avatar
        """
        user = request.user
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
    
def get_friends(request) -> JsonResponse:
    """
    Get all friends of currently logged in user
    """
    if request.method != "GET":
        return JsonResponse({"Error": "Wrong Request Method"}, status=400)
    if not request.user.is_authenticated:
        return JsonResponse({"status": "Not authenticated"}, status=401)
    try:
        skip = int(request.GET.get("skip", 0))
        limit = int(request.GET.get("limit", 10))
        friends = request.user.get_friends(skip, limit)
        if not friends:
            return JsonResponse({"status": "No friends"}, status=200)
        return JsonResponse(friends, status=200, safe=False)
    except Exception as e:
        return JsonResponse({"status": f"{e}"}, status=400)
    
class BlockedUsersView(View):
    def get(self, request) -> JsonResponse:
        """
        Get all blocked users of currently logged in user
        """
        if request.method != "GET":
            return JsonResponse({"Error": "Wrong Request Method"}, status=400)
        if not request.user.is_authenticated:
            return JsonResponse({"status": "Not authenticated"}, status=401)
        try:
            blocked_users = request.user.get_blocked_users()
            if not blocked_users:
                return JsonResponse({"status": "No blocked users"}, status=200)
            return JsonResponse(blocked_users, status=200, safe=False)
        except Exception as e:
            return JsonResponse({"status": f"{e}"}, status=400)
    
    def post(self, request) -> JsonResponse:
        """
        Blocks a user by user_id
        Deletes pending friend requests between the two users
        """
        if request.method != "POST":
            return JsonResponse({"Error": "Wrong Request Method"}, status=400)
        if not request.user.is_authenticated:
            return JsonResponse({"status": "Not authenticated"}, status=401)
        data = json.loads(request.body)
        user_id = data.get("user_id")
        if not user_id:
            return JsonResponse({"status": "error"}, status=400)
        try:
            if request.user.block(user_id):
                FriendRequest.objects.filter(sender_id=user_id, receiver_id=request.user.id).delete()
            return JsonResponse({"status": "User Blocked"}, status=200)
        except Exception as e:
            return JsonResponse({"status": f"{e}"}, status=400)
        
    def put(self, request) -> JsonResponse:
        """
        Unblocks a user by user_id
        """
        if request.method != "PUT":
            return JsonResponse({"Error": "Wrong Request Method"}, status=400)
        if not request.user.is_authenticated:
            return JsonResponse({"status": "Not authenticated"}, status=401)
        data = json.loads(request.body)
        user_id = data.get("user_id")
        if not user_id:
            return JsonResponse({"status": "error"}, status=400)
        try:
            request.user.unblock(user_id)
            return JsonResponse({"status": "User Unblocked"}, status=200)
        except Exception as e:
            return JsonResponse({"status": f"{e}"}, status=400)