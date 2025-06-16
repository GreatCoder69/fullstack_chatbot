import React, { useEffect, useState } from 'react';
import {
  Table, Image, Button, Modal, Form, Dropdown
} from 'react-bootstrap';
import {
  FaBars, FaHome, FaTable, FaUser, FaCog, FaSignOutAlt
} from 'react-icons/fa';
import './adminstyle.css'; // You'll define styles here
import { useNavigate } from "react-router-dom";


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

  const handleSignOut = () => {
    // Optionally clear tokens, etc.
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }
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
      password: data.password || '',
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

    if (res.ok) {
      setMessage('✅ Profile updated!');
      setTimeout(() => setShowModal(false), 1500);
    } else {
      const result = await res.json();
      setMessage(`❌ ${result.message || 'Update failed'}`);
    }
  };

  return (
    <div className={`admin-panel ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h4 className="purple-logo">LOGO</h4>
        </div>
        <ul className="sidebar-nav">
          <li onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>Dashboard</li>
          <li onClick={() => navigate('/history')} style={{ cursor: 'pointer' }}>Chat History</li>
          <li onClick={() => navigate('/logs')} style={{ cursor: 'pointer' }}>User Logs</li>
          <li onClick={() => navigate('/edit-profile')} style={{ cursor: 'pointer' }}>Edit Profile</li>
        </ul>
      </aside>

      {/* Main Content */}
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
              <Dropdown.Item onClick={handleSignOut}>
                Sign Out
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </header>
        <div className="d-flex justify-content-center pt-4" style={{ width: '100%' }}>
          <div className="table-container" style={{ padding: 0, width: '90%', marginTop:'5%'}}>
            <Table className="user-table text-center">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={user.email} className={idx % 2 === 0 ? 'even' : 'odd'}>
                    <td onClick={() => openEditModal(user.email)} style={{ cursor: 'pointer' }}>
                      <Image src={user.profileimg} roundedCircle width={40} height={40} />
                    </td>
                    <td onClick={() => openEditModal(user.email)}>{user.name}</td>
                    <td onClick={() => openEditModal(user.email)}>{user.email}</td>
                    <td>
                      <Button
                        size="sm"
                        style={{
                          backgroundColor: user.isActive ? 'green' : '#dc3545',
                          border: 'none'
                        }}
                        onClick={() => toggleStatus(user.email, user.isActive)}
                      >
                        {user.isActive ? 'Active' : 'Blocked'}
                      </Button>
                    </td>
                    <td>
                      <Button
                        variant="outline-dark"
                        size="sm"
                        onClick={() => openEditModal(user.email)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      </main>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Body className="p-5">
          <div className="text-center mb-4">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
              width={50}
              height={50}
              alt="avatar"
            />
            <h5>Edit User</h5>
          </div>
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
              <Form.Control type="password" name="password" value={formData.password} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Profile Image</Form.Label>
              <Form.Control type="file" name="profileimg" onChange={handleInputChange} />
            </Form.Group>
            <div className="d-grid gap-2">
              <Button
                type="submit"
                className="btn-purple"
              >
                Save Changes
              </Button>
              <Button
                variant="light"
                className="btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};


export default AdminPanel;
