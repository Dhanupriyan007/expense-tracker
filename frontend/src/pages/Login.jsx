import React, { useEffect, useState } from 'react';
import { signInWithGoogle } from '../firebase';
import { API_BASE_URL } from '../config';

function Login({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`).catch(() => {});
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setWakingUp(false);
    setErrorMsg('');

    const wakeTimer = setTimeout(() => setWakingUp(true), 2000);

    try {
      const { user, idToken } = await signInWithGoogle();
      
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: idToken,
          google_id: user.uid,
          name: user.displayName,
          email: user.email,
          profile_image: user.photoURL
        })
      });

      const data = await response.json();
      if (response.ok && data.user) {
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.error || "Authentication failed on backend server.");
      }
    } catch (error) {
      console.error("Google Authentication error:", error);
      setErrorMsg(error.message || "Failed to sign in with Google.");
    } finally {
      clearTimeout(wakeTimer);
      setLoading(false);
      setWakingUp(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setWakingUp(false);
    setErrorMsg('');

    const wakeTimer = setTimeout(() => setWakingUp(true), 1800);

    try {
      let guestId = localStorage.getItem('guest_session_id');
      if (!guestId) {
        guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        localStorage.setItem('guest_session_id', guestId);
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_guest: true,
          google_id: guestId,
          name: `Guest (${guestId.slice(-4)})`,
          email: `${guestId}@student.local`,
          profile_image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestId}`
        })
      });

      const data = await response.json();
      if (response.ok && data.user) {
        onLoginSuccess(data.user);
      } else {
        setErrorMsg(data.error || "Failed to start guest session.");
      }
    } catch (error) {
      console.error("Guest Sign-In error:", error);
      setErrorMsg("Failed to connect to backend server.");
    } finally {
      clearTimeout(wakeTimer);
      setLoading(false);
      setWakingUp(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100/80 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 text-center space-y-6">
        <div>
          <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Student Edition
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">Expense Tracker</h1>
          <p className="text-slate-500 text-sm mt-1">Smart, minimal budget management for students</p>
        </div>

        {wakingUp && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs rounded-xl font-medium text-left">
            Waking up server host... Please wait a moment.
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl text-left">
            {errorMsg}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300/80 rounded-xl px-4 py-3 text-slate-700 font-semibold hover:bg-slate-50 transition shadow-xs disabled:opacity-50 text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {loading ? 'Authenticating...' : 'Sign in with Google'}
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 uppercase">or</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            onClick={handleGuestSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-3 font-semibold transition shadow-sm disabled:opacity-50 text-sm"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
