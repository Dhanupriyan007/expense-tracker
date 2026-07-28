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
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between h-screen sticky top-0 flex-shrink-0">
      <div className="p-6 space-y-6">
        <Link to="/dashboard" className="block">
          <h1 className="text-xl font-bold text-gray-900">
            Expense Tracker
          </h1>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-2.5 rounded-md text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3 mb-3">
          <img
            src={user.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'user'}`}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-full object-cover border border-gray-300"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full text-xs bg-white hover:bg-gray-100 text-gray-700 py-2 rounded font-medium border border-gray-300 transition shadow-xs"
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
      <div className="flex min-h-screen bg-gray-100 text-gray-800">
        <Sidebar user={user} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="px-8 py-4 border-b border-gray-200 bg-white flex justify-between items-center sticky top-0 z-10">
            <h2 className="text-base font-bold text-gray-800">Welcome back, {user.name}</h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded border border-gray-200 font-medium">
              ID: {user.google_id || user.id}
            </span>
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
