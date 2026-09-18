import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Phone, ArrowRight, Shield } from 'lucide-react';

const LoginRegister = () => {
  const { login, register } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [showManagerModal, setShowManagerModal] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    address: '',
    ward_id: 'WARD-01'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const user = await login(formData.email, formData.password);
        if (user.user_type === 'officer') navigate('/officer');
        else if (user.user_type === 'admin') navigate('/admin');
        else if (user.user_type === 'commissioner') navigate('/commissioner');
        else navigate('/citizen');
      } else {
        await register(formData);
        navigate('/citizen');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Try demo credentials below.');
    }
  };

  const handleQuickDemoLogin = async (email, pwd) => {
    setFormData((prev) => ({ ...prev, email, password: pwd }));
    try {
      const user = await login(email, pwd);
      if (user.user_type === 'officer') navigate('/officer');
      else if (user.user_type === 'admin') navigate('/admin');
      else if (user.user_type === 'commissioner') navigate('/commissioner');
      else navigate('/citizen');
    } catch (err) {
      console.error(err);
    }
  };

  const demoManagers = [
    { name: 'Manager Abhi', email: 'abhi.manager@gvmc.gov.in', pwd: 'abhi123', ward: 'WARD-01', dept: 'Water Supply & Sanitation', icon: '💧' },
    { name: 'Manager Janu', email: 'janu.manager@gvmc.gov.in', pwd: 'janu123', ward: 'WARD-02', dept: 'Roads & Infrastructure', icon: '🛣️' },
    { name: 'Manager Teja', email: 'teja.manager@gvmc.gov.in', pwd: 'teja123', ward: 'WARD-03', dept: 'Electricity & Power Grid', icon: '⚡' },
    { name: 'Manager Ravi', email: 'ravi.manager@gvmc.gov.in', pwd: 'ravi123', ward: 'WARD-04', dept: 'Public Health & Waste', icon: '🧹' },
    { name: 'Manager Srinu', email: 'srinu.manager@gvmc.gov.in', pwd: 'srinu123', ward: 'WARD-05', dept: 'Town Planning & Encroachments', icon: '🏢' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      {/* Top 3 Language Selector Buttons */}
      <div className="mb-4 flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-xl">
        <button
          onClick={() => setLanguage('en')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            language === 'en'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          English
        </button>
        <button
          onClick={() => setLanguage('te')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            language === 'te'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          తెలుగు (Telugu)
        </button>
        <button
          onClick={() => setLanguage('hi')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            language === 'hi'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          हिन्दी (Hindi)
        </button>
      </div>

      <div className="max-w-md w-full bg-slate-900 text-white rounded-3xl shadow-2xl p-8 border border-slate-800 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white mx-auto flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20">
            🏛️
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-wide">GVMC Service Complaint Portal</h2>
          <p className="text-xs text-blue-300 font-medium">Government of Telangana • Municipal Governance</p>
        </div>

        {/* Toggle Login / Register */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              isLogin ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              !isLogin ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            New Registration
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 text-red-300 text-xs rounded-xl border border-red-500/40 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="K. Rajesh Kumar"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="citizen@telangana.gov.in"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2 text-xs"
          >
            <span>{isLogin ? 'Sign In to Portal' : 'Register Citizen Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="pt-2 space-y-2 border-t border-slate-800">
          <div className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-mono font-semibold">
            QUICK DEMO ACCOUNTS & PORTAL ROLES
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemoLogin('citizen@telangana.gov.in', 'citizen123')}
              className="px-3 py-2.5 rounded-xl bg-slate-950 text-xs text-slate-300 hover:bg-blue-600 hover:text-white transition font-semibold flex items-center justify-center space-x-1 border border-slate-800"
            >
              <span>👤 Citizen Portal</span>
            </button>
            <button
              onClick={() => setShowManagerModal(true)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 text-xs text-emerald-300 hover:bg-emerald-600 hover:text-white transition font-bold flex items-center justify-center space-x-1 border border-emerald-500/40 shadow-sm"
            >
              <span>👔 Demo Manager Tab</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin('admin@telangana.gov.in', 'admin123')}
              className="px-3 py-2.5 rounded-xl bg-slate-950 text-xs text-slate-300 hover:bg-purple-600 hover:text-white transition font-semibold flex items-center justify-center space-x-1 border border-slate-800"
            >
              <span>🛡️ Admin Console</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin('commissioner@telangana.gov.in', 'commish123')}
              className="px-3 py-2.5 rounded-xl bg-slate-950 text-xs text-slate-300 hover:bg-amber-600 hover:text-white transition font-semibold flex items-center justify-center space-x-1 border border-slate-800"
            >
              <span>🏛️ Commissioner</span>
            </button>
          </div>
        </div>
      </div>

      {/* DEMO MANAGER SELECTION POPUP MODAL */}
      {showManagerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">👔</span>
                <div>
                  <h3 className="font-extrabold text-base text-white">Select Demo Ward Manager</h3>
                  <p className="text-xs text-slate-400">Choose a manager to view their allocated complaints & SLA status</p>
                </div>
              </div>
              <button
                onClick={() => setShowManagerModal(false)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {demoManagers.map((mgr) => (
                <button
                  key={mgr.email}
                  onClick={() => {
                    setShowManagerModal(false);
                    handleQuickDemoLogin(mgr.email, mgr.pwd);
                  }}
                  className="w-full p-3.5 rounded-2xl bg-slate-950 hover:bg-gradient-to-r hover:from-slate-900 hover:to-blue-900/60 border border-slate-800 hover:border-blue-500/40 text-left transition space-y-1 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-xs text-white group-hover:text-blue-300 flex items-center space-x-1.5">
                      <span>{mgr.icon}</span>
                      <span>{mgr.name}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                      {mgr.ward}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    Department: <span className="text-slate-300">{mgr.dept}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowManagerModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginRegister;
