import {Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Register from "./components/Register";
import PlaidLink from './components/PlaidLink';
import BudgetDashboard from './components/BudgetDashboard';
import LoanDashboard from "./components/LoanDashboard";
import Tips from './components/Tips';
import TransactionDashboard from "./components/TransactionDashboard";

function App() {
  return (
      <div className="App">
          <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path={"/register"} element={<Register />} />
              <Route path="/plaid-link" element={<PlaidLink />} />
              <Route path={"/budget-dashboard"} element={<BudgetDashboard />} />
              <Route path={"/loan-dashboard"} element={<LoanDashboard />} />
              <Route path={"/tips"} element={<Tips />} />
              <Route path="/transaction-dashboard" element={<TransactionDashboard />} />
              {/* Add other routes here */}
          </Routes>
      </div>
  );
}


export default App;
