from django.shortcuts                   import render
from django.http                        import JsonResponse
from .models                            import Stats
from users.models                       import User
from django.views                       import View
from transcendence_backend.decorators   import jwt_auth_required



## TODO Do we display blocked users or users who blocked us int the leaderboard?
@jwt_auth_required
def getStatistics(request, user : User, id : int) -> JsonResponse:
    """
    Get statistics for a user by id
    """
    if request.method == "GET":
        try:
            user = User.objects.get(id=id)
            stats = Stats.objects.get(user=user)
            data = {
                "games_played": stats.games_played,
                "games_won": stats.games_won,
                "games_lost": stats.games_lost,
                "total_points": stats.total_points,
                "win_streaks": stats.win_streaks
            }
            return JsonResponse(data, status=200)
        except Exception:
            return JsonResponse({"Error": "User Not Found"}, status=400)
    return JsonResponse({"Error": "Wrong Request Method"}, status=400)

@jwt_auth_required
def leaderBoard(request, user : User) -> JsonResponse:
    """
    Get all users statistics with pagination
    skip : int
    limit : int
    """
    if request.method == 'GET':
        
        skip = int(request.GET.get("skip", 0))
        limit = int(request.GET.get("limit", 10))
        if (limit > 100):
            return JsonResponse({"Error": "Limit too high"}, status=400)
        order = request.GET.get("order", "desc")
        if order not in ["asc", "desc"]:
            return JsonResponse({"Error": "Invalid order"}, status=400)
        if order == "asc":
            users = Stats.objects.order_by("total_points")[skip:skip+limit]
        else:
            users = Stats.objects.order_by("-total_points")[skip:skip+limit]
        data = [
            {
                "username": user.user.username,
                "points": user.total_points,
                "win_streaks": user.win_streaks,
                "games_played": user.games_played,
                "games_won": user.games_won,
                "games_lost": user.games_lost,
            }
            for user in users
        ]
        return JsonResponse(data, status=200, safe=False)
    return JsonResponse({"Error": "Wrong Request Method"}, status=400)