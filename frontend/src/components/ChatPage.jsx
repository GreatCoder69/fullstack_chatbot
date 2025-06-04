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

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log('Fetched data:', data);

      if (!Array.isArray(data) || data.length === 0) {
        console.log('No chat data found');
        setLoading(false);
        return;
      }

      // Sort by lastUpdated or updatedAt (latest first)
      const sorted = data.sort((a, b) => {
        const aTime = new Date(a.lastUpdated || a.updatedAt || 0);
        const bTime = new Date(b.lastUpdated || b.updatedAt || 0);
        return bTime - aTime;
      });

      // Extract topics using _id as subject name
      const topicNames = sorted.map(c => c._id);
      const history = {};

      // Build chat history for each topic
      sorted.forEach(c => {
        const topic = c._id;
        if (c.chat && Array.isArray(c.chat)) {
          history[topic] = c.chat.flatMap(entry => [
            { sender: 'user', message: entry.question, timestamp: entry.timestamp },
            { sender: 'bot', message: entry.answer, timestamp: entry.timestamp }
          ]);
        } else {
          history[topic] = [];
        }
      });

      setTopics(topicNames);
      setChatHistory(history);

      // Select first topic if available
      if (topicNames.length > 0) {
        const first = topicNames[0];
        setSelectedTopic(first);
        setChat(history[first] || []);
      }

    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to reorder topics: move current topic to top
  const reorderTopics = (topic) => {
    setTopics(prev => {
      const filtered = prev.filter(t => t !== topic);
      return [topic, ...filtered];
    });
  };

  const handleSend = async () => {
    if (!currentMessage.trim() || !selectedTopic) return;

    const userMsg = { 
      sender: 'user', 
      message: currentMessage,
      timestamp: new Date().toISOString()
    };
    
    const newChat = [...chat, userMsg];
    setChat(newChat);
    setChatHistory(prev => ({
      ...prev,
      [selectedTopic]: [...(prev[selectedTopic] || []), userMsg]
    }));

    reorderTopics(selectedTopic);

    const messageToSend = currentMessage;
    setCurrentMessage('');

    try {
      const res = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify({
          subject: selectedTopic,
          question: messageToSend,
          answer: 'Placeholder'
        })
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      const data = await res.json();
      const botMsg = { 
        sender: 'bot', 
        message: data.answer || 'No response.',
        timestamp: new Date().toISOString()
      };
      
      const updatedChat = [...newChat, botMsg];
      setChat(updatedChat);
      setChatHistory(prev => ({
        ...prev,
        [selectedTopic]: updatedChat
      }));

      reorderTopics(selectedTopic);

    } catch (err) {
      console.error('Failed to send message:', err);
      // Revert optimistic update on error
      setChat(chat);
      setChatHistory(prev => ({
        ...prev,
        [selectedTopic]: chat
      }));
    }
  };

  const addTopic = () => {
    const topic = prompt('Enter topic name:');
    if (topic && !topics.includes(topic)) {
      setTopics([topic, ...topics]);
      setChatHistory(prev => ({ ...prev, [topic]: [] }));
      setSelectedTopic(topic);
      setChat([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const selectTopic = (topic) => {
    setSelectedTopic(topic);
    setChat(chatHistory[topic] || []);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading your chats...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex vh-100 app-container light-mode">
      {/* Sidebar */}
      <div className="sidebar light-sidebar" style={{ width: '300px', borderRight: '1px solid #dee2e6' }}>
        <div className="p-3">
          <Button className="new-chat-btn w-100 mb-3" onClick={addTopic}>
            + New Chat
          </Button>
        </div>
        
        <div className="topics-list px-3" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 90px)' }}>
          {topics.length === 0 ? (
            <div className="text-muted text-center py-4">
              <p>No chats yet</p>
              <small>Create your first chat to get started!</small>
            </div>
          ) : (
            topics.map((topic, idx) => (
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
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area flex-grow-1 d-flex flex-column">
        {/* Header */}
        <div className="chat-header d-flex justify-content-between align-items-center p-3 border-bottom bg-white">
          <div>
            <h5 className="mb-0">
              {selectedTopic ? selectedTopic : 'Select a chat'}
            </h5>
            {selectedTopic && (
              <small className="text-muted">
                {chat.filter(m => m.sender === 'user').length} questions asked
              </small>
            )}
          </div>
          
          <Dropdown align="end">
            <Dropdown.Toggle
              variant="outline-secondary"
              className="rounded-circle border-0"
              id="profile-dropdown"
              style={{ width: '40px', height: '40px' }}
            >
              👤
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleLogout}>
                Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Messages */}
        <div 
          className="chat-messages flex-grow-1 p-3" 
          style={{ 
            overflowY: 'auto',
            backgroundColor: '#f8f9fa'
          }}
        >
          {!selectedTopic ? (
            <div className="text-center mt-5">
              <h4 className="text-muted">Welcome to Your Chat Dashboard</h4>
              <p className="text-muted">
                {topics.length > 0 
                  ? 'Select a chat from the sidebar to continue the conversation'
                  : 'Create your first chat to get started'
                }
              </p>
            </div>
          ) : chat.length === 0 ? (
            <div className="text-center mt-5">
              <h5 className="text-muted">Start a conversation</h5>
              <p className="text-muted">Ask your first question about {selectedTopic}</p>
            </div>
          ) : (
            chat.map((msg, i) => (
              <div 
                key={i} 
                className="d-flex mb-3 justify-content-start"
              >
                <div 
                  className={`message-bubble p-3 rounded-3 shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-white text-dark border'
                  }`}
                  style={{ 
                    maxWidth: '70%',
                    wordWrap: 'break-word'
                  }}
                >
                  <div>{msg.message}</div>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef}></div>
        </div>

        {/* Input */}
        {selectedTopic && (
          <div className="chat-input p-3 border-top bg-white">
            <InputGroup>
              <Form.Control
                placeholder={`Ask a question about ${selectedTopic}...`}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                style={{ resize: 'none' }}
              />
              <Button 
                onClick={handleSend} 
                className="send-btn px-4"
                disabled={!currentMessage.trim()}
                variant="primary"
              >
                Send
              </Button>
            </InputGroup>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
