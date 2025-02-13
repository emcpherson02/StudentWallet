import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const UncategorizedTransactions = () => {
    const { currentUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [budgets, setBudgets] = useState([]);
    const [successMessage, setSuccessMessage] = useState(null);

    // Date range state
    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [endDate, setEndDate] = useState(new Date());

    const categories = [
        'Groceries',
        'Utilities',
        'Entertainment',
        'Transportation',
        'Rent',
        'Other'
    ];

    useEffect(() => {
        fetchData();
    }, [currentUser]);

    useEffect(() => {
        const filtered = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
        setFilteredTransactions(filtered);
    }, [transactions, startDate, endDate]);

    const fetchData = async () => {
        try {
            const token = await currentUser.getIdToken();

            const transactionsResponse = await axios.get(
                'http://localhost:3001/transactions/user-transactions',
                {
                    params: { userId: currentUser.uid },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const uncategorizedTransactions = transactionsResponse.data.Transaction.filter(
                t => !t.category || t.category === 'Other'
            );
            setTransactions(uncategorizedTransactions);

            const budgetsResponse = await axios.get(
                'http://localhost:3001/budget/get_budgets',
                {
                    params: { userId: currentUser.uid },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setBudgets(budgetsResponse.data.budgets || []);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load transactions');
            setLoading(false);
        }
    };

    const updateTransactionCategory = async (transactionId, category) => {
        try {
            const token = await currentUser.getIdToken();

            const matchingBudget = budgets.find(budget => {
                const transactionDate = new Date(
                    transactions.find(t => t.id === transactionId).date
                );
                const budgetStart = new Date(budget.startDate);
                const budgetEnd = new Date(budget.endDate);

                return (
                    budget.category === category &&
                    transactionDate >= budgetStart &&
                    transactionDate <= budgetEnd
                );
            });

            await axios.post(
                `http://localhost:3001/transactions/update-category`,
                {
                    userId: currentUser.uid,
                    transactionId,
                    category,
                    budgetId: matchingBudget?.id
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setSuccessMessage('Transaction category updated successfully!');
            setTimeout(() => setSuccessMessage(null), 3000); // Clear success message after 3 seconds
            fetchData();
        } catch (error) {
            console.error('Error updating category:', error);
            setError('Failed to update transaction category');
        }
    };

    if (loading) return <div className="p-4">Loading transactions...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;
    if (transactions.length === 0) {
        return <div className="p-4">No uncategorized transactions found</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Uncategorized Transactions</h3>
            {successMessage && <div className="p-4 text-green-500">{successMessage}</div>}
            {/* Date Range Selector */}
            <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                    <label htmlFor="start-date" className="text-sm">From:</label>
                    <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        className="p-2 border rounded-md"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <label htmlFor="end-date" className="text-sm">To:</label>
                    <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        className="p-2 border rounded-md"
                    />
                </div>
            </div>
            {filteredTransactions.length === 0 ? (
                <div className="p-4">No uncategorized transactions found in this date range</div>
            ) : (
                <div className="space-y-4">
                    {filteredTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium">{transaction.type}</p>
                                <p className="text-sm text-gray-500">
                                    {new Date(transaction.date).toLocaleDateString()}
                                </p>
                                <p className="font-medium">£{Math.abs(transaction.amount).toFixed(2)}</p>
                            </div>
                            <select
                                className="ml-4 p-2 border rounded-md"
                                onChange={(e) => updateTransactionCategory(transaction.id, e.target.value)}
                                value={transaction.category || ""}
                            >
                                <option value="" disabled>Select category</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UncategorizedTransactions;