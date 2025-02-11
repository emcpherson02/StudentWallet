import React from 'react';
import { useAuth } from '../utils/AuthContext';
import Layout from './Layout';
import { BookOpen, DollarSign, Lightbulb, ExternalLink } from 'lucide-react';
import styles from '../styles/Tips.module.css';

const Tips = () => {
    const { currentUser } = useAuth();

    const appTips = [
        {
            title: "Link Your Bank Account",
            description: "Connect your bank account to automatically track expenses and get a complete view of your finances.",
            icon: <DollarSign className="w-6 h-6" />
        },
        {
            title: "Set Up Budgets",
            description: "Create budgets for different categories to manage your spending effectively.",
            icon: <BookOpen className="w-6 h-6" />
        },
        {
            title: "Track Student Loan",
            description: "Use the loan tracking feature to manage your maintenance loan instalments.",
            icon: <Lightbulb className="w-6 h-6" />
        }
    ];

    const financialTips = [
        {
            title: "Student Bank Accounts",
            description: "Open a student bank account to access benefits like interest-free overdrafts.",
            link: "https://www.moneysavingexpert.com/students/student-bank-account/"
        },
        {
            title: "Student Discounts",
            description: "Sign up for TOTUM or UNiDAYS to access student discounts across the UK.",
            link: "https://www.totum.com/"
        },
        {
            title: "Budgeting Guide",
            description: "Learn how to create and stick to a student budget.",
            link: "https://www.savethestudent.org/money/student-budgeting/student-budgeting.html"
        }
    ];

    return (
        <Layout currentUser={currentUser}>
            <div className={styles.tipsContainer}>
                <header className={styles.header}>
                    <h1>Financial Tips & Guidance</h1>
                    <p>Make the most of your money with these helpful tips and resources</p>
                </header>

                <section className={styles.section}>
                    <h2>Using StudentWallet Effectively</h2>
                    <div className={styles.tipsGrid}>
                        {appTips.map((tip, index) => (
                            <div key={index} className={styles.tipCard}>
                                <div className={styles.iconContainer}>
                                    {tip.icon}
                                </div>
                                <h3>{tip.title}</h3>
                                <p>{tip.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>Financial Resources</h2>
                    <div className={styles.resourcesGrid}>
                        {financialTips.map((resource, index) => (
                            <div key={index} className={styles.resourceCard}>
                                <div className={styles.resourceContent}>
                                    <h3>{resource.title}</h3>
                                    <p>{resource.description}</p>
                                </div>
                                <a
                                    href={resource.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.resourceLink}
                                >
                                    Learn More
                                    <ExternalLink className="w-4 h-4 ml-2" />
                                </a>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>Quick Money-Saving Tips</h2>
                    <div className={styles.savingTips}>
                        <ul>
                            <li>Cook meals in bulk and freeze portions</li>
                            <li>Use cashback websites for online shopping</li>
                            <li>Buy second-hand textbooks or use the library</li>
                            <li>Walk or cycle instead of using public transport</li>
                            <li>Take advantage of student discount cards</li>
                            <li>Shop at budget supermarkets</li>
                        </ul>
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default Tips;