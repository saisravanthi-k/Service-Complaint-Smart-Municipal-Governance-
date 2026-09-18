import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const SLATimer = ({ deadline }) => {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState('');
  const [isBreached, setIsBreached] = useState(false);

  useEffect(() => {
    const calculate = () => {
      const target = new Date(deadline).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setIsBreached(true);
        const overdue = Math.abs(diff);
        const hrs = Math.floor(overdue / (1000 * 60 * 60)).toString().padStart(2, '0');
        const mins = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        const secs = Math.floor((overdue % (1000 * 60)) / 1000).toString().padStart(2, '0');
        setTimeLeft(`SLA Breached: +${hrs}h ${mins}m ${secs}s overdue`);
      } else {
        setIsBreached(false);
        const hrs = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        const secs = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
        setTimeLeft(`${hrs}h ${mins}m ${secs}s remaining`);
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [deadline, t]);

  return (
    <div
      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold shadow-sm ${
        isBreached
          ? 'bg-red-100 text-red-700 border border-red-300 animate-pulse'
          : 'bg-amber-100 text-amber-800 border border-amber-300'
      }`}
    >
      {isBreached ? <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
      <span>{timeLeft}</span>
    </div>
  );
};

export default SLATimer;
