from django.http import HttpResponse

class CORSMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS":
            response = HttpResponse()
            response["Content-Length"] = "0"  # Allow requests from any origin
        else:
            response = self.get_response(request)
        response["Access-Control-Allow-Origin"] = "*"  # Allow requests from any origin
        if "access-control-request-method" in request.headers:
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"  # Allow these HTTP methods
        if "access-control-request-headers" in request.headers:
            response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"  # Allow these request headers
        return response
