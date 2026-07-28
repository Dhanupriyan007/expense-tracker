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
    return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user.name}</h1>
        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded border border-gray-200">
          Daily Safe Allowance: <strong className="text-blue-600">${data.daily_allowance.toFixed(2)} / day</strong>
        </div>
      </div>

      {data.alerts && data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-3 rounded border text-sm ${
                alert.type === 'exceeded'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Basic Quick Add Box */}
      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-2">
        <label className="block text-sm font-semibold text-gray-700">Quick Add Expense</label>
        <form onSubmit={handleQuickAdd} className="flex gap-3">
          <input
            type="text"
            placeholder='Type expense details, e.g. "Lunch 15 UPI" or "Books 45 Debit Card"'
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={quickLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded text-sm transition disabled:opacity-50"
          >
            {quickLoading ? 'Adding...' : 'Add Expense'}
          </button>
        </form>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Expenses</p>
          <p className="text-3xl font-bold text-red-600 mt-2">${data.total_expenses.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Budget</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">${data.total_budget.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase">Remaining Budget</p>
          <p className={`text-3xl font-bold mt-2 ${data.remaining_budget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${data.remaining_budget.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Recent Expenses Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Expenses</h2>
        {data.recent_expenses.length === 0 ? (
          <p className="text-gray-500 py-4 text-sm">No recent expenses found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase bg-gray-50">
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Payment Method</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {data.recent_expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{expense.description}</td>
                    <td className="py-3 px-4 text-gray-600">{expense.category}</td>
                    <td className="py-3 px-4 text-gray-600">{expense.payment_method}</td>
                    <td className="py-3 px-4 text-gray-500">{expense.expense_date}</td>
                    <td className="py-3 px-4 text-right font-semibold text-red-600">
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
