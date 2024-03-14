import re
from websockets.sync.client import connect
import curses
import json

class Game:
    def __init__(self, stdsrc, client) -> None:
        self.stdscr = stdsrc
        self.stdscr.clear()
        self.ball_x = 50
        self.ball_y = 50
        self.left_paddle_y = 40
        self.right_paddle_y = 40
        self.left_paddle_x = 2
        self.side = "left"
        self.score_x = 10
        self.score_y = 10
        self.update_dimensions()
        self.stdscr.addstr(1, self.sw // 2 - 18, "Game Starting As Soon As Possible...")
        self.stdscr.refresh()
        curses.curs_set(0)
        self.stdscr.nodelay(1)
        self.key = None
        try:
            self.ws = connect("ws://localhost:8000/ws", additional_headers={"Authorization": f"Bearer {client.access_token}"})
            self.ws.send(json.dumps({"join": 13}))
        except Exception as e:
            self.running = False
            return
        self.running = True

    def update_dimensions(self):
        self.sh = self.stdscr.getmaxyx()[0]
        self.sw = self.stdscr.getmaxyx()[1]
        self.paddle_height = self.sh // 5
        self.right_paddle_x = self.sw - 3


    def run(self):
        while self.running:
            self.update()
            self.render()

    def update(self, ):
        self.update_dimensions()
        data = json.loads(self.ws.recv())
        if 'status' in data:
            self.ws.close()
            self.running = False
            return
        if 'side' in data:
            self.side = data['side']
            return
        if 'error' in data:
            self.running = False
            return
        if 'x' in data:
            self.ball_x = data['x']
            self.ball_y = data['y']
        if 'p1' in data:
            self.left_paddle_y = data['p1']
        if 'p2' in data:
            self.right_paddle_y = data['p2']
        if 's1' in data:
            self.score_x = data['s1']
            self.score_y = data['s2']
        self.key = self.stdscr.getch()
        if self.key == curses.KEY_UP:
            self.ws.send(json.dumps({"d": self.side, "message": "up"}))
        elif self.key == curses.KEY_DOWN:
            self.ws.send(json.dumps({"d": self.side, "message": "down"}))
        elif self.key == ord('q'):
            self.ws.close()
            self.running = False
        

    def render(self):
        self.stdscr.clear()
        for i in range(self.paddle_height):
            curses.init_pair(1, curses.COLOR_RED, curses.COLOR_BLACK)
            self.stdscr.attron(curses.color_pair(1))
            self.stdscr.addch(int((self.sh + 1) / 100 * self.left_paddle_y) + i, self.left_paddle_x, '▍')
            self.stdscr.addch(int((self.sh + 1)/ 100 * self.right_paddle_y) + i, self.right_paddle_x, '▍')
            self.stdscr.attroff(curses.color_pair(1))
        self.stdscr.addch(int((self.sh - 1) / 100 * self.ball_y), int((self.ball_x / 100 ) * self.sw), '◯')
        self.stdscr.addstr(1, self.sw // 2, f"{self.score_x} - {self.score_y}")

        self.stdscr.refresh()