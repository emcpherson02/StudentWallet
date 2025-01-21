import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/PlaidLink.module.css';
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';

function PlaidLink() {
    const { currentUser } = useAuth();
    const [message, setMessage] = useState('');
    const [linkedBank, setLinkedBank] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const token = await currentUser.getIdToken();
                const response = await axios.get(`http://localhost:3001/user/user-data`, {
                    params: { userId: currentUser.uid },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const { linkedBank: isLinked } = response.data;
                setLinkedBank(isLinked);

                if (isLinked) {
                    // Only fetch Plaid data if bank is linked
                    await fetchPlaidAccounts();
                    await fetchPlaidTransactions();
                }
            } catch (error) {
                console.error('Error fetching user details:', error);
                setMessage('Failed to fetch user details.');
            }
        };

        const fetchPlaidAccounts = async () => {
            try {
                const token = await currentUser.getIdToken();
                const response = await axios.get(`http://localhost:3001/plaid/accounts/${currentUser.uid}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setAccounts(response.data.accounts || []);
            } catch (error) {
                console.error('Error fetching accounts:', error);
            }
        };

        const fetchPlaidTransactions = async () => {
            try {
                const token = await currentUser.getIdToken();
                const endDate = new Date().toISOString().split('T')[0];
                const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                const response = await axios.get(
                    `http://localhost:3001/plaid/transactions/${currentUser.uid}`,
                    {
                        params: { startDate, endDate },
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (response.data && response.data.transactions) {
                    const formattedTransactions = response.data.transactions.map(trans => ({
                        type: trans.description,
                        amount: trans.amount,
                        date: new Date(trans.date),
                    }));
                    setTransactions(formattedTransactions);
                }
            } catch (error) {
                // Don't show error message if user hasn't linked bank yet
                if (linkedBank) {
                    console.error('Error fetching Plaid transactions:', error);
                    setMessage('Failed to fetch bank transactions. Manual transactions still available.');
                }
            }
        };

        const fetchTransactions = async () => {
            try {
                const token = await currentUser.getIdToken();

                // First get manual transactions
                const manualResponse = await axios.get(`http://localhost:3001/transactions/user-transactions`, {
                    params: { userId: currentUser.uid },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                let allTransactions = manualResponse.data.Transaction || [];

                // If bank is linked, try to get Plaid transactions too
                if (linkedBank) {
                    try {
                        const endDate = new Date().toISOString().split('T')[0];
                        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                        const plaidResponse = await axios.get(
                            `http://localhost:3001/plaid/transactions/${currentUser.uid}`,
                            {
                                params: { startDate, endDate },
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            }
                        );

                        if (plaidResponse.data && plaidResponse.data.transactions) {
                            const plaidTransactions = plaidResponse.data.transactions.map(trans => ({
                                type: trans.description,
                                amount: trans.amount,
                                date: new Date(trans.date),
                            }));
                            allTransactions = [...allTransactions, ...plaidTransactions];
                        }
                    } catch (error) {
                        console.error('Error fetching Plaid transactions:', error);
                    }
                }

                // Sort all transactions by date
                allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
                setTransactions(allTransactions);

            } catch (error) {
                console.error('Error fetching transactions:', error);
                setMessage('Failed to fetch transactions. Please try again later.');
            }
        };

        const fetchBudgets = async () => {
            try {
                const token = await currentUser.getIdToken();
                const response = await axios.get(`http://localhost:3001/budget/get_budgets`, {
                    params: { userId: currentUser.uid },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setBudgets(response.data.budgets || []);
            } catch (error) {
                console.error('Error fetching budgets:', error);
            }
        };

        if (currentUser) {
            fetchUserDetails();
            fetchTransactions();
            fetchBudgets();
        }
    }, [currentUser]);

    const startPlaidLink = async () => {
        try {
            const token = await currentUser.getIdToken();
            const response = await axios.post('http://localhost:3001/plaid/create_link_token',
                {
                    userId: currentUser.uid,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            const linkToken = response.data.linkToken;

            const handler = window.Plaid.create({
                token: linkToken,
                onSuccess: async (publicToken) => {
                    try {
                        const exchangeResponse = await axios.post('http://localhost:3001/plaid/exchange_public_token',
                            {
                                publicToken,
                                userId: currentUser.uid,
                            },
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            }
                        );

                        setMessage('Plaid account linked successfully!');
                        setLinkedBank(true);
                        setAccounts(exchangeResponse.data.accounts || []);

                        // Refresh transactions after linking
                        const endDate = new Date().toISOString().split('T')[0];
                        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                        const transResponse = await axios.get(`http://localhost:3001/plaid/transactions/${currentUser.uid}`, {
                            params: { startDate, endDate },
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });

                        const formattedTransactions = transResponse.data.transactions.map(trans => ({
                            type: trans.description,
                            amount: trans.amount,
                            date: new Date(trans.date),
                        }));

                        setTransactions(formattedTransactions);
                    } catch (error) {
                        console.error('Error exchanging public token:', error);
                        setMessage('Failed to link account.');
                    }
                },
                onExit: (err, metadata) => {
                    if (err) {
                        console.error('Error during Plaid Link:', err);
                        setMessage('Error connecting to bank.');
                    }
                },
            });

            handler.open();
        } catch (error) {
            console.error('Error fetching link token:', error);
            setMessage('Failed to start Plaid Link.');
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    if (!currentUser) {
        return null;
    }

    return (
        <div className={styles.App}>
            <div className={styles.header}>
                <h1>Financial Dashboard</h1>
                <button className={styles.logoutButton} onClick={handleLogout}>
                    Logout
                </button>
            </div>

            <div className={styles.mainContent}>
                <div className={`${styles.card} ${styles.userInfo}`}>
                    <h2>Account Overview</h2>
                    <p><strong>Name:</strong> {currentUser.displayName}</p>
                    <p><strong>Email:</strong> {currentUser.email}</p>
                    {message && (
                        <div className={styles.messageBanner}>
                            {message}
                        </div>
                    )}
                </div>

                <div className={`${styles.card} ${styles.connectBankSection}`}>
                    <h2>Linked Bank Account</h2>
                    {!linkedBank && (
                        <div className={styles.connectBankSection}>
                            <p>Connect your bank account to get started</p>
                            <button
                                className={styles.primaryButton}
                                onClick={startPlaidLink}
                            >
                                Connect Bank Account
                            </button>
                        </div>
                    )}
                    {linkedBank && (
                        <div className={styles.connectBankSection}>
                            <h2>Linked Accounts</h2>
                            <div className={styles.accountsGrid}>
                                {accounts.map((account, index) => (
                                    <div key={account.id || index} className={styles.accountCard}>
                                        <h3>{account.name || account.type}</h3>
                                        <p>
                                            <strong>Balance:</strong> £
                                            {account.balance?.current?.toFixed(2) ||
                                                account.balance?.available?.toFixed(2) ||
                                                'N/A'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className={`${styles.card} ${styles.transactionsSection}`}>
                    <h2>Transactions</h2>
                    {linkedBank ? (
                        transactions.length > 0 ? (
                            <ul>
                                {transactions.map((transaction, index) => (
                                    <li key={index} className={styles.transactionItem}>
                                        <div><strong>Type:</strong> {transaction.type}</div>
                                        <div><strong>Amount:</strong> £{Math.abs(transaction.amount).toFixed(2)}</div>
                                        <div>
                                            <strong>Date:</strong> {new Date(transaction.date).toLocaleDateString()} - {new Date(transaction.date).toLocaleTimeString()}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No transactions available.</p>
                        )
                    ) : (
                        <p>Link your bank account or Add Transactions Manually to view transactions.</p>
                    )}
                </div>

                <div className={`${styles.card} ${styles.budgetsSection}`}>
                    <h2>Budgets</h2>
                    {budgets.length > 0 ? (
                        <ul>
                            {budgets.map((budget, index) => (
                                <li key={index} className={styles.budgetItem}>
                                    <div><strong>Category:</strong> {budget.category}</div>
                                    <div><strong>Amount:</strong> £{budget.amount}</div>
                                    <div><strong>Spent:</strong> £{budget.spent}</div>
                                    <div><strong>Period:</strong> {budget.period}</div>
                                    <div><strong>Start Date:</strong> {new Date(budget.startDate).toLocaleDateString()}</div>
                                    <div><strong>End Date:</strong> {new Date(budget.endDate).toLocaleDateString()}</div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No budgets available. Add your first budget to get started.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PlaidLink;