import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ChatPage from './components/ChatPage';
import AdminPage from './components/AdminPage';
import ChatHistory from './components/ChatHistory';
import AdminLogs from './components/AdminLogs';
import EditProfile from './components/EditProfile'
const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/chat" element={<ChatPage />} />
    <Route path="/admin" element={<AdminPage />} />
    <Route path="/logs" element={<AdminLogs />} />
    <Route path="/history" element={<ChatHistory />} />
    <Route path="/edit-profile" element={<EditProfile />} />
  </Routes>
);

export default App;
