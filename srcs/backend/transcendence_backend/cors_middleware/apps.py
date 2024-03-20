from django.apps import AppConfig
from django.core.checks import Error, Tags, register
from cors_middleware.

class CorsMiddlewareConfig(AppConfig):
    name = 'cors_middleware'
    verbose_name = "Cors Middleware"
    register(Tags.security, validate_settings)
