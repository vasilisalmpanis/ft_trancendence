from django.http                    import JsonResponse
from django.views                   import View
from django.views.decorators.csrf   import csrf_exempt
from django.views.decorators.http   import require_http_methods
from django.utils.decorators        import method_decorator
from django.contrib.auth            import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from .models                        import User
from logging                        import Logger
from typing                         import Any
import email , json


logger = Logger(__name__)

@require_http_methods(["GET", "POST"])
def handle_users(request) -> JsonResponse:
    """
    GET: Get all users with pagination
    POST: Create a new user
    """
    if request.method == "GET":
        if not request.user.is_authenticated:
            return JsonResponse({"status": "Not authenticated"}, status=401)
        skip = int(request.GET.get("skip", 0))
        limit = int(request.GET.get("limit", 10))
        users = User.objects.all()[skip:skip+limit]
        data = [
            {
                "name": user.username,
                "id": user.id,
                "avatar": user.avatar
            }
            for user in users
        ]
        return JsonResponse(data, status=200, safe=False)
    if request.method == "POST":
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")
        email1 = data.get("email")
        isstaff =  data.get("is_staff", False)
        issuper = data.get("is_superuser", False)
        if not username or not password or not email:
            return JsonResponse({"status": "error"}, status=400)
        try:
            User.objects.create_user(username=username, 
                                     password=password, 
                                     email=email1, 
                                     is_staff=isstaff, 
                                     is_superuser=issuper
                                     )
            return JsonResponse({"status": "User Created"}, status=201)
        except Exception:
            return JsonResponse({"status": "error"}, status=400)
    ## TODO pagination

@csrf_exempt
@require_http_methods(["POST"])
def logout_user(request) -> JsonResponse:
    """
    Logs out the user
    """
    if not request.user.is_authenticated:
        return JsonResponse({"status": "Not authenticated"}, status=401)
    logout(request)
    return JsonResponse({"status": "Logged Out"}, status=200)

@csrf_exempt
@require_http_methods(["GET", "POST"])
def login_user(request) -> JsonResponse:
    """
    Authenticates the user
    """
    if request.method == "GET":
        return JsonResponse({"Login": "Create A Form"}, status=200)
    data = json.loads(request.body)
    username = data.get("username", None)
    password = data.get("password", None)
    user = authenticate(username=username, password=password)
    if user is not None:
        login(request, user)
        return JsonResponse({"status": "Logged In"}, status=200)
    else:
        return JsonResponse({"status": "error"}, status=401)

from Chat.models import Chat  # Import the Chat model

@require_http_methods(["GET"])
@login_required
def user_by_id_view(request, id) -> JsonResponse:
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

@method_decorator(login_required, name="dispatch")
class CurrentUserView(View):
            
    def get(self, request) -> JsonResponse:
        """
        Returns currently logged in user data
        """
        if request.user.is_authenticated:
            data = {
                "username": request.user.username,
                "id": request.user.id,
                "avatar": request.user.avatar
            }
            return JsonResponse(data, status=200)
        return JsonResponse({}, status=401)
    
    def delete(self, request) -> JsonResponse:
        """
        Deletes currently logged in user
        """
        user = request.user
        # Delete the user from Chat participants
        Chat.objects.filter(participants=user).delete()
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