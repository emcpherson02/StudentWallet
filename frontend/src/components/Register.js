import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../utils/authService';
import styles from '../styles/Register.module.css';

function Register() {
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (password.match(/[A-Z]/)) strength += 1;
        if (password.match(/[0-9]/)) strength += 1;
        if (password.match(/[^A-Za-z0-9]/)) strength += 1;
        return strength;
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage("Passwords do not match!");
            return;
        }

        if (passwordStrength < 3) {
            setMessage("Please create a stronger password");
            return;
        }

        try {
            await registerUser(email, password, name, dob);
            setMessage("Registration successful!");
            navigate('/login');
        } catch (error) {
            console.error("Error registering user:", error);
            const errorMessages = {
                'auth/email-already-in-use': "This email is already registered.",
                'auth/weak-password': "Password should be at least 6 characters.",
                'default': "An error occurred. Please try again."
            };
            setMessage(errorMessages[error.code] || errorMessages.default);
        }
    };

    return (
        <div className={styles.Register}>
            <div className={styles.brandContainer}>
                <h1 className={styles.brandTitle}>StudentWallet</h1>
                <p className={styles.brandSubtitle}>Manage your finances with ease</p>
            </div>

            <div className={styles.RegisterContainer}>
                <div className={styles.Header}>
                    <h1>Create Account</h1>
                    <p>Join us to manage your student finances</p>
                </div>

                <form onSubmit={handleRegister}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="name">Full name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="dob">Date of birth</label>
                        <input
                            id="dob"
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            required
                        />
                    </div>

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
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setPasswordStrength(calculatePasswordStrength(e.target.value));
                            }}
                            required
                            placeholder="Create a password"
                        />
                        {password && (
                            <div className={styles.passwordStrength}>
                                <div className={styles.strengthBar}>
                                    {[...Array(4)].map((_, i) => (
                                        <span
                                            key={i}
                                            className={`${styles.strengthSegment} ${
                                                i < passwordStrength ? styles.active : ''
                                            }`}
                                        />
                                    ))}
                                </div>
                                <span className={styles.strengthText}>
                                    {['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'][passwordStrength]}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="confirmPassword">Confirm password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Confirm your password"
                        />
                    </div>

                    <button type="submit" className={styles.gradientButton}>
                        Create account
                    </button>

                    {message && (
                        <div className={`${styles.message} ${
                            message.includes('successful') ? styles.success : styles.error
                        }`}>
                            {message}
                        </div>
                    )}

                    <Link to="/login">
                        <button className={styles.linkButton}>
                            Already have an account? Sign in
                        </button>
                    </Link>
                </form>
            </div>
        </div>
    );
}

export default Register;