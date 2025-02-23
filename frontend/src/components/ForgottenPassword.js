// src/components/ForgotPassword.js
import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { AlertCircle, Mail } from 'lucide-react';
import styles from '../styles/ForgottenPassword.module.css';

const ForgotPassword = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState({ type: '', content: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage({
                type: 'success',
                content: 'Password reset email sent! Check your inbox.'
            });
            setTimeout(() => onClose(), 3000);
        } catch (error) {
            setMessage({
                type: 'error',
                content: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2>Reset Password</h2>
                <div className={styles.content}>
                    <label>Email address</label>
                    <div className={styles.inputWrapper}>
                        <Mail className={styles.inputIcon} size={20} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className={styles.buttonGroup}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.cancelButton}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={styles.submitButton}
                        >
                            Reset Password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

