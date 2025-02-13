import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import axios from 'axios';
import styles from '../styles/BudgetDashboard.module.css';
import Layout from './Layout';
import PieChartComponent from './PieChartComponent';

const BudgetDashboard = () => {
    const { currentUser } = useAuth();
    const [budgetData, setBudgetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [expandedBudget, setExpandedBudget] = useState(null);

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

    const isWithinBudgetPeriod = (transactionDate, startDate, endDate) => {
        const txDate = new Date(transactionDate);
        const budgetStart = new Date(startDate);
        const budgetEnd = new Date(endDate);
        return txDate >= budgetStart && txDate <= budgetEnd;
    };

    const fetchTransactionsForBudget = async (budgetId) => {
        if (!currentUser || !budgetId) return;

        try {
            const token = await currentUser.getIdToken();
            const response = await axios.get(
                'http://localhost:3001/budget/transactions/',
                {
                    params: {
                        userId: currentUser.uid,
                        budgetId: budgetId
                    },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const budget = budgetData.categoryBreakdown.find(b => b.budgetId === budgetId);
            const filteredTransactions = response.data.data.filter(tx =>
                isWithinBudgetPeriod(tx.date, budget.startDate, budget.endDate)
            );

            setTransactions(prev => ({
                ...prev,
                [budgetId]: filteredTransactions
            }));
        } catch (err) {
            console.error('Error fetching transactions:', err);
        }
    };

    const calculatePercentage = (spent, budget) => {
        return (spent / budget) * 100;
    };

    const toggleTransactions = (budgetId) => {
        // If the clicked budget is already expanded, collapse it
        if (expandedBudget === budgetId) {
            setExpandedBudget(null);
        }
        // Otherwise, collapse any open budget and expand the clicked one
        else {
            setExpandedBudget(budgetId);
            if (!transactions[budgetId]) {
                fetchTransactionsForBudget(budgetId);
            }
        }
    };

// Function to prepare data for the Budget Allocation pie chart
    const prepareBudgetAllocationData = () => {
        if (!budgetData) return [];

        return budgetData.categoryBreakdown.map(category => ({
            name: category.category,
            value: category.budgetAmount
        }));
    };

    // Function to prepare data for the Spending Breakdown pie chart
    const prepareSpendingBreakdownData = () => {
        if (!budgetData) return [];

        return budgetData.categoryBreakdown.map(category => ({
            name: category.category,
            value: category.spent
        }));
    };

    if (loading) {
        return <div className={styles.loading}>Loading budget data...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    if (!budgetData) return null;


    return (
        <Layout CurrentUser={currentUser}>
            <div className={styles.dashboard}>
                <div className={styles.dashboardHeader}>
                    <h1>Budget Overview</h1>
                    <div className={styles.headerActions}>
                        <button
                            onClick={toggleNotifications}
                            className={`${styles.notificationToggle} ${notificationsEnabled ? styles.enabled : ''}`}
                        >
                            {notificationsEnabled ? 'Disable' : 'Enable'} Notifications
                        </button>
                    </div>
                </div>

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
                <div className={styles.pieChartSection}>
                    <div className={styles.pieChartContainer}>
                        <PieChartComponent data={prepareBudgetAllocationData()} title="Budget Allocation" />
                        <PieChartComponent data={prepareSpendingBreakdownData()} title="Spending Breakdown" />
                    </div>
                </div>

                <div className={styles.categorySection}>
                    <h2>Category Breakdown</h2>
                    <div className={styles.categoriesGrid}>
                        {budgetData.categoryBreakdown.map((category, index) => (
                            <div key={index} className={styles.categoryCard}>
                                <div className={styles.categoryHeader}>
                                    <h3>{category.category}</h3>
                                    <span className={styles.progressLabel}>
                                        {parseFloat(category.percentageUsed).toFixed(1)}% Used
                                    </span>
                                </div>

                                <div className={styles.progressContainer}>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={`${styles.progressFill} ${
                                                calculatePercentage(category.spent, category.budgetAmount) > 100 ? styles.exceeded : ''
                                            }`}
                                            style={{
                                                width: `${Math.min(calculatePercentage(category.spent, category.budgetAmount), 100)}%`
                                            }}
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
                                </div>

                                {parseFloat(category.percentageUsed) > 100 && (
                                    <div className={styles.warning}>
                                        <p>
                                            Budget exceeded by {(parseFloat(category.percentageUsed) - 100).toFixed(1)}%
                                        </p>
                                    </div>
                                )}

                                <button
                                    className={styles.transactionsButton}
                                    onClick={() => toggleTransactions(category.budgetId)}
                                >
                                    {expandedBudget === category.budgetId ? 'Hide' : 'View'} Transactions
                                </button>

                                {expandedBudget === category.budgetId && (
                                    <div className={styles.transactionsList}>
                                        {transactions[category.budgetId] ? (
                                            transactions[category.budgetId].length > 0 ? (
                                                transactions[category.budgetId].map(transaction => (
                                                    <div key={transaction.id} className={styles.transactionItem}>
                                                        <div className={styles.transactionDetails}>
                                                            <p className={styles.transactionDescription}>
                                                                {transaction.Description}
                                                            </p>
                                                            <p className={styles.transactionDate}>
                                                                {new Date(transaction.date).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <p className={styles.transactionAmount}>
                                                            £{Math.abs(transaction.Amount).toFixed(2)}
                                                        </p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className={styles.noTransactions}>No transactions found</p>
                                            )
                                        ) : (
                                            <p className={styles.loading}>Loading transactions...</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default BudgetDashboard;