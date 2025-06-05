import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Form,
  InputGroup,
  Dropdown,
  Modal
} from 'react-bootstrap';
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

  const [showModal, setShowModal] = useState(false);
  const [profile, setProfile] = useState({
    email: '',
    name: '',
    phone: '',
    password: ''
  });
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch user profile once on mount
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchUserProfile();
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
        headers: { 'x-access-token': token }
      });
      const data = await res.json();
      if (!Array.isArray(data)) return;

      const sorted = data.sort((a, b) =>
        new Date(b.lastUpdated || b.updatedAt) - new Date(a.lastUpdated || a.updatedAt)
      );
      const history = {};
      sorted.forEach((c) => {
        const topic = c._id;
        history[topic] = (c.chat || []).flatMap((entry) => [
          { sender: 'user', message: entry.question, timestamp: entry.timestamp },
          { sender: 'bot', message: entry.answer, timestamp: entry.timestamp }
        ]);
      });

      const sortedTopics = sorted.map((c) => c._id);
      const savedOrder = localStorage.getItem('topicsOrder');
      const topicOrder = savedOrder ? JSON.parse(savedOrder) : sortedTopics;

      setChatHistory(history);
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
    setTopics((prev) => {
      const updated = [topic, ...prev.filter((t) => t !== topic)];
      localStorage.setItem('topicsOrder', JSON.stringify(updated));
      return updated;
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
    setChatHistory((prev) => ({
      ...prev,
      [selectedTopic]: [...(prev[selectedTopic] || []), userMsg]
    }));

    reorderTopics(selectedTopic);
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
          question: userMsg.message
        })
      });
      const data = await res.json();
      const botMsg = {
        sender: 'bot',
        message: data.answer || 'No response.',
        timestamp: new Date().toISOString()
      };
      const updatedChat = [...newChat, botMsg];
      setChat(updatedChat);
      setChatHistory((prev) => ({
        ...prev,
        [selectedTopic]: updatedChat
      }));
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
      setChatHistory((prev) => ({ ...prev, [topic]: [] }));
      setSelectedTopic(topic);
      setChat([]);
    }
  };

  const selectTopic = (topic) => {
    setSelectedTopic(topic);
    setChat(chatHistory[topic] || []);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/auth/me', {
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        }
      });
      const data = await res.json();
      setProfile({
        email: data.email,
        name: data.name,
        phone: data.phone,
        password: ''
      });
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const handleProfileUpdate = async () => {
    const updateBody = {
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
      ...(profile.password && { password: profile.password }) // only send password if not empty
    };

    try {
      const res = await fetch('http://localhost:8080/api/auth/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify(updateBody)
      });

      const data = await res.json(); // parse response

      if (res.ok) {
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          setShowModal(false);
        }, 2000);
      } else {
        console.error('Update failed:', data.message || data.error || data);
        alert(data.message || data.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };


  if (loading) return <div className="text-center">Loading...</div>;

  return (
    <div className="d-flex vh-100">
      <div className="p-3 border-end" style={{ width: 300 }}>
        <Button className="w-100 mb-3" onClick={addTopic}>
          + New Chat
        </Button>
        <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 100px)' }}>
          {topics
            .filter((topic) => (chatHistory[topic]?.length || 0) > 0)
            .map((topic, idx) => (
              <div
                key={idx}
                className={`topic-item p-3 mb-2 rounded ${
                  selectedTopic === topic
                    ? 'bg-primary text-white'
                    : 'bg-light'
                }`}
                onClick={() => selectTopic(topic)}
                style={{ cursor: 'pointer' }}
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
              <Dropdown.Item onClick={() => setShowModal(true)}>Edit Profile</Dropdown.Item>
              <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        <div className="flex-grow-1 p-3 overflow-auto">
          {(chat || []).map((msg, i) => (
            <div key={i} className="mb-3 text-start">
              <div className={`d-inline-block p-3 rounded ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-light'}`}>
                {msg.message}
              </div>
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
            <Button onClick={handleSend} disabled={!currentMessage.trim()}>
              Send
            </Button>
          </InputGroup>
        </div>
      </div>

      {/* MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email (readonly)</Form.Label>
              <Form.Control type="email" value={profile.email} readOnly />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Leave blank to keep old password"
                value={profile.password}
                onChange={(e) => setProfile({ ...profile, password: e.target.value })}
              />
            </Form.Group>
          </Form>
          {successMessage && <p className="text-success">{successMessage}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleProfileUpdate}>
            Update
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ChatPage;
