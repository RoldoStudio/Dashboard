import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  RotateCw, 
  Coins, 
  Gem, 
  Gift, 
  Clock, 
  History, 
  Award, 
  AlertCircle, 
  Key, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  HelpCircle,
  Zap
} from 'lucide-react';
import { api } from '../api';

// Fallback wheel segments if unauthenticated or loading
const SAMPLE_SEGMENTS = [
  { segment_index: 0, label: "500 Coins", reward_type: "coins", reward_amount: 500, reward_item_id: null, icon: "coins" },
  { segment_index: 1, label: "5 Gems", reward_type: "gems", reward_amount: 5, reward_item_id: null, icon: "gem" },
  { segment_index: 2, label: "1,000 Coins", reward_type: "coins", reward_amount: 1000, reward_item_id: null, icon: "coins" },
  { segment_index: 3, label: "Powerup Pack", reward_type: "powerup", reward_amount: 1, reward_item_id: "bomb_boost", icon: "zap" },
  { segment_index: 4, label: "2,500 Coins", reward_type: "coins", reward_amount: 2500, reward_item_id: null, icon: "coins" },
  { segment_index: 5, label: "15 Gems", reward_type: "gems", reward_amount: 15, reward_item_id: null, icon: "gem" },
  { segment_index: 6, label: "5,000 Coins", reward_type: "coins", reward_amount: 5000, reward_item_id: null, icon: "coins" },
  { segment_index: 7, label: "Rare Skin", reward_type: "skin", reward_amount: 1, reward_item_id: "skin_neon_cube", icon: "gift" }
];

const SEGMENT_COLORS = [
  '#4f46e5', '#7c3aed', '#2563eb', '#059669',
  '#d97706', '#dc2626', '#0891b2', '#9333ea'
];

export default function WheelOfFortune({ addToast }) {
  const [activeTab, setActiveTab] = useState('wheel'); // 'wheel', 'segments', 'history', 'token'
  const [wheelStatus, setWheelStatus] = useState(null);
  const [segments, setSegments] = useState(SAMPLE_SEGMENTS);
  const [spinning, setSpinning] = useState(false);
  const [spinRotation, setSpinRotation] = useState(0);
  const [lastWin, setLastWin] = useState(null);
  const [allowPaid, setAllowPaid] = useState(false);

  // History state
  const [historyItems, setHistoryItems] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLimit] = useState(15);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Cooldown countdown state
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Player Bearer Token state
  const [playerToken, setPlayerTokenState] = useState(api.getPlayerToken());
  const [tokenInput, setTokenInput] = useState(api.getPlayerToken());
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Fetch wheel status from backend
  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getWheelStatus(playerToken || undefined);
      setWheelStatus(data);
      if (data.segments && data.segments.length > 0) {
        setSegments(data.segments);
      }
      setCooldownRemaining(data.cooldown_seconds_remaining || 0);
      setIsDemoMode(false);
    } catch (err) {
      // If 401 or auth error, fall back to sample preview mode with clear notification
      setIsDemoMode(true);
      setWheelStatus({
        can_spin: true,
        cooldown_seconds_remaining: 0,
        paid_spin_cost_gems: 10,
        segments: SAMPLE_SEGMENTS
      });
      setSegments(SAMPLE_SEGMENTS);
      if (playerToken) {
        addToast(`Wheel API: ${err.message}`, 'error');
      }
    }
  }, [playerToken, addToast]);

  // Fetch spin history
  const fetchHistory = useCallback(async (offset = historyOffset) => {
    setLoadingHistory(true);
    try {
      const data = await api.getWheelHistory({ limit: historyLimit, offset }, playerToken || undefined);
      setHistoryItems(data.items || []);
      setHistoryTotal(data.total || 0);
      setHistoryOffset(offset);
    } catch (err) {
      if (playerToken) {
        addToast(`Spin History: ${err.message}`, 'error');
      }
      // Demo fallback history
      setHistoryItems([]);
      setHistoryTotal(0);
    } finally {
      setLoadingHistory(false);
    }
  }, [historyLimit, historyOffset, playerToken, addToast]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory(0);
    }
  }, [activeTab, fetchHistory]);

  // Cooldown live timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          fetchStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining, fetchStatus]);

  const handleSaveToken = (e) => {
    e.preventDefault();
    api.setPlayerToken(tokenInput);
    setPlayerTokenState(tokenInput.trim());
    addToast('Player Bearer token updated successfully.', 'success');
  };

  const handleClearToken = () => {
    api.setPlayerToken('');
    setPlayerTokenState('');
    setTokenInput('');
    addToast('Player Bearer token cleared. Using demo mode.', 'info');
  };

  const formatCooldown = (seconds) => {
    if (seconds <= 0) return 'Ready to Spin!';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}h ` : ''}${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  // Perform spin
  const handleSpin = async () => {
    if (spinning) return;
    setSpinning(true);
    setLastWin(null);

    try {
      let winningIndex = 0;
      let winResult = null;

      if (!isDemoMode && playerToken) {
        // Execute real spin on backend
        winResult = await api.spinWheel(allowPaid, playerToken);
        winningIndex = winResult.segment_index;
      } else {
        // Simulated local spin
        await new Promise(r => setTimeout(r, 300));
        winningIndex = Math.floor(Math.random() * segments.length);
        const seg = segments[winningIndex];
        winResult = {
          spin_id: 'demo_' + Math.random().toString(36).substring(2, 9),
          segment_index: winningIndex,
          reward_type: seg.reward_type,
          reward_amount: seg.reward_amount,
          reward_item_id: seg.reward_item_id,
          spin_cost_type: allowPaid ? 'gems' : 'free',
          coins_balance: 5000 + (seg.reward_type === 'coins' ? seg.reward_amount : 0),
          gems_balance: 50 + (seg.reward_type === 'gems' ? seg.reward_amount : 0) - (allowPaid ? 10 : 0),
          created_at: new Date().toISOString()
        };
      }

      // Calculate rotation animation
      const segmentAngle = 360 / segments.length;
      // Wheel pointer is at top (270 deg or 90 deg depending on orientation)
      // To align winning segment with top pointer:
      const targetAngle = 360 - (winningIndex * segmentAngle + segmentAngle / 2);
      const extraSpins = 360 * 5; // 5 full revolutions
      const nextRotation = spinRotation + extraSpins + (targetAngle - (spinRotation % 360) + 360) % 360;

      setSpinRotation(nextRotation);

      setTimeout(() => {
        setSpinning(false);
        setLastWin(winResult);
        addToast(`Congratulations! Won: ${segments[winningIndex]?.label || winResult.reward_type}!`, 'success');
        fetchStatus();
      }, 4000);

    } catch (err) {
      setSpinning(false);
      addToast(err.message || 'Spin failed', 'error');
    }
  };

  // Render SVG Wheel Slices
  const renderWheelSvg = () => {
    const totalSegments = segments.length;
    const radius = 180;
    const center = 200;
    const sliceAngle = 360 / totalSegments;

    return (
      <svg 
        width="400" 
        height="400" 
        viewBox="0 0 400 400"
        style={{
          transform: `rotate(${spinRotation}deg)`,
          transition: spinning ? 'transform 4s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none',
          filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.5))'
        }}
      >
        <circle cx={center} cy={center} r={radius + 8} fill="#1e1b4b" stroke="#312e81" strokeWidth="6" />

        {segments.map((seg, idx) => {
          const startAngle = (idx * sliceAngle - 90) * (Math.PI / 180);
          const endAngle = ((idx + 1) * sliceAngle - 90) * (Math.PI / 180);

          const x1 = center + radius * Math.cos(startAngle);
          const y1 = center + radius * Math.sin(startAngle);
          const x2 = center + radius * Math.cos(endAngle);
          const y2 = center + radius * Math.sin(endAngle);

          const largeArc = sliceAngle > 180 ? 1 : 0;
          const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

          const midAngle = ((idx + 0.5) * sliceAngle - 90);
          const textRadius = radius * 0.65;
          const textAngleRad = midAngle * (Math.PI / 180);
          const tx = center + textRadius * Math.cos(textAngleRad);
          const ty = center + textRadius * Math.sin(textAngleRad);

          const color = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];

          return (
            <g key={seg.segment_index ?? idx}>
              <path 
                d={pathData} 
                fill={color} 
                stroke="#0f1017" 
                strokeWidth="2" 
                opacity="0.9"
              />
              <text
                x={tx}
                y={ty}
                fill="#ffffff"
                fontSize="12"
                fontWeight="700"
                fontFamily="var(--font-heading)"
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
              >
                {seg.label}
              </text>
            </g>
          );
        })}

        {/* Center hub */}
        <circle cx={center} cy={center} r="32" fill="#0f1017" stroke="#6366f1" strokeWidth="4" />
        <circle cx={center} cy={center} r="14" fill="#a78bfa" />
      </svg>
    );
  };

  return (
    <div>
      {/* Subtab Navigation */}
      <div className="table-header-row" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTab === 'wheel' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('wheel')}
            style={{ width: 'auto' }}
          >
            <Sparkles size={16} />
            <span>Interactive Wheel</span>
          </button>

          <button
            className={`btn ${activeTab === 'segments' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('segments')}
            style={{ width: 'auto' }}
          >
            <Gift size={16} />
            <span>Wheel Segments ({segments.length})</span>
          </button>

          <button
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('history')}
            style={{ width: 'auto' }}
          >
            <History size={16} />
            <span>Spin History</span>
          </button>

          <button
            className={`btn ${activeTab === 'token' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('token')}
            style={{ width: 'auto' }}
          >
            <Key size={16} />
            <span>Player Session Auth</span>
            {playerToken && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />}
          </button>
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={fetchStatus} 
          style={{ width: 'auto' }}
          title="Refresh Wheel Status"
        >
          <RotateCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Mode Banner */}
      {isDemoMode && (
        <div style={{ 
          background: 'rgba(245, 158, 11, 0.08)', 
          border: '1px solid rgba(245, 158, 11, 0.3)', 
          borderRadius: '10px', 
          padding: '12px 16px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
              <strong>Demo Preview Mode:</strong> Viewing wheel simulation. Provide a valid Player Bearer token in the <strong>Player Session Auth</strong> tab to fetch live player cooldowns and spin execution from the backend.
            </span>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={() => setActiveTab('token')}
            style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
          >
            Configure Token
          </button>
        </div>
      )}

      {/* TAB 1: INTERACTIVE WHEEL & LIVE STATUS */}
      {activeTab === 'wheel' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1fr) minmax(320px, 1fr)', gap: '24px', alignItems: 'start' }}>
          
          {/* Wheel Visualizer Card */}
          <div className="table-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', position: 'relative' }}>
            {/* Top Pointer Needle */}
            <div style={{
              position: 'relative',
              width: '0',
              height: '0',
              borderLeft: '16px solid transparent',
              borderRight: '16px solid transparent',
              borderTop: '32px solid #ef4444',
              zIndex: 10,
              marginBottom: '-14px',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))'
            }} />

            {/* SVG Wheel */}
            <div style={{ width: '400px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {renderWheelSvg()}
            </div>

            {/* Spin Controls */}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%', maxWidth: '320px' }}>
              
              {/* Paid spin checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={allowPaid}
                  onChange={(e) => setAllowPaid(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span>Allow Paid Spin ({wheelStatus?.paid_spin_cost_gems || 10} Gems)</span>
              </label>

              <button
                className="btn btn-primary"
                onClick={handleSpin}
                disabled={spinning || (cooldownRemaining > 0 && !allowPaid)}
                style={{ 
                  width: '100%', 
                  padding: '14px 20px', 
                  fontSize: '15px', 
                  fontWeight: '700',
                  letterSpacing: '0.03em'
                }}
              >
                {spinning ? (
                  <span className="spinner">Spinning the Wheel...</span>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>
                      {cooldownRemaining > 0 
                        ? (allowPaid ? `Paid Spin (${wheelStatus?.paid_spin_cost_gems || 10} Gems)` : `On Cooldown (${formatCooldown(cooldownRemaining)})`) 
                        : 'Spin Free Now!'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Status & Reward Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Live Status Card */}
            <div className="table-card">
              <h3 style={{ marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: 'var(--primary)' }} />
                <span>Wheel Status & Cooldown</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Spin Eligibility</span>
                  <span style={{ 
                    fontSize: '15px', 
                    fontWeight: '700', 
                    color: (cooldownRemaining <= 0 || allowPaid) ? 'var(--success)' : 'var(--danger)' 
                  }}>
                    {cooldownRemaining <= 0 ? 'Eligible (Free)' : (allowPaid ? 'Eligible (Paid)' : 'Cooldown Active')}
                  </span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Paid Spin Cost</span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Gem size={16} />
                    <span>{wheelStatus?.paid_spin_cost_gems ?? 10} Gems</span>
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Cooldown Countdown</span>
                <span style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'monospace', color: cooldownRemaining > 0 ? 'var(--warning)' : 'var(--success)' }}>
                  {formatCooldown(cooldownRemaining)}
                </span>
              </div>
            </div>

            {/* Last Spin Result Card */}
            {lastWin && (
              <div className="table-card" style={{ border: '1px solid var(--primary)', background: 'linear-gradient(145deg, rgba(92, 60, 230, 0.1), rgba(15, 16, 23, 0.95))' }}>
                <h3 style={{ marginBottom: '14px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa' }}>
                  <Award size={18} />
                  <span>Latest Spin Reward</span>
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '12px', 
                    background: 'var(--primary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    {lastWin.reward_type === 'coins' ? <Coins size={28} /> :
                     lastWin.reward_type === 'gems' ? <Gem size={28} /> :
                     lastWin.reward_type === 'powerup' ? <Zap size={28} /> :
                     <Gift size={28} />}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '16px', color: 'white', marginBottom: '4px' }}>
                      {segments[lastWin.segment_index]?.label || `${lastWin.reward_amount || ''} ${lastWin.reward_type}`}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Cost: <span style={{ textTransform: 'uppercase', fontWeight: '600' }}>{lastWin.spin_cost_type}</span> • ID: <code style={{ fontSize: '11px' }}>{lastWin.spin_id}</code>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Updated Coins</span>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#f59e0b' }}>{lastWin.coins_balance?.toLocaleString() || '-'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Updated Gems</span>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#a78bfa' }}>{lastWin.gems_balance?.toLocaleString() || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Segment Highlights */}
            <div className="table-card">
              <h3 style={{ marginBottom: '14px', fontSize: '15px' }}>Segment Distribution</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {segments.map((seg, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        width: '10px', 
                        height: '10px', 
                        borderRadius: '50%', 
                        background: SEGMENT_COLORS[idx % SEGMENT_COLORS.length] 
                      }} />
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{seg.label}</span>
                    </div>
                    <span style={{ 
                      fontSize: '11px', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      background: 'rgba(255,255,255,0.05)',
                      textTransform: 'uppercase',
                      color: 'var(--text-secondary)'
                    }}>
                      {seg.reward_type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: SEGMENTS CONFIGURATION TABLE */}
      {activeTab === 'segments' && (
        <div className="table-card">
          <div className="chart-header" style={{ marginBottom: '16px' }}>
            <div>
              <span className="chart-title">Wheel Segments Specification</span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                All configured outcome slots on the Wheel of Fortune ({segments.length} total segments)
              </p>
            </div>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Index</th>
                  <th>Slice Preview</th>
                  <th>Label</th>
                  <th>Reward Type</th>
                  <th>Reward Amount</th>
                  <th>Reward Item ID</th>
                  <th>Icon</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((seg, index) => (
                  <tr key={seg.segment_index ?? index}>
                    <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                      #{seg.segment_index ?? index}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '4px', 
                          background: SEGMENT_COLORS[index % SEGMENT_COLORS.length] 
                        }} />
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Slice {index + 1}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {seg.label}
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background: seg.reward_type === 'coins' ? 'rgba(245, 158, 11, 0.1)' :
                                    seg.reward_type === 'gems' ? 'rgba(168, 85, 247, 0.1)' :
                                    seg.reward_type === 'skin' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: seg.reward_type === 'coins' ? '#f59e0b' :
                               seg.reward_type === 'gems' ? 'var(--accent)' :
                               seg.reward_type === 'skin' ? '#3b82f6' : 'var(--success)'
                      }}>
                        {seg.reward_type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {seg.reward_amount ? seg.reward_amount.toLocaleString() : '-'}
                    </td>
                    <td>
                      {seg.reward_item_id ? (
                        <code style={{ fontSize: '11px', color: '#a78bfa' }}>{seg.reward_item_id}</code>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {seg.icon || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SPIN HISTORY */}
      {activeTab === 'history' && (
        <div className="table-card">
          <div className="chart-header" style={{ marginBottom: '16px' }}>
            <div>
              <span className="chart-title">Player Wheel Spin History</span>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Audit log of all wheel spins, outcomes, and transaction types (Total: {historyTotal})
              </p>
            </div>
            
            <button className="btn btn-secondary" onClick={() => fetchHistory(historyOffset)} style={{ width: 'auto' }}>
              <RotateCw size={14} />
              <span>Refresh Logs</span>
            </button>
          </div>

          <div className="table-container">
            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                Loading spin history...
              </div>
            ) : historyItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                No spin history logs found. Perform a spin or verify player token.
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Spin ID</th>
                    <th>Segment</th>
                    <th>Reward Won</th>
                    <th>Cost Type</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {historyItems.map((item) => (
                    <tr key={item.spin_id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-primary)' }}>
                        {item.spin_id}
                      </td>
                      <td>
                        Segment #{item.segment_index}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                          {item.reward_amount ? `${item.reward_amount.toLocaleString()} ` : ''}
                          <span style={{ textTransform: 'capitalize' }}>{item.reward_type}</span>
                        </span>
                        {item.reward_item_id && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                            ({item.reward_item_id})
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          background: item.spin_cost_type === 'free' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                          color: item.spin_cost_type === 'free' ? 'var(--success)' : 'var(--accent)'
                        }}>
                          {item.spin_cost_type}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* History Pagination */}
          {historyTotal > historyLimit && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Showing {historyOffset + 1} to {Math.min(historyOffset + historyLimit, historyTotal)} of {historyTotal} spins
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  disabled={historyOffset === 0}
                  onClick={() => fetchHistory(Math.max(0, historyOffset - historyLimit))}
                  style={{ width: 'auto', padding: '6px 12px' }}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={historyOffset + historyLimit >= historyTotal}
                  onClick={() => fetchHistory(historyOffset + historyLimit)}
                  style={{ width: 'auto', padding: '6px 12px' }}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PLAYER SESSION AUTH CONFIG */}
      {activeTab === 'token' && (
        <div className="table-card" style={{ maxWidth: '640px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} style={{ color: 'var(--primary)' }} />
            <span>Player Session Bearer Authentication</span>
          </h3>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
            The <code>/wheel/status</code>, <code>/wheel/spin</code>, and <code>/wheel/history</code> endpoints require a player session Bearer token (issued upon Google/Apple/Guest sign in). Enter a player token below to interact with that player's live wheel state.
          </p>

          <form onSubmit={handleSaveToken}>
            <div className="form-group">
              <label className="form-label" htmlFor="playerToken">
                Player Bearer Token / JWT
              </label>
              <textarea
                id="playerToken"
                rows="4"
                className="form-input"
                style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button className="btn btn-primary" type="submit" style={{ width: 'auto' }}>
                <CheckCircle2 size={16} />
                <span>Save Token</span>
              </button>

              {playerToken && (
                <button 
                  className="btn btn-secondary" 
                  type="button" 
                  onClick={handleClearToken}
                  style={{ width: 'auto', color: 'var(--danger)' }}
                >
                  Clear Token
                </button>
              )}
            </div>
          </form>

          {playerToken ? (
            <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
              <span style={{ fontSize: '13px', color: 'var(--success)' }}>
                Active Player Bearer Token configured in localStorage.
              </span>
            </div>
          ) : (
            <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={16} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                No player token stored. Demo preview mode is currently active.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
