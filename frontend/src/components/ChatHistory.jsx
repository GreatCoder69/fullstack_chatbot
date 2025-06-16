import React, { useEffect, useState } from 'react';
import {
  Table, Image, Button, Modal, Form, Dropdown, Accordion, Card, ListGroup, Alert
} from 'react-bootstrap';
import {
  FaBars, FaHome, FaTable, FaUser, FaCog
} from 'react-icons/fa';
import './adminstyle.css';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    email: '', name: '', phone: '', password: '', profileimg: null
  });
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8080/api/admin/users-chats', {
      headers: { 'x-access-token': token }
    })
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter(user => user.chats?.length > 0);
        setUsers(filtered);
      })
      .catch(console.error);
  }, [token]);

  const toggleStatus = (email, currentStatus) => {
    fetch('http://localhost:8080/api/admin/toggle-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token
      },
      body: JSON.stringify({ email, isActive: !currentStatus })
    }).then(res => {
      if (res.ok) {
        setUsers(prev =>
          prev.map(user =>
            user.email === email ? { ...user, isActive: !currentStatus } : user
          )
        );
      }
    });
  };

  const openEditModal = async (email) => {
    const res = await fetch(`http://localhost:8080/api/admin/user?email=${email}`, {
      headers: { 'x-access-token': token }
    });
    const data = await res.json();
    setFormData({
      email: data.email,
      name: data.name || '',
      phone: data.phone || '',
      password: '',
      profileimg: null
    });
    setSelectedUser(email);
    setShowModal(true);
    setMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profileimg') {
      setFormData(prev => ({ ...prev, profileimg: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (val) form.append(key, val);
    });

    const res = await fetch('http://localhost:8080/api/admin/user', {
      method: 'PUT',
      headers: { 'x-access-token': token },
      body: form
    });

    const result = await res.json();
    if (res.ok) {
      setMessage('✅ Profile updated!');
      setTimeout(() => setShowModal(false), 1500);
    } else {
      setMessage(`❌ ${result.message || 'Update failed'}`);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className={`admin-panel ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h4 className="purple-logo">💜 Purple</h4>
        </div>
        <ul className="sidebar-nav">
          <li onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>Dashboard</li>
          <li onClick={() => navigate('/history')} style={{ cursor: 'pointer' }}>Chat History</li>
          <li onClick={() => navigate('/logs')} style={{ cursor: 'pointer' }}>User Logs</li>
          <li onClick={() => navigate('/edit-profile')} style={{ cursor: 'pointer' }}>Edit Profile</li>
        </ul>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <Button variant="light" className="burger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FaBars />
          </Button>

          <Dropdown className="admin-dropdown ms-auto">
            <Dropdown.Toggle variant="light" className="admin-toggle">
              <Image
                src="https://www.shutterstock.com/editorial/image-editorial/M2T3Qc10N2zaIawbNzA0Nzg=/cole-palmer-chelsea-celebrates-scoring-his-fourth-440nw-14434919bx.jpg"
                roundedCircle
                width={40}
                height={40}
              />
              <span className="ms-2">admin</span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleSignOut}>Sign Out</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </header>

        <div className="table-container px-4 mt-5">
          <Accordion alwaysOpen>
            {users.map((user, idx) => (
              <Accordion.Item key={idx} eventKey={idx.toString()}>
                <Accordion.Header>
                  <Image
                    src={user.profileimg}
                    roundedCircle
                    width={40}
                    height={40}
                    className="me-3"
                  />
                  <span className="fw-bold">{user.name}</span>
                </Accordion.Header>
                <Accordion.Body>
                  {user.chats.map((chat, i) => (
                    <Card className="mb-3" key={i}>
                      <Card.Header><strong>Subject:</strong> {chat.subject}</Card.Header>
                      <ListGroup variant="flush">
                        {chat.history.map((entry, j) => (
                          <ListGroup.Item key={j}>
                            {entry.question && <p><strong>Q:</strong> {entry.question}</p>}
                            <p><strong>A:</strong> {entry.answer}</p>
                            {entry.imageUrl && (
                              entry.imageUrl.toLowerCase().endsWith('.pdf') ? (
                                <div className="d-flex align-items-center gap-2">
                                  <span style={{ fontSize: 24 }}>📄</span>
                                  <a
                                    href={`http://localhost:8080${entry.imageUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontWeight: 'bold' }}
                                  >
                                    {entry.imageUrl.split('/').pop()}
                                  </a>
                                </div>
                              ) : (
                                <img
                                  src={`http://localhost:8080${entry.imageUrl}`}
                                  alt="chat"
                                  style={{ maxWidth: 200, borderRadius: 8 }}
                                />
                              )
                            )}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </Card>
                  ))}
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      </main>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Body className="p-4">
          <h5 className="text-center mb-3">Edit User</h5>
          {message && <Alert variant="info">{message}</Alert>}
          <Form onSubmit={handleFormSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control name="name" value={formData.name} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control name="phone" value={formData.phone} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control name="password" type="password" value={formData.password} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Profile Image</Form.Label>
              <Form.Control name="profileimg" type="file" onChange={handleInputChange} />
            </Form.Group>
            <div className="d-grid gap-2">
              <Button type="submit" className="btn-purple">Save Changes</Button>
              <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AdminPanel;
