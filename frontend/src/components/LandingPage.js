import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../utils/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../styles/LandingPage.module.css';
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';
import TransactionForm from './TransactionForm';
import BudgetForm from './BudgetForm';
import { Plus, Wallet, CreditCard, ArrowUpRight, Banknote, RefreshCw, PoundSterling } from 'lucide-react';
import Layout from './Layout';
import ProductTour from './ProductTour';
import '../styles/ProductTour.css';
import { getApiUrl } from "../utils/api";
import { toast } from "react-toastify";
import { logoutUser } from "../utils/authService";

function LandingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const appRef = useRef();

  // State declarations
  const [message, setMessage] = useState('');
  const [linkedBank, setLinkedBank] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Loading states - combined into a single state to manage transitions gracefully
  const [loading, setLoading] = useState({
    accounts: true,
    transactions: true,
    budgets: true,
    initialLoadComplete: false
  });

  // Define fetch functions first
  const handleRefresh = async () => {
    setIsRefreshing(true);

    // Set individual loading states without triggering a full loading screen
    setLoading(prev => ({
      ...prev,
      accounts: true,
      transactions: true,
      budgets: true
    }));

    await Promise.all([
      fetchUserDetails(),
      fetchTransactions(),
      fetchBudgets()
    ]);

    setIsRefreshing(false);
  };

  const fetchBudgets = useCallback(async () => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(getApiUrl(`/budget/get_budgets`), {
        params: {userId: currentUser.uid},
        headers: {Authorization: `Bearer ${token}`}
      });
      setBudgets(response.data.budgets || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast('Failed to fetch budgets.', {type: 'error'});
    } finally {
      setLoading(prev => ({
        ...prev,
        budgets: false
      }));
    }
  }, [currentUser]);

  const fetchTransactions = useCallback(async () => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(getApiUrl(`/transactions/user-transactions`), {
        params: {userId: currentUser.uid},
        headers: {Authorization: `Bearer ${token}`}
      });

      const {Transaction} = response.data;
      setTransactions(Transaction || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast('Failed to fetch transactions.', {type: 'error'});
    } finally {
      setLoading(prev => ({
        ...prev,
        transactions: false
      }));
    }
  }, [currentUser]);

  const fetchPlaidAccounts = useCallback(async () => {
    try {
      console.log('Fetching Plaid accounts...');
      const token = await currentUser.getIdToken();

      // Fetch accounts and transactions in parallel
      const [accountsResponse, transactionsResponse] = await Promise.all([
        axios.get(getApiUrl(`/plaid/accounts/${currentUser.uid}`), {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(getApiUrl('/transactions/user-transactions'), {
          params: { userId: currentUser.uid },
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (accountsResponse.data.accounts) {
        const allTransactions = transactionsResponse.data.Transaction || [];

        const processedAccounts = accountsResponse.data.accounts.map(account => {
          // Calculate balance from transactions
          const accountTransactions = allTransactions.filter(
              transaction => transaction.accountId === account.account_id
          );

          const calculatedBalance = accountTransactions.reduce((sum, transaction) => {
            const transactionAmount = Number(transaction.amount) || 0;
            return sum + transactionAmount;
          }, 0);

          return {
            id: account.account_id,
            name: account.name || 'Unknown Account',
            officialName: account.official_name,
            type: account.type || 'Account',
            subtype: account.subtype,
            institutionName: account.institutionName || accountsResponse.data.institutionName || 'Bank',
            calculatedBalance: Math.abs(calculatedBalance || 0),
            transactionCount: accountTransactions.length || 0
          };
        });

        console.log('Processed accounts:', processedAccounts);
        setAccounts(processedAccounts);
      } else {
        console.log('No accounts found in Plaid response');
      }
    } catch (error) {
      console.error('Error fetching Plaid accounts:', error);
    } finally {
      setLoading(prev => ({
        ...prev,
        accounts: false
      }));
    }
  }, [currentUser]);

  const fetchUserDetails = useCallback(async () => {
    if (!currentUser) return;

    try {
      console.log('Fetching user details...');
      const token = await currentUser.getIdToken();
      const response = await axios.get(getApiUrl(`/user/user-data`), {
        params: {userId: currentUser.uid},
        headers: {Authorization: `Bearer ${token}`}
      });

      const {linkedBank} = response.data;

      setLinkedBank(linkedBank);

      if (linkedBank) {
        await fetchPlaidAccounts();
        return true;
      } else {
        console.log('No bank linked, clearing accounts');
        setAccounts([]);
        setLoading(prev => ({
          ...prev,
          accounts: false
        }));
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast('Failed to fetch user details.', {type: 'error'});
      setLoading(prev => ({
        ...prev,
        accounts: false
      }));
      return false;
    }
  }, [currentUser, fetchPlaidAccounts]);

  // Handler functions
  const handleTransactionAdded = useCallback(() => {
    fetchTransactions();
    fetchBudgets();
    setIsTransactionModalOpen(false);
    toast('Transaction added successfully!', {type: 'success'});
    appRef.current?.classList.remove('modal-open');
  }, [fetchTransactions, fetchBudgets]);

  const handleBudgetAdded = useCallback(() => {
    fetchBudgets();
    setIsBudgetModalOpen(false);
    toast('Budget added successfully!', {type: 'success'});
    appRef.current?.classList.remove('modal-open');
  }, [fetchBudgets]);

  const startPlaidLink = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await axios.post(getApiUrl('/plaid/create_link_token'),
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
            const exchangeResponse = await axios.post(getApiUrl('/plaid/exchange_public_token'),
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

            toast('Bank account linked successfully!', {type: 'success'});
            setLinkedBank(true);
            setAccounts(exchangeResponse.data.accounts || []);

            // First, trigger Plaid transaction fetch (which stores in DB)
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            await axios.get(
                getApiUrl(`/plaid/transactions/${currentUser.uid}`),
                {
                  params: { startDate, endDate },
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
            );

            // Then fetch all transactions from our DB
            await fetchTransactions();
            toast('Transactions imported successfully!', {type: 'success'});
          } catch (error) {
            console.error('Error exchanging public token:', error);
            toast('Failed to link bank account.', {type: 'error'});
          }
        },
        onExit: (err, metadata) => {
          if (err) {
            console.error('Error during Plaid Link:', err);
            toast('Failed to link bank account.', {type: 'error'});
          }
        },
      });

      handler.open();
    } catch (error) {
      console.error('Error fetching link token:', error);
      toast('Failed to start bank account linking.', {type: 'error'});
    }
  };

  const checkBudgetRollovers = useCallback(async () => {
    try {
      const token = await currentUser.getIdToken();
      const userBudgets = await axios.get(getApiUrl('/budget/get_budgets'), {
        params: { userId: currentUser.uid },
        headers: { Authorization: `Bearer ${token}` }
      });

      const today = new Date();
      for (const budget of (userBudgets.data.budgets || [])) {
        const endDate = new Date(budget.endDate);
        console.log(`[Frontend] Checking budget ${budget.id}, end date: ${endDate}`);

        if (endDate <= today) {
          console.log(`[Frontend] Processing rollover for budget ${budget.id}`);
          await axios.post(getApiUrl('/history/rollover'), {
            userId: currentUser.uid,
            budgetId: budget.id
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }
    } catch (error) {
      console.error('[Frontend] Error during rollover check:', error);
    }
  }, [currentUser]);

  // Loading placeholder components
  const AccountsLoadingPlaceholder = () => (
      <div className={styles.loadingGrid}>
        {[1, 2, 3].map((i) => (
            <div key={i} className={styles.loadingCard}>
              <div className={styles.accountPlaceholder}>
                <div className={styles.accountIcon} />
                <div className={styles.accountDetails}>
                  <div className={styles.shimmerLine} />
                  <div className={`${styles.shimmerLine} ${styles.short}`} />
                </div>
              </div>
            </div>
        ))}
      </div>
  );

  const TransactionsLoadingPlaceholder = () => (
      <div className={styles.loadingGrid}>
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={styles.loadingCard}>
              <div className={styles.transactionPlaceholder}>
                <div className={styles.accountDetails}>
                  <div className={styles.shimmerLine} />
                  <div className={`${styles.shimmerLine} ${styles.short}`} />
                </div>
                <div className={`${styles.shimmerLine} ${styles.short}`} />
              </div>
            </div>
        ))}
      </div>
  );

  const BudgetsLoadingPlaceholder = () => (
      <div className={styles.loadingGrid}>
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.loadingCard}>
              <div className={styles.budgetPlaceholder}>
                <div className={styles.budgetHeader}>
                  <div className={`${styles.shimmerLine} ${styles.short}`} />
                  <div className={`${styles.shimmerLine} ${styles.short}`} />
                </div>
                <div className={styles.shimmerBar} />
                <div className={styles.budgetHeader}>
                  <div className={`${styles.shimmerLine} ${styles.short}`} />
                  <div className={`${styles.shimmerLine} ${styles.short}`} />
                </div>
              </div>
            </div>
        ))}
      </div>
  );

  // Loading Animation Component
  const LoadingAnimation = () => (
      <div className={styles.initialLoadingContainer}>
        <div className={styles.loadingLogo}>
          <PoundSterling size={40} className={styles.loadingIcon} />
        </div>
        <h2 className={styles.loadingTitle}>Student Wallet</h2>
        <p className={styles.loadingSubtitle}>Loading your financial dashboard...</p>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinnerDot}></div>
          <div className={styles.spinnerDot}></div>
          <div className={styles.spinnerDot}></div>
        </div>
      </div>
  );

  // Message timeout effect
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000); // Messages will disappear after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Authentication effect
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Main data fetching effect
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!currentUser || !isMounted) return;

      try {
        await checkBudgetRollovers();

        // Fetch all data in parallel
        await Promise.all([
          fetchUserDetails(),
          fetchTransactions(),
          fetchBudgets()
        ]);

        // Only mark initial load as complete after all data is loaded
        if (isMounted) {
          // Add a small delay for a smoother transition
          setTimeout(() => {
            setLoading(prev => ({
              ...prev,
              initialLoadComplete: true
            }));
          }, 500);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        // Make sure we mark loading as complete even if there are errors
        if (isMounted) {
          setLoading({
            accounts: false,
            transactions: false,
            budgets: false,
            initialLoadComplete: true
          });
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [currentUser, fetchUserDetails, fetchTransactions, fetchBudgets, checkBudgetRollovers]);

  if (!currentUser) return null;

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  // Check if we're still in the initial loading phase
  const isInitialLoading = !loading.initialLoadComplete;

  return (
      <Layout currentUser={currentUser} onLogout={handleLogout}>
        {isInitialLoading ? (
            <LoadingAnimation />
        ) : (
            <div className={styles.pageContainer}>
              {/* Welcome Section */}
              <section className={styles.welcomeSection}>
                <div className={styles.welcomeContent}>
                  <h1>Welcome back, {currentUser.displayName}</h1>
                  <p>Manage your finances and track your spending all in one place</p>
                </div>
                {message && (
                    <div className={styles.messageBanner}>
                      {message}
                    </div>
                )}
              </section>

              {/* Quick Actions Grid */}
              <section className={`${styles.quickActions} quickActions`}>
                <button
                    onClick={() => setIsTransactionModalOpen(true)}
                    className={styles.actionCard}
                >
                  <Plus className="w-6 h-6" />
                  <span>Add Transaction</span>
                </button>
                <button
                    onClick={() => setIsBudgetModalOpen(true)}
                    className={styles.actionCard}
                >
                  <Wallet className="w-6 h-6" />
                  <span>Create Budget</span>
                </button>
                {!linkedBank && (
                    <button
                        onClick={startPlaidLink}
                        className={styles.actionCard}
                    >
                      <CreditCard className="w-6 h-6" />
                      <span>Link Bank</span>
                    </button>
                )}
              </section>

              {/* Main Content Grid */}
              <div className={styles.mainGrid}>
                {/* Accounts Overview */}
                <section className={styles.gridSection}>
                  <div className={styles.sectionHeader}>
                    <h2>Accounts</h2>
                  </div>
                  <div className={`${styles.accountsContainer} accountsContainer`}>
                    {loading.accounts ? (
                        <AccountsLoadingPlaceholder />
                    ) : !linkedBank ? (
                        <div className={styles.emptyStateCard}>
                          <CreditCard className="w-12 h-12 text-gray-400" />
                          <h3>Link Your Bank Account</h3>
                          <p>Connect your bank to automatically track expenses</p>
                          <button
                              onClick={startPlaidLink}
                              className={styles.primaryButton}
                          >
                            Connect Now
                          </button>
                        </div>
                    ) : (
                        <div className={styles.accountsGrid}>
                          {accounts.map((account) => (
                              <div key={account.id || `${account.name}-${account.type}`} className={styles.accountCard}>
                                <div className={styles.accountIcon}>
                                  <Banknote className="w-5 h-5"/>
                                </div>
                                <div className={styles.accountInfo}>
                                  <h4>{account.institutionName || 'Account'}</h4>
                                  <p className={styles.accountType}>
                                    {account.subtype ? account.subtype.charAt(0).toUpperCase() + account.subtype.slice(1) : account.type || 'Account'}
                                  </p>
                                  <div className={styles.accountBalanceContainer}>
                                    <p className={styles.accountBalance}>
                                      £{(account.calculatedBalance || 0).toFixed(2)}
                                    </p>
                                    <span className={styles.transactionCount}>
            {account.transactionCount || 0} transactions
          </span>
                                  </div>
                                </div>
                              </div>
                          ))}
                        </div>
                    )}
                  </div>
                </section>

                {/* Recent Transactions */}
                <section className={styles.gridSection}>
                  <div className={styles.sectionHeader}>
                    <h2>Recent Transactions</h2>
                    <div className={styles.headerActions}>
                      <button
                          onClick={handleRefresh}
                          className={`${styles.iconButton} ${isRefreshing ? styles.spinning : ''}`}
                          disabled={isRefreshing}
                      >
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? styles.refreshIcon : ''}`}/>
                      </button>
                      <button
                          onClick={() => setIsTransactionModalOpen(true)}
                          className={styles.iconButton}
                      >
                        <Plus className="w-5 h-5"/>
                      </button>
                    </div>
                  </div>
                  <div className={`${styles.transactionsContainer} transactionsContainer`}>
                    {loading.transactions ? (
                        <TransactionsLoadingPlaceholder/>
                    ) : transactions.length === 0 ? (
                        <div className={styles.emptyStateCard}>
                          <Wallet className="w-12 h-12 text-gray-400"/>
                          <h3>No Transactions Yet</h3>
                          <p>Add your first transaction to get started</p>
                          <button
                              onClick={() => setIsTransactionModalOpen(true)}
                              className={styles.primaryButton}
                          >
                            Add Transaction
                          </button>
                        </div>
                    ) : (
                        <div className={styles.transactionsList}>
                          {transactions.slice(0, 5).map((transaction, index) => (
                              <div key={transaction.id || `transaction-${index}`} className={styles.transactionItem}>
                                <div className={styles.transactionInfo}>
                                  <h4>{transaction.type}</h4>
                                  <p>{new Date(transaction.date).toLocaleDateString()}</p>
                                </div>
                                <span className={styles.transactionAmount}>
                          £{Math.abs(transaction.amount).toFixed(2)}
                        </span>
                              </div>
                          ))}
                        </div>
                    )}
                  </div>
                </section>

                {/* Active Budgets */}
                <section className={styles.gridSection}>
                  <div className={styles.sectionHeader}>
                    <h2>Active Budgets</h2>
                    <div className={styles.headerActions}>
                      <button
                          onClick={() => setIsBudgetModalOpen(true)}
                          className={styles.iconButton}
                      >
                        <Plus className="w-5 h-5"/>
                      </button>
                      <button
                          onClick={() => navigate('/budget-dashboard')}
                          className={styles.viewAllButton}
                      >
                        View All <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className={`${styles.budgetsContainer} budgetsContainer`}>
                    {loading.budgets ? (
                        <BudgetsLoadingPlaceholder />
                    ) : budgets.length === 0 ? (
                        <div className={styles.emptyStateCard}>
                          <Wallet className="w-12 h-12 text-gray-400" />
                          <h3>No Budgets Set</h3>
                          <p>Create your first budget to track spending</p>
                          <button
                              onClick={() => setIsBudgetModalOpen(true)}
                              className={styles.primaryButton}
                          >
                            Create Budget
                          </button>
                        </div>
                    ) : (
                        <div className={styles.budgetsGrid}>
                          {budgets.slice(0, 4).map((budget, index) => (
                              <div key={`budget-${index}`} className={styles.budgetCard}>
                                <div className={styles.budgetHeader}>
                                  <h4>{budget.category}</h4>
                                  <span className={styles.budgetPeriod}>{budget.period}</span>
                                </div>
                                <div className={styles.budgetProgress}>
                                  <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{
                                          width: `${Math.min((budget.spent / budget.amount) * 100, 100)}%`
                                        }}
                                    />
                                  </div>
                                  <div className={styles.budgetStats}>
                                    <span>£{budget.spent?.toFixed(2) || "0.00"} spent</span>
                                    <span>of £{budget.amount?.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                          ))}
                        </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Modals */}
              {isTransactionModalOpen && (
                  <TransactionForm
                      userId={currentUser?.uid}
                      onTransactionAdded={handleTransactionAdded}
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
                      onClose={() => {
                        setIsBudgetModalOpen(false);
                        appRef.current?.classList.remove('modal-open');
                      }}
                  />
              )}
              <ProductTour
                  onComplete={() => console.log('Tour completed!')}
              />
            </div>
        )}
      </Layout>
  );
}

export default React.memo(LandingPage);