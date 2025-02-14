import {Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Register from "./components/Register";
import PlaidLink from './components/PlaidLink';
import BudgetDashboard from './components/BudgetDashboard';
import BudgetAnalytics from './components/budgetAnalytics';
import LoanDashboard from "./components/LoanDashboard";
import Tips from './components/Tips';
import TransactionDashboard from "./components/TransactionDashboard";
import PreferencesPage from './components/PreferencesPage';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/darkMode.css';



function App() {
  return (
    <ThemeProvider>
      <div className="App">
          <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path={"/register"} element={<Register />} />
              <Route path="/plaid-link" element={<PlaidLink />} />
              <Route path={"/budget-dashboard"} element={<BudgetDashboard />} />
              <Route path={"/loan-dashboard"} element={<LoanDashboard />} />
              <Route path="/budget-analytics" element={<BudgetAnalytics />} />
              <Route path={"/tips"} element={<Tips />} />
              <Route path="/transaction-dashboard" element={<TransactionDashboard />} />
              <Route path="/preferences" element={<PreferencesPage />} />
              {/* Add other routes here */}
          </Routes>
      </div>
      </ThemeProvider>
  );
}


export default App;
