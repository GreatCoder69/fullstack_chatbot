import React, { useEffect, useState } from 'react';
import {
  Form, Button, Dropdown, Image, Alert, Card, Row, Col, Pagination
} from 'react-bootstrap';
import { FaBars } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import './adminstyle.css';

const ChatHistory = () => {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ username: '', subject: '', startDate: '', endDate: '', fileType: '' });
  const [showDateError, setShowDateError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const messagesPerPage = 5;
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const location = useLocation();

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filter = params.get('filter');

    if (filter === 'pdf' || filter === 'image' || filter === 'none' || filter === 'nofile') {
      const fileType = filter === 'nofile' ? 'none' : filter;
      setFilters(prev => ({ ...prev, fileType }));
    } else if (filter) {
      // Treat anything else as a subject
      setFilters(prev => ({ ...prev, subject: filter }));
    }
  }, [location.search]);

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      setShowDateError(end < start);
    } else {
      setShowDateError(false);
    }
  }, [filters.startDate, filters.endDate]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const applyFilters = (entry, user, chat) => {
    const timestamp = new Date(entry.timestamp);
    const start = filters.startDate ? new Date(filters.startDate) : null;
    const end = filters.endDate ? new Date(new Date(filters.endDate).setHours(23, 59, 59, 999)) : null;

    if (filters.username && !user.name.toLowerCase().includes(filters.username.toLowerCase())) return false;
    if (filters.subject && !chat.subject.toLowerCase().includes(filters.subject.toLowerCase())) return false;
    if (start && timestamp < start) return false;
    if (end && timestamp > end) return false;
    if (filters.fileType === 'image' && (!entry.imageUrl || entry.imageUrl.toLowerCase().endsWith('.pdf'))) return false;
    if (filters.fileType === 'pdf' && (!entry.imageUrl || !entry.imageUrl.toLowerCase().endsWith('.pdf'))) return false;
    if (filters.fileType === 'none' && entry.imageUrl) return false;

    return true;
  };

  const allEntries = users.flatMap(user =>
    user.chats.flatMap(chat =>
      chat.history.filter(entry => applyFilters(entry, user, chat)).map(entry => ({
        profileimg: user.profileimg,
        name: user.name,
        subject: chat.subject,
        ...entry
      }))
    )
  );

  const totalPages = Math.ceil(allEntries.length / messagesPerPage);
  const paginatedEntries = allEntries.slice((currentPage - 1) * messagesPerPage, currentPage * messagesPerPage);

  const renderPagination = () => (
    <Pagination className="justify-content-center mt-4">
      <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
      <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
      {[...Array(totalPages)].map((_, i) => (
        <Pagination.Item
          key={i}
          active={i + 1 === currentPage}
          onClick={() => setCurrentPage(i + 1)}
        >{i + 1}</Pagination.Item>
      ))}
      <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
      <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
    </Pagination>
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

        <div className="px-4 mt-4 d-flex gap-3 flex-wrap align-items-center">
          <Form.Control
            placeholder="Search by user name"
            value={filters.username}
            onChange={e => setFilters(prev => ({ ...prev, username: e.target.value }))}
            style={{ maxWidth: 200 }}
          />
          <Form.Control
            placeholder="Search by subject"
            value={filters.subject}
            onChange={e => setFilters(prev => ({ ...prev, subject: e.target.value }))}
            style={{ maxWidth: 200 }}
          />
          <Form.Control
            type="date"
            value={filters.startDate}
            onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
          />
          <Form.Control
            type="date"
            value={filters.endDate}
            min={filters.startDate || ''}
            onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
          />
          <Form.Select
            value={filters.fileType}
            onChange={e => setFilters(prev => ({ ...prev, fileType: e.target.value }))}
            style={{ maxWidth: 150 }}
          >
            <option value="">File Type</option>
            <option value="image">Image</option>
            <option value="pdf">PDF</option>
            <option value="none">No File</option>
          </Form.Select>
        </div>

        {showDateError && (
          <Alert variant="danger" className="mt-3 mx-4">
            ❌ End date cannot be earlier than start date.
          </Alert>
        )}

        <div className="mt-4 px-4">
          {paginatedEntries.map((entry, idx) => (
            <Card className="mb-4 w-100 shadow-sm" key={idx}>
              <Card.Body>
                <div className="d-flex align-items-center mb-2">
                  <Image src={entry.profileimg} roundedCircle width={45} height={45} className="me-3" />
                  <div>
                    <strong>{entry.name}</strong><br />
                    <small className="text-muted">{new Date(entry.timestamp).toLocaleString()}</small>
                  </div>
                </div>
                <h6><strong>Subject:</strong> {entry.subject}</h6>
                {entry.question && <p><strong>Q:</strong> {entry.question}</p>}
                <p><strong>A:</strong> {entry.answer}</p>
                {entry.imageUrl && (
                <>
                  {entry.imageUrl.toLowerCase().endsWith('.pdf') ? (
                    <>
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: 20 }}>📄</span>
                        <a
                          href={`http://localhost:8080${entry.imageUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {entry.imageUrl.split('/').pop()}
                        </a>
                      </div>

                      {/* ✅ Download DOCX button for PDF only */}
                      <div className="mt-2 d-flex flex-column gap-1">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() =>
                            window.open(`http://localhost:8080/api/download-docx/${entry._id}`, "_blank")
                          }
                        >
                          Download AI Response (DOCX)
                        </button>
                        {entry.downloadCount > 0 && (
                          <small className="text-muted">
                            Downloaded {entry.downloadCount} time{entry.downloadCount > 1 ? "s" : ""}
                          </small>
                        )}
                      </div>
                    </>
                  ) : (
                    <img
                      src={`http://localhost:8080${entry.imageUrl}`}
                      alt="chat"
                      style={{ height: '200px', objectFit: 'cover', borderRadius: 8 }}
                    />
                  )}
                </>
              )}
              </Card.Body>
            </Card>
          ))}
        </div>

        {renderPagination()}
      </main>
    </div>
  );
};

export default ChatHistory;
