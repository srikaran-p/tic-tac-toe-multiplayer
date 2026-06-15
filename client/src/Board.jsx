import Square from "./Square";
import { socket } from "./socket";

function Board({ game, role, roomId, rematchVotes }) {

    const isMyTurn = (role === "X" && game.xIsNext) || 
    (role === "O" && !game.xIsNext);

    const handleClick = (index) => {
        if (game.winner) return;

        if (!isMyTurn) return;

        if (game.squares[index]) return;

        socket.emit("make_move", {
            roomId,
            index
        });
    };

    return (
        <div className="game-card">

            <div className="game-header">

                <div className="player-badge">
                    You are {role}
                </div>

                <div
                    className={`status-badge ${
                        game.xIsNext ? "x-turn" : "o-turn"
                    }`}
                >
                    {game.winner === "DRAW"
                        ? "Draw!"
                        : game.winner
                            ? `Winner: ${game.winner}`
                            : `Turn: ${game.xIsNext ? "X" : "O"}`
                    }
                </div>

            </div>

            {game.winner === "DRAW" && (
                <div className="draw-banner">
                    🤝 It's a Draw!
                </div>
            )}

            {game.winner &&
                game.winner !== "DRAW" && (
                    <div className="winner-banner">
                        🎉 Player
                        <span
                            className={
                                game.winner === "X"
                                    ? "winner-x"
                                    : "winner-o"
                            }
                        >
                            {" "}{game.winner}
                        </span>
                        {" "}Wins!
                    </div>
                )
            }

            {game.winner && (
                <button
                    className="rematch-btn"
                    onClick={() =>
                        socket.emit(
                            "request_rematch",
                            roomId
                        )
                    }
                >
                    Rematch
                </button>
            )}

            {game.winner &&
                rematchVotes?.[role] && (
                    <p>
                        Waiting for opponent...
                    </p>
                )}

            <div className="board">
                {game.squares.map((v, i) => (
                    <Square
                        key={i}
                        value={v}
                        onClick={() => handleClick(i)}
                    />
                ))}
            </div>

        </div>
    );
}

export default Board;