import express from 'express';
import connectDB from './db.js';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import Message from './models/Message.js';

const app = express();
const PORT = 3000;

// Connect to the database
connectDB();

app.use(express.json());
app.use(bodyParser.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

let clients = [];

// SSE (Server-Sent Events) endpoint
app.get('/api/messages/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.push(res);

    // Remove client when it closes connection
    req.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
});

app.post('/api/messages', async (req, res) => {
    const { name, content, timestamp } = req.body;

    if (!name || !content || !timestamp) {
        return res.status(400).send('Missing name, content, or timestamp');
    }

    try {
        const message = new Message({ name, content, timestamp });
        await message.save();

        // Send the new message to all clients
        clients.forEach(client => client.write(`data: ${JSON.stringify(message)}\n\n`));

        res.status(201).send('Message saved');
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).send('Server error');
    }
});

app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find();
        res.json(messages);
    } catch (error) {
        console.error('Error retrieving messages:', error);
        res.status(500).send('Server error');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
