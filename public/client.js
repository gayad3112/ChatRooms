document.addEventListener('DOMContentLoaded', () => {
    const modalElement = document.getElementById('myModal');
    const submitBtn = document.getElementById('submitBtn');
    const userInput = document.getElementById('userInput');
    const form = document.querySelector('.msger-inputarea');
    const msgerChat = document.querySelector('.msger-chat');
    let userName;
    let roomName = "Main Room";
    let currentEventSource; // Track the current SSE connection
    const localUserName = localStorage.getItem("username");
    userInput.value = localUserName || '';

    modalElement.style.display = 'block'; 

    submitBtn.addEventListener('click', handleUserNameSubmission);

    document.getElementById('openModalBtn').addEventListener('click', () => {
        document.getElementById('roomModal').style.display = "block";
        fetchRooms();
    });

    document.getElementById('closeModalBtn').addEventListener('click', () => {
        document.getElementById('roomModal').style.display = "none";
    });

    window.addEventListener('click', (event) => {
        if (event.target == document.getElementById('roomModal')) {
            document.getElementById('roomModal').style.display = "none";
        }
    });

    document.getElementById('createRoomBtn').addEventListener('click', handleRoomCreation);

    function handleUserNameSubmission() {
        const userText = userInput.value.trim();

        if (!userText) {
            alert('Please enter a valid name.');
            return;
        }

        userName = userText;
        localStorage.setItem("username", userName);
        modalElement.style.display = 'none';
        initializeChat("Main Room");
    }

    function handleRoomCreation() {
        const roomNameInput = document.getElementById('newRoomInput').value.trim();
        if (roomNameInput) {
            fetch(`/api/${roomNameInput}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ roomName: roomNameInput })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to create new room');
                }
                return response.text();
            })
            .then(() => {
                document.getElementById('newRoomInput').value = '';
                document.getElementById('roomModal').style.display = "none";
                console.log('New room created successfully');
                initializeRoom(roomNameInput);
            })
            .catch(error => {
                console.error('Error creating new room:', error);
            });
        }
    }

    function initializeRoom(room) {
        roomName = room;
        document.getElementById('title').textContent = roomName;
        document.getElementById('roomNameHeader').textContent = roomName;
        initializeChat(roomName);
    }

    function initializeChat(room) {
        msgerChat.innerHTML = '';

        // Close the previous event source if it exists
        if (currentEventSource) {
            currentEventSource.close();
        }

        fetch(`/api/${room}/messages`)
            .then(response => response.json())
            .then(messages => {
                messages.forEach(appendMessage);
            })
            .catch(error => {
                console.error('Error fetching messages:', error);
            });

        // Create a new event source for the current room
        currentEventSource = new EventSource(`/api/${room}/messages/stream`);
        currentEventSource.onmessage = event => {
            const message = JSON.parse(event.data);
            appendMessage(message);
        };
        currentEventSource.onerror = event => {
            console.error('SSE error:', event);
        };
    }

    function updateRoomsList(rooms) {
        const roomList = document.getElementById('roomList');
        roomList.innerHTML = '';
        rooms.forEach(room => {
            const li = document.createElement('li');
            li.textContent = room.name;
            li.addEventListener('click', () => {
                alert('You selected the room: ' + room.name);
                document.getElementById('roomModal').style.display = "none";
                initializeRoom(room.name);
            });
            roomList.appendChild(li);
        });
    }

    function appendMessage(message) {
        const side = message.name === userName ? 'right' : 'left';
        const msgHTML = `
            <div class="msg ${side}-msg">
                <div class="msg-bubble">
                    <div class="msg-info">
                        <div class="msg-info-name">${message.name}</div>
                        <div class="msg-info-time">${message.timestamp}</div>
                    </div>
                    <div class="msg-text">${message.content}</div>
                </div>
            </div>
        `;
        msgerChat.insertAdjacentHTML('beforeend', msgHTML);
        msgerChat.scrollTop += 500;
    }

    function formatDate(date) {
        const h = `0${date.getHours()}`.slice(-2);
        const m = `0${date.getMinutes()}`.slice(-2);
        return `${h}:${m}`;
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const content = document.getElementById('messageContent').value.trim();
        if (!content) {
            alert('Please enter a message.');
            return;
        }

        const timestamp = formatDate(new Date());
        const message = { name: userName, content, timestamp };

        fetch(`/api/${roomName}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
        })
        .then(response => response.text())
        .then(() => {
            form.reset();
        })
        .catch(error => {
            console.error('Error sending message:', error);
        });
    });

    function fetchRooms() {
        fetch('/api/rooms')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch rooms');
                }
                return response.json();
            })
            .then(updateRoomsList)
            .catch(error => {
                console.error('Error fetching rooms:', error);
            });
    }
});
