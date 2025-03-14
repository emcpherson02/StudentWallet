import React, { useState } from 'react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../utils/firebase';

const ChangePassword = ({ currentUser, onComplete }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });

  const validatePasswords = () => {
    if (newPassword.length < 6) {
      setMessage({
        text: 'New password must be at least 6 characters long',
        isError: true
      });
      return false;
    }
    if (newPassword !== confirmPassword) {
      setMessage({
        text: 'New passwords do not match',
        isError: true
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswords()) return;

    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      const credential = EmailAuthProvider.credential(
          currentUser.email,
          currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);

      setMessage({
        text: 'Password updated successfully',
        isError: false
      });

      // Clear form and notify parent
      setTimeout(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (onComplete) onComplete();
      }, 2000);

    } catch (error) {
      console.error('Error changing password:', error);
      let errorMessage = 'Failed to change password';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect';
      }
      setMessage({
        text: errorMessage,
        isError: true
      });
    } finally {
      setLoading(false);
    }
  };

  return (
      <form onSubmit={handleSubmit} className="password-form">
        {message.text && (
            <div className={`message ${message.isError ? 'error' : 'success'}`}>
              {message.text}
            </div>
        )}

        <div className="form-group">
          <label>Current Password</label>
          <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="Enter your current password"
          />
        </div>

        <div className="form-group">
          <label>New Password</label>
          <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Enter your new password"
          />
        </div>

        <div className="form-group">
          <label>Confirm New Password</label>
          <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your new password"
          />
        </div>

        <div className="button-group">
          <button
              type="submit"
              className={`primary-button ${loading ? 'loading' : ''}`}
              disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>

          <button
              type="button"
              className="secondary-button"
              onClick={onComplete}
          >
            Cancel
          </button>
        </div>

        <style jsx>{`
        .password-form {
          margin-top: 1.5rem;
        }

        .message {
          padding: 0.75rem;
          margin-bottom: 1rem;
          border-radius: 0.375rem;
        }

        .message.error {
          background-color: #fee2e2;
          color: #dc2626;
        }

        .message.success {
          background-color: #dcfce7;
          color: #16a34a;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          transition: all 0.2s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #282c34;
          box-shadow: 0 0 0 2px rgba(40, 44, 52, 0.1);
        }

        .button-group {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .primary-button {
          background-color: #282c34;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .primary-button:hover:not(:disabled) {
          background-color: #364195;
        }

        .primary-button.loading {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .secondary-button {
          background-color: #f3f4f6;
          color: #374151;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .secondary-button:hover {
          background-color: #e5e7eb;
        }
      `}</style>
      </form>
  );
};

export default ChangePassword;