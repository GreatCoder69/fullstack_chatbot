import React, { useEffect, useRef, useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ChatPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [chatHistory, setChatHistory] = useState({});
  const [chat, setChat] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!token) navigate('/login');
    else loadChats();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const loadChats = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/chat', {
        headers: { 'x-access-token': token }
      });
      const data = await res.json();

      const sorted = data.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
      const loadedTopics = sorted.map(t => t._id);
      const history = {};
      sorted.forEach(c => {
        history[c._id] = c.chat.flatMap(entry => [
          { sender: 'user', message: entry.question },
          { sender: 'bot', message: entry.answer }
        ]);
      });

      setTopics(loadedTopics);
      setChatHistory(history);
      if (loadedTopics.length) {
        setSelectedTopic(loadedTopics[0]);
        setChat(history[loadedTopics[0]]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async () => {
    if (!currentMessage.trim() || !selectedTopic) return;
    const userMsg = { sender: 'user', message: currentMessage };
    const newChat = [...chat, userMsg];
    setChat(newChat);
    setChatHistory(prev => ({ ...prev, [selectedTopic]: [...(prev[selectedTopic] || []), userMsg] }));
    setCurrentMessage('');

    try {
      const res = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-access-token': token },
        body: JSON.stringify({ subject: selectedTopic, question: currentMessage, answer: 'Placeholder' })
      });
      const data = await res.json();
      const botMsg = { sender: 'bot', message: data.answer || 'No response.' };
      const updatedChat = [...newChat, botMsg];
      setChat(updatedChat);
      setChatHistory(prev => ({ ...prev, [selectedTopic]: updatedChat }));
    } catch (err) {
      console.error(err);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="d-flex vh-100 app-container light-mode">
      <div className="sidebar light-sidebar">
        <Button className="new-chat-btn" onClick={addTopic}>+ New Chat</Button>
        <ul className="topics-list">
          {topics.map((topic, idx) => (
            <li key={idx} className={`topic-item ${selectedTopic === topic ? 'active' : ''}`} onClick={() => setSelectedTopic(topic)}>
              {topic}
            </li>
          ))}
        </ul>
      </div>

      <div className="chat-area">
        <div className="chat-header d-flex justify-content-end p-2">
          <Button variant="outline-secondary" className="rounded-circle" title="Logout" onClick={handleLogout}>👤</Button>
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
      </div>
    </div>
  );
};

export default ChatPage;
