from django.db import models
from users.models import User

class Pong(models.Model):
	id = models.AutoField(primary_key=True)
	players = models.ManyToManyField(User, related_name='games')

	class Meta:
		verbose_name = 'Pong'
