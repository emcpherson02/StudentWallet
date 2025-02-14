import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../utils/AuthContext';

const CategoryDropdown = ({ value, onChange, className }) => {
    const { currentUser } = useAuth();
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [isAddingNew, setIsAddingNew] = useState(false);

    const defaultCategories = [
        'Groceries',
        'Utilities',
        'Entertainment',
        'Transportation',
        'Rent',
        'Other'
    ];

    useEffect(() => {
        const fetchCategories = async () => {
            if (!currentUser) return;

            try {
                const token = await currentUser.getIdToken();
                const response = await axios.get(
                    'http://localhost:3001/user/categories',
                    {
                        params: { userId: currentUser.uid },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                setCategories([...defaultCategories, ...response.data]);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, [currentUser]);

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
            onChange(newCategory.trim());
            setNewCategory('');
            setIsAddingNew(false);
        } catch (error) {
            console.error('Error adding category:', error);
        }
    };

    return (
        <div className="form-group">
            {!isAddingNew ? (
                <>
                    <select
                        value={value}
                        onChange={(e) => {
                            if (e.target.value === 'add_new') {
                                setIsAddingNew(true);
                            } else {
                                onChange(e.target.value);
                            }
                        }}
                        className={className}
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
                </>
            ) : (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Enter new category"
                        className="flex-1"
                    />
                    <button
                        type="button"
                        onClick={handleAddCategory}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        Add
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsAddingNew(false)}
                        className="px-4 py-2 bg-gray-200 rounded"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

export default CategoryDropdown;