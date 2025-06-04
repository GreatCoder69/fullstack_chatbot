import React, { useEffect, useRef, useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({
    name: '',
    phone: '',
    email: '',
    password: ''
  });
  const [accessToken, setAccessToken] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [chatHistory, setChatHistory] = useState({});
  const [chat, setChat] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const url = authMode === 'login'
      ? 'http://localhost:8080/api/auth/signin'
      : 'http://localhost:8080/api/auth/signup';

    const payload = authMode === 'login'
      ? { email: authData.email, password: authData.password }
      : {
          name: authData.name,
          phone: authData.phone,
          email: authData.email,
          password: authData.password
        };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (authMode === 'login' && data.accessToken) {
        setIsAuthenticated(true);
        setAccessToken(data.accessToken);
        await loadChats(data.accessToken);
      } else if (authMode === 'signup') {
        alert('Signup successful. Please login.');
        setAuthMode('login');
      } else {
        alert('Login failed. Check credentials.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred. Check console.');
    }
  };

  const addTopic = () => {
    const topic = prompt('Enter topic name:');
    if (topic && !topics.includes(topic)) {
      setTopics([...topics, topic]);
      setChatHistory(prev => ({ ...prev, [topic]: [] }));
      setSelectedTopic(topic);
      setChat([]);
    }
  };

  const handleSend = async () => {
    if (!currentMessage.trim() || !selectedTopic) return;

    const userMsg = { sender: 'user', message: currentMessage };
    const newChat = [...chat, userMsg];
    setChat(newChat);
    setChatHistory(prev => ({
      ...prev,
      [selectedTopic]: [...(prev[selectedTopic] || []), userMsg]
    }));
    setCurrentMessage('');

    try {
      const payload = {
        subject: selectedTopic,
        question: currentMessage,
        answer: 'Placeholder'
      };

      const res = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': accessToken
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const botMsg = { sender: 'bot', message: data.answer || 'No response.' };

      const updatedChat = [...newChat, botMsg];
      setChat(updatedChat);
      setChatHistory(prev => ({
        ...prev,
        [selectedTopic]: updatedChat
      }));

    } catch (err) {
      console.error(err);
      const errMsg = { sender: 'bot', message: 'Server error.' };
      const updatedChat = [...newChat, errMsg];
      setChat(updatedChat);
      setChatHistory(prev => ({
        ...prev,
        [selectedTopic]: updatedChat
      }));
    }
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setChat(chatHistory[topic] || []);
  };

  const loadChats = async (token) => {
    try {
      const res = await fetch('http://localhost:8080/api/chat', {
        headers: {
          'x-access-token': token
        }
      });
      const data = await res.json();

      if (!Array.isArray(data)) return;

      // Sort chats by lastUpdated descending
      const sortedChats = data.sort(
        (a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)
      );

      const loadedTopics = sortedChats.map(chat => chat._id);
      const history = {};
      sortedChats.forEach(chat => {
        history[chat._id] = chat.chat.map(entry => [
          { sender: 'user', message: entry.question },
          { sender: 'bot', message: entry.answer }
        ]).flat(); // flatten user-bot Q/A pairs
      });

      setTopics(loadedTopics);
      setChatHistory(history);

      if (loadedTopics.length > 0) {
        setSelectedTopic(loadedTopics[0]);
        setChat(history[loadedTopics[0]]);
      }
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    }
  };

  return (
    <div className="d-flex vh-100 app-container light-mode">
      {/* Sidebar */}
      <div className="sidebar light-sidebar">
        {isAuthenticated && (
          <>
            <Button className="new-chat-btn" onClick={addTopic}>+ New Chat</Button>
            <ul className="topics-list">
              {topics.map((topic, idx) => (
                <li
                  key={idx}
                  className={`topic-item ${selectedTopic === topic ? 'active' : ''}`}
                  onClick={() => handleTopicSelect(topic)}
                >
                  {topic}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Chat or Auth */}
      <div className="chat-area">
        {!isAuthenticated ? (
          <div className="auth-container">
            <h3>{authMode === 'login' ? 'Login' : 'Sign Up'}</h3>
            <Form onSubmit={handleAuthSubmit}>
              {authMode === 'signup' && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter your name"
                      required
                      value={authData.name}
                      onChange={(e) => setAuthData({ ...authData, name: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      placeholder="Enter your phone number"
                      required
                      value={authData.phone}
                      onChange={(e) => setAuthData({ ...authData, phone: e.target.value })}
                    />
                  </Form.Group>
                </>
              )}
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  required
                  value={authData.email}
                  onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Password"
                  required
                  value={authData.password}
                  onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                />
              </Form.Group>
              <Button variant="primary" type="submit">
                {authMode === 'login' ? 'Login' : 'Sign Up'}
              </Button>
            </Form>
            <div className="auth-switch mt-3">
              {authMode === 'login' ? (
                <p>
                  Don’t have an account?{' '}
                  <Button variant="link" onClick={() => setAuthMode('signup')}>Sign up</Button>
                </p>
              ) : (
                <p>
                  Already registered?{' '}
                  <Button variant="link" onClick={() => setAuthMode('login')}>Login</Button>
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="profile-button" title="User Profile">👤</div>
            </div>

            <div className="chat-messages">
              {chat.map((msg, i) => (
                <div key={i} className={`message-row ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                  <div className="message-bubble">{msg.message}</div>
                </div>
              ))}
              <div ref={bottomRef}></div>
            </div>

            <div className="chat-input">
              <InputGroup>
                <Form.Control
                  placeholder="Type your message..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <Button onClick={handleSend} className="send-btn">Send</Button>
              </InputGroup>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
