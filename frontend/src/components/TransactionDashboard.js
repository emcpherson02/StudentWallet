import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import axios from 'axios';
import Layout from './Layout';
import PieChartComponent from './PieChartComponent';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import styles from '../styles/TransactionDashboard.module.css';
import UncategorizedTransactions from './UncategorisedTransaction';
import {Trash2, Banknote, RefreshCw} from "lucide-react";

const TransactionDashboard = () => {
    const { currentUser } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [transactions, setTransactions] = useState([]); // Add this state
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;

            try {
                const token = await currentUser.getIdToken();

                // Fetch analytics
                const analyticsResponse = await axios.get(
                    'http://localhost:3001/transactions/analytics',
                    {
                        params: { userId: currentUser.uid },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                // Fetch transactions
                const transactionsResponse = await axios.get(
                    'http://localhost:3001/transactions/user-transactions',
                    {
                        params: { userId: currentUser.uid },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                setAnalytics(analyticsResponse.data.data);
                setTransactions(transactionsResponse.data.Transaction || []); // Set transactions from response
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    const handleDeleteTransaction = async (transactionId) => {
        try {
            const token = await currentUser.getIdToken();
            await axios.delete(
                `http://localhost:3001/transactions/delete_transaction/${transactionId}`,
                {
                    data: { userId: currentUser.uid },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Remove the deleted transaction from state
            setTransactions(prevTransactions =>
                prevTransactions.filter(transaction => transaction.id !== transactionId)
            );
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    };

    if (loading) {
        return (
            <Layout currentUser={currentUser}>
                <div className={styles.dashboard}>
                    <p>Loading transaction data...</p>
                </div>
            </Layout>
        );
    }

    const prepareTransactionSourceData = (transactions) => {
        const plaidTransactions = transactions.filter(t => t.isPlaidTransaction).length;
        const manualTransactions = transactions.filter(t => !t.isPlaidTransaction).length;

        return [
            {
                name: "Bank Transactions",
                value: plaidTransactions
            },
            {
                name: "Cash Transactions",
                value: manualTransactions
            }
        ];
    };

    const prepareCategoryData = (transactions) => {
        const categoryTotals = transactions.reduce((acc, transaction) => {
            const category = transaction.category || 'Uncategorized';
            acc[category] = (acc[category] || 0) + Math.abs(Number(transaction.amount));
            return acc;
        }, {});

        return Object.entries(categoryTotals).map(([category, total]) => ({
            name: category,
            value: total
        }));
    };

    return (
        <Layout currentUser={currentUser}>
            <div className={styles.dashboard}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Transaction Analytics</h1>
                    <p className={styles.subtitle}>Analyse your spending patterns and trends</p>
                </header>

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <p className={styles.statLabel}>Average Transaction</p>
                        <p className={styles.statValue}>
                            £{analytics?.averageTransaction.toFixed(2) || '0.00'}
                        </p>
                    </div>
                    <div className={styles.statCard}>
                        <p className={styles.statLabel}>Total Transactions</p>
                        <p className={styles.statValue}>
                            {analytics?.totalTransactions || 0}
                        </p>
                    </div>
                    <div className={styles.statCard}>
                        <p className={styles.statLabel}>Total Spent</p>
                        <p className={styles.statValue}>
                            £{analytics?.totalSpent.toFixed(2) || '0.00'}
                        </p>
                    </div>
                </div>

                <section className={styles.chartSection}>
                    <h2 className={styles.chartTitle}>Daily Spending Pattern</h2>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer>
                            <BarChart data={analytics?.dailySpendingPattern || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                                <XAxis dataKey="day" tick={{fill: '#6b7280'}} axisLine={{stroke: '#e5e7eb'}}/>
                                <YAxis tick={{fill: '#6b7280'}} axisLine={{stroke: '#e5e7eb'}}/>
                                <Tooltip contentStyle={{
                                    background: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                    padding: '0.75rem'
                                }}/>
                                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className={styles.chartSection}>
                    <h2 className={styles.chartTitle}>Transaction Analysis</h2>
                    <div className={styles.pieChartsContainer}>
                        <div className={styles.pieChartWrapper}>
                            <PieChartComponent
                                data={prepareTransactionSourceData(transactions)}
                                title="Cash vs Bank Transactions"
                            />
                        </div>
                        <div className={styles.pieChartWrapper}>
                            <PieChartComponent
                                data={prepareCategoryData(transactions)}
                                title="Spending by Category"
                            />
                        </div>
                    </div>
                </section>

                <section className={styles.transactionsSection}>
                    <UncategorizedTransactions/>
                </section>

                <section className={styles.transactionsSection}>
                    <div className={styles.transactionsHeader}>
                        <h2 className={styles.transactionsTitle}>Transaction History</h2>
                    </div>

                    {transactions.length > 0 ? (
                        <div className={styles.transactionsList}>
                            {Object.entries(
                                transactions.reduce((groups, transaction) => {
                                    const date = new Date(transaction.date);
                                    const monthYear = date.toLocaleDateString('en-GB', {
                                        year: 'numeric',
                                        month: 'long'
                                    });
                                    if (!groups[monthYear]) groups[monthYear] = [];
                                    groups[monthYear].push(transaction);
                                    return groups;
                                }, {})
                            )
                                .sort(([dateA], [dateB]) => {
                                    const [monthA, yearA] = dateA.split(' ').reverse();
                                    const [monthB, yearB] = dateB.split(' ').reverse();
                                    return yearB - yearA || new Date(dateB).getMonth() - new Date(dateA).getMonth();
                                })
                                .map(([monthYear, groupTransactions]) => (
                                    <div key={monthYear} className={styles.transactionGroup}>
                                        <div className={styles.dateHeader}>
                                            <span>{monthYear}</span>
                                        </div>
                                        {groupTransactions
                                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                                            .map((transaction) => (
                                                <div
                                                    key={transaction.id || `${transaction.type}-${transaction.date}-${transaction.amount}`}
                                                    className={styles.transactionCard}>
                                                    <div className={styles.transactionInfo}>
                                                        <div className={styles.transactionMain}>
                                                            <div className={styles.transactionIcon}>
                                                                {transaction.isPlaidTransaction ?
                                                                    <RefreshCw size={16}
                                                                               className={styles.plaidIcon}/> :
                                                                    <Banknote size={16} className={styles.manualIcon}/>
                                                                }
                                                            </div>
                                                            <div className={styles.typeAndDate}>
                                                                <span className={styles.transactionType}>
                                                                    {transaction.type}
                                                                </span>
                                                                <span className={styles.transactionDate}>
                                                                    {new Date(transaction.date).toLocaleDateString('en-GB', {
                                                                        day: 'numeric'
                                                                    })} {new Date(transaction.date).toLocaleDateString('en-GB', {
                                                                    month: 'short'
                                                                })}
                                                                </span>
                                                            </div>
                                                            <span className={styles.transactionCategory}>
                                                                {transaction.category}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className={styles.transactionActions}>
                                               <span
                                                   className={Number(transaction.amount) < 0 ? styles.negative : styles.positive}>
                                                   £{Math.abs(Number(transaction.amount)).toFixed(2)}
                                               </span>
                                                        <button
                                                            onClick={() => handleDeleteTransaction(transaction.id)}
                                                            className={styles.deleteButton}
                                                            aria-label="Delete transaction"
                                                        >
                                                            <Trash2 size={20}/>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <p>No transactions found</p>
                        </div>
                    )}
                </section>
            </div>
        </Layout>
    );
};

export default TransactionDashboard;