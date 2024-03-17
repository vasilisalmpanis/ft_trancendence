from django.http                        import JsonResponse
from django.utils.decorators            import method_decorator
from users.models                       import User, FriendRequest, user_model_to_dict
from django.views                       import View
from django.forms.models                import model_to_dict
from transcendence_backend.decorators   import jwt_auth_required
from ..services                         import UserService, FriendRequestService
import json
import logging

logger = logging.getLogger(__name__)

@jwt_auth_required()
def get_incoming_friend_requests(request, user : User) -> JsonResponse:
    """
    Get all incoming friend requests
    """
    if request.method != "GET":
        return JsonResponse({"Error": "Wrong Request Method"}, status=400)
    try:
        friend_requests = FriendRequestService.get_user_friend_requests(user, "incoming")
        if not friend_requests:
            return JsonResponse({"status": "No friend requests"}, status=200)
        return JsonResponse(friend_requests, status=200, safe=False)
    except Exception as e:
        return JsonResponse({"status": f"{e}"}, status=400)
    
@method_decorator(jwt_auth_required(), name="dispatch")
class FriendsView(View):
    def get(self, request, user : User) -> JsonResponse:
        """
        Get all sent friend requests by currently logged in user
        """
        try:
            friend_requests = FriendRequestService.get_user_friend_requests(user, "sent")
            if not friend_requests:
                return JsonResponse({"status": "No friend requests"}, status=200)
            return JsonResponse(friend_requests, status=200, safe=False)
        except Exception as e:
            return JsonResponse({"status": f"{e}"}, status=400)
    
    def post(self, request, user : User) -> JsonResponse:
        """
        Create a new friend request
        body: {receiver_id, message}
        """
        data = json.loads(request.body)
        receiver_id = int(data.get("receiver_id"))
        message = data.get("message")
        if not receiver_id:
            return JsonResponse({"status": "error"}, status=400)
        try:
            friend_request = FriendRequestService.create_friend_request(sender=user,
                                                                 receiver_id=receiver_id,
                                                                 message=message
                                                                 )
            if friend_request:
                return JsonResponse(model_to_dict(friend_request), status=201)
            return JsonResponse({"status": "Friend request not created"}, status=400)
        except Exception as e:
            return JsonResponse({"status": f"{e}"}, status=400)

@jwt_auth_required()
def accept_friend_request(request, user : User) -> JsonResponse:
    if request.method != "POST":
        return JsonResponse({"Error": "Wrong Request Method"}, status=400)
    data = json.loads(request.body)
    request_id = data.get("request_id")
    if not request_id:
        return JsonResponse({"status": "error"}, status=400)
    try:
        if FriendRequestService.accept_friend_request(user, request_id):
            return JsonResponse({"status": "Friend request accepted"}, status=200)
        return JsonResponse({"status": "Friend request declined"}, status=400)
    except Exception as e:
        return JsonResponse({"status": f"{e}"}, status=400)
    
@jwt_auth_required()
def decline_friend_request(request, user : User) -> JsonResponse:
    if request.method != "POST":
        return JsonResponse({"Error": "Wrong Request Method"}, status=400)
    data = json.loads(request.body)
    request_id = data.get("request_id")
    if not request_id:
        return JsonResponse({"status": "error"}, status=400)
    try:
        if FriendRequestService.decline_friend_request(user, request_id):
            return JsonResponse({"status": "Friend request declined"}, status=200)
        return JsonResponse({"status": "Friend request declined"}, status=400)
    except Exception as e:
        return JsonResponse({"status": f"{e}"}, status=400)

@jwt_auth_required()
def unfriend(request, user : User) -> JsonResponse:
    if request.method != "POST":
        return JsonResponse({"Error": "Wrong Request Method"}, status=400)
    data = json.loads(request.body)
    friend_id = data.get("friend_id")
    if not friend_id:
        return JsonResponse({"Error": "Friend ID not provided"}, status=400)
    try:
        removed_friend = UserService.unfriend(user, friend_id)
        if removed_friend:
            return JsonResponse(user_model_to_dict(removed_friend), status=200)
        return JsonResponse({"status": "Friend not removed"}, status=400)
    except Exception as e:
        return JsonResponse({"status": f"{e}"}, status=400)