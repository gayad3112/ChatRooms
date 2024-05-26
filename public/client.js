document.addEventListener('DOMContentLoaded', () => {
    const modalElement = document.getElementById('myModal');
    const submitBtn = modalElement.querySelector('#submitBtn');
    const userInput = modalElement.querySelector('#userInput');
    var userName;
    // Show the modal when the page loads
    modalElement.style.display = 'block';

    // Handle the submit button click
    submitBtn.onclick = function() {
        const userText = userInput.value;
        console.log('User entered: ' + userText);
        modalElement.style.display = 'none'; // Close the modal after submission
        userName = userText;
    }
    const form = get(".msger-inputarea");
    const msgerChat = get(".msger-chat");
 

  // Function to append a message to the messagesDiv
  const appendMessage = (message) => {
    let side;
    if (message.name === userName) {
        side = 'right';
    } else side = 'left';
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

  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  msgerChat.scrollTop += 500;
  };

  function get(selector, root = document) {
    return root.querySelector(selector);
  }
  
  function formatDate(date) {
    const h = "0" + date.getHours();
    const m = "0" + date.getMinutes();
  
    return `${h.slice(-2)}:${m.slice(-2)}`;
  }


  // Fetch and display previous messages
  fetch('/api/messages')
      .then(response => response.json())
      .then(messages => {
          messages.forEach(message => appendMessage(message));
      })
      .catch(error => {
          console.error('Error fetching messages:', error);
      });

  // Event listener for form submission
  form.addEventListener('submit', (event) => {
      event.preventDefault();

      const name = userName;
      const content = document.getElementById('messageContent').value;
      const timestamp = formatDate( new Date());

      const message = { name, content, timestamp };

      fetch('/api/messages', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
      })
      .then(response => response.text())
      .then(data => {
          form.reset();
      })
      .catch(error => {
          console.error('Error:', error);
      });
  });

  // Set up the SSE connection
  const eventSource = new EventSource('/api/messages/stream');

  eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      appendMessage(message);
  };

  eventSource.onerror = (event) => {
      console.error('SSE error:', event);
  };
});
