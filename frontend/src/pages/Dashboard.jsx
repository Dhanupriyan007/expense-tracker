import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

function Dashboard({ user }) {
  const [data, setData] = useState({
    total_expenses: 0,
    total_budget: 0,
    remaining_budget: 0,
    daily_allowance: 0,
    recent_expenses: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);

  const [quickText, setQuickText] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard?user_id=${user.id}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickText.trim()) return;

    setQuickLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses/quick-add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          text: quickText
        })
      });

      if (res.ok) {
        setQuickText('');
        fetchDashboardData();
      } else {
        alert("Failed to parse quick expense.");
      }
    } catch (err) {
      alert("Error adding quick expense.");
    } finally {
      setQuickLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome, {user.name}</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Student ID: {user.google_id || user.id}</p>
        </div>

        <div className="bg-indigo-50/80 border border-indigo-100 px-4 py-2 rounded-xl text-sm text-indigo-900 flex items-center gap-2 font-medium">
          <span className="text-slate-600">Daily Safe Allowance:</span>
          <strong className="text-indigo-600 text-base font-bold">${data.daily_allowance.toFixed(2)} / day</strong>
        </div>
      </div>

      {data.alerts && data.alerts.length > 0 && (
        <div className="space-y-3">
          {data.alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border text-sm font-medium ${
                alert.type === 'exceeded'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-900 p-6 rounded-2xl shadow-sm text-white space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Quick Text Expense Entry
        </h2>
        <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder='e.g. "Spent 15 on lunch via UPI" or "Bought textbook 45 debit card"'
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <button
            type="submit"
            disabled={quickLoading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm shadow-sm disabled:opacity-50"
          >
            {quickLoading ? 'Parsing...' : 'Auto-Add'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Expenses</p>
          <p className="text-3xl font-extrabold text-rose-600 mt-2 tracking-tight">${data.total_expenses.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Budget</p>
          <p className="text-3xl font-extrabold text-indigo-600 mt-2 tracking-tight">${data.total_budget.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Remaining Budget</p>
          <p className={`text-3xl font-extrabold mt-2 tracking-tight ${data.remaining_budget >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ${data.remaining_budget.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Recent Expenses</h2>
        {data.recent_expenses.length === 0 ? (
          <p className="text-slate-500 py-4 text-sm text-center">No recent expenses found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {data.recent_expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-semibold text-slate-800">{expense.description}</td>
                    <td className="py-3 px-4 text-slate-600">{expense.category}</td>
                    <td className="py-3 px-4 text-slate-600">{expense.payment_method}</td>
                    <td className="py-3 px-4 text-slate-500">{expense.expense_date}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      -${Number(expense.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
