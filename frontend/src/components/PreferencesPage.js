import React, { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Preferences.module.css';
import axios from 'axios';
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';
import UpdateUserForm from './UpdateUserForm';
import DeleteAccountButton from './DeleteAccountButton';
import ChangePassword from './ChangePassword';
import ThemeToggleSection from './ThemeToggleSection';
import Layout from './Layout';

function PreferencesPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [linkedBank, setLinkedBank] = useState(false);
    const [accounts, setAccounts] = useState([]);

    if (!currentUser) {
        navigate('/login');
        return null;
    }

    const fetchUserDetails = async () => {
        try {
            const token = await currentUser.getIdToken();
            const response = await axios.get(`http://localhost:3001/user/user-data`, {
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
            setMessage('Failed to fetch user details.');
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

    return (
        <Layout currentUser={currentUser}>
            <div className={styles.pageContainer}>
                <header className={styles.pageHeader}>
                    <h1>Account Preferences</h1>
                    <p className={styles.subtitle}>Manage your account settings and preferences</p>
                </header>

                {message && (
                    <div className={styles.messageBanner}>
                        {message}
                    </div>
                )}

                <div className={styles.contentGrid}>
                    {/* User Details Section */}
                    <section className={styles.section}>
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
                                <span className={styles.detailValue}>{currentUser.displayName || 'Not set'}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Email</span>
                                <span className={styles.detailValue}>{currentUser.email}</span>
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

                        {showUpdateForm && (
                            <UpdateUserForm
                                userId={currentUser.uid}
                                currentUser={currentUser}
                                onUserUpdated={() => {
                                    fetchUserDetails();
                                    setShowUpdateForm(false);
                                    setMessage('User details updated successfully!');
                                }}
                                setMessage={setMessage}
                                onClose={() => setShowUpdateForm(false)}
                            />
                        )}
                    </section>

                    {/* Theme Toggle Section */}
                    <section className={styles.section}>
                        <ThemeToggleSection />
                    </section>

                    {/* Password Section */}
                    <section className={styles.section}>
                        <ChangePassword currentUser={currentUser} />
                    </section>

                    {/* Account Deletion Section */}
                    <section className={styles.dangerSection}>
                        <DeleteAccountButton currentUser={currentUser} />
                    </section>
                </div>
            </div>
        </Layout>
    );
}

export default PreferencesPage;