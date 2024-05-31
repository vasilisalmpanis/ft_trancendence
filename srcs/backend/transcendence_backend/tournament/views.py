from django.views                       import View
from django.utils.decorators            import method_decorator
from transcendence_backend.decorators   import jwt_auth_required
from users.models                       import User
from django.http                        import JsonResponse
from .services                          import TournamentService
from .models import Tournament
import json
# Create your views here.


@method_decorator(jwt_auth_required(), name='dispatch')
class TournamentView(View):
    '''Tournament view'''
    def get(self, request, user : User):
        """
        Returns active tournaments
        @param user: User
        @return: JsonResponse with tournament schema
        """
        try:
            skip = int(request.GET.get('skip', 0))
            limit = int(request.GET.get('limit', 10))
            if skip < 0 or limit < 0:
                return JsonResponse({'status': 'Invalid skip or limit'}, status=400)
            type = request.GET.get('type', 'all')
            tournaments = TournamentService.get_tournaments(type, skip, limit)
            return JsonResponse(tournaments, safe=False)
        except Exception as e:
            return JsonResponse({'status': str(e)}, status=400)

    def post(self, request, user : User):
        """
        Creates a tournament
        @param user: User
        @return: List of tournaments
        """
        try:
            data = json.loads(request.body)
            name = data.get('name', "Pong Tournament")
            description = data.get('description', "Let the games begin")
            max_players = int(data.get('max_players', 20))
            max_points = int(data.get('max_points', 10))
            if max_points < 1 or max_players < 1 or max_players > 20:
                return JsonResponse({'status': 'Invalid max_points or max_players'}, status=400)
            tournament = TournamentService.create_tournament(name, user, description=description, max_points=max_points, max_players=max_players)
            return JsonResponse(tournament, safe=False)
        except Exception as e:
            return JsonResponse({'status': str(e)}, status=400)
        

    def put(self, request, user : User):
        """
        Updates a tournament
        @param user: User
        @return: JsonResponse with tournament schema
        """
        try:
            data = json.loads(request.body)
            tournament_id = int(data.get('tournament_id', 0))
            if tournament_id < 1:
                return JsonResponse({'status': 'Invalid tournament_id'}, status=400)
            tournament = TournamentService.update_tournament(tournament_id, user)
            return JsonResponse(tournament, safe=False)
        except Exception as e:
            return JsonResponse({'status': str(e)}, status=400)
        
    def delete(self, request , user : User):
        """
        Deletes a tournament
        @param user: User
        @return: JsonResponse with success message
        """
        try:
            data = json.loads(request.body)
            tournament_id = int(data.get('tournament_id', 0))
            if tournament_id < 1:
                return JsonResponse({'status': 'Invalid tournament_id'}, status=400)
            tournament = TournamentService.leave_tournament(user, tournament_id)
            return JsonResponse(tournament, safe=False)
        except Exception as e:
            return JsonResponse({'status': str(e)}, status=400)
        
@jwt_auth_required()
def get_tournament_by_id(request, user: User, id: int):
    try:
        if id < 1:
            return JsonResponse({'status': 'Invalid tournament_id'}, status=400)
        data = TournamentService.tournament_by_id(id)
        return JsonResponse(data, safe=False, status=200)
    except Tournament.DoesNotExist:
        return JsonResponse({'status': 'tournament not found'}, safe=False, status=404)
    except Exception as e:
        return JsonResponse({'status': str(e)}, status=400)