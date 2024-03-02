import json
from os import name
from venv import logger
from django.shortcuts   import render
from django.http        import JsonResponse
from .models            import Chat, Message
from django.views       import View

from logging import Logger

logger = Logger(__name__)

def get_chats(request) -> JsonResponse:
    """
    Get all chats for a user by id  
    """
    if not request.user.is_authenticated:
        return JsonResponse({"status": "Not authenticated"}, status=401)
    if request.method == "GET":
        user_id = request.user.id
        skip = int(request.GET.get("skip", 0))
        limit = int(request.GET.get("limit", 10))
        data = Chat.get_chats(user_id, skip, limit)
        return JsonResponse(data, status=200, safe=False)
    

def get_messages_from_chat(request, id : int) -> JsonResponse:
    if not request.method == "GET":
        return JsonResponse({"status": "Wrong Request Method"}, status=400)
    if not request.user.is_authenticated:
        return JsonResponse({"status" : "Not authenticated"}, status=401)
    try:
        if not Chat.objects.filter(id=id).exists():
            return JsonResponse({"status": "Chat not found"}, status=404)
        messages = Message.get_messages(id)
        return JsonResponse(messages, status=200, safe=False)
    except Exception:
        return JsonResponse({"status": "Chat not found"}, status=404)
    

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
    def post(self, request, id : int) -> JsonResponse:
        """
        Creates a new chat between two authenticated
        users if it doesnt already exist.
        """
        if not request.user.is_authenticated:
            return JsonResponse({"status": "Not authenticated"}, status=401)
        try:
            chat = Chat.get_chat_id(request.user.id, id)
            if chat:
                return JsonResponse({"status": "Chat already exists"}, status=400)
            # if (request.body):
            #     name = json.loads(request.body).get("name", None)
            # else:
            name = None
            chat = Chat.create_chat(request.user.id, id, name)
            return JsonResponse({"status": "Chat created"}, status=201)
        except Exception as e:
            logger.warn(f"Exception: {str(e)}")
            return JsonResponse({"status": "Problem creating chat"}, status=401)
    def delete(self, request, id: int) -> JsonResponse:
        """
        Deletes Chat between users removing messages for both.
        """
        if not request.user.is_authenticated:
            return JsonResponse({"status": "Not authenticated"}, status=401)
        try:
            if Chat.delete_chat(id):
                return JsonResponse({"status": "Chat deleted"}, status=200)
            return JsonResponse({"status": "Chat not found"}, status=404)
        except Exception:
            return JsonResponse({"status": "Chat not found"}, status=404)