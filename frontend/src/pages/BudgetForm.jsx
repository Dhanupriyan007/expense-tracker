import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const PRESET_CATEGORIES = [
  "Food",
  "Education",
  "Transport",
  "Rent & Bills",
  "Entertainment",
  "Shopping",
  "Others"
];

function BudgetForm({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [categoryOption, setCategoryOption] = useState('Food');
  const [customCategory, setCustomCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      fetchBudget();
    }
  }, [id]);

  const fetchBudget = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budgets/${id}`);
      const data = await response.json();
      if (response.ok) {
        if (PRESET_CATEGORIES.includes(data.category)) {
          setCategoryOption(data.category);
        } else {
          setCategoryOption('Others');
          setCustomCategory(data.category || '');
        }
        setBudget(data.budget || '');
      }
    } catch (error) {
      console.error("Error fetching budget:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalCategory = categoryOption === 'Others' ? customCategory.trim() : categoryOption;

    if (!finalCategory) {
      alert("Please enter or select a category name.");
      return;
    }

    const url = isEditing
      ? `${API_BASE_URL}/api/budgets/${id}`
      : `${API_BASE_URL}/api/budgets`;

    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          category: finalCategory,
          budget: parseFloat(budget)
        })
      });

      if (response.ok) {
        navigate('/budgets');
      } else {
        alert("Failed to save budget");
      }
    } catch (error) {
      alert("Error saving budget");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading budget details...</div>;
  }

  return (
    <div className="max-w-md mx-auto bg-slate-900 p-8 rounded-xl border border-slate-800 space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">
        {isEditing ? 'Edit Category Budget' : 'Add Category Budget'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Budget Limit ($)</label>
          <input
            type="number"
            step="0.01"
            required
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/budgets')}
            className="px-4 py-2 border border-slate-800 text-slate-300 rounded-lg hover:bg-slate-800 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-sm transition"
          >
            {isEditing ? 'Save Changes' : 'Add Budget'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BudgetForm;
