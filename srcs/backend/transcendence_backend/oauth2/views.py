from django.http                    import JsonResponse
from django.core.signing            import Signer, BadSignature
from django.shortcuts               import redirect
from users.models                   import User
from stats.models                   import Stats
from django.db.models               import Q
from jwt                            import JWT
from django.conf                    import settings
from authorize.views                import create_token
from datetime                       import datetime, timedelta
import os, json, http.client

signer = Signer()

def health_check (request) -> JsonResponse:
    """
    Health check for oauth app
    """
    data = {'health-check oauth': 'alive'}
    return JsonResponse(data, status=200)

def ft_intra_auth(request):
    """
    Builds a request url to the 42intra OAuth2 endpoint
    :return: redirection to 42intra auth endpoint
    """
    auth_base_url = 'https://api.intra.42.fr/oauth/authorize'
    client_id = os.environ.get('OAUTH_UID')
    state = signer.sign(os.environ.get('OAUTH_STATE'))
    redirect_url = 'http://localhost:8000/oauth2/redir'
    response_type = 'code'
    auth_full_url = (
        f'{auth_base_url}?client_id={client_id}'
        f'&redirect_uri={redirect_url}&state={state}&response_type={response_type}'
        )

    return redirect(auth_full_url)

def handle_redir(request) -> JsonResponse:
    """
    extracts auth_code, exchanges it for access token. 
    Fetches user data from 42API and logs user in to transcendence.
    :return: access and refresh token for transcendence
    """
    auth_code = request.GET.get('code')
    try:
        state = signer.unsign(request.GET.get('state'))
    except BadSignature:
        return JsonResponse({'status': 'State not matching', 'state': state}, status=400)
    if not auth_code or state != os.environ.get("OAUTH_STATE"):
        return JsonResponse({'status': 'Authorization code not provided or state mismatch'}, status=400)

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
        user_data = fetch_user_data(access_token)
        if user_data:
                user = get_or_create_user(user_data)
                return login_ft_oauth_user(user)
        else:
            return JsonResponse({'status': 'Failed to fetch userdata'}, status=404)
    else:
        return JsonResponse({'status': 'Failed to obtain access token'}, status=response.status_code)

def fetch_user_data(access_token):
    """
    Make request with access token to fetch user information
    :return: dict with user data
    """
    user_headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-type': 'application/json'
    }
    conn = http.client.HTTPSConnection('api.intra.42.fr')
    conn.request('GET', '/v2/me', headers=user_headers)
    data_response_raw = conn.getresponse()

    if data_response_raw.status == 200:
        data_response = json.loads(data_response_raw.read().decode('utf-8'))
        return {
            'id': data_response['id'],
            'email': data_response['email'],
            'login': data_response['login']
        }
    else:
        return None

def get_or_create_user(user_data):
    """
    Builds new user oder returns existing user fitting user_data
    :return: user object
    """
    try:
        user = User.objects.get(Q(ft_intra_id=user_data['id']) & Q(email=user_data['email']))
    except User.DoesNotExist:
        if not user_data['login'] or not user_data['email']:
            return None
        try:
            user = User.objects.create_user(
                username=user_data['login'], 
                email=user_data['email'],
                password=os.environ.get('OAUTH_RANDOM_OAUTH_USER_PASSWORD'),
                is_staff=False,
                is_superuser=False,
                ft_intra_id=user_data['id'],
            )
            Stats.objects.create(user=user)
        except Exception as e:
            return None
    return user

def login_ft_oauth_user(ft_user):
    """
    Checks for 2fa and creates jwt token pair for transcendence session
    :return: JSON element containing token pair
    """

    if ft_user != None:
        jwt = JWT(settings.JWT_SECRET)
        access_token = create_token(jwt=jwt, 
                                    user=ft_user, 
                                    expiration=datetime.now() + timedelta(days=1), 
                                    isa=ft_user.last_login, second_factor=ft_user.is_2fa_enabled)
        refresh_token = create_token(jwt=jwt,
                                     user=ft_user,
                                     expiration=datetime.now() + timedelta(days=30),
                                     isa=ft_user.last_login,
                                     second_factor=ft_user.is_2fa_enabled)
        ft_user.is_user_active = True
        ft_user.last_login = datetime.now()
        ft_user.save()
        return JsonResponse({
                                'access_token': access_token,
                                'refresh_token' : refresh_token }, status=200
                            )
    else:
        return JsonResponse({'status': 'error while creating jwt tokens for OAuth2 login'}, status=401)

