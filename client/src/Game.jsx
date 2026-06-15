import { useEffect, useState } from "react";
import { socket } from "./socket";
import Board from "./Board";

function Game() {
    const [roomId, setRoomId] = useState("");
    const [joinedRoom, setJoinedRoom] = useState(null);
    const [game, setGame] = useState(null);
    const [role, setRole] = useState(null);
    const [rematchVotes, setRematchVotes] = useState(null);
    const [playerCount, setPlayerCount] = useState(0);

    useEffect(() => {
        const handleGameState = (state) => {
            console.log("GAME STATE RECEIVED:", state);
            setGame(state);
        };

        socket.on("game_state", handleGameState);

        return () => {
            socket.off("game_state", handleGameState);
        };
    }, []);

    useEffect(() => {
        const handleRoomStatus = (status) => {
            setPlayerCount(status.playerCount);
        };

        socket.on("room_status", handleRoomStatus);

        return () => {
            socket.off("room_status", handleRoomStatus);
        };
    }, []);

    useEffect(() => {
        const handleRematchStatus = (votes) => {
            setRematchVotes(votes);
        };

        socket.on(
            "rematch_status",
            handleRematchStatus
        );

        return () => {
            socket.off(
                "rematch_status",
                handleRematchStatus
            );
        };
    }, []);

    const createRoom = () => {
        socket.emit("create_room", ({ roomId }) => {
            setJoinedRoom(roomId);
            setRole("X");
        });
    };

    const joinRoom = () => {
        socket.emit("join_room", roomId, ({ role, roomId }) => {
            setJoinedRoom(roomId);
            setRole(role);
        });
    };

    if (!joinedRoom) {
        return (
            <div className="lobby-container">
                <div className="lobby-card">
                    <h1>Tic-Tac-Toe Online</h1>

                    <p>
                        Create a room and invite a friend,
                        or join an existing room.
                    </p>

                    <button
                        className="primary-btn"
                        onClick={createRoom}
                    >
                        Create Room
                    </button>

                    <div className="divider">
                        <span>OR</span>
                    </div>

                    <input
                        className="room-input"
                        placeholder="Enter Room Code"
                        value={roomId}
                        onChange={(e) =>
                            setRoomId(e.target.value.toUpperCase())
                        }
                    />

                    <button
                        className="secondary-btn"
                        onClick={joinRoom}
                        disabled={!roomId.trim()}
                    >
                        Join Room
                    </button>
                </div>
            </div>
        );
    }

    if (!game) return <div>Loading game...</div>;

    if (playerCount < 2) {
        return (
            <div className="waiting-card">
                <h2>Room: {joinedRoom}</h2>

                <p>Players: {playerCount}/2</p>

                <p>Waiting for opponent...</p>

                <button
                    onClick={() =>
                        navigator.clipboard.writeText(joinedRoom)
                    }
                >
                    Copy Room Code
                </button>
            </div>
        );
    } else {
        return (
            <div className="game-container">
                <Board
                    game={game}
                    roomId={joinedRoom}
                    role={role}
                    rematchVotes={rematchVotes}
                />
            </div>
        );
    }
}

export default Game;