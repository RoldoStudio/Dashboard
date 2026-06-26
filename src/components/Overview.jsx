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

      {/* Visual Analytics Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Level Progression Distribution</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active players per level</span>
          </div>

          <div className="chart-container">
            {levels.map((level, idx) => {
              const val = levelValues[idx];
              const heightPct = (val / maxLevelVal) * 100;
              return (
                <div key={level} className="bar-chart-bar">
                  <span className="bar-value">{val}</span>
                  <div className="bar-fill-wrapper">
                    <div 
                      className="bar-fill" 
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="bar-label">{level}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Retention Share</span>
          </div>

          <div className="donut-chart-wrapper">
            {/* Custom Responsive SVG Donut Chart */}
            <svg width="150" height="150" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
              <path
                className="donut-ring"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
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
              <span className="donut-label-value">{stats.guest_to_oauth_conversion_rate}%</span>
              <span className="donut-label-text">Linked Accounts</span>
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
