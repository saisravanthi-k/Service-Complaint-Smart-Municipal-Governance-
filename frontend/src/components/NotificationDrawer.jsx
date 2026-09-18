import React, { useEffect, useState } from 'react';
import { X, Bell, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { notificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const NotificationDrawer = ({ onClose }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        // Trigger real-time SLA breach evaluation
        await notificationAPI.triggerEscalations();
        const type = user?.user_type?.toUpperCase() || 'CITIZEN';
        const userId = user?.user_id || user?.id || 1;
        const res = await notificationAPI.getNotifications(type, userId);
        setNotifications(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifs();
  }, [user]);

  return (
    <div className="fixed inset-y-0 right-0 w-96 max-w-full bg-slate-900 text-white shadow-2xl border-l border-slate-800 z-50 p-6 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-lg">{t('notifications_drawer.heading')}</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">{t('notifications_drawer.empty')}</p>
        ) : (
          notifications.map((n) => {
            const isBreach = n.title.includes('ALERT') || n.title.includes('BREACH') || n.title.includes('URGENT');
            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border space-y-1.5 transition ${
                  isBreach ? 'bg-red-950/40 border-red-500/40' : 'bg-slate-800/80 border-slate-700/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-xs font-bold flex items-center space-x-1 ${isBreach ? 'text-red-400' : 'text-blue-400'}`}>
                    {isBreach ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> : <Bell className="w-3.5 h-3.5 shrink-0" />}
                    <span>{n.title}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">{n.message}</p>
                <div className="text-[10px] text-slate-500 pt-1 flex items-center justify-between border-t border-slate-800">
                  <span>Channel: <b>{n.channel}</b></span>
                  <span>{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationDrawer;
