from flask import Flask, render_template
import requests

app = Flask(__name__)

boards = {
    "default": "https://cadoth.net/werewolf/leaderboard.json",
    "classic": "https://cadoth.net/werewolf/leaderboard_classic.json"
}

def get_leaderboard(name=None):
    if name not in boards:
        name = "default"

    return boards[name], requests.get(boards[name]).json()

@app.context_processor
def helpers():
    return dict(
        sorted=sorted,
        with_precision=lambda n, precision: format(n, ".{}f".format(precision))
    )

@app.route("/")
@app.route("/board/")
@app.route("/board/<board_name>/")
def get_board(board_name="default"):
    try:
        url, board = get_leaderboard(board_name)
    except IOError:
        return "There was a problem fetching the leaderboard data.", 500

    return render_template("index.html", url=url, board=board)

if __name__ == '__main__':
    app.run(port=5000)
