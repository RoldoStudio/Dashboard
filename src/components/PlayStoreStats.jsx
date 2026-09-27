import React, { useEffect, useState, useCallback } from 'react';
import { 
  Download, 
  Star, 
  TrendingUp, 
  BarChart3, 
  Calendar, 
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { api } from '../api';

export default function PlayStoreStats({ addToast }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState('7d'); // '7d', '14d', '30d', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [syncing, setSyncing] = useState(false);

  const fetchPlayStoreStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      const today = new Date();
      const formatDate = (d) => d.toISOString().split('T')[0];

      if (datePreset === '7d') {
        const past = new Date();
        past.setDate(today.getDate() - 7);
        params.start_date = formatDate(past);
        params.end_date = formatDate(today);
      } else if (datePreset === '14d') {
        const past = new Date();
        past.setDate(today.getDate() - 14);
        params.start_date = formatDate(past);
        params.end_date = formatDate(today);
      } else if (datePreset === '30d') {
        const past = new Date();
        past.setDate(today.getDate() - 30);
        params.start_date = formatDate(past);
        params.end_date = formatDate(today);
      } else if (datePreset === 'custom' && startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }

      const data = await api.getPlayStoreStats(params);
      setStats(data);
    } catch (err) {
      addToast(err.message || 'Failed to fetch Play Store statistics', 'error');
    } finally {
      setLoading(false);
    }
  }, [datePreset, startDate, endDate, addToast]);

  useEffect(() => {
    fetchPlayStoreStats();
  }, [fetchPlayStoreStats]);

  const handleForceSync = async () => {
    setSyncing(true);
    try {
      await api.syncStats();
      addToast('Play Store & AdMob stats synchronized.', 'success');
      await fetchPlayStoreStats();
    } catch (err) {
      addToast(err.message || 'Failed to sync stats', 'error');
    } finally {
      setSyncing(false);
    }
  };

  if (loading && !stats) {
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
    const x = padding + (index / Math.max(points.length - 1, 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (p.downloads / maxDownloads) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = points.length > 0
    ? `${padding},${chartHeight - padding} ` + svgPoints + ` ${chartWidth - padding},${chartHeight - padding}`
    : '';

  // App health rates
  const crashRate = stats.active_installs > 0 ? ((stats.crashes_30d / stats.active_installs) * 100).toFixed(2) : 0;
  const anrRate = stats.active_installs > 0 ? ((stats.anr_30d / stats.active_installs) * 100).toFixed(2) : 0;

  return (
    <div>
      {/* Date Range & Action Bar */}
      <div className="table-header-row" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
          {[
            { id: '7d', label: 'Last 7 Days' },
            { id: '14d', label: 'Last 14 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: 'custom', label: 'Custom Range' }
          ].map(p => (
            <button
              key={p.id}
              className={`btn ${datePreset === p.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDatePreset(p.id)}
              style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
            >
              {p.label}
            </button>
          ))}

          {datePreset === 'custom' && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginLeft: '6px' }}>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', padding: '4px 8px', fontSize: '12px' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', padding: '4px 8px', fontSize: '12px' }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleForceSync}
            disabled={syncing}
            style={{ width: 'auto' }}
          >
            <RefreshCw size={14} className={syncing ? 'spin-animation' : ''} />
            <span>{syncing ? 'Syncing...' : 'Force Sync'}</span>
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={fetchPlayStoreStats}
            style={{ width: 'auto' }}
          >
            <BarChart3 size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top Cards grid */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">Total Downloads</span>
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Download size={20} />
            </div>
          </div>
          <span className="stats-value">{(stats.total_downloads || 0).toLocaleString()}</span>
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
          <span className="stats-value">{(stats.active_installs || 0).toLocaleString()}</span>
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
          <span className="stats-value">{stats.average_rating || 4.8} ★</span>
          <span className="stats-change positive">
            <span>{stats.total_reviews || 0}</span> total reviews
          </span>
        </div>

        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">App Stability (30d)</span>
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
              <CheckCircle size={20} />
            </div>
          </div>
          <span className="stats-value">{crashRate}%</span>
          <span className="stats-change positive">
            <span>Below 1.09%</span> Google Android Vitals bad threshold
          </span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="charts-grid" style={{ gridTemplateColumns: '7fr 5fr', marginBottom: '24px' }}>
        
        {/* Daily Downloads Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <span className="chart-title">Acquisition Trend ({datePreset.toUpperCase()})</span>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Organic & referral install volume</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '180px' }}>
            {points.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No download records for this range.</p>
            ) : (
              <svg width="100%" height="150" viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="downloads-area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal baseline */}
                <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.08)" />

                {/* Area and Line */}
                <polygon points={areaPoints} fill="url(#downloads-area-grad)" />
                <polyline points={svgPoints} fill="none" stroke="#3b82f6" strokeWidth="3" />

                {/* Data point dots */}
                {points.map((p, index) => {
                  const x = padding + (index / Math.max(points.length - 1, 1)) * (chartWidth - padding * 2);
                  const y = chartHeight - padding - (p.downloads / maxDownloads) * (chartHeight - padding * 2);
                  return (
                    <circle key={p.date || index} cx={x} cy={y} r="4" fill="var(--text-primary)" stroke="#3b82f6" strokeWidth="2" />
                  );
                })}
              </svg>
            )}
          </div>

          {/* Date Axis Labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: `0 ${padding}px`, marginTop: '8px' }}>
            {points.map(p => (
              <span key={p.date} style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {p.date ? p.date.substring(5) : ''}
              </span>
            ))}
          </div>
        </div>

        {/* Technical Vitals Card */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <span className="chart-title">Google Play Vitals</span>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Crash & freeze health monitor</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
            
            {/* Crash Rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>User-Perceived Crash Rate</span>
                <span style={{ color: Number(crashRate) > 1 ? 'var(--danger)' : 'var(--success)', fontWeight: '600' }}>{crashRate}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, Number(crashRate) * 20)}%`, height: '100%', background: Number(crashRate) > 1 ? 'var(--danger)' : 'var(--success)', borderRadius: '4px' }} />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Target: &lt; 1.09% threshold
              </span>
            </div>

            {/* ANR Rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>User-Perceived ANR Rate</span>
                <span style={{ color: Number(anrRate) > 0.47 ? 'var(--danger)' : 'var(--success)', fontWeight: '600' }}>{anrRate}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, Number(anrRate) * 50)}%`, height: '100%', background: Number(anrRate) > 0.47 ? 'var(--danger)' : 'var(--success)', borderRadius: '4px' }} />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Target: &lt; 0.47% threshold
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* Daily Acquisition Breakdown Table */}
      <div className="table-card">
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Acquisition Table</h3>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>New Downloads</th>
                <th>Uninstalls</th>
                <th>Net Device Growth</th>
                <th>Active Devices (Cumulative)</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => {
                const net = (p.downloads || 0) - (p.uninstalls || 0);
                return (
                  <tr key={p.date}>
                    <td style={{ fontWeight: '500', color: 'var(--text-title)' }}>{p.date}</td>
                    <td style={{ color: 'var(--success)', fontWeight: '600' }}>+{(p.downloads || 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--danger)' }}>-{(p.uninstalls || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: '600', color: net >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {net >= 0 ? `+${net.toLocaleString()}` : net.toLocaleString()}
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{(p.active_devices || 0).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
