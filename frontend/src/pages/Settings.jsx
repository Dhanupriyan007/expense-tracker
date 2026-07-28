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
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account preferences</p>
      </div>

      {savedMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm rounded-lg">
          {savedMsg}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <h2 className="text-base font-semibold text-slate-200 border-b border-slate-800 pb-3">User Profile</h2>

        <div className="flex items-center space-x-4">
          <img
            src={user.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'user'}`}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-full border border-slate-700 object-cover"
          />
          <div>
            <h3 className="font-bold text-slate-100 text-lg">{user.name}</h3>
            <p className="text-sm text-slate-400">{user.email}</p>
            <span className="inline-block mt-1 text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded">
              ID: {user.google_id || user.id}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-slate-800">
          <h2 className="text-base font-semibold text-slate-200">Preferences</h2>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Currency Symbol</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="$">USD ($)</option>
              <option value="₹">INR (₹)</option>
              <option value="€">EUR (€)</option>
              <option value="£">GBP (£)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Default Payment Method</label>
            <select
              value={defaultPayment}
              onChange={(e) => setDefaultPayment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition shadow-sm"
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
