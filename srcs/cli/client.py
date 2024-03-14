
from typing         import Dict, Any
import http.client  as http
from autobahn.twisted.websocket import WebSocketClientProtocol, WebSocketClientFactory
import json

from autobahn.websocket.protocol import NoneType
from autobahn.websocket.types import ConnectionResponse


class Response:
    def __init__(self, response : http.HTTPResponse | None):
        if not response:
            self.status = 500
            self.body = {"error": "Internal Server Error"}
            self.header = []
            self.reason = "Internal Server Error"
            return
        self.status = response.status
        self.body = json.loads(response.read().decode("utf-8"))
        self.header = response.getheaders()
        self.reason = response.reason

    @property
    def text(self) -> str:
        return json.dumps(self.body)
    
    def __repr__(self):
        return f"Response(status={self.status}, reason={self.reason}, body={self.body})"
    
    def __str__(self):
        return f"Response(status={self.status}, reason={self.reason}, body={self.body})"



class NetworkClient:
        headers : Dict[str, str]
        def __init__(self):
            self.headers = {"Accept": "application/json"}
            self.access_token = None
            self.refresh_token = None

        def validate_method(self, method : str) -> None:
            if method not in ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]:
                raise ValueError(f"Invalid method {method}")

        def request(self, path: str, method : str, body : Dict[str, str] = None) -> Response:
            self.validate_method(method)
            if method == "POST" or method == "PUT" or method == "PATCH" and body:
                self.headers["Content-Type"] = "application/json"
            connection = http.HTTPConnection("localhost", 8000)
            try:
                connection.request(method, path, body, headers=self.headers)
                response = Response(connection.getresponse())
                if response.text == '{ "Error" : "Token expired" }':
                    self.refresh()
                    response = self.request(path, method, body)
                self.headers.pop("Content-Type", None)
                return response
            except http.HTTPException as e:
                print(f"HTTP exception: {e}")
            except Exception as e:
                print(f"Exception: {e}")
            finally:
                connection.close()
            return Response(None)
    
        def authenticate(self, username : str, password : str) -> Response:
            response = self.request("/auth", "POST", json.dumps({"username": username,
                                                                 "password": password}))
            if response.status == 200:
                self.access_token = response.body["access_token"]
                self.refresh_token = response.body["refresh_token"]
                self.headers["Authorization"] = f"Bearer {self.access_token}"
            return response
        
        def logout(self) -> None:
            response = self.request("/logout", "POST")
            if response.status == 200:
                self.access_token = None
                self.refresh_token = None
                self.headers.pop("Authorization", None)
        
        def refresh(self) -> None:
            response = self.request("/auth/refresh", "GET")
            if response.status == 200:
                self.access_token = response.body["access_token"]
                self.headers["Authorization"] = f"Bearer {self.access_token}"
            else:
                self.access_token = None
                self.refresh_token = None
                self.headers.pop("Authorization", None)

        def verify_2fa(self, code : str) -> Response:
            response = self.request("/auth/verify", "POST", json.dumps({"2fa_code": code}))
            if response.status == 200:
                self.access_token = response.body["access_token"]
                self.refresh_token = response.body["refresh_token"]
                self.headers["Authorization"] = f"Bearer {self.access_token}"
            return response

class PongClientProtocol(WebSocketClientProtocol):
    def onConnect(self, response: ConnectionResponse) -> NoneType:
        print(f"Connected to {response.peer}")

    def onOpen(self):
        print("WebSocket connection open.")

    def onClose(self, wasClean, code, reason):
        print(f"WebSocket connection closed: {reason}")

    def onMessage(self, payload, isBinary):
        if isBinary:
            print(f"Binary message received: {len(payload)} bytes")
        else:
            print(f"Text message received: {payload.decode('utf8')}")