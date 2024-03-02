from .views         import getStatistics, leaderBoard
from django.urls    import path

urlpatterns = [
    path("users/<int:id>/stats", getStatistics, name="getStatistics"),
    path("leaderboard", leaderBoard, name="Leaderboard")
]

