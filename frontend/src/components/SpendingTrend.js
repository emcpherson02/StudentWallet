import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import styles from '../styles/SpendingTrend.module.css';

const SpendingTrend = ({ transactions }) => {
    const monthlyData = useMemo(() => {
        const grouped = transactions.reduce((acc, transaction) => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!acc[monthKey]) {
                acc[monthKey] = {
                    month: new Date(date.getFullYear(), date.getMonth(), 1)
                        .toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
                    total: 0
                };
            }

            acc[monthKey].total += Math.abs(transaction.Amount);
            return acc;
        }, {});

        return Object.values(grouped).sort((a, b) =>
            new Date(a.month) - new Date(b.month)
        );
    }, [transactions]);

    return (
        <div className={styles.trendContainer}>
            <h3>Monthly Spending Trend</h3>
            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `£${value}`}
                        />
                        <Tooltip
                            formatter={(value) => [`£${value.toFixed(2)}`, 'Spent']}
                            labelStyle={{ color: '#1f2937' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SpendingTrend;