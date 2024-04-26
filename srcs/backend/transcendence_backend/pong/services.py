from ast            import Dict
from types          import NoneType
from typing         import Dict, Any, List
from .models        import Pong, pong_model_to_dict    
from users.models   import User, user_model_to_dict
from django.db.models import Q
from tournament.models import Tournament
import logging

logger = logging.getLogger(__name__)

def join_game(user , game_id : int):
    '''Joins user to game'''
    game = Pong.objects.get(id=game_id)
    user_games = Pong.objects.filter(Q(player1=user) | Q(player2=user))
    if game.status == 'finished':
        return False
    if user == game.player1 or user == game.player2:
        game.status = 'running'
        return True
    if game.player2 is not None:
        return False
    if user_games.filter(status='pending').exists() or user_games.filter(status='running').exists():
        return False
    game.player2 = user
    game.status = 'running'
    game.save()
    return True

def pause_game(game_id: int):
    '''Pauses game'''
    game = Pong.objects.get(id=game_id)
    if game.status == 'running':
        game.status = 'paused'
        game.save()

def resume_game(game_id: int):
    '''Resumes game'''
    game = Pong.objects.get(id=game_id)
    if game.status == 'paused':
        game.status = 'running'
        game.save()



class PongService:

    @staticmethod
    def get_games(user : User, type : str, skip : int, limit : int, me : bool = False) -> List[Dict[Any, Any]]:
        """
        Returns the games of the user
        @param user: User
        @param type: str
        @param skip: int
        @param limit: int
        @return: JsonResponse with game schema
        """
        users_blocked_by_me = user.blocked.all()
        users_blocked_me = User.objects.filter(blocked=user)
        order_by = ['-timestamp', 'id']
        if type.lower() not in ['all', 'pending', 'finished', 'running', 'paused']:
            raise Exception('Invalid type')
        if me:
            if type == 'all':
                games = Pong.objects.filter(Q(player1=user) | Q(player2=user)).\
                    order_by(*order_by).\
                    exclude(Q(player1__in=users_blocked_by_me) | Q(player2__in=users_blocked_by_me) | Q(player1__in=users_blocked_me) | Q(player2__in=users_blocked_me))[skip:skip+limit]
            else:
                games = Pong.objects.filter(Q(player1=user) | Q(player2=user)).\
                    filter(status=type).\
                    order_by(*order_by).\
                    exclude(Q(player1__in=users_blocked_by_me) | Q(player2__in=users_blocked_by_me) | Q(player1__in=users_blocked_me) | Q(player2__in=users_blocked_me))[skip:skip+limit]
        else:
            if type == 'all':
                games = Pong.objects.order_by(*order_by).\
                    exclude(Q(player1__in=users_blocked_by_me) | Q(player2__in=users_blocked_by_me) | Q(player1__in=users_blocked_me) | Q(player2__in=users_blocked_me))[skip:skip+limit]
            else:
                games = Pong.objects.filter(status=type).\
                    order_by(*order_by).\
                    exclude(Q(player1__in=users_blocked_by_me) | Q(player2__in=users_blocked_by_me) | Q(player1__in=users_blocked_me) | Q(player2__in=users_blocked_me))[skip:skip+limit]
        return [pong_model_to_dict(game) for game in games]
    
    @staticmethod
    def get_user_games(id: int, type : str, skip : int, limit : int, me: User) -> List[Dict[Any, Any]]:
        """
        Returns the games of the user
        @param id: int
        @param type: str
        @param skip: int
        @param limit: int
        @return: JsonResponse with game schema
        """

        user = User.objects.filter(id=id).first()

        if user is None:
            raise Exception('User not found')
        users_blocked_by_me = user.blocked.all()
        users_blocked_me = User.objects.filter(blocked=user)
        order_by = ['-timestamp', 'id']
        if user.blocked.filter(id=me.id).exists() or me.blocked.filter(id=user.id).exists():
            raise Exception('User blocked')
        if type.upper() not in ['ALL', 'PENDING', 'FINISHED', 'RUNNING', 'PAUSED']:
            raise Exception('Invalid type')
        if type == 'all':
            games = Pong.objects.filter(Q(player1=user) | Q(player2=user)).\
                order_by(*order_by).\
                exclude(Q(player1__in=users_blocked_by_me) | Q(player2__in=users_blocked_by_me) | Q(player1__in=users_blocked_me) | Q(player2__in=users_blocked_me))[skip:skip+limit]
        else:
            games = Pong.objects.filter(Q(player1=user) | Q(player2=user)).\
                filter(status=type.lower()).\
                order_by(*order_by).\
                exclude(Q(player1__in=users_blocked_by_me) | Q(player2__in=users_blocked_by_me) | Q(player1__in=users_blocked_me) | Q(player2__in=users_blocked_me))[skip:skip+limit]
        return [pong_model_to_dict(game, me) for game in games]
    
    @staticmethod
    def check_user_already_joined(user) -> bool:
        """
        Checks if the user has already joined a game
        @param user: User
        @return: bool
        """
        if Pong.objects.filter(Q(player1=user) | Q(player2=user)).filter(status='pending').exists() or Pong.objects.filter(Q(player1=user) | Q(player2=user)).filter(status='running').exists():
            return True
        return False

    @staticmethod
    def create_game(user : User, max_points) -> Dict[Any, Any]:
        """
        Creates a game for the user and assigns them as participant
        @param user: User
        @return: JsonResponse with game schema
        """
        if PongService.check_user_already_joined(user):
            raise Exception('You have a game in progress')
        if max_points < 3 or max_points > 20:
            raise Exception('Invalid max points')
        game = Pong.objects.create(player1=user, max_score=max_points)
        return pong_model_to_dict(game)
    
    @staticmethod
    def get_game_by_id(game_id : int) -> Dict[Any, Any]:
        """
        Returns the game by id
        @param game_id: int
        @return: JsonResponse with game schema
        """
        game = Pong.objects.filter(id=game_id).first()
        if game is None:
            raise Exception('Game not found')
        return pong_model_to_dict(game)

    @staticmethod
    def finish_game(game_id: int, result: Dict[str,Any] | NoneType = None) -> Dict[Any, Any]:
        """
        Finishes the game
        @param game_id: int
        @return: JsonResponse with game schema
        """
        score1 = 0
        score2 = 0
        if result is not None:
            score1 = result['s1']
            score2 = result['s2']
        game = Pong.objects.filter(id=game_id).first()
        if game is None:
            raise Exception('Game not found')
        if game.player2 is None:
            raise Exception('Game is not full')
        if game.status != 'finished' and score1 < game.max_score and score2 < game.max_score:
            try:
                Tournament.objects.get(games__in=[game.id])
            except Exception as e:
                game.delete()
            return pong_model_to_dict(game)
        if game.status == 'finished':
            return pong_model_to_dict(game)
        game.score1 = score1
        game.score2 = score2
        game.status = 'finished'
        game.save()
        if score1 > score2:
            return user_model_to_dict(game.player1, avatar=False)
        elif score1 < score2:
            return user_model_to_dict(game.player2, avatar=False)
        return pong_model_to_dict(game)
    
    @staticmethod
    def delete_game(game_id : int, user : User) -> Dict[Any, Any]:
        """
        Deletes the game
        @param game_id: int
        """
        game = Pong.objects.filter(id=game_id).first()
        if not game:
            raise Exception('Game not found')
        if game.player1 == user or game.player2 == user and game.status == 'pending':
            game.delete()
            return pong_model_to_dict(game)
        else:
            raise Exception('You are either not a participant or the game has already started')
        
    @staticmethod
    def get_max_score(game_id: int) -> int:
        """
        Returns the max score of the game
        @param game_id: int
        @return: int
        """
        game = Pong.objects.filter(id=game_id).first()
        if game is None:
            raise Exception('Game not found')
        return game.max_score
        
        
