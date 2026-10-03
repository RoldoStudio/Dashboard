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
  X,
  Package,
  Gift,
  Zap,
  Tag
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

  // Inventory & Grants Modal state
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [inventoryUser, setInventoryUser] = useState(null);
  const [userInventory, setUserInventory] = useState({ skins: [], powerups: {} });
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [availableSkins, setAvailableSkins] = useState([]);
  const [availablePowerups, setAvailablePowerups] = useState([]);
  const [grantSkinId, setGrantSkinId] = useState('');
  const [grantPowerupId, setGrantPowerupId] = useState('');
  const [grantPowerupAmount, setGrantPowerupAmount] = useState(1);
  const [grantingSkin, setGrantingSkin] = useState(false);
  const [grantingPowerup, setGrantingPowerup] = useState(false);

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

  const handleOpenInventory = async (user) => {
    setInventoryUser(user);
    setIsInventoryModalOpen(true);
    setLoadingInventory(true);
    try {
      const [inv, skinsData, powerupsData] = await Promise.all([
        api.getUserInventory(user.user_id),
        api.getBackofficeSkins().catch(() => api.getStoreCatalog().then(d => d.skins || [])).catch(() => []),
        api.getBackofficePowerups().catch(() => [])
      ]);
      setUserInventory(inv || { skins: [], powerups: {} });
      const skins = Array.isArray(skinsData) ? skinsData : (skinsData.skins || []);
      const powerups = Array.isArray(powerupsData) ? powerupsData : [];
      setAvailableSkins(skins);
      setAvailablePowerups(powerups);
      if (skins.length > 0) setGrantSkinId(skins[0].skin_id);
      if (powerups.length > 0) setGrantPowerupId(powerups[0].powerup_id);
    } catch (err) {
      addToast(err.message || 'Failed to load user inventory', 'error');
    } finally {
      setLoadingInventory(false);
    }
  };

  const refreshUserInventory = async (userId) => {
    try {
      const inv = await api.getUserInventory(userId);
      setUserInventory(inv || { skins: [], powerups: {} });
    } catch (err) {
      addToast(err.message || 'Failed to refresh inventory', 'error');
    }
  };

  const handleGrantSkin = async (e) => {
    e.preventDefault();
    if (!grantSkinId) return;
    setGrantingSkin(true);
    try {
      await api.grantUserSkin(inventoryUser.user_id, grantSkinId);
      addToast(`Successfully granted skin '${grantSkinId}' to ${inventoryUser.display_name || inventoryUser.user_id}`, 'success');
      await refreshUserInventory(inventoryUser.user_id);
      fetchOperations();
    } catch (err) {
      addToast(err.message || 'Failed to grant skin', 'error');
    } finally {
      setGrantingSkin(false);
    }
  };

  const handleGrantPowerup = async (e) => {
    e.preventDefault();
    if (!grantPowerupId || grantPowerupAmount <= 0) return;
    setGrantingPowerup(true);
    try {
      const res = await api.grantUserPowerups(inventoryUser.user_id, grantPowerupId, grantPowerupAmount);
      addToast(`Successfully granted ${grantPowerupAmount}x '${grantPowerupId}' (new total: ${res.new_quantity})`, 'success');
      await refreshUserInventory(inventoryUser.user_id);
      fetchOperations();
    } catch (err) {
      addToast(err.message || 'Failed to grant powerup', 'error');
    } finally {
      setGrantingPowerup(false);
    }
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
                            onClick={() => handleOpenInventory(u)}
                            title="Inspect Inventory & Grant Items"
                          >
                            <Package size={14} style={{ color: 'var(--accent)' }} />
                          </button>

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

      {/* User Inventory & Grants Modal */}
      {isInventoryModalOpen && inventoryUser && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Package size={20} style={{ color: 'var(--accent)' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>User Inventory & Item Grants</h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {inventoryUser.display_name || 'User'} ({inventoryUser.user_id})
                  </div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setIsInventoryModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {loadingInventory ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <RotateCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
                <div>Fetching player inventory records...</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Current progression balances */}
                <div style={{ display: 'flex', gap: '16px', background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <Coins size={15} style={{ color: '#f59e0b' }} />
                    <span style={{ color: 'var(--text-muted)' }}>Coins:</span>
                    <strong>{(inventoryUser.progression?.coins || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <Gem size={15} style={{ color: 'var(--accent)' }} />
                    <span style={{ color: 'var(--text-muted)' }}>Gems:</span>
                    <strong>{(inventoryUser.progression?.gems || 0).toLocaleString()}</strong>
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: '11px', width: 'auto' }}
                    onClick={() => refreshUserInventory(inventoryUser.user_id)}
                    title="Refresh Inventory"
                  >
                    <RotateCw size={12} />
                    <span>Refresh</span>
                  </button>
                </div>

                {/* Unlocked Skins Section */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', background: 'var(--bg-card)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag size={16} style={{ color: 'var(--secondary)' }} />
                      <h4 style={{ fontSize: '14px', margin: 0 }}>Unlocked Skins ({userInventory.skins?.length || 0})</h4>
                    </div>
                  </div>

                  {userInventory.skins && userInventory.skins.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                      {userInventory.skins.map((skin) => (
                        <div 
                          key={skin.skin_id}
                          style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Tag size={12} style={{ color: 'var(--secondary)' }} />
                          <span style={{ fontWeight: 600 }}>{skin.name || skin.skin_id}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>({skin.skin_id})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px', fontStyle: 'italic' }}>
                      No custom skins currently unlocked for this user.
                    </div>
                  )}

                  {/* Grant Skin Form */}
                  <form onSubmit={handleGrantSkin} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select
                      className="form-input"
                      value={grantSkinId}
                      onChange={(e) => setGrantSkinId(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                    >
                      {availableSkins.map((s) => (
                        <option key={s.skin_id} value={s.skin_id}>
                          {s.name} ({s.skin_id})
                        </option>
                      ))}
                    </select>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={grantingSkin || !grantSkinId}
                      style={{ width: 'auto', padding: '8px 16px', fontSize: '13px' }}
                    >
                      <Gift size={14} />
                      <span>{grantingSkin ? 'Granting...' : 'Grant Skin'}</span>
                    </button>
                  </form>
                </div>

                {/* Powerups Inventory Section */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', background: 'var(--bg-card)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={16} style={{ color: 'var(--primary)' }} />
                      <h4 style={{ fontSize: '14px', margin: 0 }}>
                        Powerup Inventory ({Object.keys(userInventory.powerups || {}).length} types)
                      </h4>
                    </div>
                  </div>

                  {userInventory.powerups && Object.keys(userInventory.powerups).length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                      {Object.entries(userInventory.powerups).map(([pId, qty]) => (
                        <div 
                          key={pId}
                          style={{
                            background: 'rgba(92, 60, 230, 0.1)',
                            border: '1px solid rgba(92, 60, 230, 0.3)',
                            padding: '10px',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center'
                          }}
                        >
                          <Zap size={18} style={{ color: 'var(--accent)', marginBottom: '4px' }} />
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{pId}</span>
                          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)', marginTop: '2px' }}>
                            x{qty}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px', fontStyle: 'italic' }}>
                      Player has 0 powerups in their current inventory.
                    </div>
                  )}

                  {/* Grant Powerup Form */}
                  <form onSubmit={handleGrantPowerup} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select
                      className="form-input"
                      value={grantPowerupId}
                      onChange={(e) => setGrantPowerupId(e.target.value)}
                      style={{ flex: 2, padding: '8px 12px', fontSize: '13px' }}
                    >
                      {availablePowerups.length > 0 ? (
                        availablePowerups.map((p) => (
                          <option key={p.powerup_id} value={p.powerup_id}>
                            {p.name} ({p.powerup_id})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="bomb">Bomb</option>
                          <option value="undo">Undo</option>
                          <option value="shuffle">Shuffle</option>
                        </>
                      )}
                    </select>

                    <input
                      type="number"
                      className="form-input"
                      value={grantPowerupAmount}
                      onChange={(e) => setGrantPowerupAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      placeholder="Qty"
                      style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                    />

                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={grantingPowerup || !grantPowerupId}
                      style={{ width: 'auto', padding: '8px 16px', fontSize: '13px' }}
                    >
                      <Zap size={14} />
                      <span>{grantingPowerup ? 'Granting...' : 'Grant Powerup'}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            <div className="modal-footer" style={{ marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsInventoryModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
