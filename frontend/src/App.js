import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_URL = "https://ai-college-counsellor.onrender.com";

function App() {
  const [step, setStep] = useState('profile');
  const [gpa, setGpa] = useState('');
  const [interests, setInterests] = useState('');
  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submitProfile = async () => {
    if (!gpa || !interests) {
      alert('Please fill both fields!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Lahar',
          email: 'lahar@test.com',
          password: 'pass123',
          gpa: parseFloat(gpa),
          interests
        })
      });

      const data = await response.json();
      setUserId(data.userId || null);

      setStep('chat');
      setMessages([{
        id: 1,
        text: `Welcome Lahar! 🎓\nGPA: ${gpa} | Interests: ${interests}\n\nAsk me about colleges!`,
        isAI: true
      }]);
    } catch (error) {
      console.error('submitProfile error:', error);
      alert('Backend not reachable!');
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg = { id: Date.now(), text: inputMessage, isAI: false };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const messageToSend = inputMessage;
    setInputMessage('');

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: messageToSend,
          gpa: parseFloat(gpa),
          interests
        })
      });

      const data = await response.json();

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: data.message,
        isAI: true
      }]);
    } catch (error) {
      console.error('sendMessage error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: 'Backend error! Try again.',
        isAI: true
      }]);
    }

    setLoading(false);
  };

  // PROFILE SCREEN
  if (step === 'profile') {
    return (
      <div className="container">
        <h1>🎓 AI College Counselor</h1>

        <input
          type="number"
          step="0.1"
          placeholder="GPA (e.g. 3.5)"
          value={gpa}
          onChange={e => setGpa(e.target.value)}
        />

        <input
          placeholder="Interests (CS, AI)"
          value={interests}
          onChange={e => setInterests(e.target.value)}
        />

        <button onClick={submitProfile} disabled={loading}>
          {loading ? 'Saving...' : '🚀 Start AI Chat'}
        </button>

        <div>
          Backend: <span style={{ color: 'green' }}>Live Server</span>
        </div>
      </div>
    );
  }

  // CHAT SCREEN
  return (
    <div className="container">
      <h2>🤖 AI College Counselor</h2>

      <p>GPA: {gpa} | Interests: {interests}</p>

      <button onClick={() => setStep('profile')}>
        ← Edit Profile
      </button>

      <div className="chatbox">
        {messages.map(msg => (
          <div key={msg.id} className={msg.isAI ? 'ai' : 'user'}>
            {msg.text}
          </div>
        ))}

        {loading && <div className="ai">AI typing...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="inputrow">
        <input
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about colleges..."
        />

        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;