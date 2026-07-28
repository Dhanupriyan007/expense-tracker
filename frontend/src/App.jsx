import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import ExpenseForm from './pages/ExpenseForm';
import Budgets from './pages/Budgets';
import BudgetForm from './pages/BudgetForm';
import SplitBill from './pages/SplitBill';
import Settings from './pages/Settings';
import { logoutUser } from './firebase';

function Sidebar({ user, onLogout }) {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Expenses', path: '/expenses' },
    { label: 'Budgets', path: '/budgets' },
    { label: 'Split Bill', path: '/split' },
    { label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 flex-shrink-0">
      <div className="p-6 space-y-8">
        {/* Brand */}
        <Link to="/dashboard" className="block">
          <span className="text-xl font-extrabold text-white tracking-tight">
            Expense Tracker
          </span>
        </Link>

        {/* Sidebar Nav Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Logout at Bottom */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center space-x-3 mb-3">
          <img
            src={user.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'user'}`}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-full object-cover border border-slate-700"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-200 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg font-semibold transition border border-slate-700"
        >
          Logout
        </button>
      </div>
    </aside>
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
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <Sidebar user={user} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="px-8 py-5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex justify-between items-center sticky top-0 z-10">
            <div>
              <h1 className="text-lg font-bold text-slate-100">Welcome back, {user.name}</h1>
            </div>
            <div className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              Account: {user.google_id || user.id}
            </div>
          </header>

          <main className="p-8 flex-1 max-w-6xl w-full mx-auto">
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
              <Route path="/settings" element={<Settings user={user} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
