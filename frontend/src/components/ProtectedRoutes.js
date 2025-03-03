// components/ProtectedRoute.js
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
    const { currentUser } = useAuth();
    const token = sessionStorage.getItem('token');
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser && !token) {
            navigate('/login');
        }
    }, [currentUser, token, navigate]);

    return children;
};

export default ProtectedRoute;
