import axios from 'axios';

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