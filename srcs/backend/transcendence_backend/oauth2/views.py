from django.http                    import JsonResponse, HttpResponse
from django.shortcuts               import redirect
from django.utils.decorators        import method_decorator
from users.models                   import User, FriendRequest
from django.views                   import View
import os
import json
import http.client

def health_check (request) -> JsonResponse:
	data = {"health-check auth": "alive"}
	return JsonResponse(data, status=200)

#this just opens the window with the 42oauth dialogue
def ft_intra_auth(request):
    authorization_base_url = "https://api.intra.42.fr/oauth/authorize"
    client_id = os.environ.get('OAUTH_UID')
    state = "test"
    redirect_uri = "http://localhost:8000/oauth2/redir"
    response_type = "code"
    auth_full_url = (
                    f"{authorization_base_url}?client_id={client_id}"
                    f"&redirect_uri={redirect_uri}&state={state}&response_type={response_type}"
                    )

    # Use JavaScript to open a new window with the authorization URL
    return redirect(auth_full_url)
# ToDo: mt to be continued

# handles requests on the redirect url
def handle_redir(request):
    # Extract the authorization code from the URL
    auth_code = request.GET.get('code')
    state = request.GET.get('state')
    if state != "test":
        return JsonResponse({"error": "state not matching"})
    if not auth_code:
        return JsonResponse({"error": "Authorization code not provided"}, status=400)

    #set up access token request
    token_url = "api.intra.42.fr"
    client_id = os.environ.get('OAUTH_UID')
    client_secret = os.environ.get('OAUTH_SECRET')
    redirect_uri = "http://localhost:8000/oauth2/redir"
    grant_type = "authorization_code"

    parameters = json.dumps({
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": redirect_uri,
                    "code": auth_code,
                    "grant_type": grant_type
                })
    conn = http.client.HTTPSConnection(token_url)
    headers = {'Content-type': 'application/json'}
    conn.request("POST", "/oauth/token", parameters, headers)

    response = conn.getresponse()
    response_data = response.read().decode("utf-8")
    response_json = json.loads(response_data)

    if response.status == 200:
        access_token = response_json.get('access_token')
        
        # Make request to fetch user information
        user_info_url = "/v2/me"
        user_conn = http.client.HTTPSConnection(token_url)
        user_headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-type': 'application/json'
        }
        user_conn.request("GET", user_info_url, headers=user_headers)
        user_response = user_conn.getresponse()
        user_response_data = user_response.read().decode("utf-8")
        user_info = json.loads(user_response_data)
        
        # Return user information
        return JsonResponse(user_info, status=200)
    else:
        return JsonResponse({"error": "Failed to obtain access token"}, status=response.status_code)