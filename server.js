import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize the Google Gen AI SDK
// It automatically looks for an Environment Variable named GEMINI_API_KEY
const ai = new GoogleGenAI(AIzaSyBl12cHDoqW65LFY7HY7igCDatMbEarxpc);

app.use(express.json());

// 1. API Route to handle chat processing requests
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message content is required." });
        }

        // Format history for the API structure if provided
        const contents = history ? [...history, { role: 'user', parts: [{ text: message }] }] : message;

        // Call the Gemini 2.5 Flash model core
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: "You are Elian AI, a highly intelligent, premium, tech-forward AI assistant. You are sleek, witty, incredibly helpful, and supportive. Answer clearly, accurately, and always maintain your identity as Elian AI.",
            }
        });

        res.json({ reply: response.text });
    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ error: "Mainframe connection failed. Try again." });
    }
});

// 2. Main Interface Route - Serves the HTML frontend code text directly
app.get('*', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Elian AI Mainframe</title>
    <style>
        body {
            background-color: #0b0f17;
            color: #f1f5f9;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        /* Sidebar Styling */
        .sidebar {
            width: 260px;
            background-color: #070a10;
            border-right: 1px solid #1e293b;
            display: flex;
            flex-direction: column;
            padding: 15px;
            justify-content: space-between;
            box-sizing: border-box;
        }

        .new-chat-btn {
            background: linear-gradient(135deg, #00f2fe, #4facfe);
            color: #000;
            font-weight: bold;
            border: none;
            border-radius: 8px;
            padding: 12px;
            cursor: pointer;
            font-size: 14px;
            transition: opacity 0.2s;
        }
        .new-chat-btn:hover { opacity: 0.9; }

        /* Main Dialogue Area */
        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            background-image: radial-gradient(circle at top right, #111827 0%, #0b0f17 100%);
        }

        .chat-header {
            padding: 15px 25px;
            border-bottom: 1px solid #1e293b;
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 1px;
            color: #00f2fe;
            text-shadow: 0 0 10px rgba(0, 242, 254, 0.3);
        }

        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px 40px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        /* Message Bubbles layout */
        .message {
            max-width: 75%;
            padding: 14px 18px;
            border-radius: 12px;
            font-size: 15px;
            line-height: 1.5;
            word-wrap: break-word;
        }

        .user-message {
            background-color: #1e293b;
            color: #f8fafc;
            align-self: flex-end;
            border-bottom-right-radius: 2px;
        }

        .ai-message {
            background-color: #111827;
            border: 1px solid #1e293b;
            color: #e2e8f0;
            align-self: flex-start;
            border-bottom-left-radius: 2px;
        }

        /* Typing Indicator dots */
        .typing {
            color: #64748b;
            font-style: italic;
            font-size: 14px;
            align-self: flex-start;
            display: none;
        }

        /* Input Controls Platform */
        .input-area {
            padding: 20px 40px;
            display: flex;
            gap: 15px;
            background-color: #0b0f17;
            border-top: 1px solid #1e293b;
        }

        .chat-input {
            flex: 1;
            background-color: #111827;
            border: 1px solid #1e293b;
            border-radius: 8px;
            padding: 14px;
            color: white;
            font-size: 15px;
            outline: none;
            transition: border-color 0.2s;
        }
        .chat-input:focus { border-color: #00f2fe; }

        .send-btn {
            background-color: #1e293b;
            border: 1px solid #334155;
            color: #00f2fe;
            border-radius: 8px;
            padding: 0 25px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.2s;
        }
        .send-btn:hover { background-color: #334155; }

        .branding-footer {
            font-size: 12px;
            color: #334155;
            text-align: center;
        }
        .branding-footer span { color: #475569; font-weight: bold; }
    </style>
</head>
<body>

    <div class="sidebar">
        <button class="new-chat-btn" onclick="clearConversation()">+ New System Sync</button>
        <div class="branding-footer">
            ELIAN AI SYSTEM // BY <span>YHONATAN AKIVA</span>
        </div>
    </div>

    <div class="chat-container">
        <div class="chat-header">ELIAN AI // MAINFRAME ACTIVE</div>
        
        <div class="chat-messages" id="chat-messages">
            <div class="message ai-message">Greetings. I am Elian AI. Mainframe connection established successfully. How can I assist your operations today?</div>
            <div class="typing" id="typing-indicator">Elian AI is compiling response...</div>
        </div>

        <div class="input-area">
            <input type="text" id="user-input" class="chat-input" placeholder="Ask Elian AI anything..." onkeydown="if(event.key === 'Enter') sendMessage()">
            <button class="send-btn" onclick="sendMessage()">SEND</button>
        </div>
    </div>

    <script>
        const chatMessages = document.getElementById('chat-messages');
        const userInput = document.getElementById('user-input');
        const typingIndicator = document.getElementById('typing-indicator');
        
        let conversationHistory = [];

        async function sendMessage() {
            const text = userInput.value.trim();
            if (!text) return;

            appendMessage(text, 'user-message');
            userInput.value = '';

            typingIndicator.style.display = 'block';
            chatMessages.scrollTop = chatMessages.scrollHeight;

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, history: conversationHistory })
                });

                const data = await response.json();
                typingIndicator.style.display = 'none';

                if (data.reply) {
                    appendMessage(data.reply, 'ai-message');
                    conversationHistory.push({ role: 'user', parts: [{ text: text }] });
                    conversationHistory.push({ role: 'model', parts: [{ text: data.reply }] });
                } else {
                    appendMessage("Error: Neural channel dropped packets.", 'ai-message');
                }
            } catch (err) {
                typingIndicator.style.display = 'none';
                appendMessage("System Link Error: Check server terminal.", 'ai-message');
                console.error(err);
            }

            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function appendMessage(text, className) {
            const msgDiv = document.createElement('div');
            msgDiv.className = \`message \${className}\`;
            msgDiv.innerText = text;
            chatMessages.insertBefore(msgDiv, typingIndicator);
        }

        function clearConversation() {
            chatMessages.innerHTML = \`<div class="message ai-message">Mainframe state flushed. Ready for new operations.</div>\`;
            conversationHistory = [];
            chatMessages.appendChild(typingIndicator);
            typingIndicator.style.display = 'none';
        }
    </script>
</body>
</html>
    `);
});

app.listen(PORT, () => {
    console.log(`Elian AI Mainframe operating on port ${PORT}`);
});
