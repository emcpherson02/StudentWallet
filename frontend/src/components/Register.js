import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../utils/authService';
import styles from '../styles/Register.module.css';

function Register() {
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await registerUser(email, password, name, dob);
            setMessage("Registration successful!");
            navigate('/login');
        } catch (error) {
            console.error("Error registering user:", error);
            if (error.code === 'auth/email-already-in-use') {
                setMessage("Email is already registered.");
            } else if (error.code === 'auth/weak-password') {
                setMessage("Password should be at least 6 characters.");
            } else {
                setMessage("An error occurred. Please try again.");
            }
        }
    };

    return (
        <div className="Register">
            <header className={styles.Header}>
                <h1>Create a StudentWallet Account</h1>
                <p>Join us to manage your finances with ease.</p>
            </header>
            <div className={styles.RegisterContainer}>
                <form onSubmit={handleRegister}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="name">Name:</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="dob">Date of Birth:</label>
                        <input
                            id="dob"
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            required
                        />
                    </div>
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
                    <button type="submit" className={styles.gradientButton}>Register</button>
                </form>
                {message && (
                    <p className={styles.message} style={{color: message.includes('successful') ? 'green' : 'red'}}>
                        {message}
                    </p>
                )}
                <p>Already have an account?</p>
                <p>
                    <Link to="/login">
                        <button className={styles.linkButton}>Login</button>
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
