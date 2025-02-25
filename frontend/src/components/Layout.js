import React, { useState, memo } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { Bell, Home, Users, LineChart, Wallet, PiggyBank, Library, BarChart2 } from 'lucide-react';
import styles from '../styles/Layout.module.css';
import NotificationHistory from "./NotificationHistory";
import {logoutUser} from "../utils/authService";

const Layout = ({ currentUser, onLogout, children, showNav = true }) => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const navigate = useNavigate();

    const userInitials = currentUser?.displayName
        ? currentUser.displayName.split(' ').map(n => n[0]).join('')
        : 'SW';

    const handleLogout = () => {
        logoutUser();
        navigate('/login');

    }

    return (
        <div className={styles.layout}>
            {/* Left Sidebar */}
            <aside className={styles.sidebar}>
                {showNav && (
                    <nav className={`${styles.sidebarNav} sidebarNav`}>
                        <div className={styles.logo}>
                            <h2>SW</h2>
                        </div>
                        <div className={styles.navLinks}>
                            <Link to="/plaid-link" className={styles.navLink}>
                                <Home size={20} />
                                <span>Home</span>
                            </Link>
                            <Link to="/about-us" className={styles.navLink}>
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
                                <span>Historical Analytics</span>
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
                            <NotificationHistory />
                            <div className={styles.userMenuContainer}>
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className={`${styles.userBtn} userBtn`}
                                >
                                    {userInitials}
                                </button>
                                {showUserMenu && (
                                    <div className={styles.userMenu}>
                                        <Link to="/preferences" className={styles.userMenuItem}>
                                            Settings
                                        </Link>
                                        <button onClick={handleLogout} className={styles.userMenuItem}>
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

export default memo(Layout);