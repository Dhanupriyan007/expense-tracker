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
    return <div className="p-8 text-center text-gray-500">Loading budgets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Category Budgets</h1>
        <button
          onClick={() => navigate('/budgets/add')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition"
        >
          + Add Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.length === 0 ? (
          <p className="text-gray-500 py-6 col-span-2 text-center">No category budgets set yet.</p>
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
                className={`bg-white p-6 rounded-lg shadow-sm border ${
                  isExceeded
                    ? 'border-red-300 bg-red-50/20'
                    : isWarning
                    ? 'border-yellow-300 bg-yellow-50/20'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Category</span>
                    <h3 className="text-xl font-bold text-gray-800">{item.category}</h3>
                  </div>

                  {/* Alert Badges */}
                  <div>
                    {isExceeded && (
                      <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded border border-red-200">
                        🚨 EXCEEDED ({percentage.toFixed(0)}%)
                      </span>
                    )}
                    {isWarning && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded border border-yellow-200">
                        ⚠️ WARNING ({percentage.toFixed(0)}%)
                      </span>
                    )}
                    {!isExceeded && !isWarning && (
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded border border-green-200">
                        OK ({percentage.toFixed(0)}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Details */}
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Spent: <strong className="text-gray-900">${spent.toFixed(2)}</strong></span>
                  <span>Budget: <strong className="text-gray-900">${limit.toFixed(2)}</strong></span>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 mt-4">
                  <button
                    onClick={() => navigate(`/budgets/edit/${item.id}`)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-3 py-1.5 rounded bg-blue-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-800 font-medium text-xs border border-red-200 px-3 py-1.5 rounded bg-red-50"
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
