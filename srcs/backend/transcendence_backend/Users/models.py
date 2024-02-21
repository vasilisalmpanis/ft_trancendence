from django.db import models


class User(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=80)
    password = models.CharField(max_length=80)
    email = models.EmailField()
    avatart = models.CharField(max_length=120)
    token = models.CharField(max_length=80)
    creation_date = models.DateTimeField()