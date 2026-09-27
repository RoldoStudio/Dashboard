import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  ToggleLeft, 
  ToggleRight, 
  Edit2, 
  UserPlus, 
  Coins, 
  Gem, 
  Trash2, 
  Clock, 
  Copy, 
  ChevronLeft, 
  ChevronRight,
  RotateCw,
  X
} from 'lucide-react';
import { api } from '../api';

export default function Backoffice({ addToast }) {
  const [users, setUsers] = useState([]);
  const [operations, setOperations] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const uData = await api.getUsers({ search, page, limit });
      setUsers(uData.users || []);
      setTotalCount(uData.total_count || 0);
      setTotalPages(uData.total_pages || 1);
    } catch (err) {
      addToast(err.message || 'Failed to fetch users', 'error');
    } finally {
      setLoadingUsers(false);
    }
  }, [search, page, limit, addToast]);

  const fetchOperations = useCallback(async () => {
    try {
      const opData = await api.getOperations();
      setOperations(opData || []);
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.updateUserStatus(userId, !currentStatus);
      addToast('User account status updated successfully.', 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.message || 'Failed to toggle user status', 'error');
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditCoins(user.progression?.coins || 0);
    setEditGems(user.progression?.gems || 0);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.updateUserProgression(selectedUser.user_id, editCoins, editGems);
      addToast('User progression balance updated.', 'success');
      setIsEditModalOpen(false);
      fetchUsers();
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
      fetchUsers();
      fetchOperations();
    } catch (err) {
      addToast(err.message || 'Failed to create user', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This will remove all progression records.')) {
      try {
        await api.deleteUser(userId);
        addToast('User deleted successfully.', 'success');
        fetchUsers();
        fetchOperations();
      } catch (err) {
        addToast(err.message || 'Failed to delete user', 'error');
      }
    }
  };

  const handleCopyId = (userId) => {
    navigator.clipboard.writeText(userId);
    addToast(`User ID copied to clipboard: ${userId}`, 'info');
  };

  return (
    <div>
      {/* Search & Actions Bar */}
      <div className="table-header-row" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
            <input
              type="text"
              className="table-search"
              placeholder="Search users by name, email, or user ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ width: '100%' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Show:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              style={{
                background: '#232535',
                border: '1px solid var(--border-color)',
                color: 'white',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => { fetchUsers(); fetchOperations(); }}
            style={{ width: 'auto' }}
            title="Refresh Users & Operations"
          >
            <RotateCw size={15} />
            <span>Refresh</span>
          </button>

          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)} style={{ width: 'auto' }}>
            <UserPlus size={16} />
            <span>Provision User</span>
          </button>
        </div>
      </div>

      {/* Main Grid: User table on the left, operation log on the right */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* User Management Table */}
        <div className="table-card" style={{ minHeight: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px' }}>
              User Directory ({totalCount} total)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </span>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User & ID</th>
                  <th>Source</th>
                  <th>Coins</th>
                  <th>Gems</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
                      No active users matching criteria found.
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.user_id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-title)' }}>
                          {u.display_name || 'Anonymous User'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          <span>{u.email || u.user_id}</span>
                          <button
                            onClick={() => handleCopyId(u.user_id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                            title="Copy User ID"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', textTransform: 'capitalize' }}>
                          {u.auth_provider}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#f59e0b' }}>
                          <Coins size={13} />
                          {(u.progression?.coins || 0).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--accent)' }}>
                          <Gem size={13} />
                          {(u.progression?.gems || 0).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.is_active ? 'badge-active' : 'badge-inactive'}`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
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
                            title="Edit progression balances"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 8px', borderRadius: '6px' }}
                            onClick={() => handleDeleteUser(u.user_id)}
                            title="Delete User"
                          >
                            <Trash2 size={13} style={{ color: 'var(--danger)' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Showing {(page - 1) * limit + 1} - {Math.min(page * limit, totalCount)} of {totalCount} users
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ width: 'auto', padding: '6px 12px' }}
                >
                  <ChevronLeft size={16} />
                  <span>Prev</span>
                </button>

                <button
                  className="btn btn-secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{ width: 'auto', padding: '6px 12px' }}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Global Operations Logs */}
        <div className="table-card">
          <h3 style={{ marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} style={{ color: 'var(--primary)' }} />
            <span>Audit / Operation Logs</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
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
                      {op.timestamp ? new Date(op.timestamp).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    User: <code style={{ color: 'var(--accent)' }}>{op.user_id}</code> | Item: {op.item_id || 'system_mod'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: op.amount >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                      {op.amount >= 0 ? `+${op.amount}` : op.amount} {op.currency_type}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Bal: {op.balance_after}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Edit User Progression Modal */}
      {isEditModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '18px' }}>Modify Player Progression</h3>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Target User: <strong style={{ color: 'var(--text-primary)' }}>{selectedUser?.display_name || selectedUser?.user_id}</strong>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="editCoins">Coins Balance</label>
                <div className="form-input-container">
                  <input
                    id="editCoins"
                    className="form-input"
                    type="number"
                    value={editCoins}
                    onChange={(e) => setEditCoins(parseInt(e.target.value) || 0)}
                    min="0"
                    required
                  />
                  <Coins className="form-icon" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="editGems">Gems Balance</label>
                <div className="form-input-container">
                  <input
                    id="editGems"
                    className="form-input"
                    type="number"
                    value={editGems}
                    onChange={(e) => setEditGems(parseInt(e.target.value) || 0)}
                    min="0"
                    required
                  />
                  <Gem className="form-icon" />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '18px' }}>Provision New Player</h3>
              <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label" htmlFor="newUserEmail">Email Address</label>
                <input
                  id="newUserEmail"
                  className="form-input"
                  style={{ paddingLeft: '16px' }}
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="player@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newUserDisplayName">Display Name</label>
                <input
                  id="newUserDisplayName"
                  className="form-input"
                  style={{ paddingLeft: '16px' }}
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="GamerTag"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newUserProvider">Auth Provider</label>
                <select
                  id="newUserProvider"
                  className="form-input"
                  style={{ paddingLeft: '16px' }}
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                >
                  <option value="google">Google</option>
                  <option value="apple">Apple</option>
                  <option value="guest">Guest</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="newCoins">Initial Coins</label>
                  <input
                    id="newCoins"
                    className="form-input"
                    style={{ paddingLeft: '16px' }}
                    type="number"
                    value={newCoins}
                    onChange={(e) => setNewCoins(parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="newGems">Initial Gems</label>
                  <input
                    id="newGems"
                    className="form-input"
                    style={{ paddingLeft: '16px' }}
                    type="number"
                    value={newGems}
                    onChange={(e) => setNewGems(parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
