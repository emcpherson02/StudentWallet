import {Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Register from "./components/Register";
import PlaidLink from './components/PlaidLink';
import BudgetDashboard from './components/BudgetDashboard';

function App() {
  return (
      <div className="App">
          <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path={"/register"} element={<Register />} />
              <Route path="/plaid-link" element={<PlaidLink />} />
              <Route path={"/budget-dashboard"} element={<BudgetDashboard />} />
              {/* Add other routes here */}
          </Routes>
      </div>
  );
}


export default App;
