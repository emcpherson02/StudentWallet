import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Preferences.module.css';
import axios from 'axios';
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';
import UpdateUserForm from './UpdateUserForm';
import DeleteAccountButton from './DeleteAccountButton';
import ChangePassword from './ChangePassword';
import Layout from './Layout';
import CategoryManagement from './CustomCategoryManagement';
import { getApiUrl } from "../utils/api";
import { toast } from "react-toastify";
import DataExport from "../components/DataExportComponent";

function PreferencesPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [linkedBank, setLinkedBank] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    
    const [activeTab, setActiveTab] = useState('account');

    const fetchNotificationStatus = async () => {
        if (!currentUser) return;
        try {
            const token = await currentUser.getIdToken();
            const response = await axios.get(
                getApiUrl('/user/user-data'),
                {
                    params: { userId: currentUser.uid },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setNotificationsEnabled(response.data.notificationsEnabled || false);
        } catch (error) {
            console.error('Error fetching notification status:', error);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchNotificationStatus();
        } else {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    const fetchUserDetails = async () => {
        try {
            const token = await currentUser.getIdToken();
            const response = await axios.get(getApiUrl(`/user/user-data`), {
                params: { userId: currentUser.uid },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const { linkedBank, accounts } = response.data;
            setLinkedBank(linkedBank);
            setAccounts(accounts || []);
            if (response.data.displayName && response.data.displayName !== currentUser.displayName) {
                await currentUser.updateProfile({ displayName: response.data.displayName });
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
            toast('Failed to fetch user details. Please try again later.', { type: 'error' });
        }
    };

    const toggleNotifications = async () => {
        try {
            const token = await currentUser.getIdToken();
            await axios.post(
                getApiUrl('/user/toggle-notifications'),
                {
                    userId: currentUser.uid,
                    enabled: !notificationsEnabled
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setNotificationsEnabled(!notificationsEnabled);
            toast(notificationsEnabled ? 'Notifications disabled' : 'Notifications enabled', { type: 'success' });
        } catch (error) {
            console.error('Error toggling notifications:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };
    
    // Tab rendering functions
    const renderAccountTab = () => (
        <>
            <section className={styles.card}>
                <div className={styles.sectionHeader}>
                    <h2>User Details</h2>
                    <button
                        className={styles.primaryButton}
                        onClick={() => setShowUpdateForm(true)}
                    >
                        Update Details
                    </button>
                </div>

                <div className={styles.userDetails}>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Name</span>
                        <span className={styles.detailValue}>
                            {currentUser.displayName || 'Not set'}
                        </span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Email</span>
                        <span className={styles.detailValue}>
                            {currentUser.email}
                        </span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Account Created</span>
                        <span className={styles.detailValue}>
                            {currentUser.metadata?.creationTime
                                ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                                : 'Not available'}
                        </span>
                    </div>
                </div>
            </section>
            
            <div className={styles.sectionGap}></div>
            
            <section className={styles.card}>
                <ChangePassword currentUser={currentUser}/>
            </section>
            
            <div className={styles.sectionGap}></div>
            
            <section className={styles.deleteSection}>
                <DeleteAccountButton currentUser={currentUser}/>
            </section>
        </>
    );
    
    const renderNotificationsTab = () => (
        <>
            <section className={styles.card}>
                <div className={styles.sectionHeader}>
                    <div className={styles.headerWithInfo}>
                        <h2>Email Notifications</h2>
                        <div className={styles.infoIcon}
                                title="Receive email notifications for budget alerts, upcoming loan instalments, and important account updates">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                    strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                        </div>
                    </div>
                    <button
                        onClick={toggleNotifications}
                        className={`${styles.primaryButton} ${notificationsEnabled ? styles.enabled : ''}`}
                    >
                        {notificationsEnabled ? 'Disable' : 'Enable'} Notifications
                    </button>
                </div>
                <p className={styles.notificationDescription}>
                    Get timely updates about your budgets, loan instalments, and important account activities.
                </p>
            </section>
        </>
    );
    
    const renderCategoriesTab = () => (
        <>
            <section className={styles.card}>
                <CategoryManagement/>
            </section>
        </>
    );
    
    const renderDataTab = () => (
        <>
            <section className={styles.card}>
                <div className={styles.sectionHeader}>
                    <h2>Data Export</h2>
                </div>
                <p className={styles.notificationDescription}>
                    Download all your StudentWallet data in Excel format.
                </p>
                <DataExport/>
            </section>
        </>
    );

    if (!currentUser) return null;

    return (
        <Layout currentUser={currentUser}>
            <div className={styles.pageContainer}>
                <header className={styles.pageHeader}>
                    <h1>Account Settings</h1>
                    <p className={styles.subtitle}>
                        Manage your account preferences and settings
                    </p>
                </header>

                {message && (
                    <div className={styles.messageBanner}>
                        {message}
                    </div>
                )}

                <div className={styles.tabsContainer}>
                    <div className={styles.tabNav}>
                        <button 
                            className={`${styles.tabButton} ${activeTab === 'account' ? styles.active : ''}`}
                            onClick={() => setActiveTab('account')}
                        >
                            Account
                        </button>
                        <button 
                            className={`${styles.tabButton} ${activeTab === 'notifications' ? styles.active : ''}`}
                            onClick={() => setActiveTab('notifications')}
                        >
                            Notifications
                        </button>
                        <button 
                            className={`${styles.tabButton} ${activeTab === 'categories' ? styles.active : ''}`}
                            onClick={() => setActiveTab('categories')}
                        >
                            Categories
                        </button>
                        <button 
                            className={`${styles.tabButton} ${activeTab === 'data' ? styles.active : ''}`}
                            onClick={() => setActiveTab('data')}
                        >
                            Data Management
                        </button>
                    </div>

                    <div className={styles.tabContent}>
                        {activeTab === 'account' && renderAccountTab()}
                        {activeTab === 'notifications' && renderNotificationsTab()}
                        {activeTab === 'categories' && renderCategoriesTab()}
                        {activeTab === 'data' && renderDataTab()}
                    </div>
                </div>

                {showUpdateForm && (
                    <UpdateUserForm
                        userId={currentUser.uid}
                        currentUser={currentUser}
                        onUserUpdated={() => {
                            fetchUserDetails();
                            setShowUpdateForm(false);
                            toast('User details updated successfully', { type: 'success' });
                        }}
                        onClose={() => setShowUpdateForm(false)}
                    />
                )}
            </div>
        </Layout>
    );
}

export default PreferencesPage;