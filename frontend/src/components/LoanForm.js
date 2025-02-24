import React, { useState } from 'react';
import axios from 'axios';
import Modal from './Modal';
import { useAuth } from '../utils/AuthContext';
import {getApiUrl} from "../utils/api";
import {toast} from "react-toastify";

const LoanForm = ({ userId, onLoanAdded, setMessage, onClose }) => {
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        instalmentDates: ['', '', ''],
        instalmentAmounts: [0, 0, 0],
        livingOption: 'home',
        totalAmount: 0
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = await currentUser.getIdToken(true);
            const response = await axios.post(
                getApiUrl('/loan/add_loan'),
                {
                    userId,
                    instalmentDates: formData.instalmentDates,
                    instalmentAmounts: formData.instalmentAmounts.map(Number),
                    livingOption: formData.livingOption,
                    totalAmount: Number(formData.totalAmount)
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 201) {
                onLoanAdded();
                toast('Loan added successfully', { type: 'success' });
                onClose();
            }
        } catch (error) {
            console.error('Error:', error.response || error);
            setMessage(error.response?.data?.message || 'Failed to create loan');
        }
    };

    const handleInstallmentChange = (index, field, value) => {
        const newData = { ...formData };
        if (field === 'dates') {
            newData.instalmentDates[index] = value;
        } else {
            newData.instalmentAmounts[index] = value;
            newData.totalAmount = newData.instalmentAmounts.reduce((a, b) => Number(a) + Number(b), 0);
        }
        setFormData(newData);
    };

    return (
        <Modal title="Loan Details" onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Living Option</label>
                    <select
                        name="livingOption"
                        value={formData.livingOption}
                        onChange={(e) => setFormData({...formData, livingOption: e.target.value})}
                        required
                    >
                        <option value="home">Living at Home</option>
                        <option value="away">Living Away</option>
                    </select>
                </div>

                {[0, 1, 2].map((index) => (
                    <div key={index} className="form-group">
                        <h4>Installment {index + 1}</h4>
                        <label>Date</label>
                        <input
                            type="date"
                            value={formData.instalmentDates[index]}
                            onChange={(e) => handleInstallmentChange(index, 'dates', e.target.value)}
                            required
                        />
                        <label>Amount (£)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.instalmentAmounts[index]}
                            onChange={(e) => handleInstallmentChange(index, 'amounts', e.target.value)}
                            required
                            placeholder="0.00"
                        />
                    </div>
                ))}

                <div className="form-group">
                    <label>Total Amount (£)</label>
                    <input
                        type="number"
                        value={formData.totalAmount}
                        disabled
                        className="disabled-input"
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
                        Add Loan
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default LoanForm;