import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link, useLocation } from 'react-router-dom';
import { Bell, LogOut, User, Shield, Award, Landmark } from 'lucide-react';
import NotificationDrawer from './NotificationDrawer';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  const isCitizen = !user || user.user_type === 'citizen';

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20">
            🏛️
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg leading-tight tracking-wide bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
              {isCitizen ? t('navbar.title') : 'Service Complaint Portal'}
            </h1>
            <p className="text-xs text-slate-400">
              {isCitizen ? t('navbar.subtitle') : 'Government of Telangana • Municipal Governance'}
            </p>
          </div>
        </div>

        {/* Quick Portal Switch Tabs */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <Link
            to="/citizen"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
              location.pathname === '/citizen' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Citizen Portal</span>
          </Link>
          <Link
            to="/officer"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
              location.pathname === '/officer' ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-500/30' : 'text-emerald-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>👔 Demo Manager Tab</span>
          </Link>
          <Link
            to="/admin"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
              location.pathname === '/admin' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </Link>
          <Link
            to="/commissioner"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
              location.pathname === '/commissioner' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Commissioner</span>
          </Link>
        </div>

        {/* User Controls & Notifications */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition relative"
            title={t('navbar.notifications')}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 rounded-full" />
          </button>

          {user && (
            <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
              <div className="text-right hidden md:block">
                <div className="text-sm font-semibold">{user.full_name}</div>
                <div className="text-xs text-blue-400 uppercase tracking-wider font-mono font-medium">
                  {isCitizen ? t('navbar.role_citizen') : user.user_type} • {user.ward_id || 'WARD-01'}
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition flex items-center space-x-1 text-sm"
                title={t('navbar.logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {showNotifications && (
        <NotificationDrawer onClose={() => setShowNotifications(false)} />
      )}
    </header>
  );
};

export default Navbar;
