from ast import Dict
from math import log
from users.models import User
from transcendence_backend.decorators import validate_jwt
from asgiref.sync import sync_to_async 
from django.http                        import JsonResponse
from jwt import JWT
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


async def decrypt_jwt_async(jwt, authorization):
    return jwt.decrypt_jwt(authorization)

async def validate_jwt_async(payload, second_factor : bool, **kwargs) -> User:
    return validate_jwt(payload, second_factor, **kwargs)

class AuthMiddleware:
    """
    Custom middleware (insecure) that takes user IDs from the query string.
    """

    def __init__(self, app):
        # Store the ASGI application we were passed
        self.app = app

    async def __call__(self, scope, receive, send):
        # Look up user from query string (you should also do things like
        # checking if it is a valid user ID, or if scope["user"] is already
        # populated).
        headers = dict(scope["headers"])
        headers_dict = {
            item[0].decode('utf-8'): item[1].decode('utf-8')
            for item in scope["headers"]
        }
        authorization = headers_dict.get("authorization", "").split(" ")[-1]
        authorization = authorization.strip("$")
        if not authorization:
            auth_protocol = headers_dict.get("sec-websocket-protocol", "").split(', ')
            authorization = auth_protocol[1] if len(auth_protocol) == 2 and auth_protocol[0] == "Authorization" else ''
            scope["auth_protocol"] = True;

        if authorization:
            try:
                jwt = JWT(settings.JWT_SECRET)
                payload = await sync_to_async(jwt.decrypt_jwt)(authorization)
                scope["user"] = await sync_to_async(validate_jwt)(payload, second_factor=False, days=1)
            except Exception as e:
                scope["user"] = None
                logger.warn(f"Error: {e}")
                return JsonResponse({'Error': 'Authorization header required'}, status=401)
        else:
            return JsonResponse({'Error': 'Authorization header required'}, status=401)


        return await self.app(scope, receive, send)