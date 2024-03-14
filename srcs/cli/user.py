from typing         import Any, Dict
import http.client  as http
import json

class User:
    username : str
    avatar : str

    def __init__(self, user : Dict[str, Any]):
        self.username = user["username"]
        self.avatar = user["avatar"]

