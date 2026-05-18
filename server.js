const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '/')));

let rooms = {}; // Keeps track of online rooms

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // 1. Host creates a room
    socket.on('createRoom', () => {
        let roomCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit random code
        rooms[roomCode] = {
            players: [socket.id],
            board: ["", "", "", "", "", "", "", "", ""],
            currentPlayer: 'X'
        };
        socket.join(roomCode);
        socket.emit('roomCreated', roomCode);
    });

    // 2. Guest joins a room
    socket.on('joinRoom', (roomCode) => {
        if (rooms[roomCode]) {
            if (rooms[roomCode].players.length < 2) {
                rooms[roomCode].players.push(socket.id);
                socket.join(roomCode);
                
                // Let both players know the game can start
                io.to(rooms[roomCode].players[0]).emit('gameStart', { symbol: 'X', turn: 'X' });
                socket.emit('gameStart', { symbol: 'O', turn: 'X' });
            } else {
                socket.emit('errorMsg', 'This room is already full!');
            }
        } else {
            socket.emit('errorMsg', 'Room code not found!');
        }
    });

    // 3. Player makes an online move
    socket.on('makeMove', ({ roomCode, index, symbol }) => {
        if (rooms[roomCode]) {
            let room = rooms[roomCode];
            room.board[index] = symbol;
            room.currentPlayer = symbol === 'X' ? 'O' : 'X';

            // Sync the move to the opponent
            socket.to(roomCode).emit('moveMade', { index, symbol, nextTurn: room.currentPlayer });
        }
    });

    // 4. Reset board for a new round
    socket.on('requestReset', (roomCode) => {
        if (rooms[roomCode]) {
            rooms[roomCode].board = ["", "", "", "", "", "", "", "", ""];
            rooms[roomCode].currentPlayer = 'X';
            io.to(roomCode).emit('roomResetByServer');
        }
    });

    // 5. Handle disconnection
    socket.on('disconnect', () => {
        for (let code in rooms) {
            if (rooms[code].players.includes(socket.id)) {
                io.to(code).emit('opponentDisconnected');
                delete rooms[code];
                break;
            }
        }
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
