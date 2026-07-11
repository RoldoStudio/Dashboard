import React, { useState } from 'react';
import { LayoutDashboard, Shield, LogOut, Menu, X, User, TrendingUp, Smartphone, ShoppingBag } from 'lucide-react';
import Overview from './Overview';
import Backoffice from './Backoffice';
import AdMobStats from './AdMobStats';
import PlayStoreStats from './PlayStoreStats';
import StoreManagement from './StoreManagement';

export default function Dashboard({ user, onLogout, addToast }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">BLOCKMERGE</div>
          <button 
            className="modal-close" 
            style={{ marginLeft: 'auto', display: 'none' /* Handled by CSS on mobile */ }} 
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div 
            className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
          >
            <LayoutDashboard size={18} />
            <span>Overview & Stats</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'admob' ? 'active' : ''}`}
            onClick={() => { setActiveTab('admob'); setMobileMenuOpen(false); }}
          >
            <TrendingUp size={18} />
            <span>AdMob Stats</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'playstore' ? 'active' : ''}`}
            onClick={() => { setActiveTab('playstore'); setMobileMenuOpen(false); }}
          >
            <Smartphone size={18} />
            <span>Play Store Stats</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'backoffice' ? 'active' : ''}`}
            onClick={() => { setActiveTab('backoffice'); setMobileMenuOpen(false); }}
          >
            <Shield size={18} />
            <span>Backoffice Admin</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === 'store' ? 'active' : ''}`}
            onClick={() => { setActiveTab('store'); setMobileMenuOpen(false); }}
          >
            <ShoppingBag size={18} />
            <span>Store Management</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div 
            className="sidebar-item" 
            onClick={onLogout}
            style={{ color: 'var(--danger)', borderLeft: 'none' }}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="main-content">
        <header className="header">
          {/* Mobile hamburger button */}
          <button 
            className="btn btn-secondary" 
            style={{ width: 'auto', padding: '8px', display: 'none' /* display flex on mobile */ }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={20} />
          </button>

          <h2 className="page-title">
            {activeTab === 'overview' && 'Dashboard Overview'}
            {activeTab === 'admob' && 'AdMob Performance'}
            {activeTab === 'playstore' && 'Google Play Store Performance'}
            {activeTab === 'backoffice' && 'Backoffice Administration'}
            {activeTab === 'store' && 'Store Catalog & Transactions'}
          </h2>

          <div className="header-actions">
            <div className="user-profile">
              <div className="user-avatar">
                {user.display_name ? user.display_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="user-info">
                <span className="profile-name">{user.display_name || 'Administrator'}</span>
                <span className="profile-role">Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        <main className="page-container">
          {activeTab === 'overview' && (
            <Overview addToast={addToast} />
          )}
          {activeTab === 'admob' && (
            <AdMobStats addToast={addToast} />
          )}
          {activeTab === 'playstore' && (
            <PlayStoreStats addToast={addToast} />
          )}
          {activeTab === 'backoffice' && (
            <Backoffice addToast={addToast} />
          )}
          {activeTab === 'store' && (
            <StoreManagement addToast={addToast} />
          )}
        </main>
      </div>
    </div>
  );
}
