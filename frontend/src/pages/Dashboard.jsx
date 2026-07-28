import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { API_BASE_URL } from '../config';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function Dashboard({ user }) {
  const [data, setData] = useState({
    total_expenses: 0,
    total_budget: 0,
    remaining_budget: 0,
    daily_allowance: 0,
    recent_expenses: [],
    alerts: []
  });
  const [budgetsList, setBudgetsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [quickText, setQuickText] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchBudgetsData();
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

  const fetchBudgetsData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/budgets?user_id=${user.id}`);
      const bData = await res.json();
      setBudgetsList(bData);
    } catch (e) {
      console.error("Error fetching budgets:", e);
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
        fetchBudgetsData();
      } else {
        alert("Failed to parse quick expense.");
      }
    } catch (err) {
      alert("Error adding quick expense.");
    } finally {
      setQuickLoading(false);
    }
  };

  // Prepare Chart Data
  const categoryChartData = (budgetsList || []).map(b => ({
    name: b.category,
    Spent: Number(b.spent || 0),
    Budget: Number(b.budget || 0)
  }));

  const pieChartData = categoryChartData.filter(c => c.Spent > 0);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Top Banner Stats */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Overview</h2>
          <p className="text-sm text-slate-400">Summary of your financial status</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-sm text-slate-300 flex items-center gap-2">
          <span>Daily Safe Allowance:</span>
          <strong className="text-emerald-400 text-base font-bold">${data.daily_allowance.toFixed(2)} / day</strong>
        </div>
      </div>

      {/* Budget Alerts */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border text-sm font-medium ${
                alert.type === 'exceeded'
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                  : 'bg-amber-950/60 border-amber-800 text-amber-300'
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Quick Add Bar */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-2">
        <label className="block text-xs font-semibold uppercase text-slate-400">Quick Add Expense</label>
        <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder='Type expense details, e.g. "Lunch 15 UPI" or "Books 45 Debit Card"'
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={quickLoading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition shadow-sm disabled:opacity-50"
          >
            {quickLoading ? 'Adding...' : 'Add Expense'}
          </button>
        </form>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</p>
          <p className="text-3xl font-extrabold text-rose-400 mt-2">${data.total_expenses.toFixed(2)}</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Budget</p>
          <p className="text-3xl font-extrabold text-indigo-400 mt-2">${data.total_budget.toFixed(2)}</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Remaining Budget</p>
          <p className={`text-3xl font-extrabold mt-2 ${data.remaining_budget >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${data.remaining_budget.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense vs Budget Comparison Bar Chart */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-200">Category Budget vs Spent Comparison</h3>
          <div className="h-64 w-full">
            {categoryChartData.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-20">No budget data for chart.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  />
                  <Bar dataKey="Budget" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Spent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Expense Distribution Pie Chart */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-200">Category Expense Distribution</h3>
          <div className="h-64 w-full">
            {pieChartData.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-20">No expenses recorded for pie chart.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="Spent"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Expenses Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h3 className="text-base font-bold text-slate-200 mb-4">Recent Expenses</h3>
        {data.recent_expenses.length === 0 ? (
          <p className="text-slate-500 py-4 text-sm">No recent expenses found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-950/50">
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {data.recent_expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-medium text-slate-200">{expense.description}</td>
                    <td className="py-3 px-4 text-slate-400">{expense.category}</td>
                    <td className="py-3 px-4 text-slate-400">{expense.payment_method}</td>
                    <td className="py-3 px-4 text-slate-500">{expense.expense_date}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400">
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
