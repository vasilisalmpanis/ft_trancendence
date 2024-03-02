from django.urls import path
from users.views import user_views, friends_views

urlpatterns = [
    path("healthcheck", user_views.health_check, name="health_check"),

    path("login", user_views.login_user, name="login_user"),
    path("logout", user_views.logout_user, name="logout_user"),

    path("users", user_views.handle_users, name="users"),
    path("users/<int:id>", user_views.user_by_id_view, name="user_by_id"),
    path("users/me", user_views.CurrentUserView.as_view(), name="get_current_user"),

    path("friends", user_views.get_friends, name="get_friends"), # Could be changed to /users/me/friends

    path("friendrequests/incoming", friends_views.get_incoming_friend_requests, name="get_pending_friend_requests"),
    path("friendrequests", friends_views.FriendsView.as_view() , name="friend_requests"),
    path("friendrequests/accept", friends_views.accept_friend_request, name="accept_friend_request"),
    path("friendrequests/decline", friends_views.decline_friend_request, name="decline_friend_request"),


    # /friendrequest/incoming
    # /friendrequest (GET)
    # /friendrequest (POST) -> BODY {receiver_id, message}
    # /friendrequest/accept (POST) -> BODY {request_id}
    # /friendrequest/decline (POST) -> BODY {request_id}
]       
