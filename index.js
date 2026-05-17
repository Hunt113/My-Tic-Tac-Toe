const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Game State stored securely on the Server
let board = ['', '', '', '', '', '', '', '', ''];
let currentLevel = 1;

const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

function getDifficultyName(level) {
    if (level <= 3) return "👶 DUMB (Random Choices)";
    if (level <= 6) return "🧠 MEDIUM (Blocks & Wins)";
    if (level <= 9) return "🔥 HARD (Smart Traps)";
    return "💀 GOD MODE (Flawless Execution)";
}

function checkWinningLayout(currentBoard, player) {
    return winConditions.some(condition => {
        return condition.every(index => currentBoard[index] === player);
    });
}

// Serve the main website layout page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Post Route processing the main game actions
app.post('/move', (req, res) => {
    const playerIndex = req.body.index;
    
    if (board[playerIndex] !== '') {
        return res.json({ board, level: currentLevel, difficulty: getDifficultyName(currentLevel), message: "Invalid move!" });
    }

    // 1. Register Player Move
    board[playerIndex] = 'X';

    // Check if Human Won
    if (checkWinningLayout(board, 'X')) {
        let oldLevel = currentLevel;
        if (currentLevel < 10) currentLevel++;
        return res.json({ board, level: currentLevel, difficulty: getDifficultyName(currentLevel), gameOver: true, message: `🎉 You Cleared Level ${oldLevel}! Advancing...` });
    }

    // Find all empty spots left
    let availSpots = [];
    for (let i = 0; i < board.length; i++) {
        if (board[i] === '') availSpots.push(i);
    }

    // Check for a Draw match
    if (availSpots.length === 0) {
        return res.json({ board, level: currentLevel, difficulty: getDifficultyName(currentLevel), gameOver: true, message: "🤝 Draw game! Replaying level." });
    }

    // 2. Compute AI Move based on Level Tier Hierarchy
    let robotChoice = null;

    // --- LEVEL 4 TO 10 BRAIN: Look for immediate structural wins or blocks ---
    if (currentLevel >= 4) {
        // Can the robot hit an immediate win layout right now?
        for (let spot of availSpots) {
            let tmp = [...board];
            tmp[spot] = 'O';
            if (checkWinningLayout(tmp, 'O')) {
                robotChoice = spot;
                break;
            }
        }

        // Do we need to block the human player from hitting a 3-in-a-row layout?
        if (robotChoice === null) {
            for (let spot of availSpots) {
                let tmp = [...board];
                tmp[spot] = 'X';
                if (checkWinningLayout(tmp, 'X')) {
                    robotChoice = spot;
                    break;
                }
            }
        }
    }

    // --- LEVEL 7 TO 10 BRAIN: Take strategic map spots (Center/Corners) ---
    if (robotChoice === null && currentLevel >= 7) {
        if (board[4] === '') {
            robotChoice = 4; // Take center point
        } else {
            let corners = [0, 2, 6, 8].filter(c => board[c] === '');
            if (corners.length > 0) {
                robotChoice = corners[Math.floor(Math.random() * corners.length)];
            }
        }
    }

    // --- FALLBACK / DEFAULT (Levels 1-3 or no strategic urgency) ---
    if (robotChoice === null) {
        robotChoice = availSpots[Math.floor(Math.random() * availSpots.length)];
    }

    // Execute Robot Choice
    board[robotChoice] = 'O';

    // Check if Robot Won
    if (checkWinningLayout(board, 'O')) {
        if (currentLevel > 1) currentLevel--;
        return res.json({ board, level: currentLevel, difficulty: getDifficultyName(currentLevel), gameOver: true, message: "💀 Defeat! The robot wins. Dropping down a level..." });
    }

    // Return active game update response layout
    res.json({
        board,
        level: currentLevel,
        difficulty: getDifficultyName(currentLevel),
        gameOver: false,
        message: "Your turn! Choose another open spot."
    });
});

app.post('/reset', (req, res) => {
    board = ['', '', '', '', '', '', '', '', ''];
    res.json({ board });
});

app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🌐 YOUR APP WEBSITE IS RUNNING LIVE!`);
    console.log(`👉 Open your browser and go to: http://localhost:3000`);
    console.log(`=========================================`);
});