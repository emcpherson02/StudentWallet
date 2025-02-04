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

function PreferencesPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [linkedBank, setLinkedBank] = useState(false);
    const [accounts, setAccounts] = useState([]);

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
            // Refresh the user display if needed
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

    if (!currentUser) {
        return null;
    }

    return (
        <div className={styles.App}>
            <div className={styles.header}>
            <div className={styles.headerLeft}>
                    <button
                        className={styles.backButton}
                        onClick={() => navigate('/plaid-link')}
                    >
                        ← Back
                    </button>
                </div>
                <h1>Account Preferences</h1>
                <button
                    className={styles.logoutButton}
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>
            <div className={styles.mainContent}>
                <div className={`${styles.card} ${styles.userDetailsSection}`}>
                    <h2>User Details</h2>
                    {message && (
                        <div className={styles.messageBanner}>
                            {message}
                        </div>
                    )}
                    
                    <button
                        className={styles.primaryButton}
                        onClick={() => setShowUpdateForm(true)}
                    >
                        Update Account Details
                    </button>

                    {currentUser ? (
                        <ul>
                            <li className={styles.userDetailItem}>
                                <div><strong>Name:</strong> {currentUser.displayName || 'Not set'}</div>
                                <div><strong>Email:</strong> {currentUser.email}</div>
                                <div>
                                    <strong>Account Created:</strong> {currentUser.metadata?.creationTime 
                                        ? new Date(currentUser.metadata.creationTime).toLocaleDateString() 
                                        : 'Not available'}
                                </div>
                            </li>
                        </ul>
                    ) : (
                        <p>No user details available.</p>
                    )}

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
                </div>
            </div>
            <ThemeToggleSection />

            <ChangePassword currentUser={currentUser} />

            <DeleteAccountButton currentUser={currentUser} />

        </div>
    );
}

export default PreferencesPage;