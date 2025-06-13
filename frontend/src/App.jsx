import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ChatPage from './components/ChatPage';
import AdminPage from './components/AdminPage';
import ChatHistory from './components/ChatHistory';
const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/chat" element={<ChatPage />} />
    <Route path="/admin" element={<AdminPage />} />
    <Route path="/history" element={<ChatHistory />} />
  </Routes>
);

export default App;
