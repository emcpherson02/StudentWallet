import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/Preferences.module.css';
import { getApiUrl } from "../utils/api";
import { toast } from "react-toastify";
import { updateProfile } from 'firebase/auth';
import EmailChangeForm from './EmailChangeForm';

const UpdateUserForm = ({ userId, currentUser, onUserUpdated, onClose }) => {
    const [formData, setFormData] = useState({
        displayName: currentUser.displayName || '',
        dob: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isChangingEmail, setIsChangingEmail] = useState(false);

    // Fetch existing user data
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = await currentUser.getIdToken();
                const response = await axios.get(
                    getApiUrl('/user/user-data'),
                    {
                        params: { userId },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                // Format the date properly if it exists
                let dobValue = '';
                if (response.data.dob) {
                    // Convert to YYYY-MM-DD format for input[type="date"]
                    const date = new Date(response.data.dob);
                    if (!isNaN(date.getTime())) {
                        dobValue = date.toISOString().split('T')[0];
                    }
                }

                setFormData({
                    displayName: currentUser.displayName || '',
                    dob: dobValue
                });

            } catch (error) {
                console.error('Error fetching user data:', error);
                toast('Failed to fetch user data', { type: 'error' });
            }
        };

        fetchUserData();
    }, [userId, currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = await currentUser.getIdToken();

            // Make sure dob is in ISO format or a proper date string
            let updatedData = { ...formData };

            // Convert dob to a consistent format
            if (formData.dob) {
                const dobDate = new Date(formData.dob);
                if (!isNaN(dobDate.getTime())) {
                    // Store as ISO string to maintain consistency
                    updatedData.dob = dobDate.toISOString();
                }
            }

            // Update the user profile in Firebase Auth for display name
            if (formData.displayName !== currentUser.displayName) {
                try {
                    await updateProfile(currentUser, {
                        displayName: formData.displayName
                    });
                } catch (profileError) {
                    console.error('Error updating profile:', profileError);
                }
            }

            // Update user in backend database
            await axios.put(
                getApiUrl(`/user/update_user/${userId}`),
                updatedData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            onUserUpdated(updatedData);
            toast('User details updated successfully', { type: 'success' });
        } catch (error) {
            console.error('Error updating user:', error);
            setError('Failed to update user details');
            toast('Failed to update user details', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleEmailChangeSuccess = (newEmail) => {
        // After successful email change, we need to refresh the page or redirect to login
        // since Firebase requires re-authentication after email change
        toast('Email updated successfully. Please sign in with your new email.', { type: 'success' });
        setTimeout(() => {
            // Sign out and redirect to login page
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userId');
            localStorage.removeItem('token');
            window.location.href = '/login';
        }, 3000);
    };

    return (
        <div className={styles.formOverlay}>
            <div className={styles.formContainer}>
                {isChangingEmail ? (
                    <EmailChangeForm
                        userId={userId}
                        currentEmail={currentUser.email}
                        currentUser={currentUser}
                        onSuccess={handleEmailChangeSuccess}
                        onCancel={() => setIsChangingEmail(false)}
                    />
                ) : (
                    <>
                        <h2>Update User Details</h2>

                        {error && (
                            <div className={styles.errorMessage}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label htmlFor="displayName">Display Name</label>
                                <input
                                    id="displayName"
                                    type="text"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="email">Email Address</label>
                                <div className={styles.emailContainer}>
                                    <input
                                        id="email"
                                        type="email"
                                        value={currentUser.email}
                                        disabled
                                        className={styles.disabledInput}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsChangingEmail(true)}
                                        className={styles.changeEmailButton}
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="dob">Date of Birth</label>
                                <input
                                    id="dob"
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className={styles.buttonGroup}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className={`${styles.primaryButton} ${styles.cancelButton}`}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.primaryButton}
                                    disabled={loading}
                                >
                                    {loading ? 'Updating...' : 'Update'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default UpdateUserForm;