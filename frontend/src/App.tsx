import React, { useState, useEffect } from 'react';
import { authAPI } from './api';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { StudentPortal } from './components/StudentPortal';
import { AdminPortal } from './components/AdminPortal';
import { RecruiterPortal } from './components/RecruiterPortal';

export function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = sessionStorage.getItem('cq_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const me = await authAPI.getMe();
      setUser(me);
    } catch (err) {
      sessionStorage.removeItem('cq_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('cq_token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
            <span className="font-extrabold text-sm">CQ</span>
          </div>
          <p className="text-xs font-bold text-slate-500">Initializing CampusQuant AI Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans">
      {user && <Navbar user={user} onLogout={handleLogout} />}

      <main className="flex-1">
        {!user ? (
          <AuthModal onLoginSuccess={(u) => setUser(u)} />
        ) : (
          <>
            {user.role === 'student' && <StudentPortal user={user} />}
            {user.role === 'admin' && <AdminPortal />}
            {user.role === 'recruiter' && <RecruiterPortal user={user} />}
          </>
        )}
      </main>

      <footer className="py-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
          <p>© 2026 CampusQuant AI • Enterprise Talent Intelligence System</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
