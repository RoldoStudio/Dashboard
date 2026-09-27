import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trophy, 
  Award, 
  Coins, 
  Gem, 
  Gift, 
  Zap, 
  CheckCircle, 
  Lock, 
  Search, 
  RotateCw, 
  Sparkles, 
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../api';

// Sample achievements for preview / demo when unauthenticated
const SAMPLE_ACHIEVEMENTS = [
  {
    id: "first_merge",
    title: "First Steps",
    description: "Merge your first blocks together on the game grid",
    icon: "play",
    metric: "total_blocks_merged",
    current_progress: 1,
    is_completed: true,
    tiers: [
      { tier: 1, target: 1, reward_type: "coins", reward_amount: 100, reward_item_id: null, is_completed: true, is_claimed: true, can_claim: false }
    ]
  },
  {
    id: "merge_master",
    title: "Block Merger",
    description: "Merge blocks to reach higher numbers and clear board space",
    icon: "flame",
    metric: "total_blocks_merged",
    current_progress: 350,
    is_completed: false,
    tiers: [
      { tier: 1, target: 100, reward_type: "coins", reward_amount: 500, reward_item_id: null, is_completed: true, is_claimed: true, can_claim: false },
      { tier: 2, target: 500, reward_type: "coins", reward_amount: 1500, reward_item_id: null, is_completed: false, is_claimed: false, can_claim: false },
      { tier: 3, target: 2000, reward_type: "gems", reward_amount: 25, reward_item_id: null, is_completed: false, is_claimed: false, can_claim: false }
    ]
  },
  {
    id: "level_conqueror",
    title: "Level Conqueror",
    description: "Complete levels and advance through the world map",
    icon: "award",
    metric: "levels_completed",
    current_progress: 12,
    is_completed: false,
    tiers: [
      { tier: 1, target: 5, reward_type: "coins", reward_amount: 1000, reward_item_id: null, is_completed: true, is_claimed: true, can_claim: false },
      { tier: 2, target: 10, reward_type: "gems", reward_amount: 10, reward_item_id: null, is_completed: true, is_claimed: false, can_claim: true },
      { tier: 3, target: 25, reward_type: "skin", reward_amount: 1, reward_item_id: "skin_golden_sphere", is_completed: false, is_claimed: false, can_claim: false }
    ]
  },
  {
    id: "power_player",
    title: "Powerup Specialist",
    description: "Deploy strategic powerups during critical puzzle situations",
    icon: "zap",
    metric: "total_powerups_used",
    current_progress: 8,
    is_completed: false,
    tiers: [
      { tier: 1, target: 5, reward_type: "coins", reward_amount: 750, reward_item_id: null, is_completed: true, is_claimed: true, can_claim: false },
      { tier: 2, target: 20, reward_type: "powerup", reward_amount: 3, reward_item_id: "rainbow_blast", is_completed: false, is_claimed: false, can_claim: false }
    ]
  }
];

export default function Achievements({ addToast }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'claimable', 'in_progress', 'completed'
  const [expandedId, setExpandedId] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [claimingTier, setClaimingTier] = useState(null);

  const playerToken = api.getPlayerToken();

  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAchievements(playerToken || undefined);
      if (data && data.achievements) {
        setAchievements(data.achievements);
        setIsDemoMode(false);
      } else {
        throw new Error('No achievements data returned');
      }
    } catch (err) {
      // Fallback to sample data for administrative overview
      setIsDemoMode(true);
      setAchievements(SAMPLE_ACHIEVEMENTS);
      if (playerToken) {
        addToast(`Achievements API: ${err.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [playerToken, addToast]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const handleClaim = async (achievementId, tierNum) => {
    setClaimingTier(`${achievementId}_${tierNum}`);
    try {
      if (!isDemoMode && playerToken) {
        const response = await api.claimAchievement(achievementId, tierNum, playerToken);
        addToast(`Claimed Tier ${tierNum} reward! Added ${response.reward_amount || ''} ${response.reward_type}`, 'success');
        fetchAchievements();
      } else {
        // Local demo claim simulation
        await new Promise(r => setTimeout(r, 400));
        setAchievements(prev => prev.map(ach => {
          if (ach.id !== achievementId) return ach;
          return {
            ...ach,
            tiers: ach.tiers.map(t => {
              if (t.tier === tierNum) {
                return { ...t, is_claimed: true, can_claim: false };
              }
              return t;
            })
          };
        }));
        addToast(`(Demo) Claimed Tier ${tierNum} reward!`, 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to claim reward', 'error');
    } finally {
      setClaimingTier(null);
    }
  };

  // Compute statistics
  const totalAchievements = achievements.length;
  const completedAchievements = achievements.filter(a => a.is_completed).length;
  
  let totalTiersCount = 0;
  let claimableTiersCount = 0;
  let totalCoinsInPool = 0;
  let totalGemsInPool = 0;

  achievements.forEach(a => {
    (a.tiers || []).forEach(t => {
      totalTiersCount++;
      if (t.can_claim) claimableTiersCount++;
      if (t.reward_type === 'coins' && t.reward_amount) totalCoinsInPool += t.reward_amount;
      if (t.reward_type === 'gems' && t.reward_amount) totalGemsInPool += t.reward_amount;
    });
  });

  // Filter achievements
  const filteredAchievements = achievements.filter(ach => {
    const matchesSearch = ach.title.toLowerCase().includes(search.toLowerCase()) ||
                          ach.description.toLowerCase().includes(search.toLowerCase()) ||
                          ach.id.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    if (statusFilter === 'claimable') {
      return (ach.tiers || []).some(t => t.can_claim);
    }
    if (statusFilter === 'completed') {
      return ach.is_completed;
    }
    if (statusFilter === 'in_progress') {
      return !ach.is_completed;
    }
    return true;
  });

  const getRewardIcon = (type) => {
    switch (type) {
      case 'coins': return <Coins size={14} style={{ color: '#f59e0b' }} />;
      case 'gems': return <Gem size={14} style={{ color: 'var(--accent)' }} />;
      case 'powerup': return <Zap size={14} style={{ color: 'var(--success)' }} />;
      case 'skin': return <Gift size={14} style={{ color: '#3b82f6' }} />;
      default: return <Award size={14} />;
    }
  };

  return (
    <div>
      {/* Top Metrics Cards Grid */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">Total Achievements</span>
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(92, 60, 230, 0.1)', color: 'var(--primary)' }}>
              <Trophy size={20} />
            </div>
          </div>
          <span className="stats-value">{totalAchievements}</span>
          <span className="stats-change positive">
            <span>{totalTiersCount}</span> total milestone tiers
          </span>
        </div>

        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">Completion Status</span>
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
              <CheckCircle size={20} />
            </div>
          </div>
          <span className="stats-value">{completedAchievements} / {totalAchievements}</span>
          <span className="stats-change positive">
            <span>{totalAchievements > 0 ? ((completedAchievements / totalAchievements) * 100).toFixed(0) : 0}%</span> fully completed
          </span>
        </div>

        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">Claimable Tiers</span>
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Sparkles size={20} />
            </div>
          </div>
          <span className="stats-value" style={{ color: claimableTiersCount > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
            {claimableTiersCount}
          </span>
          <span className="stats-change positive">
            <span>Ready to claim</span>
          </span>
        </div>

        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">Reward Pool Potential</span>
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent)' }}>
              <Award size={20} />
            </div>
          </div>
          <span className="stats-value" style={{ fontSize: '20px' }}>
            {totalCoinsInPool.toLocaleString()} C / {totalGemsInPool} G
          </span>
          <span className="stats-change positive">
            <span>Lifetime unlockable currency</span>
          </span>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div style={{ 
          background: 'rgba(245, 158, 11, 0.08)', 
          border: '1px solid rgba(245, 158, 11, 0.3)', 
          borderRadius: '10px', 
          padding: '12px 16px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
            <strong>Demo Catalog Mode:</strong> Viewing preview achievements. To inspect live player progress or claim rewards on the live backend, configure a Player Bearer token in the <strong>Wheel of Fortune → Player Session Auth</strong> tab.
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="table-header-row" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
            <input
              type="text"
              className="table-search"
              placeholder="Search achievements by title, ID, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'claimable', label: `Claimable (${claimableTiersCount})` },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'completed', label: 'Completed' }
            ].map(f => (
              <button
                key={f.id}
                className={`btn ${statusFilter === f.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(f.id)}
                style={{ width: 'auto', padding: '8px 14px', fontSize: '12px' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={fetchAchievements} 
          style={{ width: 'auto' }}
          title="Refresh Achievements"
        >
          <RotateCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Achievements List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading achievements catalog...</p>
        </div>
      ) : filteredAchievements.length === 0 ? (
        <div className="table-card" style={{ textAlign: 'center', padding: '40px' }}>
          <Trophy size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.5 }} />
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>No achievements match your filter</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Try clearing the search query or changing the filter criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredAchievements.map((ach) => {
            const isExpanded = expandedId === ach.id;
            const highestTier = ach.tiers && ach.tiers.length > 0 
              ? ach.tiers[ach.tiers.length - 1] 
              : { target: 1 };
            const maxTarget = highestTier.target || 1;
            const progressPct = Math.min(100, Math.round(((ach.current_progress || 0) / maxTarget) * 100));

            return (
              <div 
                key={ach.id} 
                className="table-card"
                style={{
                  border: ach.is_completed 
                    ? '1px solid rgba(16, 185, 129, 0.3)' 
                    : (ach.tiers || []).some(t => t.can_claim) 
                      ? '1px solid rgba(245, 158, 11, 0.4)' 
                      : '1px solid var(--border-color)',
                  transition: 'var(--transition-smooth)'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flex: 1, minWidth: '240px' }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '12px', 
                      background: ach.is_completed 
                        ? 'rgba(16, 185, 129, 0.15)' 
                        : 'rgba(92, 60, 230, 0.15)',
                      color: ach.is_completed ? 'var(--success)' : 'var(--primary)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Trophy size={24} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '16px', color: 'var(--text-title)', fontWeight: '700' }}>
                          {ach.title}
                        </h4>
                        <code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ach.id}</code>
                        {ach.is_completed && (
                          <span style={{ 
                            fontSize: '10px', 
                            fontWeight: '700', 
                            background: 'rgba(16, 185, 129, 0.15)', 
                            color: 'var(--success)', 
                            padding: '2px 8px', 
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            Completed
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {ach.description}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Progress Bar & Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ minWidth: '180px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Metric: <code>{ach.metric}</code></span>
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                          {(ach.current_progress || 0).toLocaleString()} / {maxTarget.toLocaleString()}
                        </span>
                      </div>
                      {/* Visual progress track */}
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${progressPct}%`, 
                            background: ach.is_completed 
                              ? 'var(--success)' 
                              : 'linear-gradient(90deg, var(--primary), var(--accent))',
                            borderRadius: '4px',
                            transition: 'width 0.4s ease'
                          }} 
                        />
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary"
                      onClick={() => setExpandedId(isExpanded ? null : ach.id)}
                      style={{ width: 'auto', padding: '6px 10px' }}
                      title={isExpanded ? 'Collapse Tiers' : 'Expand Tiers'}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                </div>

                {/* Tiers Breakdown (expanded or always mini-preview) */}
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    {(ach.tiers || []).map((tier) => {
                      const isClaiming = claimingTier === `${ach.id}_${tier.tier}`;
                      return (
                        <div 
                          key={tier.tier}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            background: tier.is_claimed 
                              ? 'rgba(16, 185, 129, 0.04)' 
                              : tier.can_claim 
                                ? 'rgba(245, 158, 11, 0.08)' 
                                : 'rgba(255, 255, 255, 0.02)',
                            border: tier.is_claimed 
                              ? '1px solid rgba(16, 185, 129, 0.2)' 
                              : tier.can_claim 
                                ? '1px solid rgba(245, 158, 11, 0.3)' 
                                : '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-title)' }}>
                              Tier {tier.tier}
                            </span>

                            {tier.is_claimed ? (
                              <span style={{ fontSize: '11px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={12} /> Claimed
                              </span>
                            ) : tier.can_claim ? (
                              <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '700' }}>
                                ★ Claimable!
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Lock size={12} /> Locked
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              Goal: <strong style={{ color: 'var(--text-primary)' }}>{tier.target.toLocaleString()}</strong>
                            </span>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                              {getRewardIcon(tier.reward_type)}
                              <span>
                                {tier.reward_amount ? tier.reward_amount.toLocaleString() : ''} {tier.reward_item_id || tier.reward_type}
                              </span>
                            </div>
                          </div>

                          {/* Claim button if eligible */}
                          {tier.can_claim && (
                            <button
                              className="btn btn-primary"
                              disabled={isClaiming}
                              onClick={() => handleClaim(ach.id, tier.tier)}
                              style={{ 
                                marginTop: '4px', 
                                padding: '6px 10px', 
                                fontSize: '11px', 
                                background: '#f59e0b', 
                                borderColor: '#d97706' 
                              }}
                            >
                              {isClaiming ? 'Claiming...' : 'Claim Tier Reward'}
                            </button>
                          )}
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
    </div>
  );
}
