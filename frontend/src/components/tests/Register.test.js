// Register.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../Register';
import { registerUser } from '../../utils/authService';
import {jest, describe, beforeEach, test,expect,} from '@jest/globals';
jest.mock('../../utils/authService'); // Mock the auth service

describe('Register Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders Register component with form fields', () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        expect(screen.getByLabelText(/Name:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password:/i)).toBeInTheDocument();
    });

    test('successful registration shows success message', async () => {
        registerUser.mockResolvedValueOnce({ uid: 'test-uid' });

        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByLabelText(/Name:/i), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByLabelText(/Email:/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'password' } });
        fireEvent.click(screen.getByText(/Register/i));

        const successMessage = await screen.findByText(/Registration successful!/i);
        expect(successMessage).toBeInTheDocument();
    });

    test('failed registration shows error message', async () => {
        const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

        registerUser.mockRejectedValueOnce({
            code: 'auth/email-already-in-use',
            message: 'Email already in use',
        });

        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByLabelText(/Name:/i), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByLabelText(/Email:/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/Password:/i), { target: { value: 'password' } });
        fireEvent.click(screen.getByText(/Register/i));

        const errorMessage = await screen.findByText(/Email is already registered./i);
        expect(errorMessage).toBeInTheDocument();

        consoleErrorMock.mockRestore();  // Restore console.error after test
    });
});
