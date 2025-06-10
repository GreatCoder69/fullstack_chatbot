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
  const [showImageInput, setShowImageInput] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);
  const [profile, setProfile] = useState({
    email: '',
    name: '',
    phone: '',
    password: ''
  });
  const [successMessage, setSuccessMessage] = useState('');

  // FETCH user profile once on mount
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
        profileimg: data.profileimg || 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg',
        password: ''
      });
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const handleProfileUpdate = async () => {
    const formData = new FormData();
    formData.append('email', profile.email);
    formData.append('name', profile.name);
    formData.append('phone', profile.phone);
    if (profile.password) formData.append('password', profile.password);
    if (profile.profileimgFile) formData.append('profileimg', profile.profileimgFile);

    try {
      const res = await fetch('http://localhost:8080/api/auth/update', {
        method: 'PUT',
        headers: {
          'x-access-token': token
          // ❌ Do NOT set Content-Type manually here
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage('Profile updated successfully!');
        setProfile((prev) => ({
          ...prev,
          profileimg: data.profileimg || prev.profileimg
        }));
        setTimeout(() => {
          setSuccessMessage('');
          setShowModal(false);
        }, 2000);
      } else {
        alert(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const handleDeleteTopic = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/deletechat', {
        method: 'POST', // ✅ use PUT here
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify({ subject: topicToDelete }) // ✅ send subject
      });

      if (res.ok) {
        const updatedTopics = topics.filter((t) => t !== topicToDelete);
        setTopics(updatedTopics);
        setChatHistory((prev) => {
          const copy = { ...prev };
          delete copy[topicToDelete];
          return copy;
        });
        localStorage.setItem('topicsOrder', JSON.stringify(updatedTopics));
        if (selectedTopic === topicToDelete) {
          setSelectedTopic(null);
          setChat([]);
        }
        setShowConfirmDelete(false);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete chat.');
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
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
                <div className="d-flex justify-content-between align-items-center">
                  <div className="fw-bold">{topic}</div>
                  <span
                    className="text-black rounded-circle px-2"
                    style={{ cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTopicToDelete(topic);
                      setShowDeleteModal(true);
                    }}
                  >
                    ×
                  </span>
                </div>
                <small className={selectedTopic === topic ? 'text-light' : 'text-muted'}>
                  {chatHistory[topic]?.length || 0} messages
                </small>
              </div>
            ))}
        </div>
      </div>

      <div className="flex-grow-1 d-flex flex-column">
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <h5>{selectedTopic}</h5>
          <Dropdown align="end">
            <Dropdown.Toggle
              variant="outline-secondary"
              className="p-0 border-0 bg-transparent"
              style={{ boxShadow: 'none' }}
            >
              <img
                src={
                  profile.profileimgFile
                    ? URL.createObjectURL(profile.profileimgFile)
                    : profile.profileimg
                }
                alt="Profile"
                className="rounded-circle"
                style={{ width: '36px', height: '36px', objectFit: 'cover' }}
              />

            </Dropdown.Toggle>
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
          {/* Profile Image Display + Edit */}
          <div className="text-center mb-4">
            <img
              src={
                profile.profileimgFile
                  ? URL.createObjectURL(profile.profileimgFile)
                  : profile.profileimg
              }
              alt="Profile"
              className="rounded-circle"
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'cover',
                cursor: 'pointer',
                border: '3px solid #ccc'
              }}
              onClick={() => setShowImageInput(!showImageInput)}
            />

            {showImageInput && (
              <Form.Group className="mt-3">
                <Form.Label>Upload New Profile Image</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfile({ ...profile, profileimgFile: e.target.files[0] })}
                />
              </Form.Group>
            )}
          </div>

          {/* Basic Details Form */}
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

          {successMessage && <p className="text-success text-center">{successMessage}</p>}
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
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Chat</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the chat for "<strong>{topicToDelete}</strong>"?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteTopic}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default ChatPage;