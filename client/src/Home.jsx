import { useState } from 'react';
import './App.css';

function Home() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I assist you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);


  const handleSendMessage = async () => {
      // Send the message to the backend
      if (!input.trim()) return; // Prevent sending empty messages
      setLoading(true);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'user', text: input },
      ]);
      try {
        const response = await fetch('http://localhost:5000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },  
          body: JSON.stringify({ message: input }),
        });

        
        const data = await response.json();
        setInput(""); // Clear the input field after sending
        setLoading(false); // Stop loading
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: data.data },
        ]);

      } catch (error) {
        console.error('Error sending message:', error);
      }
    
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>ChatGPT</h2>
      </div>
      <div className="chat-box">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.sender === 'bot' ? 'bot' : 'user'}`}
          >
            <p>{message.text}</p>
          </div>
        ))}
      </div>
      <div className="chat-input-container">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage} disabled={loading}>
          {loading ? <span className="spinner"></span> : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default Home;
