import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { loginUser } from '../../utils/authService';
import { jest, describe, beforeEach,test,expect } from '@jest/globals';

jest.mock('../../utils/authService'); // Mock the loginUser function

describe('Login Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders Login component with form fields', () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        expect(screen.getByLabelText(/Email:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password:/i)).toBeInTheDocument();
    });

    test('successful login shows success message', async () => {
        // Mock successful login
        loginUser.mockResolvedValueOnce({ uid: 'test-uid' });

        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByLabelText(/Email:/i), { target: { value: 'test4@example.com' } });
        fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'Password1' } });
        fireEvent.click(screen.getByRole('button', { name: 'Login' }));


        const successMessage = await screen.findByText(/Login successful!/i);
        expect(successMessage).toBeInTheDocument();
    });

    test('failed login shows error message for user not found', async () => {
        // Mock failed login
        loginUser.mockRejectedValueOnce({
            code: 'auth/user-not-found',
            message: 'User not found',
        });

        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByLabelText(/Email:/i), { target: { value: 'nonexistent@example.com' } });
        fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'password' } });
        fireEvent.click(screen.getByRole('button', { name: 'Login' }));

        const errorMessage = await screen.findByText(/User not found/i);
        expect(errorMessage).toBeInTheDocument();
    });

    test('failed login shows error message for wrong password', async () => {
        loginUser.mockRejectedValueOnce({
            code: 'auth/wrong-password',
            message: 'Incorrect password',
        });

        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByLabelText(/Email:/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'wrongpassword' } });
        fireEvent.click(screen.getByRole('button', { name: 'Login' }));

        const errorMessage = await screen.findByText(/Incorrect password/i);
        expect(errorMessage).toBeInTheDocument();
    });
});
