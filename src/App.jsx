import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { api } from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Load user from token if present in session/localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('blockmerge_auth_token');
    if (savedToken) {
      // Create mock user structure for session restoration
      setUser({
        user_id: "admin_user",
        display_name: "Administrator",
        email: "admin@roldostudios.com",
        auth_provider: "credentials"
      });
    }
  }, []);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    addToast('Signed out successfully.', 'info');
  };

  return (
    <>
      {user ? (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          addToast={addToast} 
        />
      ) : (
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          addToast={addToast} 
        />
      )}

      {/* Toast notifications portal */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
            style={{ cursor: 'pointer' }}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}
