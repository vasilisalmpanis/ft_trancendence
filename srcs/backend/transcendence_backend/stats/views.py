from django.shortcuts                   import render
from django.http                        import JsonResponse
from .models                            import Stats
from .services                          import StatService
from users.models                       import User
from users.services                     import UserService
from django.views                       import View
from transcendence_backend.decorators   import jwt_auth_required

import logging

logger = logging.getLogger(__name__)

## TODO Do we display blocked users or users who blocked us int the leaderboard?
@jwt_auth_required()
def getStatistics(request, user : User, id : int) -> JsonResponse:
    """
    Get statistics for a user by id
    """
    if request.method == "GET":
        try:
            if id < 0:
                return JsonResponse({"status": "Invalid id"}, status=400)
            new_user = User.objects.get(id=id)
            stats = StatService.get_stats(user, new_user)
            return JsonResponse(stats, status=200, safe=False)
        except Exception:
            return JsonResponse({"status": "user not found"}, status=400)
    return JsonResponse({"status": "wrong request method"}, status=400)

@jwt_auth_required()
def leaderBoard(request, user : User) -> JsonResponse:
    """
    Get all users statistics with pagination
    skip : int
    limit : int
    """
    if request.method == 'GET':
        try:        
            skip = int(request.GET.get("skip", 0))
            limit = int(request.GET.get("limit", 10))
            if skip < 0 or limit < 0:
                return JsonResponse({"status": "Invalid skip or limit"}, status=400)
            order = request.GET.get("order", "desc")
            stats = StatService.leaderboard(user, skip, limit, order)
            return JsonResponse(stats, status=200, safe=False)
        except Exception as e:
            return JsonResponse({"status": str(e)}, status=400)

    return JsonResponse({"status": "wrong request method"}, status=400)