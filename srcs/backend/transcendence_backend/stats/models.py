from django.db import models
from users.models import User

class Stats(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='stats')
    games_played = models.PositiveIntegerField(default=0)
    games_won = models.PositiveIntegerField(default=0)
    games_lost = models.PositiveIntegerField(default=0)
    total_points = models.PositiveIntegerField(default=0)
    win_streaks = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Stats'
        verbose_name_plural = 'Stats'