import React, { useState, useMemo } from 'react';
import { useAuth } from '../utils/AuthContext';
import axios from 'axios';
import { LineChart,Line ,BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Layout from './Layout';
import styles from '../styles/BudgetAnalytics.module.css';
import {useEffect} from "react";
import {TRANSACTION_CATEGORIES} from "../utils/constants";
import {getApiUrl} from "../utils/api";

const BudgetAnalytics = () => {
    const { currentUser } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState(['Groceries']);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [selectedCategory, setSelectedCategory] = useState('Groceries');
    const defaultCategories = Object.values(TRANSACTION_CATEGORIES);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = await currentUser.getIdToken();
                const response = await axios.get(
                    getApiUrl('/user/categories'),
                    {
                        params: { userId: currentUser.uid },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                // Extract custom categories from response data
                const customCategories = response.data.data || [];

                // Combine default and custom categories
                const allCategories = [...defaultCategories, ...customCategories];

                // Remove duplicates and set categories
                setCategories([...new Set(allCategories)]);
            } catch (error) {
                console.error('Error fetching categories:', error);
                setCategories(defaultCategories);
            }
        };

        fetchCategories();
    }, [currentUser]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const token = await currentUser.getIdToken();
            const response = await axios.get(
                getApiUrl('/history/analytics'),
                {
                    params: {
                        userId: currentUser.uid,
                        category: selectedCategory,
                        startDate: dateRange.startDate,
                        endDate: dateRange.endDate
                    },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setAnalytics(response.data.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch analytics');
            setLoading(false);
        }
    };

    // Format date range for the Budget Spend Trends chart
    const formattedData = useMemo(() => {
        const data = analytics?.trends?.spentTrends.map(item => ({
            ...item,
            dateRange: new Date(item.date).toLocaleString("default", { month: "short", year: "numeric" }),
            sortDate: new Date(item.date)
        })) || [];
        return data.sort((a, b) => a.sortDate - b.sortDate);
    }, [analytics]);

    return (
        <Layout currentUser={currentUser}>
            <div className={styles.dashboard}>
                <div className={styles.dashboardHeader}>
                    <h1>Budget Analytics</h1>
                    <div className={styles.buttonGroup}>
                        <button
                            onClick={fetchAnalytics}
                            disabled={loading}
                            className={styles.primaryButton}
                        >
                            {loading ? 'Loading...' : 'Update Analytics'}
                        </button>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.controlGroup}>
                        <div className={styles.inputWrapper}>
                            <label>Start Date</label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                        </div>
                        <div className={styles.inputWrapper}>
                            <label>End Date</label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </div>
                        <div className={styles.inputWrapper}>
                            <label>Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {analytics && (
                    <>
                        <div className={styles.summaryGrid}>
                            <div className={styles.summaryCard}>
                                <h3>Total Periods</h3>
                                <p>{analytics.summary.totalPeriods}</p>
                            </div>
                            <div className={styles.summaryCard}>
                                <h3>Total Spent</h3>
                                <p>£{analytics.summary.totalSpent.toFixed(2)}</p>
                            </div>
                            <div className={styles.summaryCard}>
                                <h3>Average Spent</h3>
                                <p>£{analytics.summary.averageSpent.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className={styles.chartContainer}>
                            <h3>Budget Utilization Trends</h3>
                            <div className={styles.chartWrapper}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analytics.trends.utilization}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="utilizationPercentage"
                                            stroke="#2563eb"
                                            name="Utilization %"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <h3>Budget Spend Trends</h3>
                            <div className={styles.chartWrapper}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={formattedData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="dateRange" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="actualSpent" fill="#2563eb" name="Spent £" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {analytics.recommendations.length > 0 && (
                            <div className={styles.recommendationsList}>
                                <h3>Recommendations</h3>
                                <ul>
                                    {analytics.recommendations.map((rec, index) => (
                                        <li key={index}>{rec.message}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

export default BudgetAnalytics;
