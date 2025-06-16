import React, { useEffect, useState } from 'react';
import { Container, Form, Button, Alert, Image } from 'react-bootstrap';
import { useParams } from 'react-router-dom';

const EditUser = () => {
  const { email } = useParams();
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    email: '', name: '', phone: '', password: '', profileimg: null, profileimgURL: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`http://localhost:8080/api/admin/user?email=${email}`, {
      headers: { 'x-access-token': token }
    })
      .then(res => res.json())
      .then(data => {
        setFormData({
          email: data.email,
          name: data.name || '',
          phone: data.phone || '',
          password: data.password || '',
          profileimg: null,
          profileimgURL: data.profileimg || '/default-profile.png'
        });
      });
  }, [email, token]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profileimg') {
      setFormData(prev => ({
        ...prev,
        profileimg: files[0],
        profileimgURL: URL.createObjectURL(files[0])
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (key !== 'profileimgURL' && val) form.append(key, val);
    });

    const res = await fetch('http://localhost:8080/api/admin/user', {
      method: 'PUT',
      headers: { 'x-access-token': token },
      body: form
    });

    if (res.ok) {
      if (window.opener) {
        window.opener.location.reload();
        window.close();
      } else {
        setMessage('Updated! Please close manually.');
      }
    } else {
      const result = await res.json();
      setMessage(result.message || 'Update failed.');
    }
  };

  return (
    <div style={{ backgroundColor: '#f6f0fa', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: 'white', borderRadius: '12px', padding: '40px',
        width: '100%', maxWidth: '400px', boxShadow: '0 0 10px rgba(0,0,0,0.1)'
      }}>
        <div className="text-center mb-4">
          <Image
            src={formData.profileimgURL || '/default-profile.png'}
            roundedCircle
            width="100"
            height="100"
            style={{ objectFit: 'cover', border: '3px solid #8e44ec' }}
            alt="profile"
          />
          <h4 className="mt-3">Edit Profile</h4>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Make changes and hit update</p>
        </div>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter name" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Phone</Form.Label>
            <Form.Control name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Enter phone" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Enter password" />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>Profile Image</Form.Label>
            <Form.Control type="file" name="profileimg" onChange={handleInputChange} />
          </Form.Group>

          {message && <Alert variant="info">{message}</Alert>}

          <div className="d-grid mb-2">
            <Button type="submit" variant="primary" style={{ backgroundColor: '#9b59b6', border: 'none' }}>
              Update
            </Button>
          </div>
          <div className="d-grid mb-2text-center">
            <Button type="submit" onClick={() => window.close()} style={{ backgroundColor: '#FFFFFFF', border: 'purple'}}>Cancel</Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default EditUser;
