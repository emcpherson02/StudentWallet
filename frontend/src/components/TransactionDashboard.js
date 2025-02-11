import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import axios from 'axios';
import Layout from './Layout';
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

const TransactionDashboard = () => {
    const { currentUser } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!currentUser) return;

            try {
                const token = await currentUser.getIdToken();
                const response = await axios.get(
                    'http://localhost:3001/transactions/analytics',
                    {
                        params: { userId: currentUser.uid },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                setAnalytics(response.data.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching analytics:', error);
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [currentUser]);

    if (loading) {
        return (
            <Layout currentUser={currentUser}>
                <div className={styles.dashboard}>
                    <p>Loading transaction data...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout currentUser={currentUser}>
            <div className={styles.dashboard}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Transaction Analytics</h1>
                    <p className={styles.subtitle}>Analyse your spending patterns and trends</p>
                </header>

                {/* Stats Overview */}
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

                {/* Daily Spending Chart */}
                <section className={styles.chartSection}>
                    <h2 className={styles.chartTitle}>Daily Spending Pattern</h2>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer>
                            <BarChart data={analytics?.dailySpendingPattern || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="day"
                                    tick={{ fill: '#6b7280' }}
                                    axisLine={{ stroke: '#e5e7eb' }}
                                />
                                <YAxis
                                    tick={{ fill: '#6b7280' }}
                                    axisLine={{ stroke: '#e5e7eb' }}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            const amount = typeof data.amount === 'number' ? data.amount.toFixed(2) : '0.00';
                                            const totalSpent = typeof data.totalSpent === 'number' ? data.totalSpent.toFixed(2) : '0.00';

                                            return (
                                                <div className={styles.customTooltip}>
                                                    <p className={styles.tooltipLabel}>{data.day}</p>
                                                    <p>Average Spend: £{amount}</p>
                                                    <p>Total Spent: £{totalSpent}</p>
                                                    <p>Number of Transactions: {data.transactionCount || 0}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                    contentStyle={{
                                        background: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '0.5rem',
                                        padding: '0.75rem'
                                    }}
                                />
                                <Bar
                                    dataKey="amount"
                                    fill="#3b82f6"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default TransactionDashboard;