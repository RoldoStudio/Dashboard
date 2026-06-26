import React, { useEffect, useState } from 'react';
import { Users, UserCheck, RefreshCw, BarChart2, Flame, Play, Clock, Award } from 'lucide-react';
import { api } from '../api';

export default function Overview({ addToast, isLive }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      addToast(err.message || 'Failed to load stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [isLive]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard statistics...</p>
      </div>
    );
  }

  if (!stats) return null;

  // Level Distribution Data calculation helper
  const levels = Object.keys(stats.level_distribution || {});
  const levelValues = Object.values(stats.level_distribution || {});
  const maxLevelVal = Math.max(...levelValues, 1);

  return (
    <div>
      {/* Top Stats Cards Grid */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">Total Player Base</span>
            <div className="stats-icon-wrapper">
              <Users size={20} />
            </div>
          </div>
          <span className="stats-value">{stats.total_players.toLocaleString()}</span>
          <span className="stats-change positive">
            <span>+12.4%</span> since last month
          </span>
        </div>

        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">Daily Active Users (24h)</span>
            <div className="stats-icon-wrapper" style={{ color: 'var(--success)' }}>
              <Flame size={20} />
            </div>
          </div>
          <span className="stats-value">{stats.active_players_24h.toLocaleString()}</span>
          <span className="stats-change positive">
            <span>+5.8%</span> compared to yesterday
          </span>
        </div>

        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">Monthly Active (30d)</span>
            <div className="stats-icon-wrapper" style={{ color: 'var(--accent)' }}>
              <UserCheck size={20} />
            </div>
          </div>
          <span className="stats-value">{stats.active_players_30d.toLocaleString()}</span>
          <span className="stats-change positive">
            <span>+8.2%</span> user growth
          </span>
        </div>

        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">OAuth Conv. Rate</span>
            <div className="stats-icon-wrapper" style={{ color: 'var(--warning)' }}>
              <RefreshCw size={20} />
            </div>
          </div>
          <span className="stats-value">{stats.guest_to_oauth_conversion_rate}%</span>
          <span className="stats-change positive">
            <span>+3.1%</span> binding optimization
          </span>
        </div>
      </div>

  // Level distribution parsing
  const rawLevelPairs = Object.entries(stats.level_distribution || {})
    .map(([lvl, val]) => ({ level: parseInt(lvl) || 0, count: parseInt(val) || 0 }))
    .sort((a, b) => a.level - b.level);

  const maxLevelNum = rawLevelPairs.length > 0 ? Math.max(...rawLevelPairs.map(p => p.level), 1) : 1;

  // Level Chart states
  const [levelViewMode, setLevelViewMode] = useState('aggregated'); // 'aggregated', 'range', 'hotspots'
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(Math.min(maxLevelNum, 20));

  // Determine dynamic bin size for aggregated view
  let binSize = 1;
  if (maxLevelNum > 10 && maxLevelNum <= 50) binSize = 5;
  else if (maxLevelNum > 50 && maxLevelNum <= 200) binSize = 20;
  else if (maxLevelNum > 200 && maxLevelNum <= 1000) binSize = 100;
  else if (maxLevelNum > 1000 && maxLevelNum <= 5000) binSize = 500;
  else if (maxLevelNum > 5000) binSize = 1000;

  // Process data based on mode
  let processedChartData = [];
  
  if (levelViewMode === 'aggregated' && maxLevelNum > 10) {
    // Group levels into bins (e.g. 1-10, 11-20, etc.)
    const bins = {};
    for (let i = 1; i <= maxLevelNum; i += binSize) {
      const binLabel = `${i}-${Math.min(i + binSize - 1, maxLevelNum)}`;
      bins[binLabel] = 0;
    }
    
    rawLevelPairs.forEach(pair => {
      const binIndex = Math.floor((pair.level - 1) / binSize) * binSize + 1;
      const binLabel = `${binIndex}-${Math.min(binIndex + binSize - 1, maxLevelNum)}`;
      if (bins[binLabel] !== undefined) {
        bins[binLabel] += pair.count;
      }
    });

    processedChartData = Object.entries(bins).map(([label, val]) => ({
      label,
      value: val
    }));
  } else if (levelViewMode === 'range') {
    // Show each level individually in custom range
    const start = Math.max(1, rangeStart);
    const end = Math.min(maxLevelNum, rangeEnd);
    
    // Seed all levels in range with 0
    const rangeMap = {};
    for (let i = start; i <= end; i++) {
      rangeMap[i] = 0;
    }
    rawLevelPairs.forEach(pair => {
      if (pair.level >= start && pair.level <= end) {
        rangeMap[pair.level] = pair.count;
      }
    });
    processedChartData = Object.entries(rangeMap).map(([label, val]) => ({
      label: `Lvl ${label}`,
      value: val
    }));
  } else {
    // 'hotspots' or 'aggregated' when level count is <= 10
    // Show top 15 most active levels
    processedChartData = [...rawLevelPairs]
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .sort((a, b) => a.level - b.level)
      .map(pair => ({
        label: `Lvl ${pair.level}`,
        value: pair.count
      }));
  }

  const chartValues = processedChartData.map(d => d.value);
  const maxChartVal = Math.max(...chartValues, 1);

  //Stickiness Ratio (DAU / MAU)
  const stickinessRatio = stats.active_players_30d > 0 
    ? ((stats.active_players_24h / stats.active_players_30d) * 100).toFixed(1) 
    : 0;

  return (
    <div>
      {/* Top Stats Cards Grid */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">Total Player Base</span>
            <div className="stats-icon-wrapper">
              <Users size={20} />
            </div>
          </div>
          <span className="stats-value">{stats.total_players.toLocaleString()}</span>
          <span className="stats-change positive">
            <span>+12.4%</span> since last month
          </span>
        </div>

        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">Daily Active Users (24h)</span>
            <div className="stats-icon-wrapper" style={{ color: 'var(--success)' }}>
              <Flame size={20} />
            </div>
          </div>
          <span className="stats-value">{stats.active_players_24h.toLocaleString()}</span>
          <span className="stats-change positive">
            <span>+5.8%</span> compared to yesterday
          </span>
        </div>

        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">Monthly Active (30d)</span>
            <div className="stats-icon-wrapper" style={{ color: 'var(--accent)' }}>
              <UserCheck size={20} />
            </div>
          </div>
          <span className="stats-value">{stats.active_players_30d.toLocaleString()}</span>
          <span className="stats-change positive">
            <span>+8.2%</span> user growth
          </span>
        </div>

        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">OAuth Conv. Rate</span>
            <div className="stats-icon-wrapper" style={{ color: 'var(--warning)' }}>
              <RefreshCw size={20} />
            </div>
          </div>
          <span className="stats-value">{stats.guest_to_oauth_conversion_rate}%</span>
          <span className="stats-change positive">
            <span>+3.1%</span> binding optimization
          </span>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="charts-grid" style={{ gridTemplateColumns: '7fr 5fr' }}>
        
        {/* REDESIGNED Level progression bar chart */}
        <div className="chart-card">
          <div className="chart-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div>
                <span className="chart-title">Level Distribution</span>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Active players max level reached</p>
              </div>
              
              {/* Controls */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select 
                  value={levelViewMode} 
                  onChange={(e) => setLevelViewMode(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="aggregated">Aggregated View</option>
                  <option value="hotspots">Top 15 Hotspots</option>
                  <option value="range">Custom Range</option>
                </select>
              </div>
            </div>

            {/* Custom Range Inputs */}
            {levelViewMode === 'range' && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', width: '100%' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Show levels from:</span>
                <input 
                  type="number" 
                  value={rangeStart}
                  onChange={(e) => setRangeStart(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: '60px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', padding: '2px 6px', fontSize: '12px', textAlign: 'center' }}
                  min="1"
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
                <input 
                  type="number" 
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(Math.max(rangeStart, parseInt(e.target.value) || rangeStart))}
                  style={{ width: '60px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', padding: '2px 6px', fontSize: '12px', textAlign: 'center' }}
                  min={rangeStart}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(Max level reached: {maxLevelNum})</span>
              </div>
            )}
          </div>

          <div className="chart-container" style={{ gap: '4px', overflowX: 'auto', paddingBottom: '8px' }}>
            {processedChartData.length === 0 ? (
              <div style={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', height: '180px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No active progression data found for this selection.
              </div>
            ) : (
              processedChartData.map((dataPoint) => {
                const heightPct = (dataPoint.value / maxChartVal) * 100;
                return (
                  <div key={dataPoint.label} className="bar-chart-bar" style={{ minWidth: '36px' }}>
                    <span className="bar-value" style={{ fontSize: '9px' }}>{dataPoint.value}</span>
                    <div className="bar-fill-wrapper" style={{ height: '150px', width: '100%', maxWidth: '24px' }}>
                      <div 
                        className="bar-fill" 
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="bar-label" style={{ fontSize: '9px', textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%' }} title={dataPoint.label}>
                      {dataPoint.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Double Analytics Sideboard (Stickiness Ratio & Linked Accounts) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Stickiness Metric Card */}
          <div className="chart-card" style={{ flexGrow: 1 }}>
            <div className="chart-header" style={{ marginBottom: '12px' }}>
              <span className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart2 size={16} style={{ color: 'var(--success)' }} />
                <span>Player Stickiness (DAU/MAU)</span>
              </span>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '10px 0' }}>
              <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="90" height="90" viewBox="0 0 36 36">
                  {/* Background track */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.03)"
                    strokeWidth="3"
                  />
                  {/* Gauge fill */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="url(#gradient-success)"
                    strokeWidth="3.5"
                    strokeDasharray={`${stickinessRatio}, 100`}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                  <defs>
                    <linearGradient id="gradient-success" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>{stickinessRatio}%</span>
                </div>
              </div>
              
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: stickinessRatio >= 20 ? 'var(--success)' : stickinessRatio >= 10 ? 'var(--warning)' : 'var(--danger)' }}>
                  {stickinessRatio >= 20 ? 'Excellent Engagement' : stickinessRatio >= 10 ? 'Good Stability' : 'Low Stickiness'}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                  A DAU/MAU ratio of 20%+ is top-tier in hypercasual gaming, showing recurring daily play.
                </p>
              </div>
            </div>
          </div>

          {/* Linked Account Conversion Share */}
          <div className="chart-card">
            <div className="chart-header" style={{ marginBottom: '8px' }}>
              <span className="chart-title">Linked Accounts (CVR)</span>
            </div>

            <div className="donut-chart-wrapper" style={{ height: '140px' }}>
              <svg width="110" height="110" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                <path
                  className="donut-ring"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.03)"
                  strokeWidth="3.5"
                />
                <path
                  className="donut-segment"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="url(#gradient-accent)"
                  strokeWidth="3.5"
                  strokeDasharray={`${stats.guest_to_oauth_conversion_rate}, 100`}
                />
                <defs>
                  <linearGradient id="gradient-accent" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--accent)" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="donut-label-overlay">
                <span className="donut-label-value" style={{ fontSize: '18px' }}>{stats.guest_to_oauth_conversion_rate}%</span>
                <span className="donut-label-text" style={{ fontSize: '10px' }}>OAuth Linked</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Mini Info Panel */}
      <div className="table-card">
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Dashboard Quick Start</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px', color: 'var(--primary)' }}>
              <Play size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>Real-time Monitoring</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Monitor active levels, stars, coins, and custom inventories from the single unified administrative interface.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', color: 'var(--success)' }}>
              <Award size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>Backoffice Integrity</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Directly adjust balances, inspect gameplay transactions, and deactivate users for security compliance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
