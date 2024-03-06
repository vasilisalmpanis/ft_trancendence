from .views         import login_user, logout_user
from django.urls    import path

urlpatterns = [
    path("auth", login_user, name="authorize"),
    path("logout", logout_user, name="logout_user")
]