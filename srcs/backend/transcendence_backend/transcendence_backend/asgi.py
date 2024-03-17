"""
ASGI config for api project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter, ChannelNameRouter
from channels.security.websocket import AllowedHostsOriginValidator
from pong.middlewares import AuthMiddleware
from django.core.asgi import get_asgi_application

from pong.routing import websocket_urlpatterns, channels

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcendence_backend.settings')


application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": AuthMiddleware(URLRouter(websocket_urlpatterns)),
        # "websocket": URLRouter(websocket_urlpatterns),
        "channel": ChannelNameRouter(channels),
    }
)
