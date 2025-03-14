import React, { useState, useEffect, memo } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, Home, Users, LineChart, Wallet, PiggyBank, Library, BarChart2, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../styles/Layout.module.css';
import NotificationHistory from "./NotificationHistory";
import { logoutUser } from "../utils/authService";

const Layout = ({ currentUser, onLogout, children, showNav = true }) => {
    // Initialize state from localStorage
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        // Get the stored value, or false if it's not in localStorage
        const storedValue = localStorage.getItem('sidebarCollapsed');
        return storedValue ? JSON.parse(storedValue) : false;
    });
    const navigate = useNavigate();
    const location = useLocation();

    const userInitials = currentUser?.displayName
        ? currentUser.displayName.split(' ').map(n => n[0]).join('')
        : 'SW';

    // Update localStorage when sidebarCollapsed changes
    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
    }, [sidebarCollapsed]);

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    }

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className={styles.layout}>
            {/* Left Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
                {showNav && (
                    <nav className={`${styles.sidebarNav} sidebarNav`} aria-label="Main Navigation">
                        <div className={styles.logo}>
                            <h2>SW</h2>
                            <button
                                className={styles.collapseButton}
                                onClick={toggleSidebar}
                                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                                aria-expanded={!sidebarCollapsed}
                            >
                                {sidebarCollapsed ? "❯" : "❮"}
                            </button>
                        </div>
                        <div className={styles.navLinks}>
                            <NavLink
                                to="/plaid-link"
                                className={({isActive}) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                                aria-current={location.pathname === '/plaid-link' ? 'page' : undefined}
                            >
                                <Home size={20} aria-hidden="true" />
                                <span>Home</span>
                            </NavLink>
                            <NavLink
                                to="/about-us"
                                className={({isActive}) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                                aria-current={location.pathname === '/about-us' ? 'page' : undefined}
                            >
                                <Users size={20} aria-hidden="true" />
                                <span>About Us</span>
                            </NavLink>
                            <NavLink
                                to="/transaction-dashboard"
                                className={({isActive}) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                                aria-current={location.pathname === '/transaction-dashboard' ? 'page' : undefined}
                            >
                                <LineChart size={20} aria-hidden="true" />
                                <span>Transactions</span>
                            </NavLink>
                            <NavLink
                                to="/budget-dashboard"
                                className={({isActive}) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                                aria-current={location.pathname === '/budget-dashboard' ? 'page' : undefined}
                            >
                                <Wallet size={20} aria-hidden="true" />
                                <span>Budget</span>
                            </NavLink>
                            <NavLink
                                to="/budget-analytics"
                                className={({isActive}) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                                aria-current={location.pathname === '/budget-analytics' ? 'page' : undefined}
                            >
                                <BarChart2 size={20} aria-hidden="true" />
                                <span>Historical Analytics</span>
                            </NavLink>
                            <NavLink
                                to="/loan-dashboard"
                                className={({isActive}) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                                aria-current={location.pathname === '/loan-dashboard' ? 'page' : undefined}
                            >
                                <PiggyBank size={20} aria-hidden="true" />
                                <span>Loan</span>
                            </NavLink>
                            <NavLink
                                to="/tips"
                                className={({isActive}) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                                aria-current={location.pathname === '/tips' ? 'page' : undefined}
                            >
                                <Library size={20} aria-hidden="true" />
                                <span>Tips & Resources</span>
                            </NavLink>
                        </div>
                    </nav>
                )}
            </aside>

            {/* Main Content */}
            <div className={`${styles.mainContainer} ${sidebarCollapsed ? styles.expanded : ''}`}>
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
                                    aria-label="User menu"
                                    aria-expanded={showUserMenu}
                                    aria-haspopup="true"
                                >
                                    {userInitials}
                                </button>
                                {showUserMenu && (
                                    <div
                                        className={styles.userMenu}
                                        role="menu"
                                        aria-orientation="vertical"
                                    >
                                        <Link
                                            to="/preferences"
                                            className={styles.userMenuItem}
                                            role="menuitem"
                                        >
                                            Settings
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className={styles.userMenuItem}
                                            role="menuitem"
                                        >
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