from math import log
from operator import le
from re import S
from typing import Dict, List
from venv import logger
from users.models import User
from stats.models import Stats, stats_model_to_dict
import json
import logging

logger  = logging.getLogger(__name__)
class StatService:
    @staticmethod
    def set_stats(user_1: str, user_2: str, score_1: int, score_2: int):
        """
        Sets the stats for the users based on the game result
        :param user_1: Username of the first user
        :param user_2: Username of the second user
        :param score_1: Score of the first user
        :param score_2: Score of the second user
        """
        user1 = User.objects.get(username=user_1)
        user2 = User.objects.get(username=user_2)
        stats1 = user1.stats
        stats2 = user2.stats
        stats1.games_played += 1
        stats2.games_played += 1
        if score_1 > score_2:
            stats1.games_won += 1
            stats2.games_lost += 1
            stats1.total_points += 3
            stats1.win_streaks += 1
            stats2.win_streaks = 0
        elif score_1 < score_2:
            stats2.games_won += 1
            stats1.games_lost += 1
            stats2.total_points += 3
            stats2.win_streaks += 1
            stats1.win_streaks = 0
        else:
            stats1.win_streaks = 0
            stats2.win_streaks = 0
            stats1.games_lost += 1
            stats2.games_lost += 1
        stats1.save()
        stats2.save()
    
    @staticmethod
    def create_stats():
        """
        Creates the stats for the user
        :param user: User object
        """
        stats = Stats()
        stats.save()
        return stats

    @staticmethod
    def get_stats(me: User, user: User | None = None) -> Dict[str, int]:
        """
        Returns the stats for the user
        :param user: User object
        :return: Dict
        """
        # stats = user.stats
        if user and (me.blocked.filter(id=user.id).exists() or user.blocked.filter(id=me.id).exists()):
            raise Exception("User blocked")
        return stats_model_to_dict(user)
    
    @staticmethod
    def leaderboard(me: User, skip: int, limit: int, order: str) -> List[Dict[str, int]]:
        """
        Returns the leaderboard
        :param skip: int
        :param limit: int
        :param order: str
        :return: Dict
        """
        if limit > 100:
            raise ValueError("Limit too high")
        if order not in ["asc", "desc"]:
            raise ValueError("Invalid order")
        users_not_blocked_by_me = User.objects.exclude(blocked=me).exclude(blocked_me=me)
        if order == "asc":
            leaderboard_users = users_not_blocked_by_me.filter(stats__isnull=False).order_by("stats__total_points").values_list('stats__user', flat=True)[skip:skip+limit]
        else:
            leaderboard_users = users_not_blocked_by_me.filter(stats__isnull=False).order_by("-stats__total_points").values_list('stats__user', flat=True)[skip:skip+limit]
        data = [
            stats_model_to_dict(User.objects.get(id=user_id))
            for user_id in leaderboard_users
        ]
        return data