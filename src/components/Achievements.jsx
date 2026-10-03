import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trophy, 
  Plus, 
  Edit2, 
  Trash2, 
  RotateCw, 
  Search, 
  Coins, 
  Gem, 
  Zap, 
  Tag, 
  Layers, 
  CheckCircle2, 
  X,
  Flame,
  Clock,
  Gamepad2,
  Star
} from 'lucide-react';
import { api } from '../api';

const METRIC_OPTIONS = [
  { value: 'blocks_merged', label: 'Blocks Merged', icon: Flame },
  { value: 'games_played', label: 'Games Played', icon: Gamepad2 },
  { value: 'playtime_seconds', label: 'Playtime (Seconds)', icon: Clock },
  { value: 'levels_completed', label: 'Levels Completed', icon: CheckCircle2 },
  { value: 'stars_earned', label: 'Stars Earned', icon: Star },
  { value: 'wheel_spins', label: 'Wheel Spins', icon: RotateCw },
  { value: 'powerups_used', label: 'Powerups Used', icon: Zap },
];

const REWARD_TYPES = [
  { value: 'coins', label: 'Coins', icon: Coins, color: '#f59e0b' },
  { value: 'gems', label: 'Gems', icon: Gem, color: 'var(--accent)' },
  { value: 'skin', label: 'Skin Item', icon: Tag, color: 'var(--secondary)' },
  { value: 'powerup', label: 'Powerup', icon: Zap, color: 'var(--primary)' },
];

export default function Achievements({ addToast }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadingCatalog, setReloadingCatalog] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState(null);

  // Form states for Create / Edit
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('icon_trophy');
  const [formMetric, setFormMetric] = useState('blocks_merged');
  const [formTiers, setFormTiers] = useState([
    { tier: 1, target: 50, reward_type: 'coins', reward_amount: 100, reward_item_id: '' }
  ]);

  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getBackofficeAchievements();
      setAchievements(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch achievements catalog', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const handleReloadCatalog = async () => {
    if (!window.confirm('Reload achievements configuration from server disk? Any unsaved custom records may be reset.')) {
      return;
    }
    setReloadingCatalog(true);
    try {
      const res = await api.reloadAchievementsCatalog();
      addToast(`Achievements catalog reloaded successfully (${res.count || 0} active).`, 'success');
      fetchAchievements();
    } catch (err) {
      addToast(err.message || 'Failed to reload achievements catalog', 'error');
    } finally {
      setReloadingCatalog(false);
    }
  };

  const openCreateModal = () => {
    setFormId('');
    setFormTitle('');
    setFormDescription('');
    setFormIcon('icon_achievement');
    setFormMetric('blocks_merged');
    setFormTiers([
      { tier: 1, target: 50, reward_type: 'coins', reward_amount: 100, reward_item_id: '' },
      { tier: 2, target: 200, reward_type: 'coins', reward_amount: 300, reward_item_id: '' },
      { tier: 3, target: 1000, reward_type: 'gems', reward_amount: 10, reward_item_id: '' }
    ]);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (ach) => {
    setEditingAchievement(ach);
    setFormId(ach.id);
    setFormTitle(ach.title || '');
    setFormDescription(ach.description || '');
    setFormIcon(ach.icon || 'icon_achievement');
    setFormMetric(ach.metric || 'blocks_merged');
    setFormTiers(
      (ach.tiers && ach.tiers.length > 0)
        ? ach.tiers.map(t => ({
            tier: t.tier,
            target: t.target,
            reward_type: t.reward_type || 'coins',
            reward_amount: t.reward_amount !== null && t.reward_amount !== undefined ? t.reward_amount : '',
            reward_item_id: t.reward_item_id || ''
          }))
        : [{ tier: 1, target: 10, reward_type: 'coins', reward_amount: 50, reward_item_id: '' }]
    );
    setIsEditModalOpen(true);
  };

  const handleAddTier = () => {
    const nextTierNum = formTiers.length + 1;
    const lastTarget = formTiers.length > 0 ? formTiers[formTiers.length - 1].target : 10;
    setFormTiers([
      ...formTiers,
      {
        tier: nextTierNum,
        target: lastTarget * 2,
        reward_type: 'coins',
        reward_amount: 100,
        reward_item_id: ''
      }
    ]);
  };

  const handleRemoveTier = (index) => {
    if (formTiers.length <= 1) {
      addToast('An achievement must have at least one tier', 'warning');
      return;
    }
    const updated = formTiers
      .filter((_, idx) => idx !== index)
      .map((t, idx) => ({ ...t, tier: idx + 1 }));
    setFormTiers(updated);
  };

  const handleTierChange = (index, field, value) => {
    const updated = [...formTiers];
    updated[index] = {
      ...updated[index],
      [field]: field === 'target' || field === 'reward_amount' 
        ? (value === '' ? '' : Math.max(0, parseInt(value, 10) || 0)) 
        : value
    };
    setFormTiers(updated);
  };

  const handleSaveCreate = async (e) => {
    e.preventDefault();
    if (!formId.trim()) {
      addToast('Achievement ID is required', 'warning');
      return;
    }
    if (!formTitle.trim()) {
      addToast('Achievement title is required', 'warning');
      return;
    }
    if (formTiers.some(t => !t.target || t.target <= 0)) {
      addToast('All tier targets must be greater than 0', 'warning');
      return;
    }

    try {
      const payload = {
        id: formId.trim().toLowerCase(),
        title: formTitle.trim(),
        description: formDescription.trim(),
        icon: formIcon.trim() || 'icon_trophy',
        metric: formMetric,
        tiers: formTiers.map(t => ({
          tier: t.tier,
          target: Number(t.target),
          reward_type: t.reward_type,
          reward_amount: (t.reward_type === 'coins' || t.reward_type === 'gems') ? Number(t.reward_amount || 0) : (t.reward_amount ? Number(t.reward_amount) : null),
          reward_item_id: (t.reward_type === 'skin' || t.reward_type === 'powerup') ? t.reward_item_id.trim() || null : null
        }))
      };

      await api.createBackofficeAchievement(payload);
      addToast(`Achievement '${payload.title}' created successfully`, 'success');
      setIsCreateModalOpen(false);
      fetchAchievements();
    } catch (err) {
      addToast(err.message || 'Failed to create achievement', 'error');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      addToast('Achievement title is required', 'warning');
      return;
    }
    if (formTiers.some(t => !t.target || t.target <= 0)) {
      addToast('All tier targets must be greater than 0', 'warning');
      return;
    }

    try {
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        icon: formIcon.trim() || 'icon_trophy',
        metric: formMetric,
        tiers: formTiers.map(t => ({
          tier: t.tier,
          target: Number(t.target),
          reward_type: t.reward_type,
          reward_amount: (t.reward_type === 'coins' || t.reward_type === 'gems') ? Number(t.reward_amount || 0) : (t.reward_amount ? Number(t.reward_amount) : null),
          reward_item_id: (t.reward_type === 'skin' || t.reward_type === 'powerup') ? t.reward_item_id.trim() || null : null
        }))
      };

      await api.updateBackofficeAchievement(editingAchievement.id, payload);
      addToast(`Achievement '${formTitle}' updated successfully`, 'success');
      setIsEditModalOpen(false);
      fetchAchievements();
    } catch (err) {
      addToast(err.message || 'Failed to update achievement', 'error');
    }
  };

  const handleDelete = async (achievementId, title) => {
    if (!window.confirm(`Are you sure you want to delete achievement "${title}" (${achievementId})? This action removes all tiers.`)) {
      return;
    }
    try {
      await api.deleteBackofficeAchievement(achievementId);
      addToast(`Achievement "${title}" removed successfully`, 'success');
      fetchAchievements();
    } catch (err) {
      addToast(err.message || 'Failed to delete achievement', 'error');
    }
  };

  const filteredAchievements = achievements.filter(a => {
    const matchesSearch = 
      (a.title && a.title.toLowerCase().includes(search.toLowerCase())) ||
      (a.id && a.id.toLowerCase().includes(search.toLowerCase())) ||
      (a.description && a.description.toLowerCase().includes(search.toLowerCase()));
    const matchesMetric = selectedMetric === 'all' || a.metric === selectedMetric;
    return matchesSearch && matchesMetric;
  });

  const totalTiersCount = achievements.reduce((acc, a) => acc + (a.tiers?.length || 0), 0);

  return (
    <div>
      {/* Top Metric Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Configured Achievements</span>
            <div className="stat-icon" style={{ background: 'rgba(92, 60, 230, 0.1)', color: 'var(--primary)' }}>
              <Trophy size={20} />
            </div>
          </div>
          <div className="stat-value">{achievements.length}</div>
          <div className="stat-footer">Active milestones tracked in game engine</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Reward Tiers</span>
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--secondary)' }}>
              <Layers size={20} />
            </div>
          </div>
          <div className="stat-value">{totalTiersCount}</div>
          <div className="stat-footer">Progressive progression rewards</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Tracking Metrics</span>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
              <Flame size={20} />
            </div>
          </div>
          <div className="stat-value">{METRIC_OPTIONS.length}</div>
          <div className="stat-footer">Telemetry hooks & event counters</div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="table-header-row" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
            <input
              type="text"
              className="table-search"
              placeholder="Search achievements by name, ID or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Metric:</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              style={{
                background: '#232535',
                border: '1px solid var(--border-color)',
                color: 'white',
                borderRadius: '6px',
                padding: '7px 12px',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Metrics</option>
              {METRIC_OPTIONS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={fetchAchievements}
            style={{ width: 'auto' }}
            title="Refresh Achievements"
          >
            <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={handleReloadCatalog}
            disabled={reloadingCatalog}
            style={{ width: 'auto', borderColor: 'rgba(245, 158, 11, 0.4)' }}
            title="Reload default configuration from disk"
          >
            <RotateCw size={15} style={{ color: 'var(--warning)' }} className={reloadingCatalog ? 'animate-spin' : ''} />
            <span>Reload Defaults</span>
          </button>

          <button className="btn btn-primary" onClick={openCreateModal} style={{ width: 'auto' }}>
            <Plus size={16} />
            <span>New Achievement</span>
          </button>
        </div>
      </div>

      {/* Achievements Cards Grid */}
      {loading ? (
        <div className="table-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <RotateCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <div>Loading achievements catalog...</div>
        </div>
      ) : filteredAchievements.length === 0 ? (
        <div className="table-card" style={{ padding: '48px', textAlign: 'center' }}>
          <Trophy size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
          <h4 style={{ marginBottom: '8px' }}>No achievements found</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
            {search || selectedMetric !== 'all' 
              ? 'Try adjusting your search terms or metric filter.' 
              : 'Configure your first game achievement milestone or reload the default catalog.'}
          </p>
          <button className="btn btn-primary" onClick={openCreateModal} style={{ width: 'auto', margin: '0 auto' }}>
            <Plus size={16} />
            <span>Create First Achievement</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredAchievements.map((ach) => {
            const metricObj = METRIC_OPTIONS.find(m => m.value === ach.metric);
            const MetricIcon = metricObj ? metricObj.icon : Flame;

            return (
              <div 
                key={ach.id} 
                className="table-card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-color)',
                  background: 'linear-gradient(180deg, rgba(23, 24, 34, 0.8) 0%, rgba(19, 20, 31, 0.9) 100%)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Top header */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div 
                        style={{ 
                          width: '42px', 
                          height: '42px', 
                          borderRadius: '10px', 
                          background: 'rgba(92, 60, 230, 0.15)', 
                          border: '1px solid rgba(92, 60, 230, 0.3)',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'var(--accent)'
                        }}
                      >
                        <Trophy size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {ach.title}
                        </h4>
                        <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          ID: {ach.id}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 8px', borderRadius: '6px' }}
                        onClick={() => openEditModal(ach)}
                        title="Edit Achievement"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 8px', borderRadius: '6px' }}
                        onClick={() => handleDelete(ach.id, ach.title)}
                        title="Delete Achievement"
                      >
                        <Trash2 size={13} style={{ color: 'var(--danger)' }} />
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', minHeight: '36px', lineHeight: '1.4' }}>
                    {ach.description || 'No description provided.'}
                  </p>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <span 
                      className="badge" 
                      style={{ 
                        background: 'rgba(92, 60, 230, 0.15)', 
                        color: 'var(--accent)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '5px',
                        padding: '4px 8px',
                        fontSize: '11px'
                      }}
                    >
                      <MetricIcon size={12} />
                      <span>{metricObj ? metricObj.label : ach.metric}</span>
                    </span>

                    <span 
                      className="badge" 
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        color: 'var(--text-muted)', 
                        fontSize: '11px' 
                      }}
                    >
                      Icon: {ach.icon || 'default'}
                    </span>
                  </div>
                </div>

                {/* Tiers List */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Progressive Tiers ({ach.tiers?.length || 0})
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {ach.tiers && ach.tiers.map((tier) => {
                      const rewardTypeObj = REWARD_TYPES.find(r => r.value === tier.reward_type) || REWARD_TYPES[0];
                      const RewardIcon = rewardTypeObj.icon;

                      return (
                        <div 
                          key={tier.tier} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            background: 'rgba(255, 255, 255, 0.03)',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span 
                              style={{ 
                                background: 'rgba(255, 255, 255, 0.08)', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                fontWeight: 700,
                                fontSize: '10px'
                              }}
                            >
                              T{tier.tier}
                            </span>
                            <span style={{ color: 'var(--text-secondary)' }}>Target:</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {(tier.target || 0).toLocaleString()}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: rewardTypeObj.color }}>
                            <RewardIcon size={12} />
                            {tier.reward_type === 'coins' && <span>+{(tier.reward_amount || 0).toLocaleString()}</span>}
                            {tier.reward_type === 'gems' && <span>+{(tier.reward_amount || 0).toLocaleString()}</span>}
                            {tier.reward_type === 'skin' && <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{tier.reward_item_id || 'skin'}</span>}
                            {tier.reward_type === 'powerup' && (
                              <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                                {tier.reward_item_id || 'item'} {tier.reward_amount ? `(x${tier.reward_amount})` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Achievement Modal */}
      {isCreateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Trophy size={20} style={{ color: 'var(--primary)' }} />
                <h3>Create New Achievement</h3>
              </div>
              <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Achievement ID (slug)*</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. merge_master"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Unique identifier for game telemetry</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Metric Category*</label>
                  <select
                    className="form-input"
                    value={formMetric}
                    onChange={(e) => setFormMetric(e.target.value)}
                  >
                    {METRIC_OPTIONS.map(m => (
                      <option key={m.value} value={m.value}>{m.label} ({m.value})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Display Title*</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Master of the Blocks"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Describe how the player earns this achievement..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Icon Asset Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. icon_blocks_merged"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                />
              </div>

              {/* Tiers Builder */}
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                    Reward Tiers ({formTiers.length})
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddTier}
                    style={{ width: 'auto', padding: '4px 10px', fontSize: '12px' }}
                  >
                    <Plus size={14} />
                    <span>Add Tier</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {formTiers.map((tier, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.03)', 
                        border: '1px solid var(--border-color)', 
                        padding: '12px', 
                        borderRadius: '8px',
                        display: 'grid',
                        gridTemplateColumns: '50px 1fr 1fr 1fr 32px',
                        gap: '10px',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent)', fontSize: '13px' }}>
                        T{tier.tier}
                      </div>

                      <div>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="Target"
                          value={tier.target}
                          onChange={(e) => handleTierChange(idx, 'target', e.target.value)}
                          min="1"
                          required
                          style={{ padding: '6px 8px', fontSize: '12px' }}
                          title="Progress Target"
                        />
                      </div>

                      <div>
                        <select
                          className="form-input"
                          value={tier.reward_type}
                          onChange={(e) => handleTierChange(idx, 'reward_type', e.target.value)}
                          style={{ padding: '6px 8px', fontSize: '12px' }}
                        >
                          {REWARD_TYPES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        {tier.reward_type === 'coins' || tier.reward_type === 'gems' ? (
                          <input
                            type="number"
                            className="form-input"
                            placeholder="Amount"
                            value={tier.reward_amount}
                            onChange={(e) => handleTierChange(idx, 'reward_amount', e.target.value)}
                            min="1"
                            required
                            style={{ padding: '6px 8px', fontSize: '12px' }}
                            title="Reward Currency Amount"
                          />
                        ) : (
                          <input
                            type="text"
                            className="form-input"
                            placeholder={tier.reward_type === 'skin' ? 'Skin ID' : 'Powerup ID'}
                            value={tier.reward_item_id}
                            onChange={(e) => handleTierChange(idx, 'reward_item_id', e.target.value)}
                            required
                            style={{ padding: '6px 8px', fontSize: '12px' }}
                            title="Reward Item ID"
                          />
                        )}
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleRemoveTier(idx)}
                        style={{ padding: '6px', color: 'var(--danger)', width: '32px', height: '32px' }}
                        title="Remove Tier"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Achievement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Achievement Modal */}
      {isEditModalOpen && editingAchievement && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit2 size={18} style={{ color: 'var(--primary)' }} />
                <h3>Edit Achievement: {editingAchievement.title}</h3>
              </div>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Achievement ID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formId}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>ID cannot be modified once created</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Metric Category*</label>
                  <select
                    className="form-input"
                    value={formMetric}
                    onChange={(e) => setFormMetric(e.target.value)}
                  >
                    {METRIC_OPTIONS.map(m => (
                      <option key={m.value} value={m.value}>{m.label} ({m.value})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Display Title*</label>
                <input
                  type="text"
                  className="form-input"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Icon Asset Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                />
              </div>

              {/* Tiers Builder */}
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                    Reward Tiers ({formTiers.length})
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddTier}
                    style={{ width: 'auto', padding: '4px 10px', fontSize: '12px' }}
                  >
                    <Plus size={14} />
                    <span>Add Tier</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {formTiers.map((tier, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.03)', 
                        border: '1px solid var(--border-color)', 
                        padding: '12px', 
                        borderRadius: '8px',
                        display: 'grid',
                        gridTemplateColumns: '50px 1fr 1fr 1fr 32px',
                        gap: '10px',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent)', fontSize: '13px' }}>
                        T{tier.tier}
                      </div>

                      <div>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="Target"
                          value={tier.target}
                          onChange={(e) => handleTierChange(idx, 'target', e.target.value)}
                          min="1"
                          required
                          style={{ padding: '6px 8px', fontSize: '12px' }}
                          title="Progress Target"
                        />
                      </div>

                      <div>
                        <select
                          className="form-input"
                          value={tier.reward_type}
                          onChange={(e) => handleTierChange(idx, 'reward_type', e.target.value)}
                          style={{ padding: '6px 8px', fontSize: '12px' }}
                        >
                          {REWARD_TYPES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        {tier.reward_type === 'coins' || tier.reward_type === 'gems' ? (
                          <input
                            type="number"
                            className="form-input"
                            placeholder="Amount"
                            value={tier.reward_amount}
                            onChange={(e) => handleTierChange(idx, 'reward_amount', e.target.value)}
                            min="1"
                            required
                            style={{ padding: '6px 8px', fontSize: '12px' }}
                            title="Reward Currency Amount"
                          />
                        ) : (
                          <input
                            type="text"
                            className="form-input"
                            placeholder={tier.reward_type === 'skin' ? 'Skin ID' : 'Powerup ID'}
                            value={tier.reward_item_id}
                            onChange={(e) => handleTierChange(idx, 'reward_item_id', e.target.value)}
                            required
                            style={{ padding: '6px 8px', fontSize: '12px' }}
                            title="Reward Item ID"
                          />
                        )}
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleRemoveTier(idx)}
                        style={{ padding: '6px', color: 'var(--danger)', width: '32px', height: '32px' }}
                        title="Remove Tier"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '24px' }}>
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
    </div>
  );
}
