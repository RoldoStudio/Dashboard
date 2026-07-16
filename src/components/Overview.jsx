import React, { useEffect, useState } from 'react';
import { Users, UserCheck, RefreshCw, BarChart2, Flame, Play, Clock, Award } from 'lucide-react';
import { api } from '../api';

export default function Overview({ addToast }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [levelViewMode, setLevelViewMode] = useState('aggregated'); // 'aggregated', 'range', 'hotspots'
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(20);

  // New backoffice analytics states
  const [retention, setRetention] = useState({ d1: 42.5, d7: 18.2, d30: 6.8 });
  const [hourlyData, setHourlyData] = useState([]);
  const [levelDistribution, setLevelDistribution] = useState([]);
  const [levelStats, setLevelStats] = useState([]);
  const [maxLevelNum, setMaxLevelNum] = useState(1);
  const [loadingDistribution, setLoadingDistribution] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 1. Fetch summary stats
      const summaryData = await api.getStats();
      setStats(summaryData);

      // 2. Fetch player retention
      const retentionData = await api.getPlayerRetention();
      if (retentionData && retentionData.retention_rate) {
        setRetention(retentionData.retention_rate);
      } else if (retentionData) {
        setRetention(retentionData);
      }

      // 3. Fetch hourly activity concurrency
      const hourlyActivityData = await api.getHourlyActivity();
      setHourlyData(hourlyActivityData.hourly_activity || []);

      // 4. Fetch granular level progression stats table
      const progressionStats = await api.getLevelProgressionStats();
      setLevelStats(progressionStats.levels || []);
    } catch (err) {
      addToast(err.message || 'Failed to load stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLevelDistribution = async () => {
    setLoadingDistribution(true);
    try {
      const data = await api.getLevelDistribution({
        mode: levelViewMode,
        range_start: rangeStart,
        range_end: rangeEnd,
        limit: 15
      });
      setLevelDistribution(data.distribution || []);
      if (data.max_level) {
        setMaxLevelNum(data.max_level);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load level distribution', 'error');
    } finally {
      setLoadingDistribution(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLevelDistribution();
  }, [levelViewMode, rangeStart, rangeEnd]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard statistics...</p>
      </div>
    );
  }

  if (!stats) return null;

  const processedChartData = levelDistribution.map(d => ({
    label: d.label,
    value: d.count
  }));

  const chartValues = processedChartData.map(d => d.value);
  const maxChartVal = Math.max(...chartValues, 1);

  //Stickiness Ratio (DAU / MAU)
  const stickinessRatio = stats.active_players_30d > 0 
    ? ((stats.active_players_24h / stats.active_players_30d) * 100).toFixed(1) 
    : 0;

  // Retention Curve Calculations (D0 -> D1 -> D7 -> D30)
  const rWidth = 460;
  const rHeight = 150;
  const yD0 = 25;
  const yD1 = rHeight - (retention.d1 / 100) * (rHeight - 50) - 25;
  const yD7 = rHeight - (retention.d7 / 100) * (rHeight - 50) - 25;
  const yD30 = rHeight - (retention.d30 / 100) * (rHeight - 50) - 25;
  const rPoints = `25,${yD0} 150,${yD1} 275,${yD7} 400,${yD30}`;
  const rAreaPoints = `25,${rHeight - 25} 25,${yD0} 150,${yD1} 275,${yD7} 400,${yD30} 400,${rHeight - 25}`;

  // 24h Hourly Trend Calculations
  const maxActive = hourlyData.length > 0 ? Math.max(...hourlyData.map(d => d.active_players), 1) : 1;
  const hWidth = 460;
  const hHeight = 150;
  const hPoints = hourlyData.map((d, index) => {
    const x = (index / 23) * (hWidth - 50) + 25;
    const y = hHeight - (d.active_players / maxActive) * (hHeight - 50) - 25;
    return `${x},${y}`;
  }).join(' ');
  const hAreaPoints = hourlyData.length > 0
    ? `25,${hHeight - 25} ` + hPoints + ` 435,${hHeight - 25}`
    : '';

  return (
    <div>
      {/* Top Stats Cards Grid */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">Total Player Base</span>
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', color: '#a78bfa' }}>
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
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
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
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent)' }}>
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
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
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
        
        {/* Level distribution bar chart */}
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
                    background: '#232535',
                    border: 'none',
                    color: '#94a3b8',
                    borderRadius: '6px',
                    padding: '6px 12px',
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

          <div className="chart-container" style={{ gap: '12px', overflowX: 'auto', paddingBottom: '8px', height: '200px', alignItems: 'flex-end', justifyContent: 'space-around' }}>
            {processedChartData.length === 0 ? (
              <div style={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', height: '180px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No active progression data found for this selection.
              </div>
            ) : (
              processedChartData.map((dataPoint) => {
                const heightPct = (dataPoint.value / maxChartVal) * 100;
                return (
                  <div key={dataPoint.label} className="bar-chart-bar" style={{ minWidth: '36px' }}>
                    <span className="bar-value" style={{ fontSize: '11px', marginBottom: '4px', fontWeight: '500' }}>{dataPoint.value}</span>
                    <div className="bar-fill-wrapper" style={{ height: '120px', width: '100%', maxWidth: '24px' }}>
                      <div 
                        className="bar-fill" 
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="bar-label" style={{ fontSize: '11px', marginTop: '6px', textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%' }} title={dataPoint.label}>
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
                    stroke="#222533"
                    strokeWidth="3"
                  />
                  {/* Gauge fill */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeDasharray={`${stickinessRatio}, 100`}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>{stickinessRatio}%</span>
                </div>
              </div>
              
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#f43f5e' }}>
                  Low Stickiness
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
                  stroke="#222533"
                  strokeWidth="3.5"
                />
                <path
                  className="donut-segment"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#5c3ce6"
                  strokeWidth="3.5"
                  strokeDasharray={`${stats.guest_to_oauth_conversion_rate}, 100`}
                />
              </svg>

              <div className="donut-label-overlay">
                <span className="donut-label-value" style={{ fontSize: '18px' }}>{stats.guest_to_oauth_conversion_rate}%</span>
                <span className="donut-label-text" style={{ fontSize: '10px' }}>OAuth Linked</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Advanced Visual Analytics Row */}
      <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginTop: '24px', marginBottom: '32px' }}>
        
        {/* Retention cohorts curve */}
        <div className="chart-card">
          <div className="chart-header" style={{ marginBottom: '16px' }}>
            <div>
              <span className="chart-title">Player Retention Cohorts</span>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Percentage of players returning after Day N</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '180px' }}>
            <svg width="100%" height="150" viewBox={`0 0 ${rWidth} ${rHeight}`} style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="retention-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="25" y1="25" x2="400" y2="25" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <line x1="25" y1="65" x2="400" y2="65" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <line x1="25" y1="105" x2="400" y2="105" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <line x1="25" y1="125" x2="400" y2="125" stroke="rgba(255,255,255,0.08)" />

              {/* Area path */}
              <polygon points={rAreaPoints} fill="url(#retention-area-grad)" />

              {/* Line path */}
              <polyline points={rPoints} fill="none" stroke="var(--accent)" strokeWidth="3" />

              {/* Dots & Labels */}
              <circle cx="25" cy={yD0} r="5" fill="var(--text-primary)" stroke="var(--accent)" strokeWidth="2" />
              <text x="25" y={yD0 - 10} fill="var(--text-primary)" fontSize="10" textAnchor="middle" fontWeight="bold">100%</text>
              <text x="25" y={rHeight - 5} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">Install</text>

              <circle cx="150" cy={yD1} r="5" fill="var(--text-primary)" stroke="var(--accent)" strokeWidth="2" />
              <text x="150" y={yD1 - 10} fill="var(--text-primary)" fontSize="10" textAnchor="middle" fontWeight="bold">{retention.d1}%</text>
              <text x="150" y={rHeight - 5} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">Day 1</text>

              <circle cx="275" cy={yD7} r="5" fill="var(--text-primary)" stroke="var(--accent)" strokeWidth="2" />
              <text x="275" y={yD7 - 10} fill="var(--text-primary)" fontSize="10" textAnchor="middle" fontWeight="bold">{retention.d7}%</text>
              <text x="275" y={rHeight - 5} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">Day 7</text>

              <circle cx="400" cy={yD30} r="5" fill="var(--text-primary)" stroke="var(--accent)" strokeWidth="2" />
              <text x="400" y={yD30 - 10} fill="var(--text-primary)" fontSize="10" textAnchor="middle" fontWeight="bold">{retention.d30}%</text>
              <text x="400" y={rHeight - 5} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">Day 30</text>
            </svg>
          </div>
        </div>

        {/* 24h Hourly Active Player Trend */}
        <div className="chart-card">
          <div className="chart-header" style={{ marginBottom: '16px' }}>
            <div>
              <span className="chart-title">Active Players Hourly (24h Trend)</span>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Hourly active concurrency and peak load times</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '180px' }}>
            <svg width="100%" height="150" viewBox={`0 0 ${hWidth} ${hHeight}`} style={{ overflow: 'visible' }}>
              {/* Grid Lines */}
              <line x1="25" y1="25" x2="435" y2="25" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <line x1="25" y1="65" x2="435" y2="65" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <line x1="25" y1="105" x2="435" y2="105" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <line x1="25" y1="125" x2="435" y2="125" stroke="rgba(255,255,255,0.08)" />

              {/* 24 vertical bars representing each hour */}
              {hourlyData.map((d, index) => {
                const x = (index / 23) * (hWidth - 50) + 25 - 4; // Center the 8px wide bar
                const barHeight = (d.active_players / maxActive) * (hHeight - 50);
                const y = hHeight - barHeight - 25;
                return (
                  <rect
                    key={index}
                    x={x}
                    y={y}
                    width="8"
                    height={barHeight}
                    fill="var(--primary)"
                    rx="2"
                  />
                );
              })}

              {/* Time stamps */}
              <text x="25" y={hHeight - 5} fill="var(--text-secondary)" fontSize="9" textAnchor="middle">00:00</text>
              <text x="127" y={hHeight - 5} fill="var(--text-secondary)" fontSize="9" textAnchor="middle">06:00</text>
              <text x="230" y={hHeight - 5} fill="var(--text-secondary)" fontSize="9" textAnchor="middle">12:00</text>
              <text x="332" y={hHeight - 5} fill="var(--text-secondary)" fontSize="9" textAnchor="middle">18:00</text>
              <text x="435" y={hHeight - 5} fill="var(--text-secondary)" fontSize="9" textAnchor="middle">23:00</text>
            </svg>
          </div>
        </div>

      </div>

      {/* Level Progression Stats Table */}
      <div className="table-card" style={{ marginTop: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={16} style={{ color: 'var(--primary)' }} />
          <span>Level Progression Statistics</span>
        </h3>
        <div className="table-container">
          {levelStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
              No level progression statistics available.
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Total Attempts</th>
                  <th>Win Rate</th>
                  <th>Average Stars</th>
                  <th>High Score</th>
                </tr>
              </thead>
              <tbody>
                {levelStats.map(lvl => (
                  <tr key={lvl.level_number}>
                    <td style={{ fontWeight: 600, color: 'var(--text-title)' }}>
                      Level {lvl.level_number}
                    </td>
                    <td>
                      {lvl.total_attempts.toLocaleString()}
                    </td>
                    <td>
                      <span style={{ 
                        color: lvl.win_rate > 50 ? 'var(--success)' : lvl.win_rate > 25 ? 'var(--warning)' : 'var(--danger)',
                        fontWeight: 600
                      }}>
                        {(lvl.win_rate).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>{lvl.avg_stars.toFixed(1)}</span>
                        <span style={{ color: 'var(--text-muted)' }}>/ 3.0</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>
                      {lvl.high_score.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Mini Info Panel */}
      <div className="table-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Dashboard Quick Start</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ padding: '10px', background: 'rgba(92, 60, 230, 0.1)', borderRadius: '10px', color: 'var(--primary)' }}>
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
