import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import ExpenseForm from './pages/ExpenseForm';
import Budgets from './pages/Budgets';
import BudgetForm from './pages/BudgetForm';
import SplitBill from './pages/SplitBill';
import { logoutUser } from './firebase';

function NavigationBar({ user, onLogout }) {
  const location = useLocation();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="text-xl font-bold text-gray-900">
            Expense Tracker
          </Link>
          <nav className="flex space-x-4 text-sm font-medium text-gray-600">
            <Link
              to="/dashboard"
              className={location.pathname === '/dashboard' ? 'text-blue-600 font-semibold' : 'hover:text-gray-900'}
            >
              Dashboard
            </Link>
            <Link
              to="/expenses"
              className={location.pathname === '/expenses' ? 'text-blue-600 font-semibold' : 'hover:text-gray-900'}
            >
              Expenses
            </Link>
            <Link
              to="/budgets"
              className={location.pathname === '/budgets' ? 'text-blue-600 font-semibold' : 'hover:text-gray-900'}
            >
              Budgets
            </Link>
            <Link
              to="/split"
              className={location.pathname === '/split' ? 'text-blue-600 font-semibold' : 'hover:text-gray-900'}
            >
              Split Bill
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <img
            src={user.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'user'}`}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full border border-gray-300 object-cover"
          />
          <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user.name}</span>
          <button
            onClick={onLogout}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded font-medium border border-gray-300"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function App() {
  const [user, setUser] = useState(null);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-800">
        <NavigationBar user={user} onLogout={handleLogout} />

        <main className="max-w-6xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/expenses" element={<Expenses user={user} />} />
            <Route path="/expenses/add" element={<ExpenseForm user={user} />} />
            <Route path="/expenses/edit/:id" element={<ExpenseForm user={user} />} />
            <Route path="/budgets" element={<Budgets user={user} />} />
            <Route path="/budgets/add" element={<BudgetForm user={user} />} />
            <Route path="/budgets/edit/:id" element={<BudgetForm user={user} />} />
            <Route path="/split" element={<SplitBill user={user} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
