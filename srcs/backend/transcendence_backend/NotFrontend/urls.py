from django.urls import path
from . import views

urlpatterns = [
	path("mtlogin", views.index, name="index"),
	path("dashboard", views.dashboard, name="dashboard"),
	path("unknown_user", views.unknown_user, name="unknown_user"),
]
