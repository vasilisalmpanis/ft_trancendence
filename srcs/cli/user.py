import json
import client as cl
import curses
from cli import logout
import utils

def change_username(stdscr):
    '''Changes username of currently logged in user'''
    try:
        new_username = utils.get_input(stdscr, "Enter a new username: ")
    except Exception as e:
        return
    client = cl.NetworkClient()
    respone = client.request("/users/me", "POST", body=json.dumps({"username": new_username}))
    stdscr.clear()
    if respone.status == 200:
        stdscr.addstr(2, 1, "Username changed successfully")
    else:
        stdscr.addstr(2, 1, "An error occurred. Please try again")
    stdscr.refresh()
    stdscr.getch()

        
def change_password(stdscr):
    '''Changes password of currently logged in user'''
    try:
        password = utils.get_input(stdscr, "Enter a new password: ", password=True)
    except Exception as e:
        return
    client = cl.NetworkClient()
    respone = client.request("/users/me", "POST", body=json.dumps({"password": password}))
    stdscr.clear()
    if respone.status == 200:
        stdscr.addstr(2, 1, "Password changed successfully")
    else:
        stdscr.addstr(2, 1, "An error occurred. Please try again")
    stdscr.refresh()
    stdscr.getch()
        
def change_email(stdscr):
    '''Changes email of currently logged in user'''
    try:
        email = utils.get_input(stdscr, "Enter a new email: ", password=True)
    except Exception as e:
        return
    client = cl.NetworkClient()
    respone = client.request("/users/me", "POST", body=json.dumps({"email": email}))
    stdscr.clear()
    if respone.status == 200:
        stdscr.addstr(2, 1, "Email changed successfully")
    else:
        stdscr.addstr(2, 1, "An error occurred. Please try again")
    stdscr.refresh()
    stdscr.getch()
        
def delete_account(stdscr):
    '''Deletes the account'''
    '''Changes username of currently logged in user'''
    client = cl.NetworkClient()
    response = client.request(path="/users/me", method="DELETE")
    stdscr.clear()
    if response.status == 200:
        stdscr.addstr(2, 1, "User Deleted successfully")
        logout(stdscr)
    else:
        stdscr.addstr(2, 1, "An error occurred. Please try again")
    stdscr.refresh()
    stdscr.getch()

def create_account(stdscr):
    client = cl.NetworkClient()
    '''Creates a new account'''
    try:
        username = utils.get_input(stdscr, "Enter a username: ")
        password = utils.get_input(stdscr, "Enter a password: ", password=True)
        email = utils.get_input(stdscr, "Enter an email: ")
    except Exception as e:
        return
    response = client.request("/users", "POST", body=json.dumps({"username": username,
                                                                 "password": password,
                                                                 "email": email}))
    stdscr.clear()
    if response.status < 300:
        stdscr.addstr(2, 1, "Account created successfully")
    elif response.status >= 400:
        stdscr.addstr(2, 1, response.text)
    stdscr.refresh()
    stdscr.getch()

def exit(stdscr):
    '''Exits the program'''
    stdscr.clear()
    stdscr.addstr(1, 1, "Goodbye!")
    stdscr.refresh()
    stdscr.getch()
    client = cl.NetworkClient()
    status = utils.Singleton()
    if status.state == utils.AUTHORIZED:
        client.logout()
    raise Exception("Exit")

