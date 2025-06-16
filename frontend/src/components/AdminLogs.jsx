import React, { useEffect, useState } from 'react';
import {
  Accordion, Card, ListGroup, Image, Button, Dropdown
} from 'react-bootstrap';
import { FaBars } from 'react-icons/fa';
import './adminstyle.css';
import { useNavigate } from 'react-router-dom';

const AdminLogsPanel = () => {
  const [users, setUsers] = useState([]);
  const [logsMap, setLogsMap] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8080/api/admin/users-chats', {
      headers: { 'x-access-token': token }
    })
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        data.forEach(user => fetchLogsForUser(user.email));
      })
      .catch(console.error);
  }, [token]);

  const fetchLogsForUser = (email) => {
    fetch(`http://localhost:8080/api/admin/user-logs?email=${email}`, {
      headers: { 'x-access-token': token }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLogsMap(prev => ({ ...prev, [email]: data.logs }));
        }
      })
      .catch(console.error);
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
                  {(logsMap[user.email] || []).length === 0 ? (
                    <p className="text-muted">No logs found.</p>
                  ) : (
                    <Card className="mb-3">
                      <ListGroup variant="flush">
                        {logsMap[user.email].map((log, i) => (
                          <ListGroup.Item key={i} className="py-3">
                            <p><strong>Action:</strong> {log.action}</p>
                            {log.message && <p><strong>Message:</strong> {log.message}</p>}
                            <p><strong>Time:</strong> {new Date(log.timestamp).toLocaleString()}</p>
                            {log.meta && Object.keys(log.meta).length > 0 && (
                              <pre className="bg-light p-2 rounded border"><code>{JSON.stringify(log.meta, null, 2)}</code></pre>
                            )}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </Card>
                  )}
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      </main>
    </div>
  );
};

export default AdminLogsPanel;
