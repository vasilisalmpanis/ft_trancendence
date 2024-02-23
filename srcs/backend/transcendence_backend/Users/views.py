from django.http                    import JsonResponse, QueryDict
from django.core                    import serializers
from django.views.decorators.csrf   import csrf_exempt
from django.views.decorators.http   import require_http_methods
from django.contrib.auth            import authenticate, login, get_user_model, logout
from django.contrib.auth.decorators import login_required
from pkg_resources                  import require
from .models                        import User
from .                              import forms
from logging                        import Logger
from django.contrib.auth.decorators import login_required
from django.views.decorators.http   import require_http_methods
from django.http                    import JsonResponse
import email
import json
import re

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
@login_required
def logout_user(request):
    logout(request)
    return JsonResponse({"status": "Logged Out"}, status=200)

@csrf_exempt
@require_http_methods(["POST"])
def create_user(request):
    username = request.POST.get("username")
    password = request.POST.get("password")
    email1 = request.POST.get("email")
    isstaff = request.POST.get("is_staff", False)
    issuper = request.POST.get("is_superuser", False)
    if not username or not password or not email:
        return JsonResponse({"status": "error"}, status=400)
    try:
        User.objects.create_user(username=username, password=password, email=email1, is_staff=isstaff, is_superuser=issuper)
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
@require_http_methods(["POST"])
def update_user_name(request):
    username = forms.UpdateUserNameForm(request.POST, instance=request.user)
    if not username.is_valid():
        return JsonResponse({"status": "error"}, status=400)
    username.save()
    return JsonResponse({"status": "User Updated"}, status=200)

@csrf_exempt
@login_required
@require_http_methods(["POST"])
def update_user_password(request):
    password = forms.UpdateUserPasswordForm(request.POST, instance=request.user)
    if not password.is_valid():
        return JsonResponse({"status": "error"}, status=400)
    new_password = password.cleaned_data.get("password")
    request.user.set_password(new_password)
    request.user.save()
    return JsonResponse({"status": "User Updated"}, status=200)

@csrf_exempt
@login_required
@require_http_methods(["POST"])
def update_user_email(request):
    email = forms.UpdateUserEmailForm(request.POST, instance=request.user)
    if not email.is_valid():
        return JsonResponse({"status": "error"}, status=400)
    email.save()
    return JsonResponse({"status": "User Updated"}, status=200)

@csrf_exempt
@login_required
@require_http_methods(["POST"])
def update_user_avatar(request):
    avatar = forms.UpdateUserAvatarForm(request.POST, instance=request.user)
    if not avatar.is_valid():
        return JsonResponse({"status": "error"}, status=400)
    avatar.save()
    return JsonResponse({"status": "User Updated"}, status=200)

@csrf_exempt
@login_required
@require_http_methods(["DELETE"])
def delete_user(request):
    user = request.user
    user.delete()
    return JsonResponse({"status": "User Deleted"}, status=200)

    
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

