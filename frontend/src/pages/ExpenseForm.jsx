import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const PRESET_DESCRIPTIONS = [
  "College Fees",
  "Hostel / Rent",
  "Groceries",
  "Snacks & Coffee",
  "Books & Stationery",
  "Transport / Fuel",
  "Entertainment",
  "Others"
];

const PRESET_CATEGORIES = [
  "Food",
  "Education",
  "Transport",
  "Rent & Bills",
  "Entertainment",
  "Shopping",
  "Others"
];

function ExpenseForm({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [descOption, setDescOption] = useState('Snacks & Coffee');
  const [customDesc, setCustomDesc] = useState('');
  
  const [categoryOption, setCategoryOption] = useState('Food');
  const [customCategory, setCustomCategory] = useState('');

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    fetchBudgets();
    if (isEditing) {
      fetchExpense();
    }
  }, [id]);

  const fetchBudgets = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/budgets?user_id=${user.id}`);
      const data = await res.json();
      setBudgets(data);
    } catch (e) {
      console.error("Error loading budgets for check:", e);
    }
  };

  const fetchExpense = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses/${id}`);
      const data = await response.json();
      if (response.ok) {
        if (PRESET_DESCRIPTIONS.includes(data.description)) {
          setDescOption(data.description);
        } else {
          setDescOption('Others');
          setCustomDesc(data.description || '');
        }

        if (PRESET_CATEGORIES.includes(data.category)) {
          setCategoryOption(data.category);
        } else {
          setCategoryOption('Others');
          setCustomCategory(data.category || '');
        }

        setAmount(data.amount || '');
        setPaymentMethod(data.payment_method || 'UPI');
        setExpenseDate(data.expense_date || new Date().toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error("Error fetching expense:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalDescription = descOption === 'Others' ? customDesc.trim() : descOption;
    const finalCategory = categoryOption === 'Others' ? customCategory.trim() : categoryOption;

    if (!finalDescription) {
      alert("Please enter a description for your expense.");
      return;
    }

    if (!finalCategory) {
      alert("Please enter or select a category.");
      return;
    }

    const matchedBudget = budgets.find(b => b.category.toLowerCase() === finalCategory.toLowerCase());
    if (matchedBudget) {
      const currentSpent = Number(matchedBudget.spent || 0);
      const newAmount = Number(amount || 0);
      const totalNewSpent = currentSpent + newAmount;
      const budgetLimit = Number(matchedBudget.budget || 0);
      
      if (budgetLimit > 0) {
        const newPercentage = (totalNewSpent / budgetLimit) * 100;
        if (totalNewSpent >= budgetLimit) {
          alert(`BUDGET EXCEEDED ALERT!\n\nThis expense brings your "${finalCategory}" spending to $${totalNewSpent.toFixed(2)}, exceeding your budget limit of $${budgetLimit.toFixed(2)}.`);
        } else if (newPercentage >= 80) {
          alert(`BUDGET WARNING!\n\nThis expense brings your "${finalCategory}" budget to ${newPercentage.toFixed(1)}% ($${totalNewSpent.toFixed(2)} spent of $${budgetLimit.toFixed(2)} limit).`);
        }
      }
    }

    const url = isEditing
      ? `${API_BASE_URL}/api/expenses/${id}`
      : `${API_BASE_URL}/api/expenses`;

    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          description: finalDescription,
          category: finalCategory,
          amount: parseFloat(amount),
          payment_method: paymentMethod,
          expense_date: expenseDate
        })
      });

      if (response.ok) {
        navigate('/expenses');
      } else {
        alert("Failed to save expense");
      }
    } catch (error) {
      alert("Error saving expense");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading expense details...</div>;
  }

  return (
    <div className="max-w-lg mx-auto bg-slate-900 p-8 rounded-xl border border-slate-800 space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">
        {isEditing ? 'Edit Expense' : 'Add New Expense'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description</label>
          <select
            value={descOption}
            onChange={(e) => setDescOption(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {PRESET_DESCRIPTIONS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          {descOption === 'Others' && (
            <div className="mt-2">
              <input
                type="text"
                required
                placeholder="Enter custom description..."
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Category</label>
          <select
            value={categoryOption}
            onChange={(e) => setCategoryOption(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {PRESET_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {categoryOption === 'Others' && (
            <div className="mt-2">
              <input
                type="text"
                required
                placeholder="Enter custom category..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Amount ($)</label>
          <input
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="UPI">UPI</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Net Banking">Net Banking</option>
            <option value="Cash">Cash</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Date</label>
          <input
            type="date"
            required
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/expenses')}
            className="px-4 py-2 border border-slate-800 text-slate-300 rounded-lg hover:bg-slate-800 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-sm transition"
          >
            {isEditing ? 'Save Changes' : 'Add Expense'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ExpenseForm;
