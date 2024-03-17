from django.db 				import models
from users.models			import User
from django.utils			import timezone
from typing					import Dict, Any

class Pong(models.Model):
	id = models.AutoField(primary_key=True)
	players = models.ManyToManyField(User, related_name='games')
	status = models.CharField(max_length=20, default='pending')
	score1 = models.IntegerField(default=0)
	score2 = models.IntegerField(default=0)
	timestamp = models.DateTimeField(default=timezone.now)
	class Meta:
		verbose_name = 'Pong'


def pong_model_to_dict(pong : Pong) -> Dict[Any, Any]:
	return {
		'id': pong.id,
		'players': [user.username for user in pong.players.all()],
		'status': pong.status,
		'score1': pong.score1,
		'score2': pong.score2,
		'timestamp': pong.timestamp
	}