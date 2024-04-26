from django.shortcuts                   import render
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
        skip = int(request.GET.get('skip', 0))
        limit = int(request.GET.get('limit', 10))
        type = request.GET.get('type', 'all')
        try:
            tournaments = TournamentService.get_tournaments(type, skip, limit)
            return JsonResponse(tournaments, safe=False)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def post(self, request, user : User):
        """
        Creates a tournament
        @param user: User
        @return: List of tournaments
        """
        data = json.loads(request.body)
        name = data.get('name', "Pong Tournament")
        description = data.get('description', "Let the games begin")
        max_players = data.get('max_players', 20)
        max_points = data.get('max_points', 10)
        try:
            tournament = TournamentService.create_tournament(name, user, description=description, max_points=max_points, max_players=max_players)
            return JsonResponse(tournament, safe=False)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
        

    def put(self, request, user : User):
        """
        Updates a tournament
        @param user: User
        @return: JsonResponse with tournament schema
        """
        data = json.loads(request.body)
        tournament_id = data.get('tournament_id')
        if not tournament_id:
            return JsonResponse({'error': 'Tournament ID is required'}, status=400)
        try:
            tournament = TournamentService.update_tournament(tournament_id, user)
            return JsonResponse(tournament, safe=False)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
        
    def delete(self, request , user : User):
        """
        Deletes a tournament
        @param user: User
        @return: JsonResponse with success message
        """
        data = json.loads(request.body)
        tournament_id = data.get('tournament_id')
        if not tournament_id or not isinstance(tournament_id, int):
            return JsonResponse({'error': 'Tournament ID is required'}, status=400)
        try:
            tournament = TournamentService.leave_tournament(user, tournament_id)
            return JsonResponse(tournament, safe=False)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
        
@jwt_auth_required()
def get_tournament_by_id(request, user: User, id: int):
    try:
        data = TournamentService.tournament_by_id(id)
        return JsonResponse(data, safe=False, status=200)
    except Tournament.DoesNotExist:
        return JsonResponse({'error': 'tournament not found'}, safe=False, status=404)