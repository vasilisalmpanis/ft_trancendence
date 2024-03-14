from ast import Tuple
from multiprocessing.connection import Client
from client                 import NetworkClient, Response, WebSocketClientProtocol, WebSocketClientFactory, PongClientProtocol
from user                   import User
from game                   import Game
from typing import Tuple
import curses

def get_input(stdscr, prompt, password=False):
    input_str = ""
    curses.echo()  # Enable input echoing
    stdscr.clear()
    stdscr.addstr(1, 1, prompt)
    stdscr.refresh()
    if password:
        while True:
            char = stdscr.getch()
            if char == ord('\n'):
                break
            elif char == curses.KEY_BACKSPACE or char == 127:
                input_str = input_str[:-1]
            else:
                input_str += chr(char)
            stdscr.clear()
            stdscr.addstr(1, 1, prompt)
            stdscr.addstr(2, 1, "*" * len(input_str))
    else:    
        input_str = stdscr.getstr(2, 1, 50).decode('utf-8')
    curses.noecho()  # Disable input echoing
    return input_str

class Menu:
    def __init__(self, stdscr, options):
        self.stdscr = stdscr
        self.options = options
        self.selected_option = 0

    def display(self):
        self.stdscr.clear()
        for i, option in enumerate(self.options):
            if i == self.selected_option:
                self.stdscr.addstr(i + 1, 1, f"> {option['label']}", curses.A_REVERSE)
            else:
                self.stdscr.addstr(i + 1, 1, f"  {option['label']}")
        self.stdscr.refresh()

    def navigate(self, key):
        if key == curses.KEY_UP and self.selected_option > 0:
            self.selected_option -= 1
        elif key == curses.KEY_DOWN and self.selected_option < len(self.options) - 1:
            self.selected_option += 1
        else:
            self.stdscr.clear()
            self.stdscr.addstr(4, 1, "Invalid input. Press any key to try again.")
            

    def execute_selected_action(self, stdscr, client, authenticated):
        selected_action = self.options[self.selected_option]['action']
        if self.selected_option == 4:
            self.options[self.selected_option]['action'](client)
            return False
        selected_action(stdscr, client)
        return True

def main_menu(stdscr):
    authenticated = False
    curses.curs_set(0)
    while not authenticated:
        stdscr.clear()
        client = authenticate(stdscr, "username", "password")
        authenticated = True
        menu_options = [
            {"label": "Play Game", "action": play_game},
            {"label": "Search for Users", "action": search_users},
            {"label": "Manage Friends", "action": manage_friends},
            {"label": "Account Settings", "action": account_settings},
            {"label": "Logout", "action": logout}
        ]

        menu = Menu(stdscr, menu_options)

        while authenticated:
            menu.display()
            key = stdscr.getch()
            if key == ord('\n'):
                authenticated = menu.execute_selected_action(stdscr, client, authenticated)
            elif key in [curses.KEY_UP, curses.KEY_DOWN]:
                menu.navigate(key)
            elif key == ord('q'):
                break

def verify_2fa(stdscr, client) -> Tuple[bool, NetworkClient]:
    stdscr.clear()
    code = get_input(stdscr, "Enter your 2FA code: ")
    response = client.verify_2fa(code)
    if response.status != 200:
        stdscr.addstr(1, 1, "Invalid 2FA code. Press any key to try again.")
        stdscr.refresh()
        stdscr.getch()
        return False, client
    return True, client

def authenticate(stdscr, username, password) -> NetworkClient:
    authenticated = False
    client = NetworkClient()

    while not authenticated:
        stdscr.clear()
        stdscr.nodelay(0)
        username = get_input(stdscr, "Enter your username: ")
        password = get_input(stdscr, "Enter your password: ", password=True)
        response = client.authenticate(username, password)
        response = client.request("/users/me", "GET")
        if response.status != 200:
            stdscr.clear()
            if response.status == 401:
                if response.body == {"Error" : "2FA Required"}:
                    while not authenticated:
                        authenticated, client = verify_2fa(stdscr, client)
                else:
                    stdscr.addstr(1, 1, "Invalid credentials. Press any key to try again.")
            else:
                stdscr.addstr(1, 1, f"An error occurred. Press any key to try again.")
                stdscr.getch()
            stdscr.refresh()
        else:
            authenticated = True
    return client

def play_game(stdcsr, client):
    game = Game(stdsrc=stdcsr, client=client)
    while game.running:
        game.run()


def search_users():
    print("Search for Users")
    
import json
def manage_friends(stdcsr, client):
    response = client.request("/friends", "GET")
    if response.status != 200:
        stdcsr.clear()
        stdcsr.addstr(1, 1, "An error occurred. Return to the main menu")
        stdcsr.refresh()
        stdcsr.getch()
        return
    friends = response.body
    if 'status' in friends:
        stdcsr.clear()
        stdcsr.addstr(1, 1, "You have no friends. Return to the main menu")
        stdcsr.refresh()
        stdcsr.getch()
        return
    else:
        user = { User(friend) for friend in friends}
        stdcsr.clear()
        stdcsr.addstr(1, 1, json.dumps(user))
        stdcsr.refresh()
        stdcsr.getch()
        return
 
def account_settings():
    print("Account Settings")

def logout(client):
    client.logout()

if __name__ == "__main__":
    curses.wrapper(main_menu)

