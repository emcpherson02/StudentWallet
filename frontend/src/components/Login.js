import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {loginUser} from "../utils/authService";
import styles from '../styles/Login.module.css';
import { googleAuthProvider, auth, db} from '../utils/firebase'; // Import Google provider and auth
import { signInWithPopup} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Login component that handles user authentication.
 * @component
 */
function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    /**
     * Handles user login by calling loginUser function from authService
     * @param e
     * @returns {Promise<void>}
     */
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await loginUser(email, password);
            setMessage("Login successful!");
            handleSuccessfulLogin()
        } catch (error) {
            console.error("Error logging in:", error);
            if (error.code === 'auth/user-not-found') {
                setMessage("User not found.");
            } else if (error.code === 'auth/wrong-password') {
                setMessage("Incorrect password.");
            } else {
                setMessage("An error occurred. Please try again.");
            }
            handleFailedLogin(error.message);
        }
    };

    /**
     * Handles Google login by redirecting to Google login page.
     * @returns {Promise<void>}
     */
    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleAuthProvider);
            const user = result.user
            console.log('Google login successful:', result.user);

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
                console.log("User Profile created in firestore");
            }else {
                console.log("User already exists in firestore");
            }
            navigate('/plaid-link'); // Redirect to Plaid Link page

        } catch (error) {
            console.error('Google login failed:', error);
            setMessage('Failed to log in with Google.');
        }
    };

    /**
     * Handles successful login by navigating to the home page.
     */
    const handleSuccessfulLogin = (token) => {
        setMessage('Login successful!');
        console.log('Redirecting to Plaid link...');
        navigate('/plaid-link');  // Redirect user to home or another page after login
    };

    /**
     * Handles failed login by setting appropriate message.
     * @param {string} errorMsg - Error message received from server.
     */
    const handleFailedLogin = (errorMsg) => {
        setMessage(`Login failed: ${errorMsg}`);
    };

    /**
     * Handles form submission for user login.
     * @param {Object} event - The form submission event.
     */
    const handleSubmit = (event) => {
        event.preventDefault();
        handleLogin(event);
    };

    return (
        <div className="Login">
            <header className={styles.Header}>
                <h1>Welcome to StudentWallet</h1>
                <p>Your one-stop solution for managing finances efficiently as a student.</p>
            </header>
            <div className={styles.loginContainer}>
                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email:</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password:</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className={styles.gradientButton}>Login</button>
                </form>
                {message && (
                    <p className={styles.message} style={{color: message.includes('successful') ? 'green' : 'red'}}>
                        {message}
                    </p>
                )}
                {/* <a href="http://localhost:3001/auth/google" className={styles['login-with-google-btn']}>Login with Google</a> */}
                <button onClick={handleGoogleLogin} className={styles['login-with-google-btn']}>
                    Login with Google
                </button>
                <p>Don't have an account?</p>
                <p>
                    <Link to="/register">
                        <button className={styles.linkButton}>Register</button>
                    </Link>
                </p>
            </div>
        </div>
    );
}


export default Login;