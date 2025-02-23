import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../utils/AuthContext';
import { TRANSACTION_CATEGORIES } from '../utils/constants';
import styles from '../styles/CategoryManagement.module.css';
import {getApiUrl} from "../utils/api";

const CategoryManagement = () => {
    const { currentUser } = useAuth();
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });
    const [loading, setLoading] = useState(true);

    const defaultCategories = Object.values(TRANSACTION_CATEGORIES);

    useEffect(() => {
        fetchCategories();
    }, [currentUser]);

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
            setCategories(response.data.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setMessage({ type: 'error', content: 'Failed to load categories' });
            setLoading(false);
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
            setNewCategory('');
            setIsAdding(false);
            setMessage({ type: 'success', content: 'Category added successfully' });

            // Clear success message after 3 seconds
            setTimeout(() => setMessage({ type: '', content: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', content: 'Failed to add category' });
        }
    };

    const handleDeleteCategory = async (category) => {
        try {
            const token = await currentUser.getIdToken();
            await axios.delete(
                getApiUrl(`/user/categories/${category}`),
                {
                    data: { userId: currentUser.uid },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setCategories(prev => prev.filter(c => c !== category));
            setMessage({ type: 'success', content: 'Category deleted successfully' });

            // Clear success message after 3 seconds
            setTimeout(() => setMessage({ type: '', content: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', content: 'Failed to delete category' });
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading categories...</div>;
    }

    return (
        <div className={styles.categorySection}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Custom Categories</h2>
                <button
                    onClick={() => setIsAdding(true)}
                    className={styles.addButton}
                >
                    <Plus size={20} />
                    <span>Add Category</span>
                </button>
            </div>

            {message.content && (
                <div className={`${styles.alert} ${
                    message.type === 'error' ? styles.alertError : styles.alertSuccess
                }`}>
                    <strong className={styles.alertTitle}>
                        {message.type === 'error' ? 'Error' : 'Success'}:
                    </strong>
                    <span>{message.content}</span>
                </div>
            )}

            {isAdding && (
                <div className={styles.addForm}>
                    <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Enter category name"
                    />
                    <button
                        onClick={handleAddCategory}
                        className={styles.addButton}
                    >
                        Add
                    </button>
                    <button
                        onClick={() => {
                            setIsAdding(false);
                            setNewCategory('');
                        }}
                        className={styles.cancelButton}
                    >
                        Cancel
                    </button>
                </div>
            )}

            <div className={styles.categoryGroup}>
                <h3 className={styles.categoryGroupTitle}>Default Categories</h3>
                <div className={styles.categoryGrid}>
                    {defaultCategories.map((category) => (
                        <div key={category} className={styles.categoryItem}>
                            <span className={styles.categoryName}>{category}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.categoryGroup}>
                <h3 className={styles.categoryGroupTitle}>Custom Categories</h3>
                {categories.length === 0 ? (
                    <p className={styles.emptyMessage}>No custom categories added yet</p>
                ) : (
                    <div className={styles.categoryGrid}>
                        {categories.map((category) => (
                            <div key={category} className={styles.categoryItem}>
                                <span className={styles.categoryName}>{category}</span>
                                <button
                                    onClick={() => handleDeleteCategory(category)}
                                    className={styles.deleteButton}
                                    title="Delete category"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryManagement;