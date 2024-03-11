from .views         import login_user, logout_user, refresh_token, verify_2fa
from django.urls    import path

urlpatterns = [
    path("auth", login_user, name="authorize"),
    path("auth/refresh", refresh_token, name="refresh_token"),
    path("auth/verify", verify_2fa, name="verify_2fa"),
    path("logout", logout_user, name="logout_user")
]