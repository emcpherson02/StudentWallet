import { Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Register from "./components/Register";
import LandingPage from './components/LandingPage';
import BudgetDashboard from './components/BudgetDashboard';
import BudgetAnalytics from './components/budgetAnalytics';
import LoanDashboard from "./components/LoanDashboard";
import Tips from './components/Tips';
import TransactionDashboard from "./components/TransactionDashboard";
import PreferencesPage from './components/PreferencesPage';
import AboutUs from './components/AboutUs';
import ProtectedRoute from './components/ProtectedRoutes';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './utils/AuthContext';
import './styles/darkMode.css';
import { ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Navigate } from 'react-router-dom';
function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <div className="App">
                    <Routes>
                        {/* Public Routes - These should NOT be wrapped in ProtectedRoute */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/about-us" element={<AboutUs />} />

                        {/* Protected Routes */}
                        <Route
                            path="/plaid-link"
                            element={
                                <ProtectedRoute>
                                    <LandingPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <Home />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/budget-dashboard"
                            element={
                                <ProtectedRoute>
                                    <BudgetDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/budget-analytics"
                            element={
                                <ProtectedRoute>
                                    <BudgetAnalytics />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/loan-dashboard"
                            element={
                                <ProtectedRoute>
                                    <LoanDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/tips"
                            element={
                                <ProtectedRoute>
                                    <Tips />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/transaction-dashboard"
                            element={
                                <ProtectedRoute>
                                    <TransactionDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/preferences"
                            element={
                                <ProtectedRoute>
                                    <PreferencesPage />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                    <ToastContainer
                        position="top-right"
                        autoClose={3000}
                        hideProgressBar={false}
                        newestOnTop={false}
                        closeOnClick={false}
                        rtl={false}
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                        theme="light"
                        transition={Bounce}
                    />
                </div>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
