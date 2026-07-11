import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Coins, Gem, Database, History, RefreshCw, X, Tag, FileText } from 'lucide-react';
import { api } from '../api';

const getImageUrl = (path) => {
  if (!path) return '';
  let url = path;
  if (!url.startsWith('http')) {
    url = `https://back.roldostudios.com/${url.startsWith('/') ? url.slice(1) : url}`;
  }
  // Replace localhost URL with base URL
  url = url.replace('http://localhost:8000', 'https://back.roldostudios.com');
  // Strip '/v1' or 'v1/' from the URL if present, since the routing doesn't use the v1 prefix
  url = url.replace('https://back.roldostudios.com/v1/', 'https://back.roldostudios.com/');
  return url;
};


export default function StoreManagement({ addToast }) {
  const [activeSubTab, setActiveSubTab] = useState('catalog'); // 'catalog' or 'transactions'
  const [skins, setSkins] = useState([]);
  const [loadingSkins, setLoadingSkins] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Transactions logs state
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [txUserId, setTxUserId] = useState('');
  const [txItemId, setTxItemId] = useState('');
  const [txType, setTxType] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [txLimit] = useState(20);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState(null);

  // Form states
  const [formSkinId, setFormSkinId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriceCoins, setFormPriceCoins] = useState(0);
  const [formPriceGems, setFormPriceGems] = useState(0);
  const [formCategory, setFormCategory] = useState('ball');
  const [formAssetPath, setFormAssetPath] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);

  // Fetch Skins catalog
  const fetchSkins = async () => {
    setLoadingSkins(true);
    try {
      const data = await api.getStoreCatalog();
      setSkins(data.skins || []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch skins catalog', 'error');
    } finally {
      setLoadingSkins(false);
    }
  };

  // Fetch Transactions logs
  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const data = await api.getStoreTransactions({
        user_id: txUserId || undefined,
        item_id: txItemId || undefined,
        transaction_type: txType || undefined,
        page: txPage,
        limit: txLimit
      });
      setTransactions(data.transactions || []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch transaction logs', 'error');
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'catalog') {
      fetchSkins();
    } else {
      fetchTransactions();
    }
  }, [activeSubTab]);

  useEffect(() => {
    if (activeSubTab === 'transactions') {
      const delayDebounce = setTimeout(() => {
        setTxPage(1);
        fetchTransactions();
      }, 400); // 400ms debounce
      return () => clearTimeout(delayDebounce);
    }
  }, [txUserId, txItemId, txType]);

  useEffect(() => {
    if (activeSubTab === 'transactions') {
      fetchTransactions();
    }
  }, [txPage]);

  const handleOpenCreate = () => {
    setFormSkinId('');
    setFormName('');
    setFormDescription('');
    setFormPriceCoins(0);
    setFormPriceGems(0);
    setFormCategory('ball');
    setFormAssetPath('');
    setUploadFile(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (skin) => {
    setSelectedSkin(skin);
    setFormName(skin.name);
    setFormDescription(skin.description || '');
    setFormPriceCoins(skin.price_coins || 0);
    setFormPriceGems(skin.price_gems || 0);
    setFormCategory(skin.category || 'ball');
    setFormAssetPath(skin.asset_path || '');
    setFormIsActive(skin.is_active !== false);
    setUploadFile(null);
    setIsEditModalOpen(true);
  };

  // Save new skin
  const handleCreateSkin = async (e) => {
    e.preventDefault();
    if (!formSkinId.trim() || !formName.trim()) {
      addToast('Skin ID and Name are required.', 'error');
      return;
    }
    try {
      await api.createStoreSkin({
        skin_id: formSkinId.trim(),
        name: formName.trim(),
        description: formDescription.trim() || null,
        price_coins: parseInt(formPriceCoins) || 0,
        price_gems: parseInt(formPriceGems) || 0,
        category: formCategory.trim() || null,
        asset_path: formAssetPath.trim() || null
      });

      if (uploadFile) {
        try {
          await api.uploadSkinImage(formSkinId.trim(), uploadFile);
          addToast('Skin asset uploaded successfully.', 'success');
        } catch (uploadErr) {
          addToast(`Skin created, but asset upload failed: ${uploadErr.message}`, 'warning');
        }
      }

      addToast('Skin created successfully.', 'success');
      setIsCreateModalOpen(false);
      // Reset form
      setFormSkinId('');
      setFormName('');
      setFormDescription('');
      setFormPriceCoins(0);
      setFormPriceGems(0);
      setFormCategory('ball');
      setFormAssetPath('');
      setUploadFile(null);
      fetchSkins();
    } catch (err) {
      addToast(err.message || 'Failed to create skin', 'error');
    }
  };

  // Save edits to skin
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      addToast('Skin Name is required.', 'error');
      return;
    }
    try {
      await api.updateStoreSkin(selectedSkin.skin_id, {
        name: formName.trim(),
        description: formDescription.trim() || null,
        price_coins: parseInt(formPriceCoins) || 0,
        price_gems: parseInt(formPriceGems) || 0,
        category: formCategory.trim() || null,
        asset_path: formAssetPath.trim() || null,
        is_active: formIsActive
      });

      if (uploadFile) {
        try {
          await api.uploadSkinImage(selectedSkin.skin_id, uploadFile);
          addToast('Skin asset uploaded successfully.', 'success');
        } catch (uploadErr) {
          addToast(`Skin updated, but asset upload failed: ${uploadErr.message}`, 'warning');
        }
      }

      addToast('Skin updated successfully.', 'success');
      setIsEditModalOpen(false);
      setUploadFile(null);
      fetchSkins();
    } catch (err) {
      addToast(err.message || 'Failed to update skin', 'error');
    }
  };

  // Toggle skin status quickly
  const handleToggleSkinStatus = async (skin) => {
    try {
      await api.updateStoreSkin(skin.skin_id, {
        is_active: !skin.is_active
      });
      addToast(`Skin status updated.`, 'success');
      fetchSkins();
    } catch (err) {
      addToast(err.message || 'Failed to toggle skin status', 'error');
    }
  };

  // Deactivate / Delete skin
  const handleDeleteSkin = async (skinId) => {
    if (window.confirm(`Are you sure you want to deactivate/delete skin "${skinId}"?`)) {
      try {
        await api.deleteStoreSkin(skinId);
        addToast('Skin deactivated/deleted successfully.', 'success');
        fetchSkins();
      } catch (err) {
        addToast(err.message || 'Failed to deactivate skin', 'error');
      }
    }
  };

  // Filter local catalog skins
  const filteredSkins = skins.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.skin_id.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.category && s.category.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {/* Sub-tabs header */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button 
          className={`btn ${activeSubTab === 'catalog' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('catalog')}
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Database size={16} />
          <span>Skins Catalog</span>
        </button>
        <button 
          className={`btn ${activeSubTab === 'transactions' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('transactions')}
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <History size={16} />
          <span>Store Audit Logs</span>
        </button>
      </div>

      {activeSubTab === 'catalog' ? (
        /* CATALOG VIEW */
        <div>
          {/* Controls row */}
          <div className="table-header-row">
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="table-search"
                placeholder="Search skins by ID, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={fetchSkins} style={{ width: 'auto', padding: '10px' }} title="Refresh">
                <RefreshCw size={16} />
              </button>
              <button className="btn btn-primary" onClick={handleOpenCreate} style={{ width: 'auto' }}>
                <Plus size={16} />
                <span>Create Skin</span>
              </button>
            </div>
          </div>

          {/* Skins Table */}
          <div className="table-card" style={{ minHeight: '400px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Store Skin Catalog</h3>
            <div className="table-container">
              {loadingSkins ? (
                <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-secondary)' }}>
                  Loading catalog items...
                </div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Skin Item</th>
                      <th>Category</th>
                      <th>Price Coins</th>
                      <th>Price Gems</th>
                      <th>Asset Path</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSkins.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
                          No skins found in catalog.
                        </td>
                      </tr>
                    ) : (
                      filteredSkins.map(skin => (
                        <tr key={skin.skin_id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {skin.asset_path && (
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  overflow: 'hidden',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <img
                                    src={getImageUrl(skin.asset_path)}
                                    alt={skin.name}
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-title)' }}>{skin.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: <code>{skin.skin_id}</code></div>
                              </div>
                            </div>
                            {skin.description && (
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {skin.description}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', textTransform: 'capitalize' }}>
                              <Tag size={10} style={{ marginRight: '4px', display: 'inline' }} />
                              {skin.category || 'default'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Coins size={12} style={{ color: 'var(--warning)' }} />
                              {skin.price_coins}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Gem size={12} style={{ color: 'var(--accent)' }} />
                              {skin.price_gems}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {skin.asset_path || 'None'}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${skin.is_active !== false ? 'badge-active' : 'badge-inactive'}`}>
                              {skin.is_active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 8px', borderRadius: '6px' }}
                                onClick={() => handleToggleSkinStatus(skin)}
                                title={skin.is_active !== false ? 'Deactivate Skin' : 'Activate Skin'}
                              >
                                {skin.is_active !== false ? <ToggleRight size={18} style={{ color: 'var(--success)' }} /> : <ToggleLeft size={18} style={{ color: 'var(--text-muted)' }} />}
                              </button>
                              
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 8px', borderRadius: '6px' }}
                                onClick={() => handleOpenEdit(skin)}
                                title="Edit Skin details"
                              >
                                <Edit2 size={14} />
                              </button>

                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 8px', borderRadius: '6px' }}
                                onClick={() => handleDeleteSkin(skin.skin_id)}
                                title="Soft-delete/Deactivate Skin"
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
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TRANSACTIONS VIEW */
        <div>
          {/* Filters row */}
          <div className="table-header-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="table-search"
                style={{ width: '100%', paddingLeft: '36px' }}
                placeholder="Filter by User ID..."
                value={txUserId}
                onChange={(e) => setTxUserId(e.target.value)}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="table-search"
                style={{ width: '100%', paddingLeft: '36px' }}
                placeholder="Filter by Item ID..."
                value={txItemId}
                onChange={(e) => setTxItemId(e.target.value)}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>

            <div>
              <select
                className="table-search"
                style={{ width: '100%', paddingLeft: '12px', height: '40px', background: 'var(--bg-card)', color: 'var(--text-title)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                value={txType}
                onChange={(e) => setTxType(e.target.value)}
              >
                <option value="">All Transaction Types</option>
                <option value="PURCHASE">PURCHASE</option>
                <option value="EQUIP">EQUIP</option>
                <option value="ADJUSTMENT">ADJUSTMENT</option>
                <option value="SYNC">SYNC</option>
              </select>
            </div>

            <button className="btn btn-secondary" onClick={fetchTransactions} style={{ height: '40px', width: 'auto', padding: '0 12px' }}>
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Audit Logs Table */}
          <div className="table-card">
            <h3 style={{ marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} style={{ color: 'var(--primary)' }} />
              <span>Store transaction audit logs</span>
            </h3>

            <div className="table-container">
              {loadingTransactions ? (
                <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-secondary)' }}>
                  Loading transactions...
                </div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>User ID</th>
                      <th>Item/Skin ID</th>
                      <th>Type</th>
                      <th>Delta</th>
                      <th>Balance After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
                          No transaction records found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      transactions.map(tx => (
                        <tr key={tx.id}>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {new Date(tx.timestamp).toLocaleString()}
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                            {tx.user_id}
                          </td>
                          <td>
                            {tx.item_id ? <code>{tx.item_id}</code> : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                          </td>
                          <td>
                            <span className="badge" style={{ background: 'rgba(255,255,255,0.03)', textTransform: 'uppercase', fontSize: '10px' }}>
                              {tx.transaction_type}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              color: tx.amount >= 0 ? 'var(--success)' : 'var(--danger)',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {tx.amount >= 0 ? '+' : ''}{tx.amount}
                              {tx.currency_type === 'COINS' ? <Coins size={10} style={{ color: 'var(--warning)' }} /> : <Gem size={10} style={{ color: 'var(--accent)' }} />}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {tx.balance_after}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Page {txPage}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: 'auto', padding: '6px 12px' }} 
                  disabled={txPage <= 1}
                  onClick={() => setTxPage(prev => Math.max(1, prev - 1))}
                >
                  Previous
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ width: 'auto', padding: '6px 12px' }}
                  disabled={transactions.length < txLimit}
                  onClick={() => setTxPage(prev => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SKIN MODAL */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px' }}>Create New Catalog Skin</h3>
              <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateSkin}>
              <div className="form-group">
                <label className="form-label">Skin ID (Unique Key)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ice_blue_special"
                  value={formSkinId}
                  onChange={(e) => setFormSkinId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ice Blue"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  style={{ height: '70px', resize: 'vertical' }}
                  placeholder="Description of the cosmetic skin..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Coins size={12} style={{ color: 'var(--warning)' }} /> Price (Coins)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={formPriceCoins}
                    onChange={(e) => setFormPriceCoins(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Gem size={12} style={{ color: 'var(--accent)' }} /> Price (Gems)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={formPriceGems}
                    onChange={(e) => setFormPriceGems(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Category / Rarity</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ball, legendary"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Asset File Path</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. static/skins/ice_blue.png"
                    value={formAssetPath}
                    onChange={(e) => setFormAssetPath(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Upload Image Asset (.png, .jpg)</label>
                <input
                  type="file"
                  className="form-input"
                  accept="image/png, image/jpeg"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  style={{ background: 'transparent', border: '1px dashed var(--border-color)', padding: '8px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)} style={{ width: 'auto' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                  Create Skin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SKIN MODAL */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px' }}>Edit Catalog Skin</h3>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Modifying skin specifications for: <code>{selectedSkin?.skin_id}</code>
              </div>

              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Classic Ball"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  style={{ height: '70px', resize: 'vertical' }}
                  placeholder="Description of the cosmetic skin..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Coins size={12} style={{ color: 'var(--warning)' }} /> Price (Coins)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={formPriceCoins}
                    onChange={(e) => setFormPriceCoins(e.target.value)}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Gem size={12} style={{ color: 'var(--accent)' }} /> Price (Gems)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={formPriceGems}
                    onChange={(e) => setFormPriceGems(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Category / Rarity</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ball, legendary"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Asset File Path</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. static/skins/gold_ball.png"
                    value={formAssetPath}
                    onChange={(e) => setFormAssetPath(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '16px 0 8px' }}>
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <label htmlFor="formIsActive" style={{ cursor: 'pointer', fontSize: '13px', userSelect: 'none' }}>
                  Skin is active and available in shop
                </label>
              </div>

              {selectedSkin?.asset_path && (
                <div className="form-group">
                  <label className="form-label">Current Asset Image</label>
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px'
                  }}>
                    <img
                      src={getImageUrl(selectedSkin.asset_path)}
                      alt={selectedSkin.name}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Upload New Image Asset (.png, .jpg)</label>
                <input
                  type="file"
                  className="form-input"
                  accept="image/png, image/jpeg"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  style={{ background: 'transparent', border: '1px dashed var(--border-color)', padding: '8px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)} style={{ width: 'auto' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
