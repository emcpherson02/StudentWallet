import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { Mail, Trash2, Unlink, Link, Plus } from 'lucide-react';
import styles from '../styles/LoanDashboard.module.css';

const ButtonGroup = ({ setIsTransactionModalOpen, handleUnlinkTransactions, handleDeleteLoan }) => {
    return (
        <div className={styles.buttonGroup}>
            <button
                onClick={() => setIsTransactionModalOpen(true)}
                className={styles.actionButton}
            >
                <Link size={20} />
                <span>Sync Transactions</span>
            </button>

            <button
                onClick={handleUnlinkTransactions}
                className={styles.actionButton}
            >
                <Unlink size={20} />
                <span>Unlink Transactions</span>
            </button>

            <button
                onClick={handleDeleteLoan}
                className={`${styles.actionButton} ${styles.deleteButton}`}
            >
                <Trash2 size={20} />
                <span>Delete Loan</span>
            </button>
        </div>
    );
};

const AddLoanButton = ({ onClick }) => (
    <button
        onClick={onClick}
        className={styles.actionButton}
    >
        <Plus size={20} />
        <span>Add Loan</span>
    </button>
);

export { ButtonGroup, AddLoanButton };