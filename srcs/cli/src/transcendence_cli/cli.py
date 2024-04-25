from .client                    import NetworkClient, Response
from transcendence_cli          import game as pong
from transcendence_cli          import user
from transcendence_cli          import utils
from transcendence_cli.messages import *
from transcendence_cli.menu     import Menu
import curses

# Main menu for the game
def main_menu(stdscr: object) -> None:
    """
    Main menu for the game
    :param stdscr: object
    return: None
    """
    status = utils.Singleton()
    curses.curs_set(0)
    client = NetworkClient()
    try:
        while True:
            menu_options = [
                            {"label": "Login", "action": authenticate},
                            {"label": "Create Account", "action": user.create_account},
                            {"label": "Exit", "action": user.exit}
                        ]
            menu = Menu(stdscr, menu_options)
            while status.state == utils.UNAUTHORIZED:
                menu.display()
                key = stdscr.getch()
                if key == ord('\n'):
                    try:
                        menu.execute_selected_action(stdscr)
                    except Exception as e:
                        if str(e) == "Exit":
                            return
                        message(stdscr, ERROR_MESSAGE)
                elif key in [curses.KEY_UP, curses.KEY_DOWN]:
                    menu.navigate(key)
                elif key == ord('q'):
                    break
            menu_options = [
                {"label": "Play Game", "action": play_game},
                {"label": "Create Game", "action": create_game},
                {"label": "Account Settings", "action": account_settings},
                {"label": "Logout", "action": user.logout}
            ]
            games = client.request("/games?type=running&me=True", "GET").body
            if len(games) > 0:
                game_id = games[0]['id']
                start_game(stdscr, game_id)
                continue
            else:
                games = client.request("/games?type=paused&me=True", "GET").body
                if len(games) > 0:
                    game_id = games[0]['id']
                    start_game(stdscr, game_id)
                    continue
            menu = Menu(stdscr, menu_options)
            while status.state == utils.AUTHORIZED:
                menu.display()
                key = stdscr.getch()
                if key == ord('\n'):
                    menu.execute_selected_action(stdscr)
                elif key in [curses.KEY_UP, curses.KEY_DOWN]:
                    menu.navigate(key)
                elif key == 27:
                    user.logout(stdscr)
                    break
    except Exception as e:
        message(stdscr, str(e))
        return

### AUTHENTICATION ###

def authenticate(stdscr: object) -> None:
    """
    Authenticate user
    :param stdscr: object
    """
    client = NetworkClient()
    status = utils.Singleton()
    while not status.state:
        stdscr.clear()
        stdscr.nodelay(0)
        username = utils.get_input(stdscr, "Enter your username: ")
        password = utils.get_input(stdscr, "Enter your password: ", password=True)
        response = client.authenticate(username, password)
        response = client.request("/users/me", "GET")
        status.state = response.status == 200
        if status.state != utils.AUTHORIZED:
            stdscr.clear()
            if response.status == 401:
                if response.body == {"Error" : "2FA Required"}:
                    while not status.state:
                        verify_2fa(stdscr)
                else:
                    stdscr.addstr(1, 1, INVALID_CREDENTIALS)
            else:
                message(stdscr, ERROR_MESSAGE)
            stdscr.refresh()
        else:
            return

def verify_2fa(stdscr: object) -> None:
    """
    Verify 2FA code
    :param stdscr: object
    """
    client = NetworkClient()
    status = utils.Singleton()
    stdscr.clear()
    code = utils.get_input(stdscr, "Enter your 2FA code: ")
    response = client.verify_2fa(code)
    if response.status != 200:
        message(stdscr, INVALID_2FA)
        return
    status.state = utils.AUTHORIZED


### GAME ###

def start_game(stdcsr: object, game_id: int) -> None:
    """
    Start game by id
    :param stdcsr: object
    :param game_id: int
    """
    game = pong.Game(stdcsr, game_id)
    game.run()
    stdcsr.nodelay(0)

def create_game(stdcsr: object) -> None:
    """
    Create a game
    :param stdcsr: object
    """
    client = NetworkClient()
    state = utils.Singleton()
    response = client.request("/games", "POST")
    if response.status == 401:
        state.state = utils.UNAUTHORIZED
        message(stdcsr, UNAUTHORIZED)
        return
    if response.status > 201:
        message(stdcsr, ERROR_MESSAGE)
        return
    game_id = response.body['id']
    start_game(stdcsr, game_id)


def play_game(stdcsr: object) -> None:
    """
    Play a game
    :param stdcsr: object
    """
    client = NetworkClient()
    status = utils.Singleton()
    response = client.request("/games?type=pending", "GET")
    if response.status == 401:
        status.state = utils.UNAUTHORIZED
        message(stdcsr, ACCESS_EXPIRED)
        return
    if response.status != 200:
        message(stdcsr, ERROR_MESSAGE)
        return
    games = response.body
    if len(games) == 0:
        response = client.request("/games?type=paused&me=True", "GET")
        if response.status == 401:
            status.state = utils.UNAUTHORIZED
            message(stdcsr, ACCESS_EXPIRED)
            return
        if response.status != 200:
            message(stdcsr, ERROR_MESSAGE)
            return
        games = response.body
        if len(games) == 0:
            message(stdcsr, NO_GAMES)
            return
    game_ids = [game['id'] for game in games]
    menu_options = [{"label": f"Game {game_id}", "action": start_game} for game_id in game_ids]
    menu = Menu(stdcsr, menu_options)
    while True:
        menu.display()
        key = stdcsr.getch()
        if key == ord('\n'):
            menu.execute_selected_action(stdcsr, game_id=game_ids[menu.selected_option])
            break
        elif key in [curses.KEY_UP, curses.KEY_DOWN]:
            menu.navigate(key)
        elif key == ord('q'):
            break

### ACCOUNT SETTINGS ###

def account_settings(stdscr: object) -> None:
    """
    Account settings
    :param stdscr: object
    """
    status = utils.Singleton()
    menu_options = [
        {"label": "Change Username", "action": user.change_username},
        {"label": "Change Password", "action": user.change_password},
        {"label": "Change Email", "action": user.change_email},
        {"label": "Delete Account", "action": user.delete_account}
    ]
    menu = Menu(stdscr, menu_options)
    while status.state == utils.AUTHORIZED:
        menu.display()
        key = stdscr.getch()
        if key == ord('\n'):
            menu.execute_selected_action(stdscr)
        elif key == 27:
            break
        elif key in [curses.KEY_UP, curses.KEY_DOWN]:
            menu.navigate(key)

def main():
    curses.wrapper(main_menu)