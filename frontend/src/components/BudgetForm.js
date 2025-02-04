import React, { useState } from 'react';
import axios from 'axios';
import Modal from './Modal';

const BudgetForm = ({ userId, onBudgetAdded, setMessage, onClose }) => {
    const [formData, setFormData] = useState({
        category: '',
        amount: '',
        period: 'monthly',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10)
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3001/budget/add_budget', {
                userId,
                category: formData.category,
                amount: parseFloat(formData.amount),
                period: formData.period,
                startDate: formData.startDate,
                endDate: formData.endDate
            });

            if (response.status === 201) {
                setMessage('Budget added successfully!');
                onBudgetAdded();
                onClose();
            }
        } catch (error) {
            console.error('Error creating budget:', error);
            setMessage('Failed to create budget.');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <Modal title="Budget Details" onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Category</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Category</option>
                        <option value="Groceries">Groceries</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

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
                    <label>Period</label>
                    <select
                        name="period"
                        value={formData.period}
                        onChange={handleChange}
                        required
                    >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Start Date</label>
                    <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>End Date</label>
                    <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        required
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
                        Create Budget
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default BudgetForm;