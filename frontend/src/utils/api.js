import axios from 'axios';

// Read base URL from environment variable with fallback
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Helper function to create full URLs - this makes it easy to change the base URL in one place
export const getApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

const api = axios.create({
    baseURL: 'http://localhost:3001',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to request headers
/**
 * Adds the user's token to the request headers.
 */
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const registerUser = async (name, dob, email, password) => {
    try {
        const response = await api.post('/register', { name, dob, email, password });
        return response.data;
    } catch (error) {
        throw error;
    }
};