import React from 'react';
import { useAuth } from '../utils/AuthContext';
import Layout from './Layout';
import styles from '../styles/AboutUs.module.css';

const AboutUs = () => {
    const { currentUser } = useAuth();

    return (
        <Layout currentUser={currentUser}>
            <div className={styles.aboutContainer}>
                <header className={styles.header}>
                    <h1>About StudentWallet</h1>
                    <p className={styles.subtitle}>Managing student finances made simple</p>
                </header>

                <section className={styles.projectSection}>
                    <h2>Our Mission</h2>
                    <p>
                        StudentWallet is a comprehensive financial management platform designed by students, 
                        for students. Built by a team of five Software Engineering students at Queen's University 
                        Belfast, our mission is to help students take control of their finances and develop 
                        better money management habits.
                    </p>
                </section>

                <section className={styles.featuresSection}>
                    <h2>Key Features</h2>
                    <div className={styles.featuresGrid}>
                        <div className={styles.featureCard}>
                            <h3>Bank Integration</h3>
                            <p>Securely connect your bank accounts for automatic transaction tracking</p>
                        </div>
                        <div className={styles.featureCard}>
                            <h3>Budget Management</h3>
                            <p>Create and monitor budgets to keep your spending in check</p>
                        </div>
                        <div className={styles.featureCard}>
                            <h3>Student Loan Tracking</h3>
                            <p>Keep track of your maintenance loan installments and spending</p>
                        </div>
                        <div className={styles.featureCard}>
                            <h3>Financial Analytics</h3>
                            <p>Visualize your spending patterns with detailed analytics</p>
                        </div>
                    </div>
                </section>

                <section className={styles.teamSection}>
                    <h2>Our Team</h2>
                    <p>
                        We are a team of five final-year Software Engineering students at Queen's University 
                        Belfast. This project was developed as part of our studies, combining our technical 
                        skills with our firsthand understanding of student financial challenges.
                    </p>
                    <p>
                        Our diverse team brings together expertise in frontend development, backend systems, 
                        database design, and user experience, allowing us to create a comprehensive solution 
                        for student financial management.
                    </p>
                </section>

                <section className={styles.contactSection}>
                    <h2>Get in Touch</h2>
                    <p>
                        We're always looking to improve StudentWallet and would love to hear your feedback. 
                        If you have any questions or suggestions, please feel free to reach out to our team.
                    </p>
                    <a href="mailto:team@studentwallet.com" className={styles.contactButton}>
                        Contact Us
                    </a>
                </section>
            </div>
        </Layout>
    );
};

export default AboutUs;