document.addEventListener('DOMContentLoaded', () => {
  const modalElement = document.getElementById('myModal');
  const submitBtn = modalElement.querySelector('#submitBtn');
  const userInput = modalElement.querySelector('#userInput');
  const form = document.querySelector('.msger-inputarea');
  const msgerChat = document.querySelector('.msger-chat');
  let userName;
  let localUserName = localStorage.getItem("username");
  userInput.value =  localUserName;
  // Show the modal when the page loads
  modalElement.style.display = 'block';

  // Handle the submit button click
  submitBtn.addEventListener('click', () => {
      const userText = userInput.value.trim();

      if (!userText) {
          alert('Please enter a valid name.');
          return;
      }

      userName = userText;
      console.log('User entered:', userName);
      localStorage.setItem("username", userName);
      modalElement.style.display = 'none'; // Close the modal after submission
      initializeChat();
  });

  const initializeChat = () => {
      // Fetch and display previous messages after user submits their name
      fetch('/api/messages')
          .then(response => response.json())
          .then(messages => {
              messages.forEach(message => appendMessage(message));
          })
          .catch(error => {
              console.error('Error fetching messages:', error);
          });

      // Set up the SSE connection
      const eventSource = new EventSource('/api/messages/stream');
      eventSource.onmessage = event => {
          const message = JSON.parse(event.data);
          appendMessage(message);
      };
      eventSource.onerror = event => {
          console.error('SSE error:', event);
      };
  };

  // Function to append a message to the chat
  const appendMessage = message => {
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
  };

  const formatDate = date => {
      const h = `0${date.getHours()}`;
      const m = `0${date.getMinutes()}`;
      return `${h.slice(-2)}:${m.slice(-2)}`;
  };

  // Event listener for form submission
  form.addEventListener('submit', event => {
      event.preventDefault();

      const content = document.getElementById('messageContent').value.trim();
      if (!content) {
          alert('Please enter a message.');
          return;
      }

      const timestamp = formatDate(new Date());
      const message = { name: userName, content, timestamp };

      fetch('/api/messages', {
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
});
