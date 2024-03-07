from operator import le
from venv                               import logger
from django.shortcuts                   import render
from django.http                        import JsonResponse
from .models                            import Chat, Message
from django.views                       import View
from logging                            import Logger
from transcendence_backend.decorators   import jwt_auth_required
from django.utils.decorators            import method_decorator
from users.models                       import User
import json


logger = Logger(__name__)


## TODO: See what happens with chats between blocked users and their messages
@jwt_auth_required
def get_chats(request, user : User) -> JsonResponse:
    """
    Get all chats for a user by user_id  
    """
    if request.method == "GET":
        user_id = user.id
        skip = int(request.GET.get("skip", 0))
        limit = int(request.GET.get("limit", 10))
        data = Chat.get_chats(user_id, skip, limit)
        if len(data) == 0:
            return JsonResponse({"status": "No chats found"}, status=200)
        return JsonResponse(data, status=200, safe=False)
    
@jwt_auth_required
def get_messages_from_chat(request, user : User, id : int) -> JsonResponse:
    if not request.method == "GET":
        return JsonResponse({"status": "Wrong Request Method"}, status=400)
    try:
        if not Chat.objects.filter(id=id).exists() or not Chat.objects.filter(id=id, participants=user).exists():
            return JsonResponse({"status": "Chat not found"}, status=404)
        messages = Message.get_messages(id)
        return JsonResponse(messages, status=200, safe=False)
    except Exception:
        return JsonResponse({"status": "Chat not found"}, status=404)
    
@method_decorator(jwt_auth_required, name="dispatch")
class ChatView(View):
    # def get(self, request, id : int) -> JsonResponse:
    #     """
    #     Returns Messages of chat filtered by chat id.
    #     """
    #     if not request.user.is_authenticated:
    #         return JsonResponse({"status": "Not authenticated"}, status=401)
    #     try:
    #         chat = Chat.get_chat_id(request.user.id, id)
    #         if not chat:
    #             return JsonResponse({"status": "Chat not found"}, status=404)
    #         return JsonResponse({"chat_id": chat}, status=200)
    #     except Exception:
    #         return JsonResponse({"status": "Chat not found"}, status=404)
    def post(self, request, user : User) -> JsonResponse:
        """
        Creates a new chat between two authenticated
        users if it doesnt already exist.
        """
        try:
            id = int(json.loads(request.body).get("receiver_id", None))
            if not id:
                return JsonResponse({"status": "Receiver ID not found"}, status=400)
            chat = Chat.get_chat_id(user.id, id)
            if chat:
                return JsonResponse({"status": "Chat already exists"}, status=400)
            name = json.loads(request.body).get("name", None)
            chat = Chat.create_chat(user.id, id, name)
            if not chat:
                return JsonResponse({"status": "Chat not created"}, status=400)
            return JsonResponse({"status": "Chat created"}, status=201)
        except Exception as e:
            return JsonResponse({"status": "Problem creating chat"}, status=401)

    def delete(self, request, user : User, id: int) -> JsonResponse:
        """
        Deletes Chat between users removing messages for both.
        """
        try:
            if not Chat.objects.filter(id=id).exists() or not Chat.objects.filter(id=id, participants=user).exists():
                return JsonResponse({"status": "Chat not found"}, status=404)
            if Chat.delete_chat(id):
                return JsonResponse({"status": "Chat deleted"}, status=200)
            return JsonResponse({"status": "Chat not found"}, status=404)
        except Exception:
            return JsonResponse({"status": "Chat not found"}, status=404)

#mt someone has to render something!
def index(request):
	return render(request, "chat/index.html")


def room(request, room_name):
	return render(request, "chat/room.html", {"room_name": room_name})