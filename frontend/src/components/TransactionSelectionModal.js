import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAuth } from '../utils/AuthContext';
import axios from 'axios';
import styles from '../styles/TransactionModal.css';

const TransactionSelectionModal = ({ isOpen, onClose, onSelect, loanId, currentLinkedTransactions }) => {
    const { currentUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTransactions, setSelectedTransactions] = useState(new Set());

    useEffect(() => {
        fetchTransactions();
    }, [currentUser]);

    const fetchTransactions = async () => {
        if (!currentUser) return;
        try {
            const token = await currentUser.getIdToken();
            const response = await axios.get(
                'http://localhost:3001/transactions/user-transactions',
                {
                    params: { userId: currentUser.uid },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Filter out already linked transactions
            const unlinkedTransactions = (response.data.Transaction || []).filter(
                transaction => !currentLinkedTransactions?.includes(transaction.id)
            );

            setTransactions(unlinkedTransactions);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setError('Failed to load transactions');
            setLoading(false);
        }
    };

    const toggleTransactionSelection = (transactionId) => {
        const newSelected = new Set(selectedTransactions);
        if (newSelected.has(transactionId)) {
            newSelected.delete(transactionId);
        } else {
            newSelected.add(transactionId);
        }
        setSelectedTransactions(newSelected);
    };

    const handleTransactionLink = async () => {
        if (selectedTransactions.size === 0) {
            setError('Please select at least one transaction');
            return;
        }

        try {
            const token = await currentUser.getIdToken();

            // Link each selected transaction
            for (const transactionId of selectedTransactions) {
                await axios.post(
                    `http://localhost:3001/loan/link_transaction/${loanId}`,
                    {
                        userId: currentUser.uid,
                        transactionId
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
            }

            onSelect();
            onClose();
        } catch (error) {
            setError('Failed to link transactions');
        }
    };

    if (!isOpen) return null;

    return (
        <Modal title="Select Transactions" onClose={onClose}>
            <div className="transaction-modal">
                {loading && <p className="modal-loading">Loading transactions...</p>}
                {error && <p className="modal-error">{error}</p>}

                <div className="transaction-list">
                    {transactions.length === 0 ? (
                        <p className="no-transactions">No unlinked transactions available</p>
                    ) : (
                        transactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className={`transaction-item ${selectedTransactions.has(transaction.id) ? 'selected' : ''}`}
                            >
                                <label className="transaction-label">
                                    <input
                                        type="checkbox"
                                        checked={selectedTransactions.has(transaction.id)}
                                        onChange={() => toggleTransactionSelection(transaction.id)}
                                        className="transaction-checkbox"
                                    />
                                    <div className="transaction-details">
                                        <span className="transaction-type">{transaction.type}</span>
                                        <span className="transaction-date">
                      {new Date(transaction.date).toLocaleDateString()}
                    </span>
                                    </div>
                                    <span className="transaction-amount">
                    £{Math.abs(transaction.amount).toFixed(2)}
                  </span>
                                </label>
                            </div>
                        ))
                    )}
                </div>

                <div className="modal-actions">
                    <button
                        onClick={onClose}
                        className="button-cancel"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleTransactionLink}
                        className="button-link"
                        disabled={selectedTransactions.size === 0}
                    >
                        Link Selected ({selectedTransactions.size})
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default TransactionSelectionModal;