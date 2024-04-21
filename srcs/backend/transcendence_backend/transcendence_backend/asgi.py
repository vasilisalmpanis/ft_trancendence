"""
ASGI config for api project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os
from django.core.asgi               import get_asgi_application

# fixes App not loaded yet error from channels to serve with daphne in production
django_asgi_app = get_asgi_application()

from channels.auth                  import AuthMiddlewareStack
from channels.routing               import ProtocolTypeRouter, URLRouter, ChannelNameRouter
from channels.security.websocket    import AllowedHostsOriginValidator
from pong.middlewares               import AuthMiddleware

from pong.routing                   import websocket_urlpatterns as pong_ws_urlpatterns, pong_channels
from tournament.routing             import websocket_urlpatterns as tournament_ws_urlpatterns, tournament_channels
from chat.routing                      import websocket_urlpatterns as chat_ws_urlpatterns


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcendence_backend.settings')
application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": 
        AuthMiddleware(
            URLRouter(
                [
                    *pong_ws_urlpatterns,
                    *chat_ws_urlpatterns,
                    *tournament_ws_urlpatterns,
                ]
            )
        )
        ,
        "channel": ChannelNameRouter({**pong_channels, **tournament_channels}),
    }
)
