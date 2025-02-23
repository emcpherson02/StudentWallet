import React, { useState } from 'react';
import axios from 'axios';
import Modal from './Modal';
import styles from '../styles/LandingPage.module.css';
import {getApiUrl} from "../utils/api";

const UpdateUserForm = ({ userId, currentUser, onUserUpdated, setMessage, onClose }) => {
    const [formData, setFormData] = useState({
        name: currentUser.displayName || '',
        email: currentUser.email || '',
        dob: currentUser.dob || '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const token = await currentUser.getIdToken();
            const response = await axios.put(
                getApiUrl(`/user/update_user/${userId}`),
                {
                    displayName: formData.name,
                    email: formData.email,
                    dob: formData.dob
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.status === 200) {
                setMessage('User details updated successfully!');
                onUserUpdated();
                onClose();
            }
        } catch (error) {
            console.error('Error updating user details:', error);
            setMessage(error.response?.data?.message || 'Failed to update user details.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <Modal title="Update User Details" onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter your name"
                        className="form-control"
                    />
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter your email"
                        className="form-control"
                    />
                </div>

                <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                        required
                        className="form-control"
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
                        Update Details
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default UpdateUserForm;