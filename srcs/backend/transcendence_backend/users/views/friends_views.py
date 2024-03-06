from django.http                    import JsonResponse
from django.utils.decorators        import method_decorator
from users.models                   import User, FriendRequest, user_model_to_dict
from django.views                   import View
from django.forms.models            import model_to_dict
import json
import logging

logger = logging.getLogger(__name__)

def get_incoming_friend_requests(request) -> JsonResponse:
    """
    Get all incoming friend requests
    """
    if request.method != "GET":
        return JsonResponse({"Error": "Wrong Request Method"}, status=400)
    if not request.user.is_authenticated:
        return JsonResponse({"status": "Not authenticated"}, status=401)
    try:
        friend_requests = FriendRequest.get_user_friend_requests(request.user.id, "incoming")
        if not friend_requests:
            return JsonResponse({"status": "No friend requests"}, status=200)
        return JsonResponse(friend_requests, status=200, safe=False)
    except Exception as e:
        return JsonResponse({"status": f"{e}"}, status=400)
    

class FriendsView(View):
    def get(self, request) -> JsonResponse:
        """
        Get all sent friend requests by currently logged in user
        """
        if not request.user.is_authenticated:
            return JsonResponse({"status": "Not authenticated"}, status=401)
        try:
            friend_requests = FriendRequest.get_user_friend_requests(request.user.id, "sent")
            if not friend_requests:
                return JsonResponse({"status": "No friend requests"}, status=200)
            return JsonResponse(friend_requests, status=200, safe=False)
        except Exception as e:
            return JsonResponse({"status": f"{e}"}, status=400)
    
    def post(self, request) -> JsonResponse:
        """
        Create a new friend request
        body: {receiver_id, message}
        """
        if not request.user.is_authenticated:
            return JsonResponse({"status": "Not authenticated"}, status=401)
        data = json.loads(request.body)
        receiver_id = int(data.get("receiver_id"))
        logger.warning(f"Receiver ID: {receiver_id}")
        message = data.get("message")
        if not receiver_id:
            return JsonResponse({"status": "error"}, status=400)
        try:
            friend_request = FriendRequest.create_friend_request(sender_id=request.user.id,
                                                                 receiver_id=receiver_id,
                                                                 message=message
                                                                 )
            if friend_request:
                return JsonResponse(model_to_dict(friend_request), status=201)
            return JsonResponse({"status": "Friend request not created"}, status=400)
        except Exception as e:
            return JsonResponse({"status": f"{e}"}, status=400)

    
def accept_friend_request(request) -> JsonResponse:
    if request.method != "POST":
        return JsonResponse({"Error": "Wrong Request Method"}, status=400)
    if not request.user.is_authenticated:
        return JsonResponse({"status": "Not authenticated"}, status=401)
    data = json.loads(request.body)
    request_id = data.get("request_id")
    if not request_id:
        return JsonResponse({"status": "error"}, status=400)
    try:
        if FriendRequest.accept_friend_request(request_id, request.user):
            return JsonResponse({"status": "Friend request accepted"}, status=200)
        return JsonResponse({"status": "Friend request declined"}, status=400)
    except Exception as e:
        return JsonResponse({"status": f"{e}"}, status=400)
    

def decline_friend_request(request) -> JsonResponse:
    if request.method != "POST":
        return JsonResponse({"Error": "Wrong Request Method"}, status=400)
    if not request.user.is_authenticated:
        return JsonResponse({"status": "Not authenticated"}, status=401)
    data = json.loads(request.body)
    request_id = data.get("request_id")
    if not request_id:
        return JsonResponse({"status": "error"}, status=400)
    try:
        if FriendRequest.decline_friend_request(request_id, request.user):
            return JsonResponse({"status": "Friend request declined"}, status=200)
        return JsonResponse({"status": "Friend request declined"}, status=400)
    except Exception as e:
        return JsonResponse({"status": f"{e}"}, status=400)
    
def unfriend(request) -> JsonResponse:
    if request.method != "POST":
        return JsonResponse({"Error": "Wrong Request Method"}, status=400)
    if not request.user.is_authenticated:
        return JsonResponse({"status": "Not authenticated"}, status=401)
    data = json.loads(request.body)
    friend_id = data.get("friend_id")
    if not friend_id:
        return JsonResponse({"Error": "Friend ID not provided"}, status=400)
    try:
        removed_friend = request.user.unfriend(friend_id)
        if removed_friend:
            return JsonResponse(user_model_to_dict(removed_friend), status=200)
        return JsonResponse({"status": "Friend not removed"}, status=400)
    except Exception as e:
        return JsonResponse({"status": f"{e}"}, status=400)