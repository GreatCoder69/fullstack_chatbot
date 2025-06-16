import React, { useEffect, useState } from 'react';
import {
  Row, Col, Card, Table, Image, Button, Modal, Form, Dropdown
} from 'react-bootstrap';
import {
  FaBars
} from 'react-icons/fa';
import {
  BsGraphUp, BsBookmark, BsGem, BsPeople
} from 'react-icons/bs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useNavigate } from "react-router-dom";

const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const getMonth = (dateStr) => {
  const monthIndex = new Date(dateStr).getMonth();
  return months[monthIndex] || "";
};

const AdminDashboard = () => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '', name: '', phone: '', password: '', profileimg: null
  });
  const [message, setMessage] = useState('');

  const [totalUsers, setTotalUsers] = useState(0);
  const [noFileChats, setNoFileChats] = useState(0);
  const [imageChats, setImageChats] = useState(0);
  const [pdfChats, setPdfChats] = useState(0);
  const [chartData, setChartData] = useState([]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    fetch('http://localhost:8080/api/admin/summary', {
      headers: { 'x-access-token': token }
    })
      .then(res => res.json())
      .then(summary => {
        setTotalUsers(summary.totalUsers || 0);
        setNoFileChats(summary.chatsWithoutFiles || 0);
        setImageChats(summary.chatsWithImages || 0);
        setPdfChats(summary.chatsWithPDFs || 0);
      })
      .catch(console.error);

    fetch('http://localhost:8080/api/admin/users-chats', {
      headers: { 'x-access-token': token }
    })
      .then(res => res.json())
      .then(data => {
        const monthMap = {};

        data.forEach(user => {
          user.chats.forEach(chat => {
            chat.history.forEach(message => {
              const date = new Date(message.timestamp);
              if (isNaN(date)) return;
              const month = getMonth(date);

              if (!monthMap[month]) {
                monthMap[month] = { month, noFile: 0, withImage: 0, withPDF: 0 };
              }

              const imageUrl = message.imageUrl;

              if (!imageUrl) {
                monthMap[month].noFile += 1;
              } else if (imageUrl.match(/\.(jpg|jpeg|png)$/i)) {
                monthMap[month].withImage += 1;
              } else if (imageUrl.match(/\.pdf$/i)) {
                monthMap[month].withPDF += 1;
              } else {
                monthMap[month].noFile += 1;
              }
            });
          });
        });

        const finalData = months.map(month => monthMap[month] || {
          month,
          noFile: 0,
          withImage: 0,
          withPDF: 0
        });

        setChartData(finalData);
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

  const StatCard = ({ title, value, subtitle, icon: Icon, bg }) => (
    <Card className="text-white mb-4" style={{ background: `linear-gradient(to right, ${bg[0]}, ${bg[1]})`, border: 'none' }}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="mb-2" style={{ fontSize: "1rem" }}>{title}</div>
            <h3 style={{ fontWeight: 600 }}>{value.toLocaleString()}</h3>
            <div style={{ fontSize: "0.9rem" }}>{subtitle}</div>
          </div>
          <div style={{ fontSize: "1.8rem" }}><Icon /></div>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className={`admin-panel ${sidebarOpen ? 'sidebar-open' : ''}`} style={{ display: 'flex' }}>
      {/* Sidebar */}
      <aside className={`sidebar bg-light ${sidebarOpen ? 'open' : ''}`} style={{ minWidth: '200px', height: '100vh' }}>
        <div className="p-3 border-bottom"><h4 className="text-primary"> </h4></div>
        <ul className="list-unstyled p-3">
          <li className="mb-2" onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>Dashboard</li>
          <li className="mb-2" onClick={() => navigate('/history')} style={{ cursor: 'pointer' }}>Chat History</li>
          <li className="mb-2" onClick={() => navigate('/logs')} style={{ cursor: 'pointer' }}>User Logs</li>
          <li className="mb-2" onClick={() => navigate('/edit-profile')} style={{ cursor: 'pointer' }}>Edit Profile</li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="main-content flex-grow-1">
        <header
          className="d-flex justify-content-between align-items-center p-3 border-bottom bg-white"
          style={{ position: 'sticky', top: 0, zIndex: 1000, marginTop: '-100px' }}
        >
          <Button variant="light" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FaBars />
          </Button>
          <Dropdown>
            <Dropdown.Toggle variant="light">
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

        <div className="p-4">
          <h4 className="mb-4 mt-20"><div style={{ marginTop: '60px' }}>Welcome to Admin Dashboard</div></h4>

          <Row>
            <Col md={3}><StatCard title="Total Users" value={totalUsers} subtitle="Unique users with chats" icon={BsPeople} bg={["#f093fb", "#f5576c"]} /></Col>
            <Col md={3}><StatCard title="Chats without Files" value={noFileChats} subtitle="Messages with no attachments" icon={BsBookmark} bg={["#5ee7df", "#b490ca"]} /></Col>
            <Col md={3}><StatCard title="Chats with Images" value={imageChats} subtitle=".jpg and .png attachments" icon={BsGraphUp} bg={["#43e97b", "#38f9d7"]} /></Col>
            <Col md={3}><StatCard title="Chats with PDFs" value={pdfChats} subtitle=".pdf document messages" icon={BsGem} bg={["#30cfd0", "#330867"]} /></Col>
          </Row>

          <h5 className="mt-5 mb-3">Monthly Chat Insights</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barSize={10} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="noFile" fill="#a64bf4" name="No File" />
              <Bar dataKey="withImage" fill="#ff7aa8" name="Image" />
              <Bar dataKey="withPDF" fill="#4caefc" name="PDF" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </main>

      {/* Edit User Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Body className="p-5">
          <div className="text-center mb-4">
            <img src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png" width={50} height={50} alt="avatar" />
            <h5>Edit User</h5>
          </div>
          <Form onSubmit={handleFormSubmit}>
            <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control name="name" value={formData.name} onChange={handleInputChange} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Phone</Form.Label><Form.Control name="phone" value={formData.phone} onChange={handleInputChange} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Password</Form.Label><Form.Control type="password" name="password" value={formData.password} onChange={handleInputChange} /></Form.Group>
            <Form.Group className="mb-4"><Form.Label>Profile Image</Form.Label><Form.Control type="file" name="profileimg" onChange={handleInputChange} /></Form.Group>
            <div className="d-grid gap-2">
              <Button type="submit" className="btn-purple">Save Changes</Button>
              <Button variant="light" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
