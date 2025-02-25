// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from './firebase';
import { refreshToken, checkTokenExpiration, logoutUser } from './authService';

// Create the AuthContext
const AuthContext = createContext();

// Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);

// AuthProvider component that wraps around app components that need access to auth state
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Set up token refresh interval and expiration check
    useEffect(() => {
        if (currentUser) {
            // Initial token fetch
            refreshToken();

            // Set up periodic token refresh (every 55 minutes)
            const refreshInterval = setInterval(() => {
                refreshToken();
            }, 55 * 60 * 1000);

            // Set up token expiration check (every minute)
            const expirationCheckInterval = setInterval(() => {
                checkTokenExpiration();
            }, 60 * 1000);

            return () => {
                clearInterval(refreshInterval);
                clearInterval(expirationCheckInterval);
            };
        }
    }, [currentUser]);

    // Listen for authentication state changes
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        // Cleanup the listener on unmount
        return unsubscribe;
    }, []);

    // Context value with current user, loading status, and auth functions
    const value = {
        currentUser,
        loading,
        refreshToken,
        checkTokenExpiration,
        logoutUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children} {/* Render children only when not loading */}
        </AuthContext.Provider>
    );
};