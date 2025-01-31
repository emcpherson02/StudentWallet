import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import axios from 'axios';
import styles from '../styles/BudgetDashboard.module.css';

const BudgetDashboard = () => {
    const { currentUser } = useAuth();
    const [budgetData, setBudgetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;

            try {
                const token = await currentUser.getIdToken();

                // Fetch user data first
                const userResponse = await axios.get(
                    'http://localhost:3001/user/user-data',
                    {
                        params: { userId: currentUser.uid },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                // Set notification status - explicitly convert to boolean
                const isNotificationsEnabled = userResponse.data.notificationsEnabled === true;
                console.log('Setting notifications to:', isNotificationsEnabled);
                setNotificationsEnabled(isNotificationsEnabled);

                // Fetch budget data
                const budgetResponse = await axios.get(
                    'http://localhost:3001/budget/analytics/summary',
                    {
                        params: { userId: currentUser.uid },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                setBudgetData(budgetResponse.data.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load budget data');
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    const toggleNotifications = async () => {
        try {
            const token = await currentUser.getIdToken();
            await axios.post(
                'http://localhost:3001/user/toggle-notifications',
                {
                    userId: currentUser.uid,
                    enabled: !notificationsEnabled
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setNotificationsEnabled(!notificationsEnabled);
        } catch (err) {
            console.error('Error toggling notifications:', err);
            setError('Failed to update notification settings');
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading budget data...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    if (!budgetData) return null;

    return (
        <div className={styles.dashboard}>
            <div className={styles.dashboardHeader}>
                <h1>Budget Dashboard</h1>
                <button
                    onClick={toggleNotifications}
                    className={`${styles.notificationToggle} ${
                        notificationsEnabled ? styles.enabled : ''
                    }`}
                >
                    {notificationsEnabled ? 'Disable Email Notifications' : 'Enable Email Notifications'}
                </button>
            </div>

            {/* Summary Cards Section */}
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <h3>Total Budget</h3>
                    <p className={budgetData.totalBudgets >= 0 ? styles.positive : styles.negative}>
                        £{budgetData.totalBudgets.toFixed(2)}
                    </p>
                </div>

                <div className={styles.summaryCard}>
                    <h3>Total Spent</h3>
                    <p>£{budgetData.totalSpent.toFixed(2)}</p>
                </div>

                <div className={styles.summaryCard}>
                    <h3>Remaining</h3>
                    <p className={budgetData.remaining >= 0 ? styles.positive : styles.negative}>
                        £{budgetData.remaining.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Category Breakdown Cards */}
            <div className={styles.categoriesGrid}>
                {budgetData.categoryBreakdown.map((category, index) => (
                    <div key={index} className={styles.categoryCard}>
                        <h3>{category.category}</h3>

                        <div className={styles.progressContainer}>
                            <span className={styles.progressLabel}>
                                {parseFloat(category.percentageUsed).toFixed(1)}% Used
                            </span>
                            <div className={styles.progressBar}>
                                <div
                                    className={`${styles.progressFill} ${
                                        parseFloat(category.percentageUsed) > 100 ? styles.exceeded : ''
                                    }`}
                                    style={{ width: `${Math.min(parseFloat(category.percentageUsed), 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className={styles.detailsGrid}>
                            <div className={styles.detailsItem}>
                                <p>Budget</p>
                                <p>£{category.budgetAmount.toFixed(2)}</p>
                            </div>
                            <div className={styles.detailsItem}>
                                <p>Spent</p>
                                <p>£{category.spent.toFixed(2)}</p>
                            </div>
                            <div className={styles.detailsItem}>
                                <p>Remaining</p>
                                <p className={category.remaining >= 0 ? styles.positive : styles.negative}>
                                    £{category.remaining.toFixed(2)}
                                </p>
                            </div>
                            <div className={styles.detailsItem}>
                                <p>Progress</p>
                                <p>{parseFloat(category.percentageUsed).toFixed(1)}%</p>
                            </div>
                        </div>

                        {parseFloat(category.percentageUsed) > 100 && (
                            <div className={styles.warning}>
                                <p>
                                    Warning: Budget exceeded by {(parseFloat(category.percentageUsed) - 100).toFixed(1)}%
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BudgetDashboard;