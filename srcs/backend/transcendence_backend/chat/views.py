from operator import le
from venv                               import logger
from django.shortcuts                   import render
from django.http                        import JsonResponse
from .models                            import Chat, Message
from .services                          import ChatService, MessageService
from django.views                       import View
from logging                            import Logger
from transcendence_backend.decorators   import jwt_auth_required
from django.utils.decorators            import method_decorator
from users.models                       import User
import json

logger = Logger(__name__)

@jwt_auth_required()
def get_messages_from_chat(request, user : User, id : int) -> JsonResponse:
    if not request.method == "GET":
        return JsonResponse({"status": "Wrong Request Method"}, status=400)
    if not Chat.objects.filter(id=id).exists() or not Chat.objects.filter(id=id, participants=user).exists():
        return JsonResponse({"status": "Chat not found"}, status=404)
    skip = int(request.GET.get("skip", 0))
    limit = int(request.GET.get("limit", 10))
    data = MessageService.get_messages(id, skip, limit)
    # if len(data) == 0:
    #     return JsonResponse({"status": "no messages found"}, status=404)
    return JsonResponse(data, status=200, safe=False)

@method_decorator(jwt_auth_required(), name="dispatch")
class ChatView(View):
    def get(self, request, user : User) -> JsonResponse:
        """
        Get all chats for a user by user_id
        """
        skip = int(request.GET.get("skip", 0))
        limit = int(request.GET.get("limit", 10))
        data = ChatService.get_chats(user, skip, limit)
        if len(data) == 0:
            return JsonResponse({"status": "No chats found"}, status=200)
        return JsonResponse(data, status=200, safe=False)

    def post(self, request, user : User) -> JsonResponse:
        """
        Creates a new chat between two authenticated
        users if it doesnt already exist.
        """
        try:
            id = int(json.loads(request.body).get("receiver_id", None))
            if not id:
                return JsonResponse({"status": "Receiver ID not found"}, status=400)
            chat = ChatService.get_chat_id(user, id)
            if chat:
                return JsonResponse({"status": "Chat already exists"}, status=400)
            name = json.loads(request.body).get("name", None)
            chat = ChatService.create_chat(user, id, name)
            if not chat:
                return JsonResponse({"status": "Chat not created"}, status=400)
            return JsonResponse(chat, status=201, safe=False)
        except Exception as e:
            return JsonResponse({"status": str(e)}, status=401)

    def delete(self, request, user : User) -> JsonResponse:
        """
        Deletes Chat between users removing messages for both.
        """
        try:
            id = int(json.loads(request.body).get("chat_id", None))
            if not Chat.objects.filter(id=id).exists() or not Chat.objects.filter(id=id, participants=user).exists():
                return JsonResponse({"status": "Chat not found"}, status=404)
            chat = ChatService.delete_chat(user, id)
            if chat:
                return JsonResponse(chat, status=200)
            return JsonResponse({"status": "Chat not found"}, status=404, safe=False)
        except Exception as e:
            return JsonResponse({"status": str(e)}, status=404)
