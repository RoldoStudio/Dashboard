import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Eye, Percent, ArrowUpRight, BarChart3 } from 'lucide-react';
import { api } from '../api';

export default function AdMobStats({ addToast }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdMobStats = async () => {
      try {
        const data = await api.getAdMobStats();
        setStats(data);
      } catch (err) {
        addToast(err.message || 'Failed to fetch AdMob statistics', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAdMobStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading AdMob monetization metrics...</p>
      </div>
    );
  }

  if (!stats) return null;

  // Formatting helper
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  // SVGs Chart setup
  const chartWidth = 500;
  const chartHeight = 180;
  const padding = 30;
  const points = stats.daily_earnings || [];
  const maxEarnings = Math.max(...points.map(p => p.earnings), 1);

  const svgPoints = points.map((p, index) => {
    const x = padding + (index / (points.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (p.earnings / maxEarnings) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = points.length > 0
    ? `${padding},${chartHeight - padding} ` + svgPoints + ` ${chartWidth - padding},${chartHeight - padding}`
    : '';

  // Calculate impressions breakdown percentage
  const totalImps = Object.values(stats.impressions_by_type || {}).reduce((a, b) => a + b, 0);
  const bannerPct = totalImps > 0 ? ((stats.impressions_by_type.banner / totalImps) * 100).toFixed(1) : 0;
  const interstitialPct = totalImps > 0 ? ((stats.impressions_by_type.interstitial / totalImps) * 100).toFixed(1) : 0;
  const rewardedPct = totalImps > 0 ? ((stats.impressions_by_type.rewarded / totalImps) * 100).toFixed(1) : 0;

  return (
    <div>
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
          <span className="stats-value">{stats.impressions_today.toLocaleString()}</span>
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
            <span className="stats-label">CTR / Fill Rate</span>
            <div className="stats-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Percent size={20} />
            </div>
          </div>
          <span className="stats-value">{stats.ctr}% / {stats.fill_rate}%</span>
          <span className="stats-change positive">
            <span>99.8%</span> network health
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid" style={{ gridTemplateColumns: '7fr 5fr' }}>
        
        {/* Daily revenue trend */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <span className="chart-title">Revenue Trends (7d)</span>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Daily advertising revenue timeline</p>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              30d total: <strong>{formatCurrency(stats.earnings_30d)}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '190px' }}>
            <svg width="100%" height="180" viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="admob-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="rgba(255,255,255,0.04)" strokeDasharray="3" />
              <line x1={padding} y1={(chartHeight - padding) / 2} x2={chartWidth - padding} y2={(chartHeight - padding) / 2} stroke="rgba(255,255,255,0.04)" strokeDasharray="3" />
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.08)" />

              {/* Area path */}
              {points.length > 0 && <polygon points={areaPoints} fill="url(#admob-area-grad)" />}

              {/* Line path */}
              {points.length > 0 && <polyline points={svgPoints} fill="none" stroke="#10b981" strokeWidth="3" />}

              {/* Data points */}
              {points.map((p, index) => {
                const x = padding + (index / (points.length - 1)) * (chartWidth - padding * 2);
                const y = chartHeight - padding - (p.earnings / maxEarnings) * (chartHeight - padding * 2);
                return (
                  <g key={index}>
                    <circle cx={x} cy={y} r="4" fill="var(--text-primary)" stroke="#10b981" strokeWidth="2" />
                    <text x={x} y={y - 8} fill="var(--text-primary)" fontSize="9" textAnchor="middle" fontWeight="600">
                      {formatCurrency(p.earnings)}
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

        {/* Ad formats and network health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="chart-card" style={{ flexGrow: 1 }}>
            <div className="chart-header" style={{ marginBottom: '16px' }}>
              <span className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart3 size={16} style={{ color: 'var(--primary)' }} />
                <span>Ad Formats Breakdown</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Banner Ads</span>
                  <span style={{ fontWeight: 600 }}>{stats.impressions_by_type.banner.toLocaleString()} ({bannerPct}%)</span>
                </div>
                <div style={{ height: '6px', background: '#222533', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#3b82f6', width: `${bannerPct}%` }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Interstitial Ads</span>
                  <span style={{ fontWeight: 600 }}>{stats.impressions_by_type.interstitial.toLocaleString()} ({interstitialPct}%)</span>
                </div>
                <div style={{ height: '6px', background: '#222533', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--accent)', width: `${interstitialPct}%` }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Rewarded Video Ads</span>
                  <span style={{ fontWeight: 600 }}>{stats.impressions_by_type.rewarded.toLocaleString()} ({rewardedPct}%)</span>
                </div>
                <div style={{ height: '6px', background: '#222533', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#10b981', width: `${rewardedPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="chart-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.02)' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Earnings Target Status</span>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--success)', marginTop: '2px' }}>On Track (+14.5%)</h4>
            </div>
            <ArrowUpRight size={24} style={{ color: 'var(--success)' }} />
          </div>

        </div>

      </div>
    </div>
  );
}
