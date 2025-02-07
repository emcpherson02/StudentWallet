import {Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Register from "./components/Register";
import PlaidLink from './components/PlaidLink';
import BudgetDashboard from './components/BudgetDashboard';
import PreferencesButton from './components/PreferencesButton';  // Make sure this matches your file name
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
              <Route path="/preferencesButton" element={<PreferencesButton />} />
              <Route path="/preferences" element={<PreferencesPage />} />
              {/* Add other routes here */}
          </Routes>
      </div>
      </ThemeProvider>
  );
}


export default App;
