import React, { useEffect, useState } from 'react';
import { Download, Star, ShieldAlert, Award, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function PlayStoreStats({ addToast }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayStoreStats = async () => {
      try {
        const data = await api.getPlayStoreStats();
        setStats(data);
      } catch (err) {
        addToast(err.message || 'Failed to fetch Play Store statistics', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPlayStoreStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading Play Store statistics...</p>
      </div>
    );
  }

  if (!stats) return null;

  // SVGs Chart setup
  const chartWidth = 500;
  const chartHeight = 180;
  const padding = 30;
  const points = stats.daily_downloads || [];
  const maxDownloads = Math.max(...points.map(p => p.downloads), 1);

  const svgPoints = points.map((p, index) => {
    const x = padding + (index / (points.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (p.downloads / maxDownloads) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = points.length > 0
    ? `${padding},${chartHeight - padding} ` + svgPoints + ` ${chartWidth - padding},${chartHeight - padding}`
    : '';

  // App health rates
  const crashRate = ((stats.crashes_30d / stats.active_installs) * 100).toFixed(2);
  const anrRate = ((stats.anr_30d / stats.active_installs) * 100).toFixed(2);

  return (
    <div>
      {/* Top Cards grid */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">Total Downloads</span>
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Download size={20} />
            </div>
          </div>
          <span className="stats-value">{stats.total_downloads.toLocaleString()}</span>
          <span className="stats-change positive">
            <span>+15.2%</span> lifetime downloads growth
          </span>
        </div>

        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">Active Installs (Devices)</span>
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <span className="stats-value">{stats.active_installs.toLocaleString()}</span>
          <span className="stats-change positive">
            <span>42.1%</span> user retention rate
          </span>
        </div>

        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">Store Rating / Reviews</span>
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Star size={20} />
            </div>
          </div>
          <span className="stats-value">{stats.average_rating} ★</span>
          <span className="stats-change positive">
            <span>{stats.total_reviews}</span> total reviews
          </span>
        </div>

        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">App Stability (30d)</span>
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
              <ShieldAlert size={20} />
            </div>
          </div>
          <span className="stats-value">{stats.crashes_30d} Crashes / {stats.anr_30d} ANRs</span>
          <span className="stats-change negative">
            <span>{crashRate}%</span> device crash rate
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid" style={{ gridTemplateColumns: '7fr 5fr' }}>
        
        {/* Daily downloads trend */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <span className="chart-title">Daily Downloads Trend (7d)</span>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Daily Android installations overview</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '190px' }}>
            <svg width="100%" height="180" viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="playstore-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="rgba(255,255,255,0.04)" strokeDasharray="3" />
              <line x1={padding} y1={(chartHeight - padding) / 2} x2={chartWidth - padding} y2={(chartHeight - padding) / 2} stroke="rgba(255,255,255,0.04)" strokeDasharray="3" />
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.08)" />

              {/* Area path */}
              {points.length > 0 && <polygon points={areaPoints} fill="url(#playstore-area-grad)" />}

              {/* Line path */}
              {points.length > 0 && <polyline points={svgPoints} fill="none" stroke="#3b82f6" strokeWidth="3" />}

              {/* Data points */}
              {points.map((p, index) => {
                const x = padding + (index / (points.length - 1)) * (chartWidth - padding * 2);
                const y = chartHeight - padding - (p.downloads / maxDownloads) * (chartHeight - padding * 2);
                return (
                  <g key={index}>
                    <circle cx={x} cy={y} r="4" fill="var(--text-primary)" stroke="#3b82f6" strokeWidth="2" />
                    <text x={x} y={y - 8} fill="var(--text-primary)" fontSize="9" textAnchor="middle" fontWeight="600">
                      {p.downloads}
                    </text>
                    <text x={x} y={chartHeight - 10} fill="var(--text-secondary)" fontSize="9" textAnchor="middle">
                      {p.date}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Application health status details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="chart-card" style={{ flexGrow: 1 }}>
            <div className="chart-header" style={{ marginBottom: '16px' }}>
              <span className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
                <span>Play Store Vitals</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Crash rate (30d)</span>
                  <span style={{ fontWeight: 600, color: crashRate > 1.0 ? 'var(--danger)' : 'var(--success)' }}>{crashRate}%</span>
                </div>
                <div style={{ height: '6px', background: '#222533', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--danger)', width: `${Math.min(crashRate * 10, 100)}%` }} />
                </div>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>Google Play bad behavior threshold: 1.09%</p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>ANR rate (30d)</span>
                  <span style={{ fontWeight: 600, color: anrRate > 0.47 ? 'var(--danger)' : 'var(--success)' }}>{anrRate}%</span>
                </div>
                <div style={{ height: '6px', background: '#222533', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--warning)', width: `${Math.min(anrRate * 20, 100)}%` }} />
                </div>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>Google Play bad behavior threshold: 0.47%</p>
              </div>
            </div>
          </div>

          <div className="chart-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(168, 85, 247, 0.2)', background: 'rgba(168, 85, 247, 0.02)' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>30d Uninstalls Volume</span>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{stats.uninstalls_30d.toLocaleString()} devices</h4>
            </div>
            <Download size={24} style={{ color: 'var(--text-secondary)', transform: 'rotate(180deg)' }} />
          </div>

        </div>

      </div>
    </div>
  );
}
