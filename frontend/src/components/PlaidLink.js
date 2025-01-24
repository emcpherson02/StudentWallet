import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/PlaidLink.module.css';
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';
import TransactionForm from './TransactionForm';
import BudgetForm from './BudgetForm';

function PlaidLink() {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [transactionMessage, setTransactionMessage] = useState('');
  const [linkedBank, setLinkedBank] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const navigate = useNavigate();
  const appRef = useRef();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const fetchUserDetails = useCallback(async () => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(`http://localhost:3001/user/user-data`, {
        params: { userId: currentUser.uid },
        headers: { Authorization: `Bearer ${token}` }
      });

      const { linkedBank, accounts } = response.data;
      setLinkedBank(linkedBank);
      if (linkedBank) {
        // Only fetch Plaid data if bank is linked
        await fetchPlaidAccounts();
        await fetchPlaidTransactions();
      }
        setAccounts(accounts || []);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setMessage('Failed to fetch user details.');
    }
  }, [currentUser]);

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
          type: trans.Description,
          amount: trans.Amount,
          date: new Date(trans.date)
        }));
        setTransactions(formattedTransactions);
      }
    } catch (error) {
      if (linkedBank) {
        console.error('Error fetching Plaid transactions:', error);
        setMessage('Failed to fetch bank transactions. Manual transactions still available.');
      }
    }
  };

  const fetchTransactions = useCallback(async () => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(`http://localhost:3001/transactions/user-transactions`, {
        params: { userId: currentUser.uid },
        headers: { Authorization: `Bearer ${token}` }
      });

      const { Transaction } = response.data;
      setTransactions(Transaction || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setMessage('Failed to fetch transactions.');
    }
  }, [currentUser]);

  const fetchBudgets = useCallback(async () => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(`http://localhost:3001/budget/get_budgets`, {
        params: { userId: currentUser.uid },
        headers: { Authorization: `Bearer ${token}` }
      });
      setBudgets(response.data.budgets || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      setMessage('Failed to fetch budgets.');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchUserDetails();
      fetchTransactions();
      fetchBudgets();
    }
  }, [currentUser, fetchUserDetails, fetchTransactions, fetchBudgets]);

  const handleTransactionAdded = useCallback(() => {
    fetchTransactions();
    fetchBudgets();
    setTransactionMessage('Transaction added successfully!');
    setIsTransactionModalOpen(false);
    appRef.current.classList.remove('modal-open');
  }, [fetchTransactions][fetchBudgets]);

  const handleBudgetAdded = useCallback(() => {
    fetchBudgets();
    setMessage('Budget added successfully!');
    setIsBudgetModalOpen(false);
    appRef.current.classList.remove('modal-open');
  }, [fetchBudgets]);

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

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, [navigate]);

  if (!currentUser) return null;

  return (
    <div ref={appRef} className={styles.App}>
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
          {transactionMessage && (
            <div className={styles.messageBanner}>
              {transactionMessage}
            </div>
          )}

          <button
            className={styles.primaryButton}
            onClick={() => {
              setIsTransactionModalOpen(true);
              appRef.current.classList.add('modal-open');
            }}
          >
            Add Transaction
          </button>

          {transactions.length > 0 ? (
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
          )}

          {isTransactionModalOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
              <TransactionForm
                userId={currentUser?.uid}
                onTransactionAdded={handleTransactionAdded}
                setMessage={setTransactionMessage}
                onClose={() => {
                  setIsTransactionModalOpen(false);
                  appRef.current.classList.remove('modal-open');
                }}
              />
            </div>
          )}
        </div>

        <div className={`${styles.card} ${styles.budgetsSection}`}>
          <h2>Budgets</h2>

          <button
            className={styles.primaryButton}
            onClick={() => {
              setIsBudgetModalOpen(true);
              appRef.current.classList.add('modal-open');
            }}
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

          {isBudgetModalOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
              <BudgetForm
                userId={currentUser?.uid}
                onBudgetAdded={handleBudgetAdded}
                setMessage={setMessage}
                onClose={() => {
                  setIsBudgetModalOpen(false);
                  appRef.current.classList.remove('modal-open');
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(PlaidLink);