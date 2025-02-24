import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from "../utils/authService";
import styles from '../styles/Login.module.css';
import { googleAuthProvider, auth, db } from '../utils/firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {AlertCircle, Mail, Lock} from "lucide-react";
import ForgottenPassword from "./ForgottenPassword";
import {useAuth} from "../utils/AuthContext";

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const [showForgottenPassword, setShowForgottenPassword] = useState(false);
    const { currentUser } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await loginUser(email, password);
            const token = await currentUser.getIdToken();
            setMessage("Login successful!");
            sessionStorage.setItem('user', email);
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('userId', currentUser.uid);
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
            const token = await user.getIdToken();
            sessionStorage.setItem('user', user.email);
            sessionStorage.setItem('token', token);
            navigate('/plaid-link');
        } catch (error) {
            console.error('Google login failed:', error);
            setMessage('Failed to log in with Google. Please try again.');
        }
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.brandSection}>
                <h1 className={styles.brandTitle}>StudentWallet</h1>
                <p className={styles.brandSubtitle}>Manage your finances with ease</p>
            </div>

            <div className={styles.formContainer}>
                <div className={styles.formCard}>
                    <div className={styles.formHeader}>
                        <h2>Welcome Back</h2>
                        <p>Sign in to manage your student finances</p>
                    </div>

                    {message && (
                        <div className={`${styles.message} ${
                            message.includes('successful')
                                ? styles.successMessage
                                : styles.errorMessage
                        }`}>
                            <AlertCircle size={20} />
                            <span>{message}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>Email address</label>
                            <div className={styles.inputWrapper}>
                                <Mail className={styles.inputIcon} size={20}/>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Password</label>
                            <div className={styles.inputWrapper}>
                                <Lock className={styles.inputIcon} size={20}/>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        <div className={styles.forgotPasswordContainer}>
                            <button
                                type="button"
                                onClick={() => setShowForgottenPassword(true)}
                                className={styles.forgotPasswordLink}
                            >
                                Forgot password?
                            </button>
                        </div>


                        <button type="submit" className={styles.submitButton}>
                            Sign in
                        </button>
                    </form>

                    <div className={styles.divider}>
                        <span>Or continue with</span>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className={styles.googleButton}
                    >
                        <img
                            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMTcuNiA5LjJsLS4xLTEuOEg5djMuNGg0LjhDMTMuNiAxMiAxMyAxMyAxMiAxMy42djIuMmgzYTguOCA4LjggMCAwIDAgMi42LTYuNnoiIGZpbGw9IiM0Mjg1RjQiIGZpbGwtcnVsZT0ibm9uemVybyIvPjxwYXRoIGQ9Ik05IDE4YzIuNCAwIDQuNS0uOCA2LTIuMmwtMy0yLjJhNS40IDUuNCAwIDAgMS04LTIuOUgxVjEzYTkgOSAwIDAgMCA4IDV6IiBmaWxsPSIjMzRBODUzIiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48cGF0aCBkPSJNNCAxMC43YTUuNCA1LjQgMCAwIDEgMC0zLjRWNUgxYTkgOSAwIDAgMCAwIDhsMy0yLjN6IiBmaWxsPSIjRkJCQzA1IiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48cGF0aCBkPSJNOSAzLjZjMS4zIDAgMi41LjQgMy40IDEuM0wxNSAyLjNBOSA5IDAgMCAwIDEgNWwzIDIuNGE1LjQgNS40IDAgMCAxIDUtMy43eiIgZmlsbD0iI0VBNDMzNSIgZmlsbC1ydWxlPSJub256ZXJvIi8+PHBhdGggZD0iTTAgMGgxOHYxOEgweiIvPjwvZz48L3N2Zz4="
                            alt="Google logo"
                            className={styles.googleIcon}
                        />
                        <span>Google</span>
                    </button>

                    <div className={styles.registerLink}>
                        <Link to="/register">
                            Create a new account
                        </Link>
                    </div>
                </div>
            </div>

            {showForgottenPassword && (
                <ForgottenPassword onClose={() => setShowForgottenPassword(false)} />
            )}
        </div>
    );
};

export default Login;