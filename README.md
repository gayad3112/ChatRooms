# Chat Application
This is a simple chat application built with Node.js, Express, MongoDB, and vanilla JavaScript. Users can join different chat rooms, send and receive messages in real-time, and create new rooms.


## Features
* Real-time messaging using Server-Sent Events (SSE)
* Multiple chat rooms
* Room creation
* Persistent message storage using MongoDB
* Single-page application

## Usage
1. When you first load the application, you will be prompted to enter a username. This will be stored in your browser's local storage.
2. The default room is "Main Room". You can send messages which will be displayed in the chat.
3. Click the "Change Room" button to see a list of available rooms or to create a new room.
4. Messages are specific to each room, and only users in the same room can see each other's messages.
