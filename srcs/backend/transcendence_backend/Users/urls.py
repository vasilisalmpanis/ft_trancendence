from django.urls import path
from . import views

urlpatterns = [
    path("healthcheck", views.health_check, name="health_check"),

    path("login", views.login_user, name="login_user"),
    path("logout", views.logout_user, name="logout_user"),

    path("users", views.handle_users, name="users"),
    path("users/<int:id>", views.user_by_id_view, name="user_by_id"),
    path("users/me", views.get_current_user, name="get_current_user"),
    path("users/me/update", views.update_user, name="update_user"),
    path("users/me/delete", views.delete_user, name="delete_user"),
]       
