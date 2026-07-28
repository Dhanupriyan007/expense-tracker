import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

function Budgets({ user }) {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBudgets();
  }, [user]);

  const fetchBudgets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budgets?user_id=${user.id}`);
      const data = await response.json();
      setBudgets(data);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) return;

    try {
      await fetch(`${API_BASE_URL}/api/budgets/${id}`, {
        method: 'DELETE'
      });
      setBudgets(budgets.filter(b => b.id !== id));
    } catch (error) {
      alert("Failed to delete budget");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading budgets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Category Budgets</h1>
          <p className="text-sm text-slate-400">Set and monitor spending limits per category</p>
        </div>
        <button
          onClick={() => navigate('/budgets/add')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-sm transition"
        >
          + Add Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.length === 0 ? (
          <p className="text-slate-500 py-6 col-span-2 text-center text-sm">No category budgets set yet.</p>
        ) : (
          budgets.map((item) => {
            const spent = Number(item.spent || 0);
            const limit = Number(item.budget || 0);
            const percentage = item.percentage || (limit > 0 ? (spent / limit) * 100 : 0);
            const isExceeded = spent >= limit;
            const isWarning = percentage >= 80 && !isExceeded;

            return (
              <div
                key={item.id}
                className={`bg-slate-900 p-6 rounded-xl border ${
                  isExceeded
                    ? 'border-rose-800 bg-rose-950/20'
                    : isWarning
                    ? 'border-amber-800 bg-amber-950/20'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Category</span>
                    <h3 className="text-xl font-bold text-slate-100">{item.category}</h3>
                  </div>

                  <div>
                    {isExceeded && (
                      <span className="bg-rose-950 text-rose-300 border border-rose-800 text-xs font-bold px-2.5 py-1 rounded">
                        EXCEEDED ({percentage.toFixed(0)}%)
                      </span>
                    )}
                    {isWarning && (
                      <span className="bg-amber-950 text-amber-300 border border-amber-800 text-xs font-bold px-2.5 py-1 rounded">
                        WARNING ({percentage.toFixed(0)}%)
                      </span>
                    )}
                    {!isExceeded && !isWarning && (
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold px-2.5 py-1 rounded">
                        OK ({percentage.toFixed(0)}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-950 rounded-full h-2.5 mb-3 overflow-hidden border border-slate-800">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>Spent: <strong className="text-slate-100">${spent.toFixed(2)}</strong></span>
                  <span>Budget: <strong className="text-slate-100">${limit.toFixed(2)}</strong></span>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800 mt-4">
                  <button
                    onClick={() => navigate(`/budgets/edit/${item.id}`)}
                    className="text-indigo-400 hover:text-indigo-300 font-medium text-xs bg-indigo-950/60 border border-indigo-800 px-3 py-1.5 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-rose-400 hover:text-rose-300 font-medium text-xs bg-rose-950/60 border border-rose-800 px-3 py-1.5 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Budgets;
