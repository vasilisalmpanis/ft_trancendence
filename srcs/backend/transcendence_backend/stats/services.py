from users.models import User
from stats.models import Stats
import json

class StatService:
    @staticmethod
    def set_stats(user_1: str, user_2: str, score_1: int, score_2: int):
        '''Sets stats for the game'''
        user1 = User.objects.get(username=user_1)
        user2 = User.objects.get(username=user_2)
        stats1 = Stats.objects.get(user=user1)
        stats2 = Stats.objects.get(user=user2)
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