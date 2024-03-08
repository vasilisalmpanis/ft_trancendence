from django.http                    import JsonResponse
from django.shortcuts               import redirect
from users.models                   import User
from stats.models                   import Stats
from django.db.models               import Q
from jwt                            import JWT
from django.conf                    import settings
from authorize.views                import create_token
from datetime                       import datetime, timedelta
import os, json, http.client

def health_check (request) -> JsonResponse:
	data = {'health-check auth': 'alive'}
	return JsonResponse(data, status=200)

#this just opens the window with the 42oauth dialogue
def ft_intra_auth(request):
    auth_base_url = 'https://api.intra.42.fr/oauth/authorize'
    client_id = os.environ.get('OAUTH_UID')
    state = 'test'
    redirect_uri = 'http://localhost:8000/oauth2/redir'
    response_type = 'code'
    auth_full_url = (
        f'{auth_base_url}?client_id={client_id}'
        f'&redirect_uri={redirect_uri}&state={state}&response_type={response_type}'
        )

    return redirect(auth_full_url)

# handles requests on the redirect url
def handle_redir(request):
    # Extract the authorization code from the URL
    auth_code = request.GET.get('code')
    state = request.GET.get('state')
    if state != 'test':
        return JsonResponse({'status': 'State not matching', 'state': state})
    if not auth_code:
        return JsonResponse({'status': 'Authorization code not provided'}, status=400)

    #set up access token request
    parameters = json.dumps({
        'client_id': os.environ.get('OAUTH_UID'),
        'client_secret': os.environ.get('OAUTH_SECRET'),
        'redirect_uri': 'http://localhost:8000/oauth2/redir',
        'code': auth_code,
        'grant_type': 'authorization_code'
        })

    conn = http.client.HTTPSConnection('api.intra.42.fr')
    headers = {'Content-type': 'application/json'}
    
    conn.request('POST', '/oauth/token', parameters, headers)

    response_raw = conn.getresponse()
    response = json.loads(response_raw.read().decode('utf-8'))

    if response_raw.status is 200:
        access_token = response.get('access_token')
        # Make request with access token to fetch user information
        user_headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-type': 'application/json'
        }
        conn.request('GET', '/v2/me', headers=user_headers)
        data_response_raw = conn.getresponse()
        data_response = json.loads(data_response_raw.read().decode('utf-8'))
        user_data = {
            'id': data_response['id'],
            'email': data_response['email'],
            'login': data_response['login']
        }
        #check if user is in database and log in
        try:
            user = User.objects.get(Q(ft_intra_id=user_data['id']) & Q(email=user_data['email']))
            return login_ft_oauth_user(user)

        #create user if not existing in db already and log in
        except User.DoesNotExist:
            if not user_data['login'] or not user_data['email']:
                return JsonResponse({'status': 'Failed to fetch userdata'}, status=404)
            try:
                newUser = User.objects.create_user(username=user_data['login'], 
                                                   email=user_data['email'],
                                                   password='randompassword12345',
                                                   is_staff=False,
                                                   is_superuser=False,
                                                   ft_intra_id=user_data['id'],
                                                   )
                Stats.objects.create(user=User.objects.get(username=user_data['login']))
                return login_ft_oauth_user(newUser)
            except Exception as e:
                return JsonResponse({'status': f'User creation failed: {str(e)}'}, status=400)
    else:
        return JsonResponse({'status': 'Failed to obtain access token'}, status=response.status_code)

def login_ft_oauth_user(ft_user):
    if ft_user != None:
        jwt = JWT(settings.JWT_SECRET)
        access_token = create_token(jwt=jwt, user=ft_user, expiration=datetime.now() + timedelta(days=1))
        refresh_token = create_token(jwt=jwt, user=ft_user, expiration=datetime.now() + timedelta(days=30))
        ft_user.is_user_active = True
        ft_user.last_login = datetime.now()
        ft_user.save()
        return JsonResponse({
                                'access_token': access_token,
                                'refresh_token' : refresh_token }, status=200
                            )
    else:
        return JsonResponse({'status': 'error while creating jwt tokens for OAuth2 login'}, status=401)

