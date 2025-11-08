import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Home from './Home.jsx';
import Chat from './chat.jsx';
import Image from './image_reasding.jsx';

// Main App component
function App() {
  return (
    <StrictMode>
      <Router>
        <Routes>
          <Route path="/" element={<Image />} /> {/* Home route */}
          <Route path="/chat" element={<Chat />} /> {/* Chat route */}
          <Route path="/image" element={<Home />} /> {/* Image route */}
          {/* Add more routes as needed */}
        </Routes>
      </Router>
    </StrictMode>
  );
}

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);
