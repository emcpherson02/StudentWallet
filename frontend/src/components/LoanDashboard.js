import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import axios from 'axios';
import styles from '../styles/LoanDashboard.module.css';
import TransactionSelectionModal from './TransactionSelectionModal';
import LoanForm from './LoanForm';
import Layout from './Layout';
import CountdownTimer from './CountdownTimer';
import SpendingTrend from './SpendingTrend';

const LoanDashboard = () => {
    const { currentUser } = useAuth();
    const [loanData, setLoanData] = useState(null);

    const calculateAvailableAmount = (loan) => {
        const currentDate = new Date();
        let availableAmount = 0;

        loan.instalmentDates.forEach((date, index) => {
            const installmentDate = new Date(date);
            if (currentDate >= installmentDate) {
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

    useEffect(() => {
        fetchLoanData();
    }, [currentUser]);

    const fetchLoanData = async () => {
        if (!currentUser) return;

        try {
            const token = await currentUser.getIdToken();
            const response = await axios.get(
                'http://localhost:3001/loan/get_loan',
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
                `http://localhost:3001/loan/delete_loan/${loanData.id}`,
                {
                    data: { userId: currentUser.uid },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setMessage('Loan deleted successfully');
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
                `http://localhost:3001/loan/link_all_transactions/${loanData.id}`,
                { userId: currentUser.uid },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage('Transactions linked successfully');
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
                `http://localhost:3001/loan/unlink_all_transactions/${loanData.id}`,
                {
                    data: { userId: currentUser.uid },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setMessage('Transactions unlinked successfully');
            fetchLoanData();
        } catch (error) {
            console.error('Error unlinking transactions:', error);
            setError('Failed to unlink transactions');
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading loan data...</div>;
    }

    return (
        <Layout currentUser={currentUser}>
            <div className={styles.dashboard}>
                <div className={styles.dashboardHeader}>
                    <h1>Loan Dashboard</h1>
                    <div className={styles.buttonGroup}>
                        {!loanData && (
                            <button
                                onClick={() => setIsLoanFormOpen(true)}
                                className={styles.linkButton}
                            >
                                Add Loan
                            </button>
                        )}
                        {loanData && (
                            <>
                                <button
                                    onClick={() => setIsTransactionModalOpen(true)}
                                    className={styles.linkButton}
                                >
                                    Sync Transactions
                                </button>
                                <button
                                    onClick={handleUnlinkTransactions}
                                    className={styles.linkButton}
                                >
                                    Unlink Transactions
                                </button>
                                <button
                                    onClick={handleDeleteLoan}
                                    className={`${styles.linkButton} ${styles.deleteButton}`}
                                >
                                    Delete Loan
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {message && (
                    <div className={`${styles.message} ${styles.success}`}>
                        {message}
                    </div>
                )}

                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                {loanData && (
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
                            {/* Find next installment */}
                            {(() => {
                                const nextInstallment = loanData.instalmentDates
                                    .map((date, index) => ({
                                        date,
                                        amount: loanData.instalmentAmounts[index]
                                    }))
                                    .find(inst => new Date(inst.date) > new Date());

                                return nextInstallment ? (
                                    <CountdownTimer
                                        nextInstallmentDate={nextInstallment.date}
                                        amount={nextInstallment.amount}
                                    />
                                ) : null;
                            })()}

                            {/* Add Spending Trend if there are transactions */}
                            {loanData.transactions && loanData.transactions.length > 0 && (
                                <SpendingTrend transactions={loanData.transactions} />
                            )}
                        </>

                        <div className={styles.installments}>
                            <h3>Installments</h3>
                            <div className={styles.installmentGrid}>
                                {loanData.instalmentDates.map((date, index) => (
                                    <div key={index} className={styles.installmentCard}>
                                        <div className={styles.installmentHeader}>
                                            <h4>Installment {index + 1}</h4>
                                            {(() => {
                                                const installmentDate = new Date(date);
                                                const currentDate = new Date();
                                                const isReceived = currentDate >= installmentDate;
                                                const isUpcoming = !isReceived &&
                                                    installmentDate <= new Date(currentDate.setDate(currentDate.getDate() + 14));

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
                                        <div className={styles.installmentDetails}>
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
                )}

                {isLoanFormOpen && (
                    <LoanForm
                        userId={currentUser?.uid}
                        onLoanAdded={() => {
                            fetchLoanData();
                            setIsLoanFormOpen(false);
                        }}
                        setMessage={setMessage}
                        onClose={() => setIsLoanFormOpen(false)}
                    />
                )}
            </div>
            <TransactionSelectionModal
                isOpen={isTransactionModalOpen}
                onClose={() => setIsTransactionModalOpen(false)}
                onSelect={() => {
                    fetchLoanData();
                    setMessage('Transaction linked successfully');
                }}
                loanId={loanData?.id}
                currentLinkedTransactions={loanData?.trackedTransactions}
            />
        </Layout>
    );
};

export default LoanDashboard;