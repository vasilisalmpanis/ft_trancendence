ERROR_MESSAGE = "An error occurred. Please try again later."
INVALID_CREDENTIALS = "Invalid credentials. Press any key to try again."
INVALID_2FA = "Invalid 2FA code. Press any key to try again."
UNAUTHORIZED = "You must be logged in to create a game. Return to the main menu"
NO_GAMES = "No games available. Return to the main menu"
INVALID_INPUT = "Invalid input. Press any key to try again."
ACCOUNT_CREATED = "Account created successfully. Press any key to continue."
USERNAME_CHANGED = "Username changed successfully. Press any key to continue."
PASSWORD_CHANGED = "Password changed successfully. Press any key to continue."
EMAIL_CHANGED = "Email changed successfully. Press any key to continue"
USER_DELETED = "User Deleted successfully. Press any key to continue."
ACCESS_EXPIRED = "Your Session Expired. Press any key to log in again."

def message(stdscr, message):
    stdscr.clear()
    stdscr.addstr(1, 1, message)
    stdscr.refresh()
    stdscr.getch()