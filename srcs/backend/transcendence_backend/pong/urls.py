from django.urls import path
from .views import PongView, get_game_by_id

urlpatterns = [
    path("games", PongView.as_view(), name="health_check"),
    path("games/<int:game_id>", get_game_by_id, name="get_game_by_id"),
]