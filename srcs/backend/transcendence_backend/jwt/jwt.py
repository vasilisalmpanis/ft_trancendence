import base64
import json
import hmac
import hashlib
from math import sin

class JWT:
    def __init__(self, secret):
        self.secret = secret
        self.header = {
            "alg": "HS256",
            "typ": "JWT"
        }
    
    def base64url_encode(self, input: bytes):
        """
        Base64url-encodes the given input
        :param input: The input to encode
        :return: The base64url-encoded input
        """
        return base64.urlsafe_b64encode(input).decode('utf-8').replace('=','')

    def create_jwt(self, payload) -> str:
        """
        Creates a JWT from the given payload
        :param payload: The payload to encode
        :return: The JWT
        """
        segments = []
        json_header = json.dumps(self.header    , separators=(",",":")).encode()
        json_payload = json.dumps(payload, separators=(",",":")).encode()
        segments.append(self.base64url_encode(json_header))
        segments.append(self.base64url_encode(json_payload))

        signing_input = '.'.join(segments).encode()
        key = self.secret.encode()
        signature = hmac.new(key,
                             signing_input,
                             hashlib.sha256
                             ).digest()
        segments.append(self.base64url_encode(signature))
        return '.'.join(segments)
    
    def decrypt_jwt(self, jwt) -> dict:
        """
        Decrypts the given JWT
        :param jwt: The JWT to decrypt
        :return: Dict of recrypted JWT
        """
        segments = jwt.split('.')
        payload = segments[1]
        signature = segments[2]
        signing_input = ('.'.join(segments[:-1])).encode()
        key = self.secret.encode()
        expected_signature = hmac.new(key,
                                      signing_input,
                                      hashlib.sha256
                                      ).digest()
        expected_signature = self.base64url_encode(expected_signature)
        if expected_signature != signature:
            raise Exception("Invalid signature")
        return json.loads(base64.b64decode(payload + '=' * (4 - len(payload) % 4)).decode('utf-8'))
