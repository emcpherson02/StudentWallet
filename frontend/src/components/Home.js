import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Home.module.css';

function Home() {
    return (
        <div className={styles.Home}>
            <header className={styles.HomeHeader}>
                <div className={styles.logoContainer}>
                    <img
                        src="/LogoNew.webp"
                        alt="StudentWallet Logo"
                        className={styles.logo}
                    />
                </div>
                <h1>Welcome to StudentWallet</h1>
                <p>Your one-stop solution for managing finances efficiently as a student.</p>
                <div className={styles.HomeButtons}>
                    <Link to="/login" className={styles.HomeLink}>Login</Link>
                    <Link to="/register" className={styles.HomeLink}>Register</Link>
                </div>
            </header>
            <section className={styles.HomeContent}>
                <h2>Features</h2>
                <ul>
                    <li>Secure login with OAuth 2.0</li>
                    <li>Link and track bank accounts</li>
                    <li>Create and categorize budgets</li>
                    <li>Receive notifications for bill payments</li>
                    <li>Manage cash transactions easily</li>
                </ul>
            </section>
        </div>
    );
}

export default Home;
