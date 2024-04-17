from django.db          import models
from typing             import Any, Dict
class Stats(models.Model):
    id = models.AutoField(primary_key=True)
    games_played = models.PositiveIntegerField(default=0)
    games_won = models.PositiveIntegerField(default=0)
    games_lost = models.PositiveIntegerField(default=0)
    total_points = models.PositiveIntegerField(default=0)
    win_streaks = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Stats'
        verbose_name_plural = 'Stats'

    @classmethod
    def get_default_pk(cls):
        return 1


def stats_model_to_dict(user) -> Dict[Any,Any]:
    if not user:
        return {}
    return {
        "username": user.username,
        "user_id" : user.id,
        "games_played": user.stats.games_played,
        "games_won": user.stats.games_won,
        "games_lost": user.stats.games_lost,
        "total_points": user.stats.total_points,
        "win_streaks": user.stats.win_streaks,
    }