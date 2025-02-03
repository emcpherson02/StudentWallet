import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../utils/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../styles/PlaidLink.module.css';
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';
import TransactionForm from './TransactionForm';
import BudgetForm from './BudgetForm';
import { Bell } from 'lucide-react';
import Layout from './Layout';

function PlaidLink() {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState(''); //DIVIDE INTO budgetMessage AND userMessage
  const [transactionMessage, setTransactionMessage] = useState('');
  const [linkedBank, setLinkedBank] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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
      setAccounts(accounts || []);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setMessage('Failed to fetch user details.');
    }
  }, [currentUser]);

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

  const startPlaidLink = useCallback(async () => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      const linkTokenResponse = await axios.post(
        'http://localhost:3001/plaid/create_link_token',
        { userId: currentUser.uid },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const linkToken = linkTokenResponse.data.link_token;
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: async (publicToken) => {
          try {
            const token = await currentUser.getIdToken();
            await axios.post(
              'http://localhost:3001/plaid/exchange_public_token',
              { publicToken, userId: currentUser.uid },
              { headers: { Authorization: `Bearer ${token}` } }
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
        onExit: (err) => {
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
  }, [currentUser, fetchUserDetails, fetchTransactions]);

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
    <Layout currentUser={currentUser} onLogout={handleLogout}>
      <div className={styles.pageContainer}>
        {/* Account Overview Section */}
        <section className={styles.contentSection}>
          <div className={styles.sectionHeader}>
            <h2>Account Overview</h2>
          </div>
          <div className={styles.card}>
            <div className={styles.userInfo}>
              <p><strong>Name:</strong> {currentUser.displayName}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
            </div>
            {message && (
              <div className={styles.messageBanner}>{message}</div>
            )}
          </div>
        </section>

        {/* Bank Connection Section */}
        <section className={styles.contentSection}>
          <div className={styles.sectionHeader}>
            <h2>Bank Account</h2>
          </div>
          <div className={styles.card}>
            {!linkedBank ? (
              <div className={styles.connectBankSection}>
                <p>Connect your bank account to get started</p>
                <button onClick={startPlaidLink} className={styles.primaryButton}>
                  Connect Bank Account
                </button>
              </div>
            ) : (
              <div>
                <h3>Linked Accounts</h3>
                <div className={styles.accountsGrid}>
                  {accounts.map((account, index) => (
                    <div key={account.id || index} className={styles.accountCard}>
                      <h4>{account.name || account.type}</h4>
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
        </section>

        {/* Transactions Section */}
        <section className={styles.contentSection}>
          <div className={styles.sectionHeader}>
            <h2>Transactions</h2>
            <button
              onClick={() => {
                setIsTransactionModalOpen(true);
                appRef.current?.classList.add('modal-open');
              }}
              className={styles.primaryButton}
            >
              Add Transaction
            </button>
          </div>
          <div className={styles.card}>
            {transactionMessage && (
              <div className={styles.messageBanner}>{transactionMessage}</div>
            )}
            <div className={styles.transactionsList}>
              {transactions.length > 0 ? (
                transactions.map((transaction, index) => (
                  <div key={index} className={styles.transactionItem}>
                    <div className={styles.transactionDetails}>
                      <div><strong>Type:</strong> {transaction.type}</div>
                      <div><strong>Amount:</strong> £{Math.abs(transaction.amount).toFixed(2)}</div>
                      <div><strong>Date:</strong> {new Date(transaction.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.emptyState}>No transactions available.</p>
              )}
            </div>
          </div>
        </section>

        {/* Budgets Section */}
        <section className={styles.contentSection}>
          <div className={styles.sectionHeader}>
            <h2>Budgets</h2>
            <div className={styles.buttonGroup}>
              <button
                onClick={() => {
                  setIsBudgetModalOpen(true);
                  appRef.current?.classList.add('modal-open');
                }}
                className={styles.primaryButton}
              >
                Add Budget
              </button>
              <button
                onClick={() => navigate('/budget-dashboard')}
                className={styles.secondaryButton}
              >
                View Dashboard
              </button>
            </div>
          </div>
          <div className={styles.card}>
            {budgets.length > 0 ? (
              <div className={styles.budgetsGrid}>
                {budgets.map((budget, index) => (
                  <div key={index} className={styles.budgetCard}>
                    <h4>{budget.category}</h4>
                    <div className={styles.budgetDetails}>
                      <div><strong>Amount:</strong> £{budget.amount}</div>
                      <div><strong>Spent:</strong> £{budget.spent || 0}</div>
                      <div><strong>Period:</strong> {budget.period}</div>
                      <div className={styles.budgetDates}>
                        <div>{new Date(budget.startDate).toLocaleDateString()}</div>
                        <div>to</div>
                        <div>{new Date(budget.endDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>No budgets available. Add your first budget to get started.</p>
            )}
          </div>
        </section>
      </div>

      {/* Modals */}
      {isTransactionModalOpen && (
        <TransactionForm
          userId={currentUser?.uid}
          onTransactionAdded={handleTransactionAdded}
          setMessage={setTransactionMessage}
          onClose={() => {
            setIsTransactionModalOpen(false);
            appRef.current?.classList.remove('modal-open');
          }}
        />
      )}

      {isBudgetModalOpen && (
        <BudgetForm
          userId={currentUser?.uid}
          onBudgetAdded={handleBudgetAdded}
          setMessage={setMessage}
          onClose={() => {
            setIsBudgetModalOpen(false);
            appRef.current?.classList.remove('modal-open');
          }}
        />
      )}
    </Layout>
  );
}

export default React.memo(PlaidLink);