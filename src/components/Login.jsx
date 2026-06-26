import React, { useState } from 'react';
import { Lock, User, Activity, Globe } from 'lucide-react';
import { api, isLiveMode, setLiveMode } from '../api';

export default function Login({ onLoginSuccess, addToast }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [isLive, setIsLive] = useState(isLiveMode());
  const [loading, setLoading] = useState(false);

  const handleToggleMode = () => {
    const nextMode = !isLive;
    setIsLive(nextMode);
    setLiveMode(nextMode);
    
    // Autofill credentials helper
    if (nextMode) {
      setUsername('');
      setPassword('');
      addToast('Switched to Live API Mode (Credentials: ton/ton12345)', 'success');
    } else {
      setUsername('admin');
      setPassword('admin');
      addToast('Switched to Local Mock Mode (Credentials: admin/admin)', 'success');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await api.login(username, password);
      addToast(`Welcome back, ${data.user.display_name || 'Admin'}!`, 'success');
      onLoginSuccess(data.user);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div className="auth-header">
          <div className="auth-logo">BLOCKMERGE</div>
          <div className="auth-subtitle">Backoffice Admin Portal</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <div 
              className={`api-mode-badge ${isLive ? 'live' : 'mock'}`}
              onClick={handleToggleMode}
              style={{ display: 'inline-flex', alignSelf: 'flex-start', margin: '0 auto 8px auto' }}
            >
              <Globe size={14} />
              <span>{isLive ? 'Live API: back.roldostudios.com' : 'Local Mock Database'}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="username">
              {isLive ? 'Admin Username' : 'Username'}
            </label>
            <div className="form-input-container">
              <input
                id="username"
                className="form-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isLive ? "ton" : "admin"}
                required
              />
              <User className="form-icon" />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="form-input-container">
              <input
                id="password"
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Lock className="form-icon" />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? (
              <span className="spinner">Authenticating...</span>
            ) : (
              <>
                <Activity size={18} />
                <span>Enter Dashboard</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Authorized staff access only. Activity is monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
