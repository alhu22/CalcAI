import { useState, useEffect, useRef } from 'react';
import ImageKit from 'imagekit-javascript';
import { marked } from 'marked';
import { Image } from 'lucide-react';
// import { markedKatex } from "marked-katex-extension";
import "katex/dist/katex.min.css"; // Required for KaTeX styles

import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // You can choose another theme

marked.setOptions({
  highlight: function (code, lang) {
    return hljs.highlightAuto(code).value;
  },
});

// marked.use(markedKatex({ throwOnError: false }));

const imagekit = new ImageKit({
  publicKey: "public_vIIUYDN3TgSfgAxlE+gUi/cjQXE=",
  urlEndpoint: "https://ik.imagekit.io/fxjzsfork",
  authenticationEndpoint: "http://localhost:5000/api/auth",
});

function addCopyButtons(html) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const codeBlocks = tempDiv.querySelectorAll("pre > code");

  codeBlocks.forEach((codeBlock) => {
    const button = document.createElement("button");
    button.textContent = "Copy";
    button.className = "copy-button";
    button.type = "button";

    button.onclick = async () => {
      const code = codeBlock.innerText;
      console.log("Copying:", code); // ✅ Debug output

      try {
        await navigator.clipboard.writeText(code);
        button.textContent = "Copied!";
        setTimeout(() => (button.textContent = "Copy"), 2000);
      } catch (err) {
        console.error("Failed to copy", err);
        alert("Copy failed. Make sure you're running over HTTPS or localhost.");
      }
    };

    const pre = codeBlock.parentElement;
    pre.style.position = "relative";
    button.style.position = "absolute";
    button.style.top = "8px";
    button.style.right = "8px";
    pre.appendChild(button);
  });

  return tempDiv.innerHTML;
}

function ImageChat() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'How can I assist you today?' },
  ]);
  const [question, setQuestion] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Ref for the chat box container to scroll
  const chatBoxRef = useRef(null);

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!question.trim()) return;

    setLoading(true);

    if (!file) {
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

      return; // Prevent further execution
    }

    // If an image is selected
    const objectUrl = URL.createObjectURL(file);
    setMessages((prev) => [...prev, { sender: 'user', text: question, image: objectUrl }]);

    try {
      const authResponse = await fetch("http://localhost:5000/api/auth");
      const authData = await authResponse.json();

      const uploaded = await new Promise((resolve, reject) => {
        imagekit.upload({
          file,
          fileName: file.name,
          token: authData.token,
          signature: authData.signature,
          expire: authData.expire,
        }, (err, result) => (err ? reject(err) : resolve(result)));
      });

      const imageUrl = uploaded.url;

      try {
        const response = await fetch('http://localhost:5000/api/image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: question, imageUrl: imageUrl }),
        });

        const data = await response.json();
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: data.data },
        ]);
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setFile(null);
        setQuestion('');
        setLoading(false);
      }

    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Error processing your request.' }]);
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-box" ref={chatBoxRef}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.sender === 'bot' ? 'bot' : 'user'}`}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: '8px' }}
          >
            {message.sender === 'user' && message.image && (
              <img src={message.image} alt="" style={{ width: '50%', marginBottom: '5px', marginLeft: '0%' }} />
            )}
            <div
              className="message-text"
              style={{ maxWidth: '60%', background: 'none' }}
              dangerouslySetInnerHTML={{ __html: addCopyButtons(marked(message.text)) }}
            />
          </div>
        ))}
      </div>

      <div className="chat-input-container">
        <Image
          className="cursor-pointer"
          onClick={() => document.getElementById('file-input').click()}
        />
        <input
          id="file-input"
          className='file-input'
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          hidden
        />

        {/* ✅ Show image preview if file is selected */}
        {file && (
          <div className="image-preview" style={{ margin: '10px 0' }}>
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              style={{
                maxWidth: '100%',
                maxHeight: '200px',
                borderRadius: '8px',
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        <textarea
          placeholder="Enter your question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          style={{ maxHeight: '300px', overflowY: 'auto', resize: 'vertical' }}
          rows={1}
        />

        <button className='submitbutton' onClick={handleSendMessage} disabled={loading}>
          {loading ? <span className="spinner"></span> : 'Send'}
        </button>
      </div>

    </div>
  );
}

export default ImageChat;
