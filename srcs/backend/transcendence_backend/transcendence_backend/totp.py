import hmac, time, struct, hashlib, base64

# def get_hotp_token(secret, intervals_no):
#     key = base64.b32decode(secret, True)
#     msg = struct.pack(">Q", intervals_no)
#     h = hmac.new(key, msg, hashlib.sha1).digest()
#     o = ord(h[19]) & 15
#     h = (struct.unpack(">I", h[o:o+4])[0] & 0x7fffffff) % 1000000
#     return h

def get_totp_token(secret : str) -> str:
    """
    Generates a TOTP token
    :param secret: The secret to use
    :return: The TOTP token
    """
    secret = base64.b32decode(secret.upper())
    timestamp = int(time.time()) // 30
    timestamp_bytes = struct.pack(">Q", timestamp)
    hmac_hash = hmac.new(secret, timestamp_bytes, hashlib.sha1).digest()
    offset = hmac_hash[-1] & 0x0F
    dynamic_code = hmac_hash[offset:offset+4]
    dynamic_code_int = struct.unpack(">I", dynamic_code)[0]
    totp = dynamic_code_int % 10**6
    return "{:06d}".format(totp)