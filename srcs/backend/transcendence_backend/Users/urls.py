from django.urls import path
from . import views

urlpatterns = [
    path("healthcheck", views.health_check, name="health_check"),
    path("users/all", views.all_users_view, name="all users"),
    path("users/<int:id>", views.user_by_id_view, name="user_by_id"),
    path("users/new", views.create_user, name="create_user"),
    path("users/update/username", views.update_user_name, name="update_user"),
    path("users/update/password", views.update_user_password, name="update_user_password"),
    path("users/update/email", views.update_user_email, name="update_user_email"),
    path("users/update/avatar", views.update_user_avatar, name="update_user_avatar"),
    path("users/delete", views.delete_user, name="delete_user"),
    path("users/me", views.get_current_user, name="get_current_user"),
    path("login", views.login_user, name="login_user"),
    path("logout", views.logout_user, name="logout_user"),
]       

# TODO Create class view for User Model