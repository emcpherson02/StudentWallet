import React, { useState } from 'react';
import axios from 'axios';
import Modal from './Modal';

const TransactionForm = ({ userId, onTransactionAdded, setMessage, onClose }) => {
    const [formData, setFormData] = useState({
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        description: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3001/transactions/add_transaction', {
                userId,
                amount: parseFloat(formData.amount),
                date: formData.date,
                description: formData.description
            });

            if (response.status === 200) {
                setMessage('Transaction added successfully!');
                onTransactionAdded();
                onClose();
            }
        } catch (error) {
            console.error('Error creating transaction:', error);
            setMessage('Failed to create transaction.');
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