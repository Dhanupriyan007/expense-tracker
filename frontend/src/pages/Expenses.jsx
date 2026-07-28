import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

function Expenses({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses?user_id=${user.id}`);
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;

    try {
      await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
        method: 'DELETE'
      });
      setExpenses(expenses.filter(e => e.id !== id));
    } catch (error) {
      alert("Failed to delete expense");
    }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      alert("No expenses recorded yet to export.");
      return;
    }

    const headers = ["ID", "Description", "Category", "Payment Method", "Date", "Amount ($)"];
    const rows = expenses.map(e => [
      e.id,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${(e.category || '').replace(/"/g, '""')}"`,
      `"${(e.payment_method || '').replace(/"/g, '""')}"`,
      e.expense_date,
      Number(e.amount).toFixed(2)
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `student_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading expenses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Expenses</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleExportCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-1.5"
          >
            Export CSV
          </button>
          <button
            onClick={() => navigate('/expenses/add')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition"
          >
            + Add Expense
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {expenses.length === 0 ? (
          <p className="text-gray-500 p-6 text-center">No expenses recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{expense.description}</td>
                    <td className="py-3 px-4 text-gray-600">{expense.category}</td>
                    <td className="py-3 px-4 text-gray-600">{expense.payment_method}</td>
                    <td className="py-3 px-4 text-gray-500">{expense.expense_date}</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      ${Number(expense.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center space-x-2">
                      <button
                        onClick={() => navigate(`/expenses/edit/${expense.id}`)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-2.5 py-1 rounded bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-800 font-medium text-xs border border-red-200 px-2.5 py-1 rounded bg-red-50"
                      >
                        Delete
                      </button>
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

export default Expenses;
