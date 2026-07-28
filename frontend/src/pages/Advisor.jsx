import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

function Advisor({ user }) {
  const [data, setData] = useState({
    health_score: 80,
    badge: 'Smart Student Saver 🎓',
    total_expenses: 0,
    total_budget: 0,
    recommendations: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdvisorData();
  }, [user]);

  const fetchAdvisorData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/advisor?user_id=${user.id}`);
      const result = await res.json();
      setData(result);
    } catch (e) {
      console.error("Error fetching advisor data:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Calculating financial health score...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">🤖 AI Student Financial Health Advisor</h1>
        <p className="text-gray-600 text-sm mt-1">
          Smart, personalized budget recommendations designed specifically for college students.
        </p>
      </div>

      {/* Financial Health Score Hero Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-2">
          <span className="bg-blue-500/30 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Student Health Benchmark
          </span>
          <h2 className="text-3xl font-extrabold">{data.badge}</h2>
          <p className="text-blue-100 text-sm max-w-md">
            Based on your ratio of total expenses (${data.total_expenses.toFixed(2)}) against total budget (${data.total_budget.toFixed(2)}).
          </p>
        </div>

        {/* Score Ring */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-center min-w-[140px]">
          <span className="text-5xl font-black">{data.health_score}</span>
          <span className="text-xs block text-blue-200 uppercase font-semibold mt-1">out of 100</span>
        </div>
      </div>

      {/* Personalized AI Recommendations */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Smart Financial Tips & Savings Advice</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recommendations.map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-2">
              <div className="text-3xl">{item.icon}</div>
              <h3 className="font-bold text-gray-800 text-base">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{item.advice}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Student Rules of Thumb */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-sm text-blue-900 space-y-2">
        <h3 className="font-bold text-base text-blue-950">💡 College Student 50/30/20 Rule:</h3>
        <ul className="list-disc list-inside space-y-1 text-blue-800">
          <li><strong>50% Needs</strong>: Hostel Rent, College Tuition, Bus Pass, Basic Meals.</li>
          <li><strong>30% Wants</strong>: Snacks, Outings, Gaming, Shopping, Movies.</li>
          <li><strong>20% Savings</strong>: Emergency fund, textbook purchases, future trip savings.</li>
        </ul>
      </div>
    </div>
  );
}

export default Advisor;
