import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAuth } from '../utils/AuthContext';
import axios from 'axios';
import styles from '../styles/TransactionModal.css';
import {getApiUrl} from "../utils/api";
import {toast} from "react-toastify";

const TransactionSelectionModal = ({ isOpen, onClose, onSelect, loanId, currentLinkedTransactions }) => {
    const { currentUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTransactions, setSelectedTransactions] = useState(new Set());
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchTransactions();
        }
    }, [isOpen, currentUser]);

    const fetchTransactions = async () => {
        if (!currentUser) return;
        try {
            const token = await currentUser.getIdToken();
            const response = await axios.get(
                getApiUrl('/transactions/user-transactions'),
                {
                    params: { userId: currentUser.uid },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const unlinkedTransactions = (response.data.Transaction || []).filter(
                transaction => !currentLinkedTransactions?.includes(transaction.id)
            );

            setTransactions(unlinkedTransactions);
            setLoading(false);
        } catch (error) {
            setError('Failed to load transactions');
            setLoading(false);
        }
    };

    const handleSyncAll = async () => {
        try {
            setIsSyncing(true);
            const token = await currentUser.getIdToken();
            await axios.post(
                getApiUrl(`/loan/link_all_transactions/${loanId}`),
                { userId: currentUser.uid },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onSelect();
            toast('All transactions synced successfully', { type: 'success' });
            onClose();
        } catch (error) {
            setError('Failed to sync all transactions');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSelectedSync = async () => {
        if (selectedTransactions.size === 0) {
            setError('Please select at least one transaction');
            return;
        }

        try {
            setIsSyncing(true);
            const token = await currentUser.getIdToken();

            for (const transactionId of selectedTransactions) {
                await axios.post(
                    getApiUrl(`/loan/link_transaction/${loanId}`),
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
            setError('Failed to sync selected transactions');
        } finally {
            setIsSyncing(false);
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

    if (!isOpen) return null;

    return (
        <Modal title="Sync Transactions" onClose={onClose}>
            <div className="transaction-modal">
                {loading && <p className="modal-loading">Loading transactions...</p>}
                {error && <p className="modal-error">{error}</p>}

                <div className="sync-all-section">
                    <button
                        onClick={handleSyncAll}
                        className="button-sync-all"
                        disabled={isSyncing || transactions.length === 0}
                    >
                        {isSyncing ? 'Syncing...' : 'Sync All Transactions'}
                    </button>
                </div>

                <div className="transaction-list-header">
                    <h3>Or Select Individual Transactions</h3>
                </div>

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
                        disabled={isSyncing}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSelectedSync}
                        className="button-link"
                        disabled={isSyncing || selectedTransactions.size === 0}
                    >
                        Sync Selected ({selectedTransactions.size})
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default TransactionSelectionModal;