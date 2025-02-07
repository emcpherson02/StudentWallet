// Layout.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import styles from '../styles/PlaidLink.module.css';

const Layout = ({ currentUser, onLogout, children, showNav = true }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
<div className={styles.sidebarLayout}>
  {/* Left Sidebar */}
  <div className={styles.sidebar}>
    {showNav && (                         
    <nav className={styles.sidebarNav}>
      <Link to="/AboutUs" className={styles.sidebarLink}>
        About Us
      </Link>
      <Link to="/TransactionDashboard" className={styles.sidebarLink}>
        Transaction Dashboard
      </Link>
      <Link to="/budget-dashboard" className={styles.sidebarLink}>
        Budget Dashboard
      </Link>
      <Link to="/budget-analytics" className={styles.sidebarLink}>
        Analytics
      </Link>
    </nav>
    )}
  </div>

  {/* Top Bar */}
  <div className={styles.topBar}>
    <h1 className={styles.siteTitle}>Student Wallet</h1>
    { showNav && (       
    <div className={styles.topBarActions}>
      <button className={styles.notificationButton}>
        <Bell size={20} />
        <div className={styles.notificationBadge}>2</div>
      </button>
      <div className={styles.userMenuContainer}>
        <button 
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={styles.userButton}
        >
          {currentUser?.displayName?.split(' ').map(n => n[0]).join('') || 'BM'}
        </button>
        {showUserMenu && (
          <div className={styles.userMenu}>
            <Link to="/settings" className={styles.userMenuItem}>
              Settings
            </Link>
            <button onClick={onLogout} className={styles.userMenuItem}>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
    )}
  </div>

  {/* Right Sidebar */}
  <div className={styles.rightSidebar} />

  {/* Main Content Area */}
  <main className={styles.mainWrapper}>
    <div className={styles.mainContentWrapper}>
      {children}
    </div>
  </main>
</div>

  );
};

export default Layout;