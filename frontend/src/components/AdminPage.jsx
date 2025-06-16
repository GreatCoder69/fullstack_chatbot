import React, { useEffect, useState } from 'react';
import {
  Form, Button, Dropdown, Image, Alert, Card, Pagination, Row, Col
} from 'react-bootstrap';
import { FaBars } from 'react-icons/fa';
import { BsPeople, BsBookmark, BsGraphUp, BsGem } from 'react-icons/bs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import './adminstyle.css';

const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const getMonth = (dateStr) => {
  const monthIndex = new Date(dateStr).getMonth();
  return months[monthIndex] || "";
};

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8080/api/admin/users-chats', {
      headers: { 'x-access-token': token }
    })
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter(user => user.chats?.length > 0);
        setUsers(filtered);

        const monthMap = {};
        filtered.forEach(user => {
          user.chats.forEach(chat => {
            chat.history.forEach(entry => {
              const date = new Date(entry.timestamp);
              if (isNaN(date)) return;
              const month = getMonth(date);
              if (!monthMap[month]) monthMap[month] = { month, noFile: 0, withImage: 0, withPDF: 0 };

              if (!entry.imageUrl) {
                monthMap[month].noFile += 1;
              } else if (entry.imageUrl.match(/\.(jpg|jpeg|png)$/i)) {
                monthMap[month].withImage += 1;
              } else if (entry.imageUrl.match(/\.pdf$/i)) {
                monthMap[month].withPDF += 1;
              } else {
                monthMap[month].noFile += 1;
              }
            });
          });
        });

        const finalData = months.map(month => monthMap[month] || { month, noFile: 0, withImage: 0, withPDF: 0 });
        setChartData(finalData);
      })
      .catch(console.error);
  }, [token]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const allEntries = users.flatMap(user =>
    user.chats.flatMap(chat =>
      chat.history.map(entry => ({
        profileimg: user.profileimg,
        name: user.name,
        subject: chat.subject,
        ...entry
      }))
    )
  );

  const noFileChats = allEntries.filter(e => !e.imageUrl).length;
  const imageChats = allEntries.filter(e => e.imageUrl && !e.imageUrl.endsWith('.pdf')).length;
  const pdfChats = allEntries.filter(e => e.imageUrl && e.imageUrl.endsWith('.pdf')).length;
  const totalUsers = users.length;

  const StatCard = ({ title, value, subtitle, icon: Icon, bg, filter }) => (
    <Card
      className="text-white mb-4"
      style={{ background: `linear-gradient(to right, ${bg[0]}, ${bg[1]})`, border: 'none', cursor: 'pointer' }}
      onClick={() => navigate(`/history${filter ? `?filter=${filter}` : ''}`)}
    >
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
    <div className={`admin-panel ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h4 className="purple-logo">💜 Purple</h4>
        </div>
        <ul className="sidebar-nav">
          <li onClick={() => navigate('/admin')}>Dashboard</li>
          <li onClick={() => navigate('/history')}>Chat History</li>
          <li onClick={() => navigate('/logs')}>User Logs</li>
          <li onClick={() => navigate('/edit-profile')}>Edit Profile</li>
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
                roundedCircle width={40} height={40}
              />
              <span className="ms-2">admin</span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleSignOut}>Sign Out</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </header>

        <div className="mt-4 px-4">
          <Row>
            <Col md={3}><StatCard title="Total Users" value={totalUsers} subtitle="Unique users with chats" icon={BsPeople} bg={["#f093fb", "#f5576c"]} /></Col>
            <Col md={3}><StatCard title="Chats without Files" value={noFileChats} subtitle="Messages with no attachments" icon={BsBookmark} bg={["#5ee7df", "#b490ca"]} filter="nofile" /></Col>
            <Col md={3}><StatCard title="Chats with Images" value={imageChats} subtitle=".jpg and .png attachments" icon={BsGraphUp} bg={["#43e97b", "#38f9d7"]} filter="image" /></Col>
            <Col md={3}><StatCard title="Chats with PDFs" value={pdfChats} subtitle=".pdf document messages" icon={BsGem} bg={["#30cfd0", "#330867"]} filter="pdf" /></Col>
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
    </div>
  );
};

export default AdminPanel;
