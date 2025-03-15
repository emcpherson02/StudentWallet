import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../utils/authService';
import styles from '../styles/Register.module.css';
import {User, AlertCircle, Mail, Lock, Calendar} from 'lucide-react';

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

    //Sets minimum age requirement to 13 years old
    const validateAge = (birthDate) => {
        const today = new Date();
        const birth = new Date(birthDate);
        
        // Calculate age
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        // If birthday hasn't occurred yet this year, subtract a year
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age >= 13;
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

        if (!validateAge(dob)) {
            setMessage("You must be at least 13 years old to create an account.");
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
        <div className={styles.registerPage}>
            <div className={styles.brandSection}>
                <h1 className={styles.brandTitle}>StudentWallet</h1>
                <p className={styles.brandSubtitle}>Manage your finances with ease</p>
            </div>

            <div className={styles.formContainer}>
                <div className={styles.formCard}>
                    <div className={styles.formHeader}>
                        <h2>Create Account</h2>
                        <p>Join us to manage your student finances</p>
                    </div>

                    {message && (
                        <div className={`${styles.message} ${
                            message.includes('successful') ? styles.successMessage : styles.errorMessage
                        }`}>
                            <AlertCircle size={20} />
                            <span>{message}</span>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="name">Full name</label>
                            <div className={styles.inputWrapper}>
                                <User className={styles.inputIcon} size={20} />
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="dob">Date of birth</label>
                            <div className={styles.inputWrapper}>
                                <Calendar className={styles.inputIcon} size={20} />
                                <input
                                    id="dob"
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    required
                                    max={new Date().toISOString().split('T')[0]} // Prevent future dates
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="email">Email address</label>
                            <div className={styles.inputWrapper}>
                                <Mail className={styles.inputIcon} size={20} />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="password">Password</label>
                            <div className={styles.inputWrapper}>
                                <Lock className={styles.inputIcon} size={20} />
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
                            </div>
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
                                        {['Very Weak', 'Weak', 'Medium', 'Strong'][passwordStrength]}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="confirmPassword">Confirm password</label>
                            <div className={styles.inputWrapper}>
                                <Lock className={styles.inputIcon} size={20} />
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Confirm your password"
                                />
                            </div>
                        </div>

                        <button type="submit" className={styles.submitButton}>
                            Create account
                        </button>
                    </form>

                    <div className={styles.loginLink}>
                        <Link to="/login">
                            Already have an account? Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;