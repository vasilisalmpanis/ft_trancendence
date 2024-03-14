from ast import Dict
from typing import Dict, Any, List
from .models        import Pong, pong_model_to_dict
from users.models   import User



class PongService:

    @staticmethod
    def get_games(user : User, type : str, skip : int, limit : int) -> List[Dict[Any, Any]]:
        """
        Returns the games of the user
        @param user: User
        @param type: str
        @param skip: int
        @param limit: int
        @return: JsonResponse with game schema
        """
        if type == 'all':
            games = Pong.objects.filter(players=user).order_by('-timestamp')[skip:skip+limit]
        elif type == 'pending':
            games = Pong.objects.filter(players=user).filter(status='pending').order_by('-timestamp')[skip:skip+limit]
        elif type == 'finished':
            games = Pong.objects.filter(players=user).filter(status='finished').order_by('-timestamp')[skip:skip+limit]
        else:
            raise Exception('Invalid type')
        return [pong_model_to_dict(game) for game in games]
    
    @staticmethod
    def check_user_already_joined(user) -> bool:
        """
        Checks if the user has already joined a game
        @param user: User
        @return: bool
        """
        if Pong.objects.filter(players=user).filter(status='pending').exists() or Pong.objects.filter(players=user).filter(status='started').exists():
            return True
        return False

    @staticmethod
    def create_game(user : User) -> Dict[Any, Any]:
        """
        Creates a game for the user and assigns them as participant
        @param user: User
        @return: JsonResponse with game schema
        """
        if PongService.check_user_already_joined(user):
            raise Exception('You have a game in progress')
        game = Pong.objects.create()
        game.players.add(user)
        game.save()
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
    def join_game(user : User, game_id : int) -> Dict[Any, Any]:
        """
        Joins the user to the game
        @param user: User
        @param game_id: int
        @return: JsonResponse with game schema
        """
        game = Pong.objects.filter(id=game_id).first()
        if game is None:
            raise Exception('Game not found')
        if game.status != 'pending':
            raise Exception('Game already started')
        if game.players.filter(id=user.id).exists() and game.players.count() == 2:
            raise Exception('User already joined')
        if PongService.check_user_already_joined(user) and game.players.count() == 2:
            raise Exception('You have a game in progress')
        if not game.players.filter(id=user.id).exists():  
            game.players.add(user)
            game.save()
        return pong_model_to_dict(game)
    

    @staticmethod
    def finish_game(game_id : int, score_1 : int, score_2 : int) -> Dict[Any, Any]:
        """
        Finishes the game
        @param game_id: int
        @return: JsonResponse with game schema
        """
        game = Pong.objects.filter(id=game_id).first()
        if game is None:
            raise Exception('Game not found')
        game.score1 = score_1
        game.score2 = score_2
        game.status = 'finished'
        game.save()
        return pong_model_to_dict(game)
    
    @staticmethod
    def delete_game(game_id : int, user : User) -> None:
        """
        Deletes the game
        @param game_id: int
        """
        game = Pong.objects.filter(id=game_id).first()
        if not game:
            raise Exception('Game not found')
        if game.players.filter(id=user.id).exists() and game.status == 'pending':
            game.delete()
        else:
            raise Exception('You are either not a participant or the game has already started')
