// Import required modules
import express from 'express';
import connectDB from './db.js';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Room from './models/Room.js';

// Initialize Express app
const app = express();
const PORT = 3000;
// Connect to the database
connectDB();
checkAndImportMainRoom();
// Middleware
app.use(express.json());
app.use(bodyParser.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

let clients = [];

// Server-Sent Events (SSE) endpoint
app.get('/api/:roomName/messages/stream', async (req, res) => {
    const { roomName } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const newClient = { roomName, res };
    clients.push(newClient);

    req.on('close', () => {
        clients = clients.filter(client => client !== newClient);
    });
});

// Save message to a room
app.post('/api/:roomName/messages', async (req, res) => {
    const { roomName } = req.params;
    const { name, content, timestamp } = req.body;

    if (!name || !content || !timestamp) {
        return res.status(400).send('Missing name, content, or timestamp');
    }

    try {
        const message = { name, content, timestamp };
        const room = await Room.findOne({ name: roomName });
        if (!room) {
            return res.status(404).send('Room not found');
        }

        room.messages.push(message);
        await room.save();

        // Send the new message to all clients in the same room
        clients
            .filter(client => client.roomName === roomName)
            .forEach(client => client.res.write(`data: ${JSON.stringify(message)}\n\n`));

        res.status(201).send('Message saved');
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).send('Server error');
    }
});

// Retrieve messages of a room
app.get('/api/:roomName/messages', async (req, res) => {
    const { roomName } = req.params;
    
    try {
        const room = await Room.findOne({ name: roomName });
        if (!room) {
            return res.status(404).send('Room not found');
        }
        res.json(room.messages);
    } catch (error) {
        console.error('Error retrieving messages:', error);
        res.status(500).send('Server error');
    }
});

// Create a new room
app.post('/api/:roomName', async (req, res) => {
    const { roomName } = req.params;

    try {
        // Check if the room already exists
        const existingRoom = await Room.findOne({ name: roomName });
        if (existingRoom) {
            return res.status(400).send('Room already exists');
        }

        // Create a new room
        const newRoom = new Room({ name: roomName });
        await newRoom.save();

        res.status(201).send('Room created successfully');
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).send('Server error');
    }
});

// Retrieve all rooms
app.get('/api/rooms', async (req, res) => {
    try {
        const rooms = await Room.find({});
        res.json(rooms);
    } catch (error) {
        console.error('Error retrieving rooms:', error);
        res.status(500).send('Server error');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});



// Function to check if main room exsists in db and import if not
async function checkAndImportMainRoom() {
    try {
        const mainRoom = await Room.findOne({ name: 'Main Room' });

        if (!mainRoom) {
            console.log('Main Room not found, importing JSON file...');
            const filePath = path.join(__dirname, 'mainRoom.json');
            const roomData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            await Room.insertMany(roomData);
            console.log('Main Room imported successfully');
        } else {
            console.log('Main Room already exists in the database');
        }
    } catch (err) {
        console.error('Error checking or importing Main Room', err);
    }
}




// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
