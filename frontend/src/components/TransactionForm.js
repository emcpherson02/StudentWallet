import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';
import { useAuth } from '../utils/AuthContext';
import { TRANSACTION_CATEGORIES } from '../utils/constants';
import { getApiUrl } from "../utils/api";
import { toast } from "react-toastify";

// List of common currencies for UK students
const CURRENCIES = [
    { code: 'GBP', symbol: '£', name: 'British Pound Sterling' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
];

const TransactionForm = ({ userId, onTransactionAdded, setMessage, onClose }) => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        description: '',
        category: '',
        type: 'manual',
        currency: 'GBP',
    });
    const [categories, setCategories] = useState([]);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [exchangeRates, setExchangeRates] = useState(null);
    const [loading, setLoading] = useState(false);
    const [convertedAmount, setConvertedAmount] = useState(null);

    const defaultCategories = Object.values(TRANSACTION_CATEGORIES);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = await currentUser.getIdToken();
                const response = await axios.get(
                    getApiUrl('/user/categories'),
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
        fetchExchangeRates();
    }, [currentUser]);

    // Fetch exchange rates from a free API
    const fetchExchangeRates = async () => {
        try {
            setLoading(true);
            // Using exchangerate-api.com's free endpoint (or you could use another service)
            const response = await axios.get('https://api.exchangerate-api.com/v4/latest/GBP');
            setExchangeRates(response.data.rates);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
            toast('Failed to fetch exchange rates. Using default GBP.', { type: 'warning' });
            setLoading(false);
        }
    };

    // Calculate conversion when amount or currency changes
    useEffect(() => {
        if (formData.amount && formData.currency !== 'GBP' && exchangeRates) {
            const rate = 1 / exchangeRates[formData.currency];
            const amount = parseFloat(formData.amount);
            const converted = amount * rate;
            setConvertedAmount(converted.toFixed(2));
        } else if (formData.currency === 'GBP' && formData.amount) {
            setConvertedAmount(parseFloat(formData.amount).toFixed(2));
        } else {
            setConvertedAmount(null);
        }
    }, [formData.amount, formData.currency, exchangeRates]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = await currentUser.getIdToken(true);

            // Use the converted amount if currency is not GBP
            let amountToSubmit;
            if (formData.currency !== 'GBP' && convertedAmount) {
                amountToSubmit = parseFloat(convertedAmount);
            } else {
                amountToSubmit = parseFloat(formData.amount);
            }

            // Add currency information to description if not GBP
            let enhancedDescription = formData.description;
            if (formData.currency !== 'GBP') {
                const currencyInfo = CURRENCIES.find(c => c.code === formData.currency);
                enhancedDescription = `${formData.description} (${currencyInfo.symbol}${formData.amount} ${formData.currency})`;
            }

            const response = await axios.post(
                getApiUrl('/transactions/add_transaction'),
                {
                    userId,
                    amount: amountToSubmit,
                    category: formData.category,
                    date: formData.date,
                    description: enhancedDescription,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                onTransactionAdded();
                onClose();
            }
        } catch (error) {
            console.error('Error:', error.response || error);
            toast('Failed to add transaction', { type: 'error' });
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return;

        try {
            const token = await currentUser.getIdToken();
            await axios.post(
                getApiUrl('/user/categories/add'),
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
            toast('Failed to add category', { type: 'error' });
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

    // Find current currency symbol
    const getCurrencySymbol = () => {
        const currency = CURRENCIES.find(c => c.code === formData.currency);
        return currency ? currency.symbol : '£';
    };

    return (
        <Modal title="Transaction Details" onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: '1' }}>
                            <label>Amount</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                    minWidth: '40px',
                                    textAlign: 'center',
                                    padding: '8px 0',
                                    backgroundColor: '#f3f4f6',
                                    border: '1px solid #e5e7eb',
                                    borderRight: 'none',
                                    borderRadius: '4px 0 0 4px'
                                }}>
                                    {getCurrencySymbol()}
                                </div>
                                <input
                                    type="number"
                                    name="amount"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    required
                                    placeholder="0.00"
                                    style={{
                                        flex: '1',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        borderRadius: '0 4px 4px 0'
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ flex: '1' }}>
                            <label>Currency</label>
                            <select
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                style={{ width: '100%', boxSizing: 'border-box', padding: '8px' }}
                            >
                                {CURRENCIES.map((currency) => (
                                    <option key={currency.code} value={currency.code}>
                                        {currency.code}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {formData.currency !== 'GBP' && convertedAmount && (
                        <div className="conversion-info" style={{
                            marginTop: '0.5rem',
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            padding: '0.5rem',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '0.375rem'
                        }}>
                            {loading ? (
                                <span>Converting...</span>
                            ) : (
                                <>
                                    Converted amount: <strong>£{convertedAmount}</strong>
                                    {exchangeRates && <> (Rate: 1 {formData.currency} = £{(1/(exchangeRates[formData.currency] || 1)).toFixed(4)})</>}
                                </>
                            )}
                        </div>
                    )}
                </div>

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