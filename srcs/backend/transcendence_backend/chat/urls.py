from django.urls    import path
from .              import views

urlpatterns = [
    path("chats", views.ChatView.as_view(), name="Chat View"),
    path("chats/<int:id>/messages", views.get_messages_from_chat, name="get_messages"),
]