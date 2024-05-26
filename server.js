const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let messages = [];
let clients = [];

// SSE endpoint
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

app.post('/api/messages', (req, res) => {
    const { name, content, timestamp } = req.body;

    if (!name || !content || !timestamp) {
        return res.status(400).send('Missing name, content, or timestamp');
    }

    const message = { name, content, timestamp };
    messages.push(message);

    // Send the new message to all clients
    clients.forEach(client => client.write(`data: ${JSON.stringify(message)}\n\n`));

    res.status(201).send('Message saved');
});

app.get('/api/messages', (req, res) => {
    res.json(messages);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
