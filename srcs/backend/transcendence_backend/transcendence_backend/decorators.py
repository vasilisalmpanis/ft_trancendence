# decorators.py
from functools import wraps
from venv import logger
from django.http import JsonResponse
from jwt import JWT
from django.conf import settings
from users.models import User
from datetime import datetime
from django.views import View

import logging
logger = logging.getLogger(__name__)

def jwt_auth_required(view_func):
    @wraps(view_func)
    def _wrapped_view(*args, **kwargs):
        if isinstance(args[0], View):
            request = args[1]
        else:
            request = args[0]
        token = request.headers.get('Authorization')
        if token == None:
            return JsonResponse({'Error': 'Authorization header required'}, status=401)
        try:
            token = token.split(' ')[1]
        except IndexError:
            return JsonResponse({'Error': 'Access Token Required'}, status=401)
        logger.warning(f"Token: {token}")
        jwt = JWT(settings.JWT_SECRET)
        try:

            payload = jwt.decrypt_jwt(token)
            user_id = payload.get('user_id', None)
            expires_at = payload.get('expires_at', None)
            expires_at = datetime.strptime(expires_at, '%Y-%m-%d %H:%M:%S')
            if expires_at < datetime.now():
                return JsonResponse({'error': 'Token expired'}, status=401)
            user = User.objects.get(id=user_id)
            if user is None:
                return JsonResponse({'error': 'Invalid token'}, status=401)
            if user.is_user_active != True:
                return JsonResponse({'error': 'User is not active'}, status=401)
            # Perform actions for authenticated user
            kwargs['user'] = user
            return view_func(*args, **kwargs)
        except Exception as e:
            return JsonResponse({'Error': f"{str(e)}"}, status=401)
    return _wrapped_view
