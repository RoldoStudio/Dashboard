import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Coins, Gem, Database, History, RefreshCw, X, Tag, FileText, Gift } from 'lucide-react';
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
  const [activeSubTab, setActiveSubTab] = useState('catalog'); // 'catalog', 'offers', or 'transactions'
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

  // Offers state
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [isOfferCreateModalOpen, setIsOfferCreateModalOpen] = useState(false);
  const [isOfferEditModalOpen, setIsOfferEditModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);

  // Offer form fields
  const [offerFormId, setOfferFormId] = useState('');
  const [offerFormName, setOfferFormName] = useState('');
  const [offerFormDescription, setOfferFormDescription] = useState('');
  const [offerFormType, setOfferFormType] = useState('SINGLE');
  const [offerFormPriceCoins, setOfferFormPriceCoins] = useState(0);
  const [offerFormPriceGems, setOfferFormPriceGems] = useState(0);
  const [offerFormStartTime, setOfferFormStartTime] = useState('');
  const [offerFormEndTime, setOfferFormEndTime] = useState('');
  const [offerFormPurchaseLimit, setOfferFormPurchaseLimit] = useState('');
  const [offerFormIsActive, setOfferFormIsActive] = useState(true);
  const [offerFormItems, setOfferFormItems] = useState([]); // Array of { skin_id, quantity }

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

  // Fetch Offers
  const fetchOffers = async () => {
    setLoadingOffers(true);
    try {
      const data = await api.listShopOffers();
      setOffers(data || []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch shop offers', 'error');
    } finally {
      setLoadingOffers(false);
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
    } else if (activeSubTab === 'offers') {
      fetchOffers();
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

  // Open Create Offer modal
  const handleOpenCreateOffer = () => {
    setOfferFormId('');
    setOfferFormName('');
    setOfferFormDescription('');
    setOfferFormType('SINGLE');
    setOfferFormPriceCoins(0);
    setOfferFormPriceGems(0);
    setOfferFormStartTime('');
    setOfferFormEndTime('');
    setOfferFormPurchaseLimit('');
    setOfferFormIsActive(true);
    setOfferFormItems([]);
    setIsOfferCreateModalOpen(true);
  };

  // Helper to format ISO date string to datetime-local input string
  const formatDatetimeLocal = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const pad = (num) => String(num).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  // Open Edit Offer modal
  const handleOpenEditOffer = (offer) => {
    setSelectedOffer(offer);
    setOfferFormName(offer.name);
    setOfferFormDescription(offer.description || '');
    setOfferFormType(offer.offer_type || 'SINGLE');
    setOfferFormPriceCoins(offer.price_coins || 0);
    setOfferFormPriceGems(offer.price_gems || 0);
    setOfferFormStartTime(formatDatetimeLocal(offer.start_time));
    setOfferFormEndTime(formatDatetimeLocal(offer.end_time));
    setOfferFormPurchaseLimit(offer.purchase_limit || '');
    setOfferFormIsActive(offer.is_active !== false);
    setOfferFormItems(offer.items ? offer.items.map(i => ({ skin_id: i.skin_id, quantity: i.quantity || 1 })) : []);
    setIsOfferEditModalOpen(true);
  };

  // Create offer
  const handleCreateOfferSubmit = async (e) => {
    e.preventDefault();
    if (!offerFormId.trim() || !offerFormName.trim()) {
      addToast('Offer ID and Name are required.', 'error');
      return;
    }
    if (offerFormItems.length === 0) {
      addToast('Please select at least one skin/item for this offer.', 'error');
      return;
    }
    try {
      await api.createShopOffer({
        offer_id: offerFormId.trim(),
        name: offerFormName.trim(),
        description: offerFormDescription.trim() || null,
        offer_type: offerFormType,
        price_coins: parseInt(offerFormPriceCoins) || 0,
        price_gems: parseInt(offerFormPriceGems) || 0,
        start_time: offerFormStartTime ? new Date(offerFormStartTime).toISOString() : null,
        end_time: offerFormEndTime ? new Date(offerFormEndTime).toISOString() : null,
        purchase_limit: offerFormPurchaseLimit ? parseInt(offerFormPurchaseLimit) : null,
        is_active: offerFormIsActive,
        items: offerFormItems.map(item => ({
          skin_id: item.skin_id,
          quantity: parseInt(item.quantity) || 1
        }))
      });
      addToast('Offer created successfully.', 'success');
      setIsOfferCreateModalOpen(false);
      fetchOffers();
    } catch (err) {
      addToast(err.message || 'Failed to create offer', 'error');
    }
  };

  // Save edit offer
  const handleSaveEditOfferSubmit = async (e) => {
    e.preventDefault();
    if (!offerFormName.trim()) {
      addToast('Offer Name is required.', 'error');
      return;
    }
    if (offerFormItems.length === 0) {
      addToast('Please select at least one skin/item for this offer.', 'error');
      return;
    }
    try {
      await api.updateShopOffer(selectedOffer.offer_id, {
        name: offerFormName.trim(),
        description: offerFormDescription.trim() || null,
        offer_type: offerFormType,
        price_coins: parseInt(offerFormPriceCoins) || 0,
        price_gems: parseInt(offerFormPriceGems) || 0,
        start_time: offerFormStartTime ? new Date(offerFormStartTime).toISOString() : null,
        end_time: offerFormEndTime ? new Date(offerFormEndTime).toISOString() : null,
        purchase_limit: offerFormPurchaseLimit ? parseInt(offerFormPurchaseLimit) : null,
        is_active: offerFormIsActive,
        items: offerFormItems.map(item => ({
          skin_id: item.skin_id,
          quantity: parseInt(item.quantity) || 1
        }))
      });
      addToast('Offer updated successfully.', 'success');
      setIsOfferEditModalOpen(false);
      fetchOffers();
    } catch (err) {
      addToast(err.message || 'Failed to update offer', 'error');
    }
  };

  // Toggle offer status
  const handleToggleOfferStatus = async (offer) => {
    try {
      await api.updateShopOffer(offer.offer_id, {
        is_active: !offer.is_active
      });
      addToast('Offer status updated.', 'success');
      fetchOffers();
    } catch (err) {
      addToast(err.message || 'Failed to toggle offer status', 'error');
    }
  };

  // Delete offer
  const handleDeleteOffer = async (offerId) => {
    if (window.confirm(`Are you sure you want to delete offer "${offerId}"? This cannot be undone.`)) {
      try {
        await api.deleteShopOffer(offerId);
        addToast('Offer deleted successfully.', 'success');
        fetchOffers();
      } catch (err) {
        addToast(err.message || 'Failed to delete offer', 'error');
      }
    }
  };

  // Manage items list during creation/editing
  const handleAddOfferItem = () => {
    const availableSkin = skins.find(s => !offerFormItems.some(i => i.skin_id === s.skin_id));
    const defaultSkinId = availableSkin ? availableSkin.skin_id : (skins[0]?.skin_id || '');
    setOfferFormItems([...offerFormItems, { skin_id: defaultSkinId, quantity: 1 }]);
  };

  const handleRemoveOfferItem = (index) => {
    setOfferFormItems(offerFormItems.filter((_, idx) => idx !== index));
  };

  const handleUpdateOfferItem = (index, field, value) => {
    const updated = [...offerFormItems];
    updated[index] = { ...updated[index], [field]: value };
    setOfferFormItems(updated);
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
          className={`btn ${activeSubTab === 'offers' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('offers')}
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Gift size={16} />
          <span>Shop Offers</span>
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
      ) : activeSubTab === 'offers' ? (
        /* OFFERS VIEW */
        <div>
          {/* Controls row */}
          <div className="table-header-row">
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="table-search"
                placeholder="Search offers by ID, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={fetchOffers} style={{ width: 'auto', padding: '10px' }} title="Refresh">
                <RefreshCw size={16} />
              </button>
              <button className="btn btn-primary" onClick={handleOpenCreateOffer} style={{ width: 'auto' }}>
                <Plus size={16} />
                <span>Create Offer</span>
              </button>
            </div>
          </div>

          {/* Offers Table */}
          <div className="table-card" style={{ minHeight: '400px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Shop Offers & Bundles</h3>
            <div className="table-container">
              {loadingOffers ? (
                <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-secondary)' }}>
                  Loading shop offers...
                </div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Offer</th>
                      <th>Type</th>
                      <th>Included Items</th>
                      <th>Price Coins</th>
                      <th>Price Gems</th>
                      <th>Active Period / Limits</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.filter(o => {
                      const q = searchQuery.toLowerCase();
                      return o.offer_id.toLowerCase().includes(q) || o.name.toLowerCase().includes(q) || (o.description && o.description.toLowerCase().includes(q));
                    }).length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
                          No shop offers found.
                        </td>
                      </tr>
                    ) : (
                      offers.filter(o => {
                        const q = searchQuery.toLowerCase();
                        return o.offer_id.toLowerCase().includes(q) || o.name.toLowerCase().includes(q) || (o.description && o.description.toLowerCase().includes(q));
                      }).map(offer => (
                        <tr key={offer.offer_id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-title)' }}>{offer.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: <code>{offer.offer_id}</code></div>
                            {offer.description && (
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {offer.description}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="badge" style={{ background: offer.offer_type === 'BUNDLE' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.05)', color: offer.offer_type === 'BUNDLE' ? 'var(--accent)' : 'inherit', textTransform: 'uppercase' }}>
                              {offer.offer_type || 'SINGLE'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {offer.items && offer.items.map((item, idx) => {
                                const matchedSkin = skins.find(s => s.skin_id === item.skin_id);
                                return (
                                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                    {matchedSkin?.asset_path && (
                                      <img
                                        src={getImageUrl(matchedSkin.asset_path)}
                                        alt={matchedSkin.name}
                                        style={{ width: '18px', height: '18px', objectFit: 'contain', borderRadius: '2px' }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                    )}
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                      {matchedSkin ? matchedSkin.name : item.skin_id}
                                    </span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                                      (x{item.quantity})
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Coins size={12} style={{ color: 'var(--warning)' }} />
                              {offer.price_coins}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Gem size={12} style={{ color: 'var(--accent)' }} />
                              {offer.price_gems}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {offer.start_time && (
                                <div style={{ color: 'var(--text-secondary)' }}>
                                  Starts: {new Date(offer.start_time).toLocaleString()}
                                </div>
                              )}
                              {offer.end_time && (
                                <div style={{ color: 'var(--text-secondary)' }}>
                                  Ends: {new Date(offer.end_time).toLocaleString()}
                                </div>
                              )}
                              {offer.purchase_limit && (
                                <div style={{ color: 'var(--warning)' }}>
                                  Limit: {offer.purchase_limit} per user
                                </div>
                              )}
                              {!offer.start_time && !offer.end_time && !offer.purchase_limit && (
                                <span style={{ color: 'var(--text-muted)' }}>Always available / Unlimited</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${offer.is_active !== false ? 'badge-active' : 'badge-inactive'}`}>
                              {offer.is_active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 8px', borderRadius: '6px' }}
                                onClick={() => handleToggleOfferStatus(offer)}
                                title={offer.is_active !== false ? 'Deactivate Offer' : 'Activate Offer'}
                              >
                                {offer.is_active !== false ? <ToggleRight size={18} style={{ color: 'var(--success)' }} /> : <ToggleLeft size={18} style={{ color: 'var(--text-muted)' }} />}
                              </button>
                              
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 8px', borderRadius: '6px' }}
                                onClick={() => handleOpenEditOffer(offer)}
                                title="Edit Offer details"
                              >
                                <Edit2 size={14} />
                              </button>

                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 8px', borderRadius: '6px' }}
                                onClick={() => handleDeleteOffer(offer.offer_id)}
                                title="Delete Offer"
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
      {/* CREATE OFFER MODAL */}
      {isOfferCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px' }}>Create New Shop Offer</h3>
              <button className="modal-close" onClick={() => setIsOfferCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOfferSubmit}>
              <div className="form-group">
                <label className="form-label">Offer ID (Unique Key)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. bundle_starter_pack"
                  value={offerFormId}
                  onChange={(e) => setOfferFormId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Starter Pack Bundle"
                  value={offerFormName}
                  onChange={(e) => setOfferFormName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  style={{ height: '60px', resize: 'vertical' }}
                  placeholder="Description of the offer..."
                  value={offerFormDescription}
                  onChange={(e) => setOfferFormDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Offer Type</label>
                  <select
                    className="form-input"
                    value={offerFormType}
                    onChange={(e) => setOfferFormType(e.target.value)}
                  >
                    <option value="SINGLE">SINGLE</option>
                    <option value="BUNDLE">BUNDLE</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Purchase Limit (Per User)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 1 (blank for unlimited)"
                    value={offerFormPurchaseLimit}
                    onChange={(e) => setOfferFormPurchaseLimit(e.target.value)}
                    min="1"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Coins size={12} style={{ color: 'var(--warning)' }} /> Price (Coins)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={offerFormPriceCoins}
                    onChange={(e) => setOfferFormPriceCoins(e.target.value)}
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
                    value={offerFormPriceGems}
                    onChange={(e) => setOfferFormPriceGems(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Start Time (Local)</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={offerFormStartTime}
                    onChange={(e) => setOfferFormStartTime(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Time (Local)</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={offerFormEndTime}
                    onChange={(e) => setOfferFormEndTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Items list manager */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', margin: '16px 0', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Included Skins / Items</span>
                  <button type="button" className="btn btn-secondary" onClick={handleAddOfferItem} style={{ width: 'auto', padding: '4px 10px', fontSize: '12px' }}>
                    + Add Item
                  </button>
                </div>

                {offerFormItems.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                    No items added. Add at least one skin to the offer.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {offerFormItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                        <select
                          className="form-input"
                          value={item.skin_id}
                          onChange={(e) => handleUpdateOfferItem(idx, 'skin_id', e.target.value)}
                        >
                          {skins.map(s => (
                            <option key={s.skin_id} value={s.skin_id}>
                              {s.name} ({s.skin_id})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          className="form-input"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleUpdateOfferItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        />

                        <button type="button" className="btn btn-secondary" onClick={() => handleRemoveOfferItem(idx)} style={{ width: 'auto', padding: '8px', color: 'var(--danger)' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '16px 0 8px' }}>
                <input
                  type="checkbox"
                  id="offerFormIsActive"
                  checked={offerFormIsActive}
                  onChange={(e) => setOfferFormIsActive(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <label htmlFor="offerFormIsActive" style={{ cursor: 'pointer', fontSize: '13px', userSelect: 'none' }}>
                  Offer is active and available in shop
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsOfferCreateModalOpen(false)} style={{ width: 'auto' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                  Create Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT OFFER MODAL */}
      {isOfferEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px' }}>Edit Shop Offer</h3>
              <button className="modal-close" onClick={() => setIsOfferEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEditOfferSubmit}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Modifying details for offer ID: <code>{selectedOffer?.offer_id}</code>
              </div>

              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Starter Pack Bundle"
                  value={offerFormName}
                  onChange={(e) => setOfferFormName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  style={{ height: '60px', resize: 'vertical' }}
                  placeholder="Description of the offer..."
                  value={offerFormDescription}
                  onChange={(e) => setOfferFormDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Offer Type</label>
                  <select
                    className="form-input"
                    value={offerFormType}
                    onChange={(e) => setOfferFormType(e.target.value)}
                  >
                    <option value="SINGLE">SINGLE</option>
                    <option value="BUNDLE">BUNDLE</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Purchase Limit (Per User)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 1 (blank for unlimited)"
                    value={offerFormPurchaseLimit}
                    onChange={(e) => setOfferFormPurchaseLimit(e.target.value)}
                    min="1"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Coins size={12} style={{ color: 'var(--warning)' }} /> Price (Coins)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={offerFormPriceCoins}
                    onChange={(e) => setOfferFormPriceCoins(e.target.value)}
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
                    value={offerFormPriceGems}
                    onChange={(e) => setOfferFormPriceGems(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Start Time (Local)</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={offerFormStartTime}
                    onChange={(e) => setOfferFormStartTime(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Time (Local)</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={offerFormEndTime}
                    onChange={(e) => setOfferFormEndTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Items list manager */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', margin: '16px 0', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Included Skins / Items</span>
                  <button type="button" className="btn btn-secondary" onClick={handleAddOfferItem} style={{ width: 'auto', padding: '4px 10px', fontSize: '12px' }}>
                    + Add Item
                  </button>
                </div>

                {offerFormItems.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                    No items added. Add at least one skin to the offer.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {offerFormItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                        <select
                          className="form-input"
                          value={item.skin_id}
                          onChange={(e) => handleUpdateOfferItem(idx, 'skin_id', e.target.value)}
                        >
                          {skins.map(s => (
                            <option key={s.skin_id} value={s.skin_id}>
                              {s.name} ({s.skin_id})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          className="form-input"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleUpdateOfferItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        />

                        <button type="button" className="btn btn-secondary" onClick={() => handleRemoveOfferItem(idx)} style={{ width: 'auto', padding: '8px', color: 'var(--danger)' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '16px 0 8px' }}>
                <input
                  type="checkbox"
                  id="offerFormIsActive"
                  checked={offerFormIsActive}
                  onChange={(e) => setOfferFormIsActive(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <label htmlFor="offerFormIsActive" style={{ cursor: 'pointer', fontSize: '13px', userSelect: 'none' }}>
                  Offer is active and available in shop
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsOfferEditModalOpen(false)} style={{ width: 'auto' }}>
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
