// Layout.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import styles from '../styles/PlaidLink.module.css';

const Layout = ({ currentUser, onLogout, children, showNav = true }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userInitials = currentUser?.displayName
      ? currentUser.displayName.split(' ').map(n => n[0]).join('')
      : 'SW';

  return (
      <div className={styles.layout}>
        {/* Left Sidebar */}
        <aside className={styles.sidebar}>
          {showNav && (
              <nav className={styles.sidebarNav}>
                <div className={styles.logo}>
                  <h2>SW</h2>
                </div>
                <div className={styles.navLinks}>
                  <Link to="/plaid-link" className={styles.navLink}>
                    <Home size={20} />
                    <span>Home</span>
                  </Link>
                  <Link to="/AboutUs" className={styles.navLink}>
                    <Users size={20} />
                    <span>About Us</span>
                  </Link>
                  <Link to="/transaction-dashboard" className={styles.navLink}>
                    <LineChart size={20} />
                    <span>Transactions</span>
                  </Link>
                  <Link to="/budget-dashboard" className={styles.navLink}>
                    <Wallet size={20} />
                    <span>Budget</span>
                  </Link>
                  <Link to="/budget-analytics" className={styles.navLink}>
                    <BarChart2 size={20} />
                    <span>Analytics</span>
                  </Link>
                  <Link to="/loan-dashboard" className={styles.navLink}>
                    <PiggyBank size={20} />
                    <span>Loan</span>
                  </Link>
                  <Link to="/tips" className={styles.navLink}>
                    <Library size={20} />
                    <span>Tips & Resources</span>
                  </Link>
                </div>
              </nav>
          )}
        </aside>

        {/* Main Content */}
        <div className={styles.mainContainer}>
          {/* Top Bar */}
          <header className={styles.topBar}>
            <h1 className={styles.siteTitle}>Student Wallet</h1>
            {showNav && (
                <div className={styles.topBarActions}>
                  <button className={styles.notificationBtn}>
                    <Bell size={20} />
                    <span className={styles.notificationBadge}>2</span>
                  </button>
                  <div className={styles.userMenuContainer}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className={styles.userBtn}
                    >
                      {userInitials}
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
          </header>

          {/* Main Content Area */}
          <main className={styles.mainContent}>
            {children}
          </main>
        </div>
      </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(Layout);