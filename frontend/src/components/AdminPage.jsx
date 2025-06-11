import React, { useEffect, useState } from 'react';
import { Card, Accordion, ListGroup, Image, Button } from 'react-bootstrap';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
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
                {/* prevent button click from toggling accordion */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                >
                  <Button
                    onClick={() => toggleStatus(user.email, user.isActive)}
                    variant={user.isActive ? 'success' : 'danger'}
                  >
                    {user.isActive ? 'Active' : 'Blocked'}
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
                          <img
                            src={`http://localhost:8080${entry.imageUrl}`}
                            alt="chat"
                            style={{ maxWidth: 200, borderRadius: 8 }}
                          />
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
  );
};

export default AdminPanel;
