import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BookingApp from './pages/BookingApp';
import AdminPanel from './pages/AdminPanel';
import { AdminAuthProvider } from './contexts/AdminAuthContext';

function App() {
  return (
    <Router>
      <AdminAuthProvider>
        <Routes>
          <Route path="/" element={<BookingApp />} />
          <Route path="/admin/*" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminAuthProvider>
    </Router>
  );
}

export default App;