import React, { useEffect, useRef, useState } from 'react';
import { Button, Form, InputGroup, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ChatPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [chatHistory, setChatHistory] = useState({});
  const [chat, setChat] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    const savedOrder = localStorage.getItem('topicsOrder');
    if (savedOrder) {
      setTopics(JSON.parse(savedOrder));
    }
    fetchAllChats();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const fetchAllChats = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/chat', {
        headers: {
          'x-access-token': token,
        }
      });

      const data = await res.json();
      if (!Array.isArray(data)) return;

      const sorted = data.sort((a, b) => new Date(b.lastUpdated || b.updatedAt) - new Date(a.lastUpdated || a.updatedAt));
      const history = {};
      sorted.forEach(c => {
        const topic = c._id;
        history[topic] = (c.chat || []).flatMap(entry => [
          { sender: 'user', message: entry.question, timestamp: entry.timestamp },
          { sender: 'bot', message: entry.answer, timestamp: entry.timestamp }
        ]);
      });
      setChatHistory(history);

      const sortedTopics = sorted.map(c => c._id);
      const savedOrder = localStorage.getItem('topicsOrder');
      const topicOrder = savedOrder ? JSON.parse(savedOrder) : sortedTopics;

      setTopics(topicOrder);
      if (topicOrder.length > 0) {
        setSelectedTopic(topicOrder[0]);
        setChat(history[topicOrder[0]]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const reorderTopics = (topic) => {
    setTopics(prev => {
      const updated = [topic, ...prev.filter(t => t !== topic)];
      localStorage.setItem('topicsOrder', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSend = async () => {
    if (!currentMessage.trim() || !selectedTopic) return;

    const userMsg = { sender: 'user', message: currentMessage, timestamp: new Date().toISOString() };
    const newChat = [...chat, userMsg];
    setChat(newChat);
    setChatHistory(prev => ({ ...prev, [selectedTopic]: [...(prev[selectedTopic] || []), userMsg] }));

    reorderTopics(selectedTopic);
    setCurrentMessage('');

    try {
      const res = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-access-token': token },
        body: JSON.stringify({ subject: selectedTopic, question: userMsg.message, answer: 'Placeholder' })
      });
      const data = await res.json();
      const botMsg = { sender: 'bot', message: data.answer || 'No response.', timestamp: new Date().toISOString() };
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
      const updatedTopics = [topic, ...topics];
      setTopics(updatedTopics);
      localStorage.setItem('topicsOrder', JSON.stringify(updatedTopics));
      setChatHistory(prev => ({ ...prev, [topic]: [] }));
      setSelectedTopic(topic);
      setChat([]);
    }
  };

  const selectTopic = topic => {
    setSelectedTopic(topic);
    setChat(chatHistory[topic] || []);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="d-flex vh-100">
      <div className="p-3 border-end" style={{ width: 300 }}>
        <Button className="w-100 mb-3" onClick={addTopic}>+ New Chat</Button>
        <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 100px)' }}>
          {topics
            .filter(topic => (chatHistory[topic]?.length || 0) > 0)
            .map((topic, idx) => (
              <div
                key={idx}
                className={`topic-item p-3 mb-2 rounded cursor-pointer ${
                  selectedTopic === topic 
                    ? 'bg-primary text-white' 
                    : 'bg-light hover-bg-secondary'
                }`}
                onClick={() => selectTopic(topic)}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div className="fw-bold">{topic}</div>
                <small className={selectedTopic === topic ? 'text-light' : 'text-muted'}>
                  {chatHistory[topic]?.length || 0} messages
                </small>
              </div>
          ))}

        </div>
      </div>

      <div className="flex-grow-1 d-flex flex-column">
        <div className="p-3 border-bottom d-flex justify-content-between">
          <h5>{selectedTopic}</h5>
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary">👤</Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        <div className="flex-grow-1 p-3 overflow-auto">
          {(chat || []).map((msg, i) => (
            <div key={i} className="mb-3 text-start">
              <div className={`d-inline-block p-3 rounded ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-light'}`}>{msg.message}</div>
            </div>
          ))}
          <div ref={bottomRef}></div>
        </div>

        <div className="p-3 border-top">
          <InputGroup>
            <Form.Control
              placeholder="Type a message..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
            />
            <Button onClick={handleSend} disabled={!currentMessage.trim()}>Send</Button>
          </InputGroup>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
