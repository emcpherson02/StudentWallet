import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import axios from 'axios';
import styles from '../styles/LoanDashboard.module.css';
import LoanForm from './LoanForm';
import Layout from './Layout';

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
                                    onClick={handleLinkTransactions}
                                    className={styles.linkButton}
                                >
                                    Link Transactions
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
                                <p>£{loanData.remainingAmount.toFixed(2)}</p>
                            </div>
                            <div className={styles.detailItem}>
                                <h4>Living Option</h4>
                                <p>{loanData.livingOption === 'away' ? 'Living Away' : 'Living at Home'}</p>
                            </div>
                        </div>

                        <div className={styles.installments}>
                            <h3>Installments</h3>
                            <div className={styles.installmentGrid}>
                                {loanData.instalmentDates.map((date, index) => (
                                    <div key={index} className={styles.installmentCard}>
                                        <h4>Installment {index + 1}</h4>
                                        <p>Date: {new Date(date).toLocaleDateString()}</p>
                                        <p>Amount: £{loanData.instalmentAmounts[index].toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {loanData.trackedTransactions && loanData.trackedTransactions.length > 0 && (
                            <div className={styles.transactionsList}>
                                <h3>Linked Transactions</h3>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{
                                            width: `${((calculateAvailableAmount(loanData) - loanData.remainingAmount) / calculateAvailableAmount(loanData)) * 100}%`
                                        }}
                                    />
                                </div>
                                <p>Used: {((calculateAvailableAmount(loanData) - loanData.remainingAmount) / calculateAvailableAmount(loanData) * 100).toFixed(2)}% of available amount</p>

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
        </Layout>
    );
};

export default LoanDashboard;