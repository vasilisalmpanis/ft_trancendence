from typing                     import Dict, List, Any
from transcendence_cli.messages import *
import curses
class Menu:
    stdscr: object
    options: List[Dict[str, Any]]
    selected_option: int
    def __init__(self, stdscr: object, options: Dict[str, Any]) -> None:
        self.stdscr = stdscr
        self.options = options
        self.selected_option = 0

    def display(self) -> None:
        self.stdscr.clear()
        for i, option in enumerate(self.options):
            if i == self.selected_option:
                self.stdscr.addstr(i + 1, 1, f"> {option['label']}", curses.A_REVERSE)
            else:
                self.stdscr.addstr(i + 1, 1, f"  {option['label']}")
        self.stdscr.refresh()

    def navigate(self, key: int) -> None:
        if key == curses.KEY_UP and self.selected_option > 0:
            self.selected_option -= 1
        elif key == curses.KEY_DOWN and self.selected_option < len(self.options) - 1:
            self.selected_option += 1
        else:
            self.stdscr.clear()
            self.stdscr.addstr(4, 1, INVALID_INPUT)
            

    def execute_selected_action(self, stdscr: object, **kwargs) -> bool:
        selected_action = self.options[self.selected_option]['action']
        selected_action(stdscr, **kwargs)
        return True