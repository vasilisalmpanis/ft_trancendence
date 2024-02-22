from django.urls import path

from . import views

urlpatterns = [
    path("", views.health_check, name="health_check"),
    path("users/all", views.all_users_view, name="all users"),
    path("users/<int:id>", views.user_by_id_view, name="user_by_id"),
    path("users", views.create_user, name="create_user"),
    path("users/update", views.update_user, name="update_user"),
    path("users/me/delete", views.delete_user, name="delete_user"),
    path("users/me", views.get_current_user, name="get_current_user"),
    path("login", views.login_user, name="login_user"),
]       

# TODO Create class view for User Model