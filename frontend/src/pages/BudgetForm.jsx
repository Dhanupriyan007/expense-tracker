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
    return <div className="p-8 text-center text-gray-500">Loading budget details...</div>;
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditing ? 'Edit Category Budget' : 'Add Category Budget'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={categoryOption}
            onChange={(e) => setCategoryOption(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                placeholder="Enter custom category name..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Budget Limit ($)</label>
          <input
            type="number"
            step="0.01"
            required
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/budgets')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            {isEditing ? 'Save Changes' : 'Add Budget'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BudgetForm;
