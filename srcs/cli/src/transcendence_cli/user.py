from transcendence_cli                      import client as cl
from transcendence_cli                      import utils
from transcendence_cli.messages             import *
import json

def change_username(stdscr):
    '''Changes username of currently logged in user'''
    try:
        new_username = utils.get_input(stdscr, "Enter a new username: ")
    except Exception as e:
        return
    client = cl.NetworkClient()
    status = utils.Singleton()
    response = client.request("/users/me", "POST", body=json.dumps({"username": new_username}))
    if response.status == 401:
        status.state = utils.UNAUTHORIZED
        message(stdscr, ACCESS_EXPIRED)
        return
    if response.status == 200:
        message(stdscr, USERNAME_CHANGED)
    else:
        message(stdscr, ERROR_MESSAGE)

        
def change_password(stdscr):
    '''Changes password of currently logged in user'''
    try:
        password = utils.get_input(stdscr, "Enter a new password: ", password=True)
    except Exception as e:
        return
    client = cl.NetworkClient()
    status = utils.Singleton()
    response = client.request("/users/me", "POST", body=json.dumps({"password": password}))
    if response.status == 401:
        status.state = utils.UNAUTHORIZED
        message(stdscr, ACCESS_EXPIRED)
        return
    if response.status == 200:
        message(stdscr, PASSWORD_CHANGED)
    else:
        message(stdscr, ERROR_MESSAGE)
        
def change_email(stdscr):
    '''Changes email of currently logged in user'''
    try:
        email = utils.get_input(stdscr, "Enter a new email: ", password=True)
    except Exception as e:
        return
    client = cl.NetworkClient()
    status = utils.Singleton()
    response = client.request("/users/me", "POST", body=json.dumps({"email": email}))
    if response.status == 401:
        status.state = utils.UNAUTHORIZED
        message(stdscr, ACCESS_EXPIRED)
        return
    if response.status == 200:
        message(stdscr, EMAIL_CHANGED)
    else:
        message(stdscr, ERROR_MESSAGE)
        
def delete_account(stdscr):
    '''Deletes the account'''
    '''Changes username of currently logged in user'''
    client = cl.NetworkClient()
    status = utils.Singleton()
    response = client.request(path="/users/me", method="DELETE")
    if response.status == 401:
        status.state = utils.UNAUTHORIZED
        message(stdscr, ACCESS_EXPIRED)
        return
    if response.status == 200:
        message(stdscr, USER_DELETED)
        logout(stdscr)
    else:
        message(stdscr, ERROR_MESSAGE)

def create_account(stdscr):
    client = cl.NetworkClient()
    '''Creates a new account'''
    status = utils.Singleton()
    try:
        username = utils.get_input(stdscr, "Enter a username: ")
        password = utils.get_input(stdscr, "Enter a password: ", password=True)
        email = utils.get_input(stdscr, "Enter an email: ")
    except Exception as e:
        return
    response = client.request("/users", "POST", body=json.dumps({"username": username,
                                                                 "password": password,
                                                                 "email": email}))
    if response.status == 401:
        status.state = utils.UNAUTHORIZED
        message(stdscr, ACCESS_EXPIRED)
        return
    if response.status < 300:
        message(stdscr, ACCOUNT_CREATED)
    elif response.status >= 400:
        message(stdscr, ERROR_MESSAGE)

def exit(stdscr):
    '''Exits the program'''
    message(stdscr, "Goodbye!")
    client = cl.NetworkClient()
    status = utils.Singleton()
    if status.state == utils.AUTHORIZED:
        client.logout()
    raise Exception("Exit")


def logout(stdscr):
    try:
        client = cl.NetworkClient()
        status = utils.Singleton()
        status.unauthorize()
        client.logout()
    except Exception as e:
        message(stdscr, ERROR_MESSAGE)