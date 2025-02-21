import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Home.module.css';

function Home() {
    return (
        <div className={styles.homePage}>
            <div className={styles.brandSection}>
                <h1 className={styles.brandTitle}>StudentWallet</h1>
                <p className={styles.brandSubtitle}>Managing student finances made simple</p>
            </div>

            <div className={styles.contentContainer}>
                <div className={styles.contentCard}>
                    <div className={styles.logoSection}>
                        <img
                            src="/LogoNew.webp"
                            alt="StudentWallet Logo"
                            className={styles.logo}
                        />
                    </div>

                    <div className={styles.contentHeader}>
                        <h2>Welcome to StudentWallet</h2>
                        <p>Your comprehensive financial management platform</p>
                    </div>

                    <div className={styles.featuresList}>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>🔐</span>
                            <span>Secure OAuth 2.0 Authentication</span>
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>🏦</span>
                            <span>Bank Account Integration</span>
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>📊</span>
                            <span>Budget Management & Analytics</span>
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>🔔</span>
                            <span>Smart Payment Notifications</span>
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>💰</span>
                            <span>Cash Transaction Tracking</span>
                        </div>
                    </div>

                    <div className={styles.actionButtons}>
                        <Link to="/login" className={styles.loginButton}>
                            Sign In
                        </Link>
                        <Link to="/register" className={styles.registerButton}>
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
