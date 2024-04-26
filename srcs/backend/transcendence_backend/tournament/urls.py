from .views         import TournamentView, get_tournament_by_id
from django.urls    import path


urlpatterns = [
    path('tournaments', TournamentView.as_view(), name='tournaments'),
    path('tournaments/<int:id>', get_tournament_by_id, name='Tournament by id'), 
]