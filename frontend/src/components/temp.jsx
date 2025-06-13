import React, { useEffect, useState } from 'react';
import {
  Card, Accordion, ListGroup, Image, Button, Modal, Form, Alert
} from 'react-bootstrap';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    password: '',
    profileimg: null
  });
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch('http://localhost:8080/api/admin/users-chats', {
      headers: { 'x-access-token': token }
    })
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter(user => user.chats && user.chats.length > 0);
        setUsers(filtered);
      })
      .catch(console.error);
  }, [token]);

  const toggleStatus = (email, currentStatus) => {
    const newStatus = !currentStatus;

    fetch('http://localhost:8080/api/admin/toggle-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token
      },
      body: JSON.stringify({ email, isActive: newStatus })
    })
      .then(res => {
        if (res.ok) {
          setUsers(prev =>
            prev.map(user =>
              user.email === email ? { ...user, isActive: newStatus } : user
            )
          );
        } else {
          console.error('Failed to toggle user status');
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
    form.append('email', formData.email);
    form.append('name', formData.name);
    form.append('phone', formData.phone);
    if (formData.password) form.append('password', formData.password);
    if (formData.profileimg) form.append('profileimg', formData.profileimg);

    const res = await fetch('http://localhost:8080/api/admin/user', {
      method: 'PUT',
      headers: {
        'x-access-token': token
      },
      body: form
    });

    const result = await res.json();
    if (res.ok) {
      setMessage('✅ Profile updated successfully!');
      setTimeout(() => {
        setShowModal(false);
        setMessage('');
      }, 1500);
    } else {
      setMessage(`❌ Error: ${result.message || 'Update failed'}`);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Admin – User Activity Logs</h2>

      <Accordion alwaysOpen>
        {users.map((user, idx) => (
          <Accordion.Item key={idx} eventKey={idx.toString()}>
            <Accordion.Header>
              <div className="d-flex align-items-center w-100">
                <Image
                  src={user.profileimg}
                  roundedCircle
                  width={40}
                  height={40}
                  alt="profile"
                  className="me-3"
                  style={{ objectFit: "cover", border: "1px solid #ccc" }}
                />
                <div className="me-auto">
                  <div className="fw-bold">{user.name}</div>
                  <small className="text-muted">{user.email}</small>
                </div>
                <div
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  className="d-flex gap-2"
                >
                  <Button
                    onClick={() => toggleStatus(user.email, user.isActive)}
                    variant={user.isActive ? 'success' : 'danger'}
                  >
                    {user.isActive ? 'Active' : 'Blocked'}
                  </Button>
                  <Button
                    variant="warning"
                    onClick={() => openEditModal(user.email)}
                  >
                    Edit Profile
                  </Button>
                </div>
              </div>
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

      {/* Edit Profile Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User Profile</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleFormSubmit} encType="multipart/form-data">
          <Modal.Body>
            {message && <Alert variant="info">{message}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control name="name" value={formData.name} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control name="phone" value={formData.phone} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password (leave blank to keep unchanged)</Form.Label>
              <Form.Control name="password" type="password" value={formData.password} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Profile Image</Form.Label>
              <Form.Control name="profileimg" type="file" onChange={handleInputChange} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit" variant="primary">Update</Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPanel;
