from django.conf    import settings
from typing         import List, Sequence, Union, Tuple, cast

class Settings:
    """
    Cors Middleware settings
    """

    @property
    def CORS_ALLOW_HEADERS(self):
        return getattr(settings, "CORS_ALLOW_HEADERS", [])

    @property
    def CORS_ALLOW_METHODS(self):
        return getattr(settings, "CORS_ALLOW_METHODS", [])
    
    @property
    def CORS_ALLOW_ORIGIN(self) -> Union[str, List[str]]:
        value = getattr(settings, "CORS_ALLOW_ORIGIN", [])
        return cast(Union[str, List[str]], value)

