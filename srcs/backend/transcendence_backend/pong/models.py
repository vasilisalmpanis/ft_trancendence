from django.db 				import models
from users.models			import User, user_model_to_dict
from django.utils			import timezone
from typing					import Dict, Any

class Pong(models.Model):
	id = models.AutoField(primary_key=True)
	player1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='player1_games')
	player2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='player2_games', null=True, blank=True)
	status = models.CharField(max_length=20, default='pending')
	score1 = models.IntegerField(default=0)
	score2 = models.IntegerField(default=0)
	max_score = models.IntegerField(default=10)

	timestamp = models.DateTimeField(default=timezone.now)
	class Meta:
		verbose_name = 'Pong'


def pong_model_to_dict(pong : Pong, me: User | None = None) -> Dict[Any, Any]:
	return {
		'id': pong.id,
		'player1': user_model_to_dict(pong.player1, me=me),
		'player2': user_model_to_dict(pong.player2, me=me) if pong.player2 is not None else None,
		'status': pong.status,
		'score1': pong.score1,
		'score2': pong.score2,
		'max_score': pong.max_score,
		'timestamp': pong.timestamp.isoformat()
	}


