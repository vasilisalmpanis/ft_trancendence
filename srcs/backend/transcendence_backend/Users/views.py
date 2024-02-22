
import email
import re
from django.http                    import JsonResponse
from django.core                    import serializers
from django.views.decorators.csrf   import csrf_exempt
from django.views.decorators.http   import require_http_methods
from django.contrib.auth            import authenticate, login, get_user_model
from django.contrib.auth.decorators import login_required
from pkg_resources import require
from .models                        import User
from logging                        import Logger
import json
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse

logger = Logger(__name__)

@require_http_methods(["GET"])
@login_required
def all_users_view(request):
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
    ## TODO pagination

@csrf_exempt
@require_http_methods(["POST"])
def create_user(request):
    username = request.POST.get("username")
    password = request.POST.get("password")
    email1 = request.POST.get("email")
    if not username or not password or not email:
        return JsonResponse({"status": "error"}, status=400)
    try:
        User.objects.create_user(username=username, password=password, email=email1)
        return JsonResponse({"status": "User Created"}, status=201)
    except Exception:
        return JsonResponse({"status": "error"}, status=400)
    

@csrf_exempt
@require_http_methods(["GET", "POST"])
def login_user(request):
    if request.method == "GET":
        return JsonResponse({"Login": "Create A Form"}, status=200)
    username = request.POST.get("username")
    password = request.POST.get("password")
    user = authenticate(username=username, password=password)
    if user is not None:
        login(request, user)
        return JsonResponse({"status": "Logged In"}, status=200)
    else:
        return JsonResponse({"status": "error"}, status=401)
    
@csrf_exempt
@login_required
@require_http_methods(["PUT"])
def update_user(request):
    user = request.user
    data = request.POST.dict()
    fields = ["username", "password", "email", "avatar"]
    print(data)
    for field in fields:
        if field in data:
            setattr(user, field, data[field])
    
    user.save()
    return JsonResponse({"status": "User Updated"}, status=200)

@csrf_exempt
@login_required
@require_http_methods(["DELETE"])
def delete_user(request):
    user = request.user
    user.delete()
    return JsonResponse({"status": "User Deleted"}, status=200)

    
@require_http_methods(["GET"])
@login_required
@require_http_methods(["GET"])
def get_current_user(request):
    if request.user.is_authenticated:
        data = {
            "username": request.user.username,
            "id": request.user.id,
            "avatar": request.user.avatar
        }
        return JsonResponse(data, status=200)
    return JsonResponse({}, status=401)


@require_http_methods(["GET"])
@login_required
def user_by_id_view(request, id):
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
    
    
def health_check(request):
    health_check = {"health-check": "alive"}
    return JsonResponse(health_check, status=200)
    ## TODO Move it out of here