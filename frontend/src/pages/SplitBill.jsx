import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

function SplitBill({ user }) {
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidBy, setPaidBy] = useState('You');
  const [membersText, setMembersText] = useState('Alex, Sam, You');

  useEffect(() => {
    fetchSplits();
  }, [user]);

  const fetchSplits = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/splits?user_id=${user.id}`);
      const data = await res.json();
      setSplits(data);
    } catch (e) {
      console.error("Error fetching splits:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSplit = async (e) => {
    e.preventDefault();
    if (!title || !totalAmount) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/splits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          title,
          total_amount: parseFloat(totalAmount),
          paid_by: paidBy,
          members: membersText
        })
      });

      if (res.ok) {
        setTitle('');
        setTotalAmount('');
        fetchSplits();
      }
    } catch (e) {
      alert("Error creating bill split");
    }
  };

  const handleSettle = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/splits/${id}/settle`, { method: 'PUT' });
      fetchSplits();
    } catch (e) {
      alert("Failed to settle bill");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading group bill splits...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">🤝 Roommate & Flat Bill Splitter</h1>
        <p className="text-gray-600 text-sm mt-1">
          Easily split hostel rent, WiFi bills, and group dining with flatmates without awkward math!
        </p>
      </div>

      {/* Add New Shared Bill Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">+ Add Shared Bill</h2>
        <form onSubmit={handleAddSplit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Bill Title</label>
            <input
              type="text"
              required
              placeholder="e.g. WiFi Bill, Rent, Pizza Night"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Total Bill Amount ($)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Paid By</label>
            <input
              type="text"
              required
              placeholder="e.g. You, Alex, Sam"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Split With (comma separated)</label>
            <input
              type="text"
              required
              placeholder="e.g. Alex, Sam, You"
              value={membersText}
              onChange={(e) => setMembersText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md shadow-sm transition"
            >
              Calculate & Save Split
            </button>
          </div>
        </form>
      </div>

      {/* Active Splits Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">Shared Bills & Balances</h2>
          <span className="text-xs text-gray-500 font-medium">{splits.length} bills tracked</span>
        </div>

        {splits.length === 0 ? (
          <p className="p-6 text-center text-gray-500">No shared bills tracked yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid By</th>
                  <th className="py-3 px-4">Group Members</th>
                  <th className="py-3 px-4">Your Share</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {splits.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{item.title}</td>
                    <td className="py-3 px-4 text-gray-900 font-semibold">${Number(item.total_amount).toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-600">{item.paid_by}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {Array.isArray(item.split_members) ? item.split_members.join(', ') : item.split_members}
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-600">${Number(item.your_share).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      {item.settled ? (
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded">
                          ✓ Settled
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSettle(item.id)}
                          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded transition"
                        >
                          Settle Up
                        </button>
                      )}
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

export default SplitBill;
