from django.urls    import path
from .              import views

urlpatterns = [
    path("users/me/chats", views.ChatView.as_view(), name="Chat View"), # This is going away soon
    path("chats", views.get_chats, name="get_chats"),
    path("chats/<int:id>/messages", views.get_messages_from_chat, name="get_messages"),
    path("", views.index, name="index"), # mt this is just for now
    path("<str:room_name>/", views.room, name="room"), # mt just for testing purposes
]       