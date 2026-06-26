import React, { useState, useEffect } from 'react';
import { Search, ToggleLeft, ToggleRight, Edit2, Plus, UserPlus, Coins, Gem, Trash2, CheckCircle, Clock } from 'lucide-react';
import { api } from '../api';

export default function Backoffice({ addToast, isLive }) {
  const [users, setUsers] = useState([]);
  const [operations, setOperations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Edit form state
  const [editCoins, setEditCoins] = useState(0);
  const [editGems, setEditGems] = useState(0);

  // Create form state
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newProvider, setNewProvider] = useState('google');
  const [newCoins, setNewCoins] = useState(1000);
  const [newGems, setNewGems] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const uData = await api.getUsers(search);
      setUsers(uData.users);
      
      const opData = await api.getOperations();
      setOperations(opData);
    } catch (err) {
      addToast(err.message || 'Failed to fetch backoffice data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [search, isLive]);

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.updateUserStatus(userId, !currentStatus);
      addToast(`User account status updated successfully.`, 'success');
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to toggle user status', 'error');
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditCoins(user.progression.coins);
    setEditGems(user.progression.gems);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.updateUserProgression(selectedUser.user_id, editCoins, editGems);
      addToast('User progression balance updated.', 'success');
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to update balance', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser({
        email: newEmail,
        display_name: newDisplayName,
        auth_provider: newProvider,
        auth_methods: [newProvider],
        coins: newCoins,
        gems: newGems
      });
      addToast('Successfully created new user account.', 'success');
      setIsCreateModalOpen(false);
      // Reset form
      setNewEmail('');
      setNewDisplayName('');
      setNewCoins(1000);
      setNewGems(10);
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to create user', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This will remove all level progression records.')) {
      try {
        await api.deleteUser(userId);
        addToast('User deleted successfully.', 'success');
        fetchData();
      } catch (err) {
        addToast(err.message || 'Failed to delete user', 'error');
      }
    }
  };

  return (
    <div>
      {/* Search & Actions Bar */}
      <div className="table-header-row">
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="table-search"
            placeholder="Search users by email or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
        </div>

        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)} style={{ width: 'auto' }}>
          <UserPlus size={16} />
          <span>Provision User</span>
        </button>
      </div>

      {/* Main Grid: User table on the left, operation log on the right */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* User Management Table */}
        <div className="table-card" style={{ minHeight: '400px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>User Directory</h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Display Name</th>
                  <th>Source</th>
                  <th>Coins</th>
                  <th>Gems</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
                      No active users matching criteria found.
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.user_id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.display_name || 'Guest User'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email || u.user_id}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', textTransform: 'capitalize' }}>
                          {u.auth_provider}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Coins size={12} style={{ color: 'var(--warning)' }} />
                          {u.progression?.coins || 0}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Gem size={12} style={{ color: 'var(--accent)' }} />
                          {u.progression?.gems || 0}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.is_active ? 'badge-active' : 'badge-inactive'}`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 8px', borderRadius: '6px' }}
                            onClick={() => handleToggleStatus(u.user_id, u.is_active)}
                            title={u.is_active ? 'Suspend Account' : 'Activate Account'}
                          >
                            {u.is_active ? <ToggleRight size={18} style={{ color: 'var(--success)' }} /> : <ToggleLeft size={18} style={{ color: 'var(--text-muted)' }} />}
                          </button>
                          
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 8px', borderRadius: '6px' }}
                            onClick={() => handleOpenEdit(u)}
                            title="Edit progression / Balances"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 8px', borderRadius: '6px', hover: { background: 'var(--danger-glow)' } }}
                            onClick={() => handleDeleteUser(u.user_id)}
                            title="Remove User"
                          >
                            <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Operations Logs */}
        <div className="table-card">
          <h3 style={{ marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} style={{ color: 'var(--primary)' }} />
            <span>Audit / Operation Logs</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '460px', overflowY: 'auto', paddingRight: '4px' }}>
            {operations.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '16px', textAlign: 'center' }}>
                No operations logged yet.
              </p>
            ) : (
              operations.map(op => (
                <div 
                  key={op.id} 
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {op.transaction_type}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(op.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    User: <code style={{ color: 'var(--accent)' }}>{op.user_id}</code> | Item: {op.item_id || 'system_mod'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                      color: op.amount >= 0 ? 'var(--success)' : 'var(--danger)',
                      fontWeight: 600
                    }}>
                      {op.amount >= 0 ? '+' : ''}{op.amount} {op.currency_type}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      (Balance After: {op.balance_after})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* EDIT BALANCES MODAL */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '18px' }}>Adjust Progression balances</h3>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSaveEdit}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                Editing progression for user ID: <code style={{ color: 'var(--accent)' }}>{selectedUser?.user_id}</code>
              </div>

              <div className="form-group">
                <label className="form-label">Coins Balance</label>
                <div className="form-input-container">
                  <input
                    type="number"
                    className="form-input"
                    value={editCoins}
                    onChange={(e) => setEditCoins(e.target.value)}
                    style={{ paddingLeft: '16px' }}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label className="form-label">Gems Balance</label>
                <div className="form-input-container">
                  <input
                    type="number"
                    className="form-input"
                    value={editGems}
                    onChange={(e) => setEditGems(e.target.value)}
                    style={{ paddingLeft: '16px' }}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                  Save Adjustments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '18px' }}>Provision New User</h3>
              <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="form-input-container">
                  <input
                    type="email"
                    className="form-input"
                    placeholder="player@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{ paddingLeft: '16px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Display Name</label>
                <div className="form-input-container">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="New Competitor"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    style={{ paddingLeft: '16px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Identity Provider</label>
                <select 
                  className="form-input" 
                  value={newProvider} 
                  onChange={(e) => setNewProvider(e.target.value)}
                  style={{ paddingLeft: '16px', background: '#1e293b' }}
                >
                  <option value="google">Google oauth</option>
                  <option value="apple">Apple Sign-In</option>
                  <option value="guest">Guest device bind</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Starting Coins</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newCoins}
                    onChange={(e) => setNewCoins(e.target.value)}
                    style={{ paddingLeft: '16px' }}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Starting Gems</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newGems}
                    onChange={(e) => setNewGems(e.target.value)}
                    style={{ paddingLeft: '16px' }}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
