import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/PlaidLink.module.css';
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';
import TransactionForm from './TransactionForm';
import BudgetForm from './BudgetForm';
//import UpdateUserForm from './UpdateUserForm';
import PreferencesButton from './PreferencesButton';

function PlaidLink() {
    const { currentUser } = useAuth();
    const [message, setMessage] = useState('');
    const [transactionMessage, setTransactionMessage] = useState('');
    const [linkedBank, setLinkedBank] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const navigate = useNavigate();


    // Modal states
    const [showTransactionForm, setShowTransactionForm] = useState(false);
    const [showBudgetForm, setShowBudgetForm] = useState(false);
    //const [showUpdateForm, setShowUpdateForm] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
        }
    }, [currentUser, navigate]);

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

    const handlePreferencesClick = async () => {
        try {
            localStorage.setItem('previousPage', '/plaid-link');
            
            if (currentUser) {
                localStorage.setItem('userData', JSON.stringify({
                    displayName: currentUser.displayName,
                    email: currentUser.email,
                    linkedBank: linkedBank,
                }));
            }
            navigate('/user-preferences');
        } catch (error) {
            console.error('Error navigating to preferences:', error);
            setMessage('Failed to open preferences.');
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

    const fetchUserDetails = async () => {
        try {
            const token = await currentUser.getIdToken();
            const response = await axios.get(`http://localhost:3001/user/user-data`, {
                params: { userId: currentUser.uid },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
    
            const { linkedBank, accounts } = response.data;
            setLinkedBank(linkedBank);
            setAccounts(accounts || []);
    
            // Refresh the user display if needed
            if (response.data.displayName && response.data.displayName !== currentUser.displayName) {
                await currentUser.updateProfile({ displayName: response.data.displayName });
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
            setMessage('Failed to fetch user details.');
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchUserDetails();
            fetchTransactions();
            fetchBudgets();
        }
    }, [currentUser]);

    const handleTransactionAdded = () => {
        fetchTransactions();
        setTransactionMessage('Transaction added successfully!');
        setShowTransactionForm(false);
    };

    const handleBudgetAdded = () => {
        fetchBudgets();
        setMessage('Budget added successfully!');
        setShowBudgetForm(false);
    };

    const startPlaidLink = async () => {
        try {
            const token = await currentUser.getIdToken();
            const linkTokenResponse = await axios.post(
                'http://localhost:3001/plaid/create_link_token', 
                { userId: currentUser.uid },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const linkToken = linkTokenResponse.data.link_token;

            const handler = window.Plaid.create({
                token: linkToken,
                onSuccess: async (publicToken) => {
                    try {
                        await axios.post(
                            'http://localhost:3001/plaid/exchange_public_token',
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
                        fetchUserDetails();
                        fetchTransactions();
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
    <div className={styles.headerButtons}>
    <PreferencesButton 
        userData={{
            name: currentUser?.displayName || 'User Name'
        }} 
        onClick={handlePreferencesClick}
    />
         {/* <button 
            className={`${styles.primaryButton} ${styles.updateButton}`}
            onClick={() => setShowUpdateForm(true)}
        >
            Update User Details
        </button>
        <button 
            className={styles.logoutButton}
            onClick={handleLogout}
        >
            Logout
        </button>  */}
    </div>
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
                    {!linkedBank ? (
                        <div className={styles.connectBankSection}>
                            <p>Connect your bank account to get started</p>
                            <button
                                className={styles.primaryButton}
                                onClick={startPlaidLink}
                            >
                                Connect Bank Account
                            </button>
                        </div>
                    ) : (
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
                    {transactionMessage && (
                        <div className={styles.messageBanner}>
                            {transactionMessage}
                        </div>
                    )}
                    
                    <button 
                        className={styles.primaryButton} 
                        onClick={() => setShowTransactionForm(true)}
                    >
                        Add Transaction
                    </button>

                    {linkedBank ? (
                        transactions.length > 0 ? (
                            <ul>
                                {transactions.map((transaction, index) => (
                                    <li key={index} className={styles.transactionItem}>
                                        <div><strong>Type:</strong> {transaction.type}</div>
                                        <div><strong>Amount:</strong> £{transaction.amount}</div>
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

                    {showTransactionForm && (
                        <TransactionForm
                            userId={currentUser.uid}
                            onTransactionAdded={handleTransactionAdded}
                            setMessage={setTransactionMessage}
                            onClose={() => setShowTransactionForm(false)}
                        />
                    )}
                </div>

                <div className={`${styles.card} ${styles.budgetsSection}`}>
                    <h2>Budgets</h2>
                    
                    <button 
                        className={styles.primaryButton} 
                        onClick={() => setShowBudgetForm(true)}
                    >
                        Add Budget
                    </button>

                    {budgets.length > 0 ? (
                        <ul>
                            {budgets.map((budget, index) => (
                                <li key={index} className={styles.budgetItem}>
                                    <div><strong>Category:</strong> {budget.category}</div>
                                    <div><strong>Amount:</strong> £{budget.amount}</div>
                                    <div><strong>Spent:</strong> £{budget.spent || 0}</div>
                                    <div><strong>Period:</strong> {budget.period}</div>
                                    <div><strong>Start Date:</strong> {new Date(budget.startDate).toLocaleDateString()}</div>
                                    <div><strong>End Date:</strong> {new Date(budget.endDate).toLocaleDateString()}</div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No budgets available. Add your first budget to get started.</p>
                    )}

                    {showBudgetForm && (
                        <BudgetForm
                            userId={currentUser.uid}
                            onBudgetAdded={handleBudgetAdded}
                            setMessage={setMessage}
                            onClose={() => setShowBudgetForm(false)}
                        />
                    )}

{/* {showUpdateForm && (
        <UpdateUserForm
            userId={currentUser.uid}
            currentUser={currentUser}
            onUserUpdated={() => {
                fetchUserDetails();
                setShowUpdateForm(false);
                setMessage('User details updated successfully!');
            }}
            setMessage={setMessage}
            onClose={() => setShowUpdateForm(false)}
        />
    )}  */}


                </div>
            </div>
        </div>
    );
}

export default PlaidLink;