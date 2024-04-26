import curses
UNAUTHORIZED = False
AUTHORIZED = True

class SingletonMeta(type):
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]
    
class Singleton(metaclass=SingletonMeta):
    state = UNAUTHORIZED
    
    def unauthorize(self):
        self.state = UNAUTHORIZED

    def authorize(self):
        self.state = AUTHORIZED


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
            elif char == 27:
                raise Exception("User cancelled input")
            elif char == curses.KEY_BACKSPACE or char == 127:
                input_str = input_str[:-1]
            else:
                input_str += chr(char)
            stdscr.clear()
            stdscr.addstr(1, 1, prompt)
            stdscr.addstr(2, 1, "*" * len(input_str))
    else:    
        while True:
            char = stdscr.getch()
            if char == ord('\n'):
                break
            elif char == 27:
                raise Exception("User cancelled input")
            elif char == curses.KEY_BACKSPACE or char == 127:
                input_str = input_str[:-1]
            else:
                input_str += chr(char)
            stdscr.clear()
            stdscr.addstr(1, 1, prompt)
            stdscr.addstr(2, 1, input_str)
    curses.noecho()  # Disable input echoing
    return input_str