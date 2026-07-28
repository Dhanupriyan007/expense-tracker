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

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <Link to="/dashboard" className="flex items-center space-x-2.5">
            <span className="bg-indigo-600 text-white font-black text-xs px-2.5 py-1 rounded-lg tracking-wider uppercase">
              ET
            </span>
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              ExpenseTracker
            </span>
          </Link>

          <nav className="hidden sm:flex items-center space-x-1 text-sm font-medium">
            <Link
              to="/dashboard"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isActive('/dashboard')
                  ? 'bg-slate-100 text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/expenses"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isActive('/expenses')
                  ? 'bg-slate-100 text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Expenses
            </Link>
            <Link
              to="/budgets"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isActive('/budgets')
                  ? 'bg-slate-100 text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Budgets
            </Link>
            <Link
              to="/split"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isActive('/split')
                  ? 'bg-slate-100 text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Split Bill
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full">
            <img
              src={user.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'user'}`}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover border border-slate-300"
            />
            <span className="text-xs font-semibold text-slate-700 hidden md:inline">
              {user.name}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition"
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
      <div className="min-h-screen bg-slate-50/60 text-slate-800 font-sans">
        <NavigationBar user={user} onLogout={handleLogout} />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
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
