import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from "../utils/authService";
import styles from '../styles/Login.module.css';
import { googleAuthProvider, auth, db } from '../utils/firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await loginUser(email, password);
            setMessage("Login successful!");
            navigate('/plaid-link');
        } catch (error) {
            console.error("Error logging in:", error);
            const errorMessages = {
                'auth/user-not-found': "No account found with this email.",
                'auth/wrong-password': "Incorrect password. Please try again.",
                'default': "An error occurred. Please try again."
            };
            setMessage(errorMessages[error.code] || errorMessages.default);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleAuthProvider);
            const user = result.user;

            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                await setDoc(userRef, {
                    displayName: user.displayName,
                    email: user.email,
                    dob: '',
                    linkedBank: false,
                    createdAt: new Date(),
                });
            }
            navigate('/plaid-link');
        } catch (error) {
            console.error('Google login failed:', error);
            setMessage('Failed to log in with Google. Please try again.');
        }
    };

    return (
        <div className={styles.Login}>
            <div className={styles.brandContainer}>
                <h1 className={styles.brandTitle}>StudentWallet</h1>
                <p className={styles.brandSubtitle}>Manage your finances with ease</p>
            </div>

            <div className={styles.loginContainer}>
                <div className={styles.Header}>
                    <h1>Welcome Back</h1>
                    <p>Sign in to manage your student finances</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                        />
                    </div>

                    <button type="submit" className={styles.gradientButton}>
                        Sign in
                    </button>
                </form>

                {message && (
                    <div className={`${styles.message} ${
                        message.includes('successful') ? styles.success : styles.error
                    }`}>
                        {message}
                    </div>
                )}

                <button onClick={handleGoogleLogin} className={styles['login-with-google-btn']}>
                    Continue with Google
                </button>

                <Link to="/register">
                    <button className={styles.linkButton}>
                        Create a new account
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default Login;