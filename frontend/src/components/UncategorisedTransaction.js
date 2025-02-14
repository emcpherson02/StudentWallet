import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import { Calendar, DollarSign } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/UncategorisedTransaction.css';

const UncategorizedTransaction = () => {
    const { currentUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [budgets, setBudgets] = useState([]);
    const [successMessage, setSuccessMessage] = useState(null);
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

    const fetchData = async () => {
        try {
            const token = await currentUser.getIdToken();
            const [transactionsResponse, budgetsResponse] = await Promise.all([
                axios.get('http://localhost:3001/transactions/user-transactions', {
                    params: { userId: currentUser.uid },
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:3001/budget/get_budgets', {
                    params: { userId: currentUser.uid },
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const uncategorizedTransactions = transactionsResponse.data.Transaction.filter(
                t => !t.category || t.category === 'Other'
            );
            setTransactions(uncategorizedTransactions);
            setBudgets(budgetsResponse.data.budgets || []);
            setLoading(false);
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to load transactions');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentUser]);

    const updateTransactionCategory = async (transactionId, category) => {
        try {
            const token = await currentUser.getIdToken();
            const transaction = transactions.find(t => t.id === transactionId);
            const matchingBudget = budgets.find(budget => {
                const txDate = new Date(transaction.date);
                const budgetStart = new Date(budget.startDate);
                const budgetEnd = new Date(budget.endDate);
                return budget.category === category && txDate >= budgetStart && txDate <= budgetEnd;
            });

            await axios.post(
                'http://localhost:3001/transactions/update-category',
                {
                    userId: currentUser.uid,
                    transactionId,
                    category,
                    budgetId: matchingBudget?.id
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccessMessage('Category updated');
            setTimeout(() => setSuccessMessage(null), 3000);
            fetchData();
        } catch (error) {
            setError('Failed to update category');
        }
    };

    if (loading) return <div className="loader" />;
    if (error) return <div className="error">{error}</div>;

    const filteredTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= startDate && txDate <= endDate;
    });

    return (
        <div className="uncategorizedWrapper">
            <div className="header">
                <h2>Uncategorized Transactions</h2>
                <div className="dateRange">
                    <div className="dateInput">
                        <Calendar size={16} />
                        <DatePicker
                            selected={startDate}
                            onChange={setStartDate}
                            dateFormat="dd/MM/yyyy"
                        />
                    </div>
                    <span>to</span>
                    <div className="dateInput">
                        <Calendar size={16} />
                        <DatePicker
                            selected={endDate}
                            onChange={setEndDate}
                            dateFormat="dd/MM/yyyy"
                        />
                    </div>
                </div>
            </div>

            {successMessage && <div className="successMessage">{successMessage}</div>}

            {filteredTransactions.length === 0 ? (
                <div className="emptyState">No uncategorized transactions found</div>
            ) : (
                <div className="transactionsList">
                    {filteredTransactions.map(tx => (
                        <div key={tx.id} className="transactionItem">
                            <div className="txInfo">
                                <div className="txName">{tx.type}</div>
                                <div className="txDate">
                                    {new Date(tx.date).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'short'
                                    })}
                                </div>
                            </div>
                            <div className="txAmount">
                                £{Math.abs(tx.amount).toFixed(2)}
                            </div>
                            <select
                                className="categorySelect"
                                value={tx.category || ""}
                                onChange={e => updateTransactionCategory(tx.id, e.target.value)}
                            >
                                <option value="" disabled>Select category</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UncategorizedTransaction;