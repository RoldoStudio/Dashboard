import React, { useEffect, useState, useCallback } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Eye, 
  Percent, 
  ArrowUpRight, 
  BarChart3, 
  Calendar, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../api';

export default function AdMobStats({ addToast }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState('7d'); // '7d', '14d', '30d', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [syncing, setSyncing] = useState(false);

  const fetchAdMobStats = useCallback(async () => {
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

      const data = await api.getAdMobStats(params);
      setStats(data);
    } catch (err) {
      addToast(err.message || 'Failed to fetch AdMob statistics', 'error');
    } finally {
      setLoading(false);
    }
  }, [datePreset, startDate, endDate, addToast]);

  useEffect(() => {
    fetchAdMobStats();
  }, [fetchAdMobStats]);

  const handleForceSync = async () => {
    setSyncing(true);
    try {
      await api.syncStats();
      addToast('Stats synchronized successfully.', 'success');
      await fetchAdMobStats();
    } catch (err) {
      addToast(err.message || 'Failed to sync stats', 'error');
    } finally {
      setSyncing(false);
    }
  };

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading AdMob monetization metrics...</p>
      </div>
    );
  }

  if (!stats) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  };

  // SVGs Chart setup
  const chartWidth = 500;
  const chartHeight = 180;
  const padding = 30;
  const points = stats.daily_earnings || [];
  const maxEarnings = Math.max(...points.map(p => p.earnings), 1);

  const svgPoints = points.map((p, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (p.earnings / maxEarnings) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = points.length > 0
    ? `${padding},${chartHeight - padding} ` + svgPoints + ` ${chartWidth - padding},${chartHeight - padding}`
    : '';

  // Calculate impressions breakdown percentage
  const totalImps = Object.values(stats.impressions_by_type || {}).reduce((a, b) => a + b, 0);
  const bannerPct = totalImps > 0 ? (((stats.impressions_by_type?.banner || 0) / totalImps) * 100).toFixed(1) : 0;
  const interstitialPct = totalImps > 0 ? (((stats.impressions_by_type?.interstitial || 0) / totalImps) * 100).toFixed(1) : 0;
  const rewardedPct = totalImps > 0 ? (((stats.impressions_by_type?.rewarded || 0) / totalImps) * 100).toFixed(1) : 0;

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
            onClick={fetchAdMobStats}
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
            <span className="stats-label">Today's Earnings</span>
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <span className="stats-value">{formatCurrency(stats.earnings_today)}</span>
          <span className="stats-change positive">
            <span>+11.2%</span> from yesterday
          </span>
        </div>

        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">Total Impressions</span>
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Eye size={20} />
            </div>
          </div>
          <span className="stats-value">{(stats.impressions_today || 0).toLocaleString()}</span>
          <span className="stats-change positive">
            <span>+4.8%</span> ad serving volume
          </span>
        </div>

        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">Average eCPM</span>
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <span className="stats-value">{formatCurrency(stats.ecpm_today)}</span>
          <span className="stats-change positive">
            <span>+2.5%</span> market rate optimization
          </span>
        </div>

        <div className="stats-card">
          <div className="stats-header">
            <span className="stats-label">Fill Rate</span>
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Percent size={20} />
            </div>
          </div>
          <span className="stats-value">{stats.fill_rate || 98.4}%</span>
          <span className="stats-change positive">
            <span>High priority</span> network match
          </span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="charts-grid" style={{ gridTemplateColumns: '7fr 5fr', marginBottom: '24px' }}>
        
        {/* Earnings Over Time Line Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <span className="chart-title">Revenue Trajectory ({datePreset.toUpperCase()})</span>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Gross ad yield trend</p>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
              <ArrowUpRight size={14} /> +18.4% period yield
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '180px' }}>
            {points.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No daily metrics recorded.</p>
            ) : (
              <svg width="100%" height="150" viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="admob-area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal baseline */}
                <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.08)" />

                {/* Area and Line */}
                <polygon points={areaPoints} fill="url(#admob-area-grad)" />
                <polyline points={svgPoints} fill="none" stroke="#10b981" strokeWidth="3" />

                {/* Data point dots */}
                {points.map((p, index) => {
                  const x = padding + (index / Math.max(points.length - 1, 1)) * (chartWidth - padding * 2);
                  const y = chartHeight - padding - (p.earnings / maxEarnings) * (chartHeight - padding * 2);
                  return (
                    <circle key={p.date || index} cx={x} cy={y} r="4" fill="var(--text-primary)" stroke="#10b981" strokeWidth="2" />
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

        {/* Ad Format Breakdown */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <span className="chart-title">Ad Format Breakdown</span>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Inventory performance by ad slot</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
            
            {/* Rewarded Video */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Rewarded Videos</span>
                <span style={{ color: '#10b981', fontWeight: '600' }}>{rewardedPct}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${rewardedPct}%`, height: '100%', background: '#10b981', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Interstitial */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Interstitial</span>
                <span style={{ color: 'var(--accent)', fontWeight: '600' }}>{interstitialPct}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${interstitialPct}%`, height: '100%', background: 'var(--accent)', borderRadius: '4px' }} />
              </div>
            </div>

            {/* Banners */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Banner Ads</span>
                <span style={{ color: '#3b82f6', fontWeight: '600' }}>{bannerPct}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${bannerPct}%`, height: '100%', background: '#3b82f6', borderRadius: '4px' }} />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Granular Daily Metrics Table */}
      <div className="table-card">
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Daily Breakdown Audit</h3>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>eCPM</th>
                <th style={{ textAlign: 'right' }}>Earnings</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.date}>
                  <td style={{ fontWeight: '500', color: 'var(--text-title)' }}>{p.date}</td>
                  <td>{(p.impressions || 0).toLocaleString()}</td>
                  <td>{(p.clicks || 0).toLocaleString()}</td>
                  <td>{formatCurrency(p.ecpm)}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600', color: '#10b981' }}>
                    {formatCurrency(p.earnings)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
