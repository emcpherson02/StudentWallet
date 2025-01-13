import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/PlaidLink.module.css';
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebase'; // Firebase auth instance

function PlaidLink() {
    const { currentUser } = useAuth();
    const [message, setMessage] = useState('');
    const [linkedBank, setLinkedBank] = useState(false);
    const [accounts, setAccounts] = useState([]); // State to store accounts
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
                const response = await axios.get(`http://localhost:3001/user/user-data`, {
                    params: { userId: currentUser.uid },
                });

                const { linkedBank, accounts } = response.data;
                setLinkedBank(linkedBank);
                setAccounts(accounts || []);
            } catch (error) {
                console.error('Error fetching user details:', error);
                setMessage('Failed to fetch user details.');
            }
        };

        const fetchTransactions = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/transactions/user-transactions`, {
                    params: { userId: currentUser.uid },
                });

                const { Transaction } = response.data;
                setTransactions(Transaction || []);
            } catch (error) {
                console.error('Error fetching transactions:', error);
                setMessage('Failed to fetch transactions.');
            }
        };

        const fetchBudgets = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/budget/get_budgets`, {
                    params: { userId: currentUser.uid },
                });
                setBudgets(response.data.budgets || []);
            } catch (error) {
                console.error('Error fetching budgets:', error);
                setMessage('Failed to fetch budgets.');
            }
        };

        if (currentUser) {
            fetchUserDetails();  // Fetch accounts and linkedBank status
            fetchTransactions(); // Fetch transactions
            fetchBudgets();      // Fetch budgets
        }
    }, [currentUser]);


    const startPlaidLink = async () => {
        try {
            const response = await axios.post('http://localhost:3001/plaid/create_link_token', {
                userId: currentUser.uid,
            });
            const linkToken = response.data.linkToken;


            const handler = window.Plaid.create({
                token: linkToken,
                onSuccess: async (publicToken) => {
                    try {
                        await axios.post('http://localhost:3001/plaid/exchange_public_token', {
                            publicToken,
                            userId: currentUser.uid,
                        });
                        setMessage('Plaid account linked successfully!');
                        setLinkedBank(true);
                    } catch (error) {
                        console.error('Error exchanging public token:', error);
                        setMessage('Failed to link account.');
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
                                    <div key={index} className={styles.accountCard}>
                                        <h3>{account.type}</h3>
                                        <p>
                                            <strong>Balance:</strong> £{account.balance ? account.balance.toFixed(2) : 'N/A'}
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
                                        <div><strong>Amount:</strong> ${transaction.amount}</div>
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
                                    <div><strong>Start Date:</strong> {new Date(budget.startDate).toLocaleDateString()}
                                    </div>
                                    <div><strong>End Date:</strong> {new Date(budget.endDate).toLocaleDateString()}
                                    </div>
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
