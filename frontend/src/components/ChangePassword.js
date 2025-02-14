import React, { useState } from 'react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../utils/firebase';

const ChangePassword = ({ currentUser }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [showForm, setShowForm] = useState(false);

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
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);

      setMessage({
        text: 'Password updated successfully',
        isError: false
      });
      setShowForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
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
    <div style={{
      borderRadius: '0.5rem',
      padding: '1.5rem',
      marginBottom: '1rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        fontColor: 'black',
        marginBottom: '1rem'
      }}>
        Password Settings
      </h2>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            backgroundColor: '#3b82f6',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background-color 150ms'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          Change Password
        </button>
      ) : (
        <form onSubmit={handleSubmit}>
          {message.text && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              borderRadius: '0.375rem',
              backgroundColor: message.isError ? '#fee2e2' : '#dcfce7',
              color: message.isError ? '#dc2626' : '#16a34a'
            }}>
              {message.text}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem'
              }}
              required
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem'
          }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? '0.7' : '1',
                fontWeight: '500',
                transition: 'background-color 150ms'
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2563eb')}
              onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#3b82f6')}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
            
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setMessage({ text: '', isError: false });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background-color 150ms'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ChangePassword;