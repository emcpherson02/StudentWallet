import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/Preferences.module.css';
import { getApiUrl } from "../utils/api";
import { toast } from "react-toastify";
import { updateProfile, updateEmail } from 'firebase/auth';

const UpdateUserForm = ({ userId, currentUser, onUserUpdated, onClose }) => {
    const [formData, setFormData] = useState({
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        dob: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
                    email: currentUser.email || '',
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
                // Ensure it's a valid date
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
                    // Continue with backend update even if Firebase update fails
                }
            }

            // Update the user email in Firebase Auth if changed
            if (formData.email !== currentUser.email) {
                try {
                    await updateEmail(currentUser, formData.email);
                } catch (emailError) {
                    console.error('Error updating email:', emailError);
                    throw emailError; // Re-throw email errors as they're critical
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

            let errorMessage = 'Failed to update user details';

            // Handle specific Firebase errors
            if (error.code) {
                switch (error.code) {
                    case 'auth/requires-recent-login':
                        errorMessage = 'For security reasons, please log out and log back in to change your email address';
                        break;
                    case 'auth/email-already-in-use':
                        errorMessage = 'This email is already in use by another account';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Please enter a valid email address';
                        break;
                    default:
                        errorMessage = `Failed to update: ${error.message || 'Unknown error'}`;
                }
            }

            setError(errorMessage);
            toast(errorMessage, { type: 'error' });

            // If it was an error updating the email, we should refresh the form data
            if (error.code && error.code.startsWith('auth/')) {
                setFormData(prev => ({
                    ...prev,
                    email: currentUser.email // Reset to current email
                }));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.formOverlay}>
            <div className={styles.formContainer}>
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
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        {formData.email !== currentUser.email && (
                            <p className={styles.warningText}>
                                Note: Changing your email will require you to log in again
                            </p>
                        )}
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
            </div>
        </div>
    );
};

export default UpdateUserForm;