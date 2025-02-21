import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';
import { useAuth } from '../utils/AuthContext';
import { TRANSACTION_CATEGORIES } from '../utils/constants';

const BudgetForm = ({ userId, onBudgetAdded, setMessage, onClose }) => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        category: '',
        amount: '',
        period: 'monthly',
        spent: 0,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10)
    });
    const [categories, setCategories] = useState([]);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    const defaultCategories = Object.values(TRANSACTION_CATEGORIES);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = await currentUser.getIdToken();
                const response = await axios.get(
                    'http://localhost:3001/user/categories',
                    {
                        params: { userId: currentUser.uid },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                // Extract custom categories from response data
                const customCategories = response.data.data || [];

                // Combine default and custom categories
                const allCategories = [...defaultCategories, ...customCategories];

                // Remove duplicates and set categories
                setCategories([...new Set(allCategories)]);
            } catch (error) {
                console.error('Error fetching categories:', error);
                setCategories(defaultCategories);
            }
        };

        fetchCategories();
    }, [currentUser, defaultCategories]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = await currentUser.getIdToken(true);
            const response = await axios.post(
                'http://localhost:3001/budget/add_budget',
                {
                    userId,
                    category: formData.category,
                    amount: parseFloat(formData.amount),
                    period: formData.period,
                    spent: formData.spent,
                    startDate: formData.startDate,
                    endDate: formData.endDate
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 201) {
                setMessage('Budget added successfully!');
                onBudgetAdded();
                onClose();
            }
        } catch (error) {
            console.error('Error:', error.response || error);
            setMessage(error.response?.data?.message || 'Failed to create budget');
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return;

        try {
            const token = await currentUser.getIdToken();
            await axios.post(
                'http://localhost:3001/user/categories/add',
                {
                    userId: currentUser.uid,
                    category: newCategory.trim()
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setCategories(prev => [...prev, newCategory.trim()]);
            setFormData(prev => ({ ...prev, category: newCategory.trim() }));
            setNewCategory('');
            setIsAddingCategory(false);
        } catch (error) {
            console.error('Error adding category:', error);
            setMessage('Failed to add category');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'category' && value === 'add_new') {
            setIsAddingCategory(true);
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Modal title="Budget Details" onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Category</label>
                    {!isAddingCategory ? (
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Category</option>
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                            <option value="add_new">+ Add New Category</option>
                        </select>
                    ) : (
                        <div className="new-category-input">
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="Enter new category"
                            />
                            <div className="button-group">
                                <button
                                    type="button"
                                    onClick={handleAddCategory}
                                    className="button primary-button"
                                >
                                    Add
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCategory(false)}
                                    className="button secondary-button"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
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