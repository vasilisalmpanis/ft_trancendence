"""
ASGI config for api project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

from channels.auth                  import AuthMiddlewareStack
from channels.routing               import ProtocolTypeRouter, URLRouter, ChannelNameRouter
from channels.security.websocket    import AllowedHostsOriginValidator
from pong.middlewares               import AuthMiddleware
from django.core.asgi               import get_asgi_application

from pong.routing import websocket_urlpatterns as game_websocket_urlpatterns, channels
from chat.routing import websocket_urlpatterns as chat_websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcendence_backend.settings')


application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": 
        AuthMiddleware(
            URLRouter(
                [
                *game_websocket_urlpatterns,
                *chat_websocket_urlpatterns
            ]
            )
        )
        ,
        "channel": ChannelNameRouter(channels),
    }
)
