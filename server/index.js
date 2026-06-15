const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

require("dotenv").config();

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST"]
    }
});

const rooms = {};

function generateRoomId() {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function calculateWinner(squares) {
    const lines = [
        [0,1,2],
        [3,4,5],
        [6,7,8],
        [0,3,6],
        [1,4,7],
        [2,5,8],
        [0,4,8],
        [2,4,6],
    ];

    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];

        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }

    return null;
}

function getPlayerCount(room) {
    return (room.players.X ? 1 : 0) + (room.players.O ? 1 : 0);
}

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("create_room", (callback) => {
        const roomId = generateRoomId();

        rooms[roomId] = {
            squares: Array(9).fill(null),
            xIsNext: true,
            players: {
                X: null,
                O: null
            },
            winner: null,
            rematchVotes: {
                X: false,
                O: false
            }
        };

        socket.join(roomId);

        rooms[roomId].players.X = socket.id;

        console.log(`${socket.id} created room ${roomId}`);
        socket.data.roomId = roomId;

        callback({ roomId });

        socket.emit("game_state", rooms[roomId]);

        socket.emit("room_status", {
            playerCount: 1
        });
    });

    socket.on("join_room", (roomId, callback) => {
        socket.join(roomId);
        if (!rooms[roomId]) {
            callback({
                error: "Room not found"
            });
            return;
        }

        const room = rooms[roomId];
        if (room.players.X === socket.id || room.players.O === socket.id) {
            return;
        }

        if (!room.players.X) {
            room.players.X = socket.id;
        } else if (!room.players.O) {
            room.players.O = socket.id;
        } else {
            callback({
                error: "Room is full"
            });
            return;
        }

        console.log(`${socket.id} joined room ${roomId}`);
        socket.data.roomId = roomId;

        let role = null;
        if (room.players.X == socket.id) role = "X";
        if (room.players.O == socket.id) role = "O";

        callback({
            role,
            roomId
        });

        io.to(roomId).emit("room_status", {
            playerCount: getPlayerCount(room)
        });

        socket.emit("player_role", role);
        socket.emit("game_state", room);
    });

    socket.on("make_move", ({ roomId, index }) => {
        const room = rooms[roomId];
        if (!room) return;

        const player = room.players.X === socket.id ? "X" :
                       room.players.O === socket.id ? "O" :
                       null;

        if (!player) return;

        if ((room.xIsNext && player !== "X") || (!room.xIsNext && player !== "O")) {
            return;
        }

        if (room.squares[index]) return;

        if (room.winner) return;

        room.squares[index] = player;

        const winner = calculateWinner(room.squares);
        if (winner) {
            room.winner = winner;
        } else if (room.squares.every(square => square !== null)) {
            room.winner = "DRAW";
        } else {
            room.xIsNext = !room.xIsNext;
        }

        io.to(roomId).emit("game_state", room);
    });

    socket.on("request_rematch", (roomId) => {
        const room = rooms[roomId];

        if (!room) return;

        const player =
            room.players.X === socket.id ? "X" :
            room.players.O === socket.id ? "O" :
            null;

        if (!player) return;

        room.rematchVotes[player] = true;

        io.to(roomId).emit(
            "rematch_status",
            room.rematchVotes
        );

        if (
            room.rematchVotes.X &&
            room.rematchVotes.O
        ) {
            room.squares = Array(9).fill(null);
            room.xIsNext = true;
            room.winner = null;

            room.rematchVotes = {
                X: false,
                O: false
            };

            io.to(roomId).emit(
                "game_state",
                room
            );

            io.to(roomId).emit(
                "rematch_status",
                room.rematchVotes
            );
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        const roomId = socket.data.roomId;
        if (!roomId) return;

        const room = rooms[roomId];
        if (!room) return;

        if (room.players.X === socket.id) {
            room.players.X = null;
        }

        if (room.players.O === socket.id) {
            room.players.O = null;
        }

        room.squares = Array(9).fill(null);
        room.winner = null;
        room.xIsNext = true;

        io.to(roomId).emit("room_status", {
            playerCount: getPlayerCount(room)
        });
    });
})

server.listen(process.env.PORT, () => {
    console.log(
        `Server running on port ${process.env.PORT}`
    );
});
