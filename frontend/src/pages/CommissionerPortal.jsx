import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { dashboardAPI, complaintAPI, notificationAPI, officerAPI } from '../services/api';
import {
  Building2, Shield, AlertTriangle, CheckCircle2, TrendingUp, Users, MapPin, Award, Activity, AlertOctagon, History, FileText
} from 'lucide-react';

const CommissionerPortal = () => {
  const [metrics, setMetrics] = useState(null);
  const [slaAnalytics, setSlaAnalytics] = useState(null);
  const [wardAnalytics, setWardAnalytics] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [escalatedTickets, setEscalatedTickets] = useState([]);
  const [commissionerNotifs, setCommissionerNotifs] = useState([]);
  const [perfReports, setPerfReports] = useState([]);
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);

  const loadCommissionerData = async () => {
    try {
      const [mRes, slaRes, wRes, rRes, escRes, notifRes, perfRes] = await Promise.all([
        dashboardAPI.getMetrics(),
        dashboardAPI.getSLAAnalytics(),
        dashboardAPI.getWardAnalytics(),
        dashboardAPI.getRankings(),
        complaintAPI.list({ status: 'Escalated' }),
        notificationAPI.getNotifications('COMMISSIONER', 1),
        officerAPI.getPerformanceReports()
      ]);
      setMetrics(mRes.data);
      setSlaAnalytics(slaRes.data);
      setWardAnalytics(wRes.data);
      setRankings(rRes.data);
      setEscalatedTickets(escRes.data);
      setCommissionerNotifs(notifRes.data);
      setPerfReports(perfRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCommissionerData();
  }, []);

  const handleViewTimeline = async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const res = await complaintAPI.getTimeline(ticket.id);
      setTimelineEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Commissioner Executive Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-bold border border-blue-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>COMMISSIONER EXECUTIVE OVERLAY • LIVE OVERSIGHT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
              City-Wide Service Governance & Executive Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-blue-200">
              High-Level Civic Oversight • Severe SLA Escalation Center • Departmental Accountability & Ward Vulnerability
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-3 bg-slate-950/90 px-4 py-2.5 rounded-2xl border border-blue-400/40 shadow-xl ring-2 ring-blue-500/20">
            <div className="text-right">
              <div className="text-[10px] text-blue-300 font-mono uppercase font-bold">City Accountability Rating</div>
              <div className="text-xl font-extrabold text-blue-400">91.5 / 100 Grade A+</div>
            </div>
          </div>
        </div>

        {/* Commissioner Key Executive Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-1">
              <div className="text-xs font-semibold text-slate-400">Total City Complaints</div>
              <div className="text-2xl font-bold text-white">{metrics.total_complaints}</div>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-1">
              <div className="text-xs font-semibold text-slate-400">Resolved Complaints</div>
              <div className="text-2xl font-bold text-emerald-400">{metrics.resolved_complaints}</div>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-1">
              <div className="text-xs font-semibold text-slate-400">SLA Compliance Rate</div>
              <div className="text-2xl font-bold text-blue-400">{metrics.sla_compliance_rate}%</div>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-1">
              <div className="text-xs font-semibold text-slate-400">Avg Resolution Time</div>
              <div className="text-2xl font-bold text-amber-400">{metrics.avg_resolution_hours}h</div>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-1">
              <div className="text-xs font-semibold text-slate-400">Citizen CSAT Rating</div>
              <div className="text-2xl font-bold text-purple-400">{metrics.citizen_satisfaction_csat} / 5.0</div>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-red-500/40 shadow-xl space-y-1 bg-red-950/20">
              <div className="text-xs font-semibold text-red-400">1-Hr Escalated Tickets</div>
              <div className="text-2xl font-bold text-red-500">{escalatedTickets.length}</div>
            </div>
          </div>
        )}

        {/* COMMISSIONER CRITICAL ESCALATION CENTER */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-red-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">
                Commissioner Critical Escalation Center (Direct High-Priority Desk)
              </h3>
            </div>
            <span className="text-xs text-red-300 font-mono bg-red-950 px-3 py-1 rounded-xl font-bold border border-red-500/40">
              Tickets Auto-Escalated to Commissioner after 1-Hour Inactivity
            </span>
          </div>

          {escalatedTickets.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center font-medium">
              No severe 1-hour unaddressed SLA breaches currently requiring Commissioner intervention.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {escalatedTickets.map((t) => (
                <div key={t.id} className="p-4 rounded-2xl border border-red-500/50 bg-red-950/30 space-y-2">
                  <div className="flex items-center justify-between border-b border-red-500/30 pb-2">
                    <span className="font-mono text-xs font-bold text-red-300 bg-red-950 px-2 py-0.5 rounded border border-red-500/30">
                      {t.complaint_number}
                    </span>
                    <span className="text-xs font-extrabold text-white bg-red-600 px-2.5 py-0.5 rounded shadow">
                      ESCALATED TO COMMISSIONER
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm">{t.title}</h4>
                    <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">{t.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <span>Priority: <b className="text-amber-400">{t.priority}</b></span>
                    <button
                      onClick={() => handleViewTimeline(t)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Audit Trail</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WARD VULNERABILITY & MANAGER LEADERBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ward Vulnerability Index */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                <span>Municipal Ward Vulnerability Index</span>
              </h3>
              <span className="text-xs text-blue-300 font-bold bg-blue-950 border border-blue-500/30 px-2.5 py-1 rounded-xl">
                5 Wards Monitored
              </span>
            </div>

            <div className="divide-y divide-slate-800">
              {wardAnalytics.map((w) => (
                <div key={w.ward_id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">{w.ward_name} ({w.ward_id})</div>
                    <div className="text-[11px] text-slate-400">
                      Total: <b>{w.total_complaints}</b> • Pending: <b>{w.pending_count}</b> • SLA Violations: <b className="text-red-400">{w.sla_violations}</b>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      w.risk_level === 'HIGH' ? 'bg-red-950 text-red-300 border border-red-500/30' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {w.risk_level} RISK
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Manager Accountability Leaderboard */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Manager Performance, Action Speed & Badges</span>
              </h3>
              <span className="text-xs text-emerald-300 font-bold bg-emerald-950 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                Top Rated Managers
              </span>
            </div>

            <div className="divide-y divide-slate-800">
              {perfReports.map((mgr) => {
                const earned = mgr.badges?.filter(b => b.earned) || [];
                return (
                  <div key={mgr.officer_id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-2">
                        <span>{mgr.officer_name}</span>
                        <span className="text-[10px] text-amber-400 font-normal">⭐ {mgr.feedback_rating || 4.8} CSAT</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {mgr.department_name} • Rectified: <b className="text-emerald-400">{mgr.total_rectified || mgr.total_resolved || 0}</b> • Response: <b className="text-amber-400">⚡ {mgr.avg_response_time_hours || 1.2}h</b>
                      </div>

                      {/* Badges preview */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {earned.map(b => (
                          <span key={b.id} className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[10px] font-bold text-amber-300 rounded-md">
                            {b.icon === 'Zap' ? '⚡' : b.icon === 'Rocket' ? '🚀' : b.icon === 'Trophy' ? '🏆' : b.icon === 'Star' ? '🌟' : b.icon === 'Shield' ? '🛡️' : '⭐'} {b.title}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-xs font-bold text-blue-400">{mgr.on_time_resolution_rate}% On-Time</div>
                      <div className="text-[10px] text-slate-400">🚀 {mgr.avg_resolution_time_hours}h Resolution Time</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Timeline Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 text-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Complaint Audit Timeline: #{selectedTicket.complaint_number}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedTicket.title}</p>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="text-xs font-bold text-slate-400 hover:text-white">
                  ✕ Close
                </button>
              </div>

              <div className="relative border-l-2 border-slate-800 ml-4 space-y-6 my-4">
                {timelineEvents.map((evt) => (
                  <div key={evt.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-slate-900 shadow-md"></div>
                    <div className="text-xs font-bold text-white">{evt.event_type}</div>
                    <div className="text-xs text-slate-300 mt-0.5">{evt.description}</div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center space-x-2">
                      <span>Actor: <b>{evt.actor_name}</b> ({evt.actor_type})</span>
                      <span>•</span>
                      <span>{new Date(evt.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CommissionerPortal;
