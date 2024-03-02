from django.urls    import path
from .              import views

urlpatterns = [
    path("users/me/chats/<int:id>", views.ChatView.as_view(), name="get_chat"),
    path("chats", views.get_chats, name="get_chats"),
    path("chats/<int:id>/messages", views.get_messages_from_chat, name="get_messages"),
]       