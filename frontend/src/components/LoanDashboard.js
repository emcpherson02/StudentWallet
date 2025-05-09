import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import axios from 'axios';
import styles from '../styles/LoanDashboard.module.css';
import TransactionSelectionModal from './TransactionSelectionModal';
import LoanForm from './LoanForm';
import Layout from './Layout';
import CountdownTimer from './CountdownTimer';
import SpendingTrend from './SpendingTrend';
import { ButtonGroup, AddLoanButton } from "./LoanButtonGroup";
import { getApiUrl } from "../utils/api";
import { toast } from 'react-toastify';
import { Loader } from 'lucide-react';

const LoanDashboard = () => {
    const { currentUser } = useAuth();
    const [loanData, setLoanData] = useState(null);

    const calculateAvailableAmount = (loan) => {
        const currentDate = new Date();
        let availableAmount = 0;

        loan.instalmentDates.forEach((date, index) => {
            const instalmentDate = new Date(date);
            if (currentDate >= instalmentDate) {
                availableAmount += loan.instalmentAmounts[index];
            }
        });

        return availableAmount;
    };
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [isLoanFormOpen, setIsLoanFormOpen] = useState(false);
    const [linkedTransactions, setLinkedTransactions] = useState([]);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    useEffect(() => {
        fetchLoanData();
        const fetchNotificationStatus = async () => {
            if (!currentUser) return;

            try {
                const token = await currentUser.getIdToken();
                const response = await axios.get(
                    getApiUrl('/user/user-data'),
                    {
                        params: { userId: currentUser.uid },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                setNotificationsEnabled(response.data.notificationsEnabled || false);
            } catch (error) {
                console.error('Error fetching notification status:', error);
            }
        };

        fetchNotificationStatus();
    }, [currentUser]);

    const toggleNotifications = async () => {
        try {
            const token = await currentUser.getIdToken();
            await axios.post(
                getApiUrl('/user/toggle-notifications'),
                {
                    userId: currentUser.uid,
                    enabled: !notificationsEnabled
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setNotificationsEnabled(!notificationsEnabled);
            toast(notificationsEnabled ? 'Notifications disabled' : 'Notifications enabled');
        } catch (error) {
            console.error('Error toggling notifications:', error);
            setError('Failed to update notification settings');
        }
    };

    const fetchLoanData = async () => {
        if (!currentUser) return;

        try {
            const token = await currentUser.getIdToken();
            const response = await axios.get(
                getApiUrl('/loan/get_loan'),
                {
                    params: { userId: currentUser.uid },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setLoanData(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching loan data:', error);
            setError('Failed to load loan data');
            setLoading(false);
        }
    };

    const handleDeleteLoan = async () => {
        if (!currentUser || !loanData) return;

        try {
            const token = await currentUser.getIdToken();
            await axios.delete(
                getApiUrl(`/loan/delete_loan/${loanData.id}`),
                {
                    data: { userId: currentUser.uid },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast('Loan deleted successfully' , { type: 'success' });
            setLoanData(null);
        } catch (error) {
            console.error('Error deleting loan:', error);
            setError('Failed to delete loan');
        }
    };

    const handleLinkTransactions = async () => {
        if (!currentUser || !loanData) return;

        try {
            const token = await currentUser.getIdToken();
            const response = await axios.post(
                getApiUrl(`/loan/link_all_transactions/${loanData.id}`),
                { userId: currentUser.uid },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast('Transactions linked successfully', { type: 'success' });
            fetchLoanData();
        } catch (error) {
            console.error('Error linking transactions:', error);
            setError('Failed to link transactions');
        }
    };

    const handleUnlinkTransactions = async () => {
        if (!currentUser || !loanData) return;

        try {
            const token = await currentUser.getIdToken();
            const response = await axios.delete(
                getApiUrl(`/loan/unlink_all_transactions/${loanData.id}`),
                {
                    data: { userId: currentUser.uid },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast('Transactions unlinked successfully', { type: 'success' });
            fetchLoanData();
        } catch (error) {
            console.error('Error unlinking transactions:', error);
            setError('Failed to unlink transactions');
        }
    };

    const renderDashboardContent = () => {
        if (loading) {
            return (
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}>
                        <Loader size={40} className={styles.loadingIcon} />
                    </div>
                    <p>Loading loan data...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className={styles.error}>
                    {error}
                </div>
            );
        }

        if (!loanData) {
            return (
                <div className={styles.emptyStateContainer}>
                    <p>No loan data available. Add your student loan details to get started.</p>
                </div>
            );
        }

        return (
            <div className={styles.loanCard}>
                <div className={styles.loanDetails}>
                    <div className={styles.detailItem}>
                        <h4>Total Loan Amount</h4>
                        <p>£{loanData.totalAmount.toFixed(2)}</p>
                    </div>
                    <div className={styles.detailItem}>
                        <h4>Currently Available</h4>
                        <p>£{calculateAvailableAmount(loanData).toFixed(2)}</p>
                    </div>
                    <div className={styles.detailItem}>
                        <h4>Remaining Balance</h4>
                        <p>£{(calculateAvailableAmount(loanData) -
                            (loanData.transactions?.reduce((total, transaction) =>
                                total + Math.abs(transaction.Amount), 0) || 0)
                        ).toFixed(2)}</p>
                    </div>
                    <div className={styles.detailItem}>
                        <h4>Living Option</h4>
                        <p>{loanData.livingOption === 'away' ? 'Living Away' : 'Living at Home'}</p>
                    </div>
                </div>

                <>
                    {/* Find next instalment */}
                    {(() => {
                        const nextInstalment = loanData.instalmentDates
                            .map((date, index) => ({
                                date,
                                amount: loanData.instalmentAmounts[index]
                            }))
                            .find(inst => new Date(inst.date) > new Date());

                        return nextInstalment ? (
                            <CountdownTimer
                                nextInstalmentDate={nextInstalment.date}
                                amount={nextInstalment.amount}
                            />
                        ) : null;
                    })()}

                    {/* Add Spending Trend if there are transactions */}
                    {loanData.transactions && loanData.transactions.length > 0 && (
                        <SpendingTrend transactions={loanData.transactions} />
                    )}
                </>

                <div className={styles.instalments}>
                    <h3>Instalments</h3>
                    <div className={styles.instalmentGrid}>
                        {loanData.instalmentDates.map((date, index) => (
                            <div key={index} className={styles.instalmentCard}>
                                <div className={styles.instalmentHeader}>
                                    <h4>Instalment {index + 1}</h4>
                                    {(() => {
                                        const instalmentDate = new Date(date);
                                        const currentDate = new Date();
                                        const isReceived = currentDate >= instalmentDate;
                                        const isUpcoming = !isReceived &&
                                            instalmentDate <= new Date(currentDate.setDate(currentDate.getDate() + 14));

                                        return (
                                            <span className={`${styles.statusBadge} ${
                                                isReceived ? styles.received :
                                                    isUpcoming ? styles.upcoming :
                                                        styles.pending
                                            }`}>
                        {isReceived ? 'Received' :
                            isUpcoming ? 'Due Soon' :
                                'Pending'}
                    </span>
                                        );
                                    })()}
                                </div>
                                <div className={styles.instalmentDetails}>
                                    <div className={styles.detail}>
                                        <span className={styles.label}>Date:</span>
                                        <span className={styles.value}>
                    {new Date(date).toLocaleDateString()}
                </span>
                                    </div>
                                    <div className={styles.detail}>
                                        <span className={styles.label}>Amount:</span>
                                        <span className={styles.value}>
                    £{loanData.instalmentAmounts[index].toFixed(2)}
                </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {loanData.trackedTransactions && loanData.trackedTransactions.length > 0 && (
                    <div className={styles.transactionsList}>
                        <h3>Linked Transactions</h3>
                        <div className={styles.progressBarContainer}>
                            {/* Calculate total from transactions */}
                            {(() => {
                                const availableAmount = calculateAvailableAmount(loanData);
                                const usedAmount = loanData.transactions?.reduce((total, transaction) =>
                                    total + Math.abs(transaction.Amount), 0) || 0;
                                const percentageUsed = (usedAmount / availableAmount) * 100;

                                return (
                                    <>
                                        <div className={styles.progressBar}>
                                            <div
                                                className={styles.progressFill}
                                                style={{
                                                    width: `${percentageUsed}%`
                                                }}
                                            />
                                            <span className={styles.progressLabel}>
                                                {percentageUsed.toFixed(1)}%
                                            </span>
                                        </div>
                                        <p className={styles.progressText}>
                                            Used £{usedAmount.toFixed(2)} out of £{availableAmount.toFixed(2)}
                                        </p>
                                    </>
                                );
                            })()}
                        </div>

                        {loanData.transactions && loanData.transactions.map((transaction, index) => (
                            <div key={index} className={styles.transactionItem}>
                                <div>
                                    <p className={styles.transactionDescription}>{transaction.Description}</p>
                                    <p className={styles.transactionDate}>{new Date(transaction.date).toLocaleDateString()}</p>
                                </div>
                                <p className={styles.transactionAmount}>£{Math.abs(transaction.Amount).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Layout currentUser={currentUser}>
            <div className={styles.dashboard}>
                <div className={styles.dashboardHeader}>
                    <h1>Loan Dashboard</h1>
                    <div className={styles.buttonGroup}>
                        {loanData && (
                            <ButtonGroup
                                toggleNotifications={toggleNotifications}
                                setIsTransactionModalOpen={setIsTransactionModalOpen}
                                handleUnlinkTransactions={handleUnlinkTransactions}
                                handleDeleteLoan={handleDeleteLoan}
                            />
                        )}

                        {!loanData && (
                            <AddLoanButton onClick={() => setIsLoanFormOpen(true)} />
                        )}
                    </div>
                </div>

                {message && (
                    <div className={`${styles.message} ${styles.success}`}>
                        {message}
                    </div>
                )}

                {renderDashboardContent()}

                {isLoanFormOpen && (
                    <LoanForm
                        userId={currentUser?.uid}
                        onLoanAdded={() => {
                            fetchLoanData();
                            setIsLoanFormOpen(false);
                        }}
                        onClose={() => setIsLoanFormOpen(false)}
                    />
                )}
            </div>
            <TransactionSelectionModal
                isOpen={isTransactionModalOpen}
                onClose={() => setIsTransactionModalOpen(false)}
                onSelect={() => {
                    fetchLoanData();
                }}
                loanId={loanData?.id}
                currentLinkedTransactions={loanData?.trackedTransactions}
            />
        </Layout>
    );
};

export default LoanDashboard;