import { useState } from 'react';

function TextMessageChat() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'How can I assist you today?' },
  ]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!question.trim()) return;

    setLoading(true);

    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: 'user', text: question },
    ]);

    try {
      const response = await fetch('http://localhost:5000/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: question }),
      });

      const data = await response.json();
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'bot', text: data.data },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setQuestion('');
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Text Message Chat</h2>
      </div>
      <div className="chat-box">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender === 'bot' ? 'bot' : 'user'}`}> 
            <p>{message.text}</p>
          </div>
        ))}
      </div>

      <div className="chat-input-container">
        <input 
          type="text" 
          placeholder="Enter your question" 
          value={question} 
          onChange={(e) => setQuestion(e.target.value)} 
        />
        <button onClick={handleSendMessage} disabled={loading}>
          {loading ? <span className="spinner"></span> : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default TextMessageChat;
