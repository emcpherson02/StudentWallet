import React, { useState } from 'react';
import axios from 'axios';
import Modal from './Modal';
import { useAuth } from '../utils/AuthContext';

const TransactionForm = ({ userId, onTransactionAdded, setMessage, onClose }) => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        description: '',
        type: 'manual'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = await currentUser.getIdToken(true);
            const response = await axios.post(
                'http://localhost:3001/transactions/add_transaction',
                {
                    userId,
                    amount: parseFloat(formData.amount),
                    category: formData.category,
                    date: formData.date,
                    description: formData.description,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                setMessage('Transaction added successfully!');
                onTransactionAdded();
                onClose();
            }
        } catch (error) {
            console.error('Error:', error.response || error);
            setMessage(error.response?.data?.message || 'Failed to create transaction');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <Modal title="Transaction Details" onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Amount (£)</label>
                    <input
                        type="number"
                        name="amount"
                        step="0.01"
                        value={formData.amount}
                        onChange={handleChange}
                        required
                        placeholder="0.00"
                    />
                </div>

                <div className="form-group">
                    <label>Category</label>
                    <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        placeholder="Enter Transaction Category"
                    />
                </div>

                <div className="form-group">
                    <label>Date</label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        placeholder="Enter transaction description"
                    />
                </div>

                <div className="button-group">
                    <button
                        type="button"
                        onClick={onClose}
                        className="button secondary-button"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="button primary-button"
                    >
                        Add Transaction
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default TransactionForm;