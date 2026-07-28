import React, { useState } from 'react';

function Settings({ user }) {
  const [currency, setCurrency] = useState('$');
  const [defaultPayment, setDefaultPayment] = useState('UPI');
  const [savedMsg, setSavedMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('pref_currency', currency);
    localStorage.setItem('pref_payment', defaultPayment);
    setSavedMsg('Settings saved successfully.');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account preferences</p>
      </div>

      {savedMsg && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
          {savedMsg}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 border-b border-gray-200 pb-3">User Profile</h2>

        <div className="flex items-center space-x-4">
          <img
            src={user.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'user'}`}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-full border border-gray-300 object-cover"
          />
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="inline-block mt-1 text-xs bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded font-medium">
              ID: {user.google_id || user.id}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">Preferences</h2>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Currency Symbol</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="$">USD ($)</option>
              <option value="₹">INR (₹)</option>
              <option value="€">EUR (€)</option>
              <option value="£">GBP (£)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Default Payment Method</label>
            <select
              value={defaultPayment}
              onChange={(e) => setDefaultPayment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="UPI">UPI</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition shadow-xs"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Settings;
