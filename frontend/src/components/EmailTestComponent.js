import React, { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import axios from 'axios';
import { getApiUrl } from '../utils/api';
import styles from '../styles/EmailTest.module.css';

const EmailTestComponent = () => {
    const { currentUser } = useAuth();
    const [targetUserId, setTargetUserId] = useState(currentUser?.uid || '');
    const [emailPreview, setEmailPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleGeneratePreview = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        setEmailPreview('');

        try {
            const token = await currentUser.getIdToken();
            const response = await axios.post(
                getApiUrl('/api/test/trigger-summary-email'),
                {
                    userId: targetUserId,
                    sendEmail: false
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setEmailPreview(response.data.html);
            setSuccess('Email preview generated successfully');
        } catch (err) {
            console.error('Error generating email preview:', err);
            setError(err.response?.data?.message || 'Failed to generate email preview');
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async () => {
        setIsSending(true);
        setError('');
        setSuccess('');

        try {
            const token = await currentUser.getIdToken();
            const response = await axios.post(
                getApiUrl('/api/test/trigger-summary-email'),
                {
                    userId: targetUserId,
                    sendEmail: true
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setSuccess('Email sent successfully to user with ID: ' + targetUserId);
        } catch (err) {
            console.error('Error sending email:', err);
            setError(err.response?.data?.message || 'Failed to send email');
        } finally {
            setIsSending(false);
        }
    };

    const openPreviewInNewWindow = () => {
        const token = currentUser.getIdToken();
        token.then(tokenValue => {
            const url = getApiUrl(`/api/test/preview-summary-email?userId=${targetUserId}`);

            // Open in a new window/tab
            const newWindow = window.open('', '_blank');
            newWindow.document.write('<html><head><title>Loading Email Preview...</title></head><body><p>Loading...</p></body></html>');

            // Create a form to post with the token
            const form = newWindow.document.createElement('form');
            form.method = 'GET';
            form.action = url;

            // Add token as a header via meta tag
            const meta = newWindow.document.createElement('meta');
            meta.httpEquiv = 'Authorization';
            meta.content = `Bearer ${tokenValue}`;
            newWindow.document.head.appendChild(meta);

            // Submit the form
            newWindow.document.body.appendChild(form);
            form.submit();
        });
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Email Summary Test Tool</h1>
            <p className={styles.description}>
                Use this tool to generate and preview weekly summary emails for any user.
                The email will include data from the past 7 days.
            </p>

            <div className={styles.formContainer}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>User ID</label>
                    <input
                        type="text"
                        value={targetUserId}
                        onChange={(e) => setTargetUserId(e.target.value)}
                        className={styles.input}
                        placeholder="Enter user ID"
                        required
                    />
                </div>

                <div className={styles.buttonGroup}>
                    <button
                        onClick={handleGeneratePreview}
                        disabled={!targetUserId || loading}
                        className={`${styles.button} ${styles.previewButton}`}
                    >
                        {loading ? 'Generating...' : 'Generate Preview'}
                    </button>

                    <button
                        onClick={openPreviewInNewWindow}
                        disabled={!targetUserId}
                        className={`${styles.button} ${styles.openButton}`}
                    >
                        Open in New Window
                    </button>

                    <button
                        onClick={handleSendEmail}
                        disabled={!targetUserId || isSending}
                        className={`${styles.button} ${styles.sendButton}`}
                    >
                        {isSending ? 'Sending...' : 'Send Real Email'}
                    </button>
                </div>

                {error && (
                    <div className={styles.errorMessage}>
                        <p>{error}</p>
                    </div>
                )}

                {success && (
                    <div className={styles.successMessage}>
                        <p>{success}</p>
                    </div>
                )}
            </div>

            {emailPreview && (
                <div className={styles.previewContainer}>
                    <h2 className={styles.previewTitle}>Email Preview</h2>
                    <div className={styles.previewFrame}>
                        <iframe
                            srcDoc={emailPreview}
                            title="Email Preview"
                            className={styles.iframe}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailTestComponent;