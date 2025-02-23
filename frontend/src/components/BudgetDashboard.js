import React, {useState, useEffect, useCallback, useRef} from 'react';
import { useAuth } from '../utils/AuthContext';
import axios from 'axios';
import styles from '../styles/BudgetDashboard.module.css';
import Layout from './Layout';
import PieChartComponent from './PieChartComponent';
import {signOut} from "firebase/auth";
import {auth} from "../utils/firebase";
import { useNavigate, Link } from 'react-router-dom';
import {Plus, Trash2} from 'lucide-react';
import BudgetForm from './BudgetForm';
import {getApiUrl} from "../utils/api";

const BudgetDashboard = () => {
    const { currentUser } = useAuth();
    const [budgetData, setBudgetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [expandedBudget, setExpandedBudget] = useState(null);
    const navigate = useNavigate();
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const appRef = useRef();
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;

            try {
                const token = await currentUser.getIdToken();

                // Fetch user data first
                const userResponse = await axios.get(
                    getApiUrl('/user/user-data'),
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
                    getApiUrl('/budget/analytics/summary'),
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
                getApiUrl('/user/toggle-notifications'),
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
                getApiUrl('/budget/transactions/'),
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

    const handleLogout = useCallback(async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }, [navigate]);

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

    const handleDeleteBudget = async (budgetId) => {
        try {
            const token = await currentUser.getIdToken();
            await axios.delete(
                getApiUrl(`/budget/delete_budget/${budgetId}`),
                {
                    data: { userId: currentUser.uid },
                    headers: { Authorization: `Bearer ${token}` }

                }
            );
            setBudgetData(prev => ({
                ...prev,
                categoryBreakdown: prev.categoryBreakdown.filter(cat => cat.budgetId !== budgetId)
            }));
        } catch (error) {
            console.error('Error deleting budget:', error);
        }
    };

    const handleBudgetAdded = useCallback(() => {
        // Fetch budget data again to refresh the view
        const fetchData = async () => {
            try {
                const token = await currentUser.getIdToken();
                const budgetResponse = await axios.get(
                    getApiUrl('/budget/analytics/summary'),
                    {
                        params: { userId: currentUser.uid },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                setBudgetData(budgetResponse.data.data);
                setMessage('Budget added successfully!');
                setIsBudgetModalOpen(false);
                appRef.current?.classList.remove('modal-open');
            } catch (err) {
                console.error('Error fetching updated budget data:', err);
                setMessage('Failed to refresh budget data');
            }
        };

        fetchData();
    }, [currentUser]);

    if (loading) {
        return <div className={styles.loading}>Loading budget data...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    if (!budgetData) return null;


    return (
        <Layout CurrentUser={currentUser} onLogout={handleLogout} showNav={true}>
            <div className={styles.dashboard}>
                <div className={styles.dashboardHeader}>
                    <h1>Budget Overview</h1>
                    {message && (
                        <div className={styles.messageBanner}>{message}</div>
                    )}
                    <div className={styles.headerActions}>
                        <button
                            onClick={() => setIsBudgetModalOpen(true)}
                            className={styles.iconButton}
                        >
                            <Plus className="w-5 h-5"/>
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
                                    <div className={styles.categoryHeaderActions}>
        <span className={styles.timePeriod}>
            {category.period}
        </span>
                                        <span className={styles.progressLabel}>
            {parseFloat(category.percentageUsed).toFixed(1)}% Used
        </span>
                                        <button
                                            onClick={() => handleDeleteBudget(category.budgetId)}
                                            className={styles.deleteButton}
                                            aria-label="Delete budget"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
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
                {isBudgetModalOpen && (
                    <BudgetForm
                        userId={currentUser?.uid}
                        onBudgetAdded={handleBudgetAdded}
                        setMessage={setMessage}
                        onClose={() => {
                            setIsBudgetModalOpen(false);
                            appRef.current?.classList.remove('modal-open');
                        }}
                    />
                )}
            </div>
        </Layout>
    );
};

export default BudgetDashboard;