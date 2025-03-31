import React, { useState } from 'react';
import axios from 'axios';
import { getApiUrl } from "../utils/api";
import { toast } from "react-toastify";
import styles from '../styles/Preferences.module.css';

const EmailChangeForm = ({ userId, currentEmail, currentUser, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        newEmail: '',
        currentPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Get token using Firebase's getIdToken method
            const token = await currentUser.getIdToken(true);

            // Call our new backend endpoint
            await axios.post(
                getApiUrl('/user/change-email'),
                {
                    userId,
                    email: formData.newEmail,
                    currentPassword: formData.currentPassword
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast('Email changed successfully. Please verify your new email.', { type: 'success' });
            onSuccess(formData.newEmail);
        } catch (error) {
            console.error('Error changing email:', error);

            const errorResponse = error.response?.data;
            let errorMessage = 'Failed to change email address';

            // Handle specific error codes
            if (errorResponse?.code) {
                switch (errorResponse.code) {
                    case 'auth/requires-recent-login':
                        errorMessage = 'For security reasons, please log out and log back in to change your email address';
                        break;
                    case 'auth/email-already-in-use':
                        errorMessage = 'This email is already in use by another account';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Please enter a valid email address';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'The password you entered is incorrect';
                        break;
                    default:
                        errorMessage = errorResponse.message || 'Failed to change email address';
                }
            }

            setError(errorMessage);
            toast(errorMessage, { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.formContainer}>
            <h2>Change Email Address</h2>

            {error && (
                <div className={styles.errorMessage}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label htmlFor="currentEmail">Current Email</label>
                    <input
                        id="currentEmail"
                        type="email"
                        value={currentEmail}
                        disabled
                        className={styles.disabledInput}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="newEmail">New Email Address</label>
                    <input
                        id="newEmail"
                        type="email"
                        name="newEmail"
                        value={formData.newEmail}
                        onChange={handleChange}
                        required
                        placeholder="Enter your new email address"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                        id="currentPassword"
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        required
                        placeholder="Enter your current password"
                    />
                    <p className={styles.helpText}>
                        For security reasons, we need to verify your identity before changing your email.
                    </p>
                </div>

                <div className={styles.buttonGroup}>
                    <button
                        type="button"
                        onClick={onCancel}
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
                        {loading ? 'Changing...' : 'Change Email'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmailChangeForm;