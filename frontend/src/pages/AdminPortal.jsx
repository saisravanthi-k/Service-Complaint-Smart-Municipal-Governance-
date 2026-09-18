import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { complaintAPI, officerAPI, notificationAPI, dashboardAPI, adminAPI } from '../services/api';
import {
  Shield, Users, RefreshCw, AlertTriangle, CheckCircle2, Award, Clock,
  FileText, UserCheck, AlertOctagon, CornerUpRight, Calendar, ArrowRight, Activity, TrendingUp,
  Zap, Rocket, Trophy, Star, Heart, Flame
} from 'lucide-react';

const AdminPortal = () => {
  const [activeTab, setActiveTab] = useState('QUEUE'); // 'QUEUE', 'DELAY_REVIEWS', 'MANAGER_REPORTS'
  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [workloadData, setWorkloadData] = useState(null);
  const [escalationResult, setEscalationResult] = useState(null);

  // SLA Dashboard Analytics
  const [slaMetrics, setSlaMetrics] = useState({
    total_sla_violations: 0,
    number_of_delayed_complaints: 0,
    complaints_awaiting_explanation: 0,
    complaints_reassigned: 0,
    high_priority_complaints: 0,
    average_resolution_time_hours: 14.5,
    manager_wise_delay_reports: []
  });

  // Delay Submissions list & review modal
  const [delaySubmissions, setDelaySubmissions] = useState([]);
  const [selectedDelay, setSelectedDelay] = useState(null);
  const [reviewAction, setReviewAction] = useState('ACCEPT'); // 'ACCEPT', 'REJECT', 'EXTEND', 'REASSIGN', 'ESCALATE'
  const [actionNotes, setActionNotes] = useState('');
  const [extendedDeadline, setExtendedDeadline] = useState('');
  const [reassignOfficerId, setReassignOfficerId] = useState('');

  // Manager Performance Reports & Badges Modal
  const [performanceReports, setPerformanceReports] = useState([]);
  const [selectedOfficerBadgeModal, setSelectedOfficerBadgeModal] = useState(null);

  // Audit Timeline modal
  const [timelineTicket, setTimelineTicket] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);

  const loadData = async () => {
    try {
      const [cRes, oRes, wRes, slaRes, delayRes, perfRes] = await Promise.all([
        complaintAPI.list(),
        officerAPI.list(),
        officerAPI.getWorkloadBalance(),
        dashboardAPI.getSLAAnalytics(),
        adminAPI.getDelaySubmissions(),
        officerAPI.getPerformanceReports()
      ]);
      setComplaints(cRes.data);
      setOfficers(oRes.data);
      setWorkloadData(wRes.data);
      setSlaMetrics(slaRes.data);
      setDelaySubmissions(delayRes.data);
      setPerformanceReports(perfRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerEscalations = async () => {
    try {
      const res = await notificationAPI.triggerEscalations();
      setEscalationResult(res.data);
      loadData();
    } catch (err) {
      alert('Failed to evaluate SLA escalations.');
    }
  };

  const handleAllocateOfficer = async (complaintId, officerId) => {
    try {
      await officerAPI.allocate(complaintId, officerId);
      loadData();
      alert('Manager re-allocated successfully!');
    } catch (err) {
      alert('Failed to allocate manager.');
    }
  };

  const handleReviewDelaySubmission = async (e) => {
    e.preventDefault();
    if (!selectedDelay) return;

    const payload = {
      action: reviewAction,
      action_notes: actionNotes
    };

    if (reviewAction === 'EXTEND') {
      if (!extendedDeadline) {
        alert('Please pick extended deadline date & time.');
        return;
      }
      payload.extended_deadline = new Date(extendedDeadline).toISOString();
    }

    if (reviewAction === 'REASSIGN') {
      if (!reassignOfficerId) {
        alert('Please select new manager to reassign.');
        return;
      }
      payload.new_officer_id = Number(reassignOfficerId);
    }

    try {
      await adminAPI.reviewDelay(selectedDelay.complaint_id, payload);
      alert(`Action '${reviewAction}' completed successfully for complaint #${selectedDelay.complaint_number}`);
      setSelectedDelay(null);
      setActionNotes('');
      setExtendedDeadline('');
      setReassignOfficerId('');
      loadData();
    } catch (err) {
      alert('Failed to process admin action.');
    }
  };

  const handleViewTimeline = async (ticket) => {
    setTimelineTicket(ticket);
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
        {/* Admin Header Banner matching Client Navbar Theme */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4" />
              <span>GVMC Municipal Governance & Accountability Console</span>
            </div>
            <h2 className="text-2xl font-bold">AI SLA Escalation & Manager Accountability Console</h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Real-Time SLA Violation Detection • Multi-Channel Escalation Dispatch • Manager Performance Analytics
            </p>
          </div>

          <button
            onClick={handleTriggerEscalations}
            className="mt-4 md:mt-0 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center space-x-2 animate-pulse"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Run SLA Escalation Engine</span>
          </button>
        </div>

        {/* Escalation Engine Result Banner */}
        {escalationResult && (
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-red-500/30 flex items-center justify-between text-xs shadow-lg">
            <div>
              <span className="font-bold text-red-400">AI Escalation Engine Completed: </span>
              Evaluated {escalationResult.evaluated_tickets} tickets • {escalationResult.new_sla_violations || 0} New SLA Violations • {escalationResult.min_30_escalations || 0} 30-Min Auto-Escalations • {escalationResult.hour_1_commissioner_escalations || 0} 1-Hour Commissioner Alerts
            </div>
            <button onClick={() => setEscalationResult(null)} className="text-slate-400 font-bold hover:text-white">Dismiss</button>
          </div>
        )}

        {/* Real-Time SLA Dashboard KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-slate-900 p-4 rounded-2xl border border-red-500/40 shadow-xl space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
              <span>SLA Violations</span>
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            </div>
            <div className="text-xl font-bold text-red-500">{slaMetrics.total_sla_violations}</div>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-amber-500/40 shadow-xl space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
              <span>Delayed Complaints</span>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-amber-500">{slaMetrics.number_of_delayed_complaints}</div>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-indigo-500/40 shadow-xl space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
              <span>Awaiting Reason</span>
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-indigo-400">{slaMetrics.complaints_awaiting_explanation}</div>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-blue-500/40 shadow-xl space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
              <span>Reassigned</span>
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-blue-400">{slaMetrics.complaints_reassigned}</div>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-rose-500/40 shadow-xl space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
              <span>High Priority</span>
              <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-xl font-bold text-rose-500">{slaMetrics.high_priority_complaints}</div>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-emerald-500/40 shadow-xl space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
              <span>Avg Resolution</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400">{slaMetrics.average_resolution_time_hours}h</div>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
              <span>Total Managers</span>
              <Users className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-white">{officers.length}</div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex border-b border-slate-800 space-x-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('QUEUE')}
            className={`pb-3 px-2 flex items-center space-x-1 border-b-2 transition ${activeTab === 'QUEUE' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            <FileText className="w-4 h-4" />
            <span>Complaint Queue & Workload ({complaints.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('DELAY_REVIEWS')}
            className={`pb-3 px-2 flex items-center space-x-1 border-b-2 transition ${activeTab === 'DELAY_REVIEWS' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Manager Delay Explanations ({delaySubmissions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MANAGER_REPORTS')}
            className={`pb-3 px-2 flex items-center space-x-1 border-b-2 transition ${activeTab === 'MANAGER_REPORTS' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            <Award className="w-4 h-4 text-blue-400" />
            <span>Manager Performance Reports</span>
          </button>
        </div>

        {/* TAB 1: COMPLAINTS QUEUE & WORKLOAD */}
        {activeTab === 'QUEUE' && (
          <div className="space-y-6">
            {/* Smart Workload Balancer Plan */}
            {workloadData && (
              <div className="bg-slate-900 text-white rounded-3xl shadow-2xl p-6 border border-slate-800 space-y-3">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>AI Manager Workload Redistribution & Capacity Balancer</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {workloadData.redistribution_plan?.map((plan) => (
                    <div key={plan.officer_id} className="p-4 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-1">
                      <div className="text-sm font-bold text-white">{plan.full_name}</div>
                      <div className="text-xs text-slate-400">Utilization: {plan.utilization_percent}%</div>
                      <div className={`text-xs font-semibold px-2 py-0.5 rounded inline-block ${plan.recommended_action === 'REASSIGN_OVERLOAD' ? 'bg-red-950 text-red-300 border border-red-500/30' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'}`}>
                        {plan.recommended_action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Complaints Queue Table */}
            <div className="bg-slate-900 text-white rounded-3xl shadow-2xl p-6 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                Municipal Complaint Allocation Queue
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-300 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Ticket #</th>
                      <th className="p-3">Title</th>
                      <th className="p-3">Ward</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Assigned Manager</th>
                      <th className="p-3">Timeline</th>
                      <th className="p-3 text-right">Re-allocate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {complaints.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-950/80 transition">
                        <td className="p-3 font-mono font-bold text-blue-400">{c.complaint_number}</td>
                        <td className="p-3 font-medium text-white max-w-xs truncate">{c.title}</td>
                        <td className="p-3 text-slate-300">{c.ward_id}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${c.priority === 'CRITICAL' || c.priority === 'EMERGENCY' ? 'bg-red-950 text-red-300 border border-red-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30'}`}>
                            {c.priority}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-semibold ${c.status === 'SLA Violated' || c.status === 'SLA_VIOLATED' ? 'bg-red-600 text-white' : c.status === 'Escalated' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-300">
                          {officers.find((o) => o.id === c.assigned_officer_id)?.full_name || 'Unassigned'}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleViewTimeline(c)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded text-[11px] border border-slate-700"
                          >
                            View Audit
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <select
                            onChange={(e) => handleAllocateOfficer(c.id, Number(e.target.value))}
                            value={c.assigned_officer_id || ''}
                            className="bg-slate-950 border border-slate-800 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[180px] w-full truncate cursor-pointer"
                          >
                            <option value="">Select Manager...</option>
                            {officers.map((o) => (
                              <option key={o.id} value={o.id}>{o.full_name} ({o.active_workload} tickets)</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGER DELAY EXPLANATIONS REVIEW */}
        {activeTab === 'DELAY_REVIEWS' && (
          <div className="bg-slate-900 text-white rounded-3xl shadow-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Submitted Manager Delay Explanations & Administrative Actions</span>
              <span className="text-xs text-slate-400 font-normal">Review delay grounds: Heavy rainfall, materials unavailable, manpower, approvals, technical issues.</span>
            </h3>

            {delaySubmissions.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No delay explanation submissions currently pending review.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {delaySubmissions.map((sub) => (
                  <div key={sub.id} className="p-5 rounded-2xl border border-amber-500/40 bg-amber-950/20 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                      <span className="font-mono text-xs font-bold text-blue-300 bg-blue-950 border border-blue-500/30 px-2 py-0.5 rounded">
                        {sub.complaint_number}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${sub.admin_status === 'PENDING_REVIEW' ? 'bg-amber-600 text-white' : sub.admin_status === 'ACCEPTED' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'}`}>
                        Status: {sub.admin_status}
                      </span>
                    </div>

                    <div>
                      <div className="text-sm font-bold text-white">{sub.complaint_title}</div>
                      <div className="text-xs text-slate-300 mt-1">Manager: <b>{sub.officer_name}</b></div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1 text-slate-300">
                      <div><span className="font-bold text-white">Reason Category:</span> {sub.reason_category}</div>
                      <div><span className="font-bold text-white">Expected Completion:</span> {new Date(sub.expected_completion_time).toLocaleString()}</div>
                      <div><span className="font-bold text-white">Remarks:</span> {sub.additional_remarks || 'None provided'}</div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setSelectedDelay(sub)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow flex items-center space-x-1"
                      >
                        <CornerUpRight className="w-3.5 h-3.5" />
                        <span>Review & Take Action</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MANAGER PERFORMANCE REPORTS & BADGES */}
        {activeTab === 'MANAGER_REPORTS' && (
          <div className="space-y-6">
            {/* Top KPI Cards for Manager Badges & Performance */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-5 rounded-3xl border border-amber-500/30 shadow-xl space-y-1">
                <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>Avg Response Speed</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-amber-400">
                  {performanceReports.length > 0
                    ? (performanceReports.reduce((acc, r) => acc + (r.avg_response_time_hours || 1.2), 0) / performanceReports.length).toFixed(1)
                    : 1.5}h
                </div>
                <div className="text-[11px] text-slate-400">Time from assignment to first action</div>
              </div>

              <div className="bg-slate-900 p-5 rounded-3xl border border-blue-500/30 shadow-xl space-y-1">
                <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>Avg Rectification Speed</span>
                  <Rocket className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {performanceReports.length > 0
                    ? (performanceReports.reduce((acc, r) => acc + (r.avg_resolution_time_hours || 8.5), 0) / performanceReports.length).toFixed(1)
                    : 9.2}h
                </div>
                <div className="text-[11px] text-slate-400">Time to fully rectify complaint</div>
              </div>

              <div className="bg-slate-900 p-5 rounded-3xl border border-emerald-500/30 shadow-xl space-y-1">
                <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>Total Complaints Rectified</span>
                  <Trophy className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400">
                  {performanceReports.reduce((acc, r) => acc + (r.total_rectified || r.total_resolved || 0), 0)}
                </div>
                <div className="text-[11px] text-slate-400">Resolved & Closed tickets</div>
              </div>

              <div className="bg-slate-900 p-5 rounded-3xl border border-purple-500/30 shadow-xl space-y-1">
                <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>Top Badged Manager</span>
                  <Award className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-lg font-bold text-purple-300 truncate">
                  {performanceReports.find(r => r.badges?.some(b => b.earned))?.officer_name || 'K. Suresh Rao'}
                </div>
                <div className="text-[11px] text-purple-400 font-medium">Lightning Responder & Master Rectifier</div>
              </div>
            </div>

            {/* Main Manager Performance & Badges Table */}
            <div className="bg-slate-900 text-white rounded-3xl shadow-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>GVMC Manager Performance, Action Speed & Badges Scorecard</span>
                </h3>
                <span className="text-xs text-slate-400">Click on any manager's badges to inspect achievement status & criteria.</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-300 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Manager Name</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Assigned</th>
                      <th className="p-3 text-emerald-400">Rectified</th>
                      <th className="p-3 text-amber-400">Action Speed</th>
                      <th className="p-3 text-blue-400">Rectification Speed</th>
                      <th className="p-3">On-Time Rate</th>
                      <th className="p-3">CSAT Rating</th>
                      <th className="p-3">Earned Badges</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {performanceReports.map((rep) => {
                      const earnedBadges = rep.badges?.filter(b => b.earned) || [];
                      return (
                        <tr key={rep.officer_id} className="hover:bg-slate-950/80 transition">
                          <td className="p-3 font-bold text-white">
                            <div className="font-bold text-slate-100">{rep.officer_name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">ID #{rep.officer_id}</div>
                          </td>
                          <td className="p-3 text-slate-300">{rep.department_name}</td>
                          <td className="p-3 font-semibold text-slate-200">{rep.total_assigned}</td>
                          <td className="p-3 font-extrabold text-emerald-400">{rep.total_rectified || rep.total_resolved || 0}</td>
                          <td className="p-3 font-semibold text-amber-300 bg-amber-950/20 rounded-lg px-2">
                            ⚡ {rep.avg_response_time_hours || 1.2}h
                          </td>
                          <td className="p-3 font-semibold text-blue-300 bg-blue-950/20 rounded-lg px-2">
                            🚀 {rep.avg_resolution_time_hours || 8.5}h
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-bold ${rep.on_time_resolution_rate >= 80 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-red-950 text-red-300 border border-red-500/30'}`}>
                              {rep.on_time_resolution_rate}%
                            </span>
                          </td>
                          <td className="p-3 font-bold text-yellow-400">
                            ⭐ {rep.feedback_rating || 4.8} / 5.0
                          </td>
                          <td className="p-3">
                            <div
                              onClick={() => setSelectedOfficerBadgeModal(rep)}
                              className="flex flex-wrap gap-1.5 cursor-pointer group"
                            >
                              {earnedBadges.length === 0 ? (
                                <span className="text-[10px] text-slate-500 italic">No badges unlocked yet</span>
                              ) : (
                                earnedBadges.map((b) => (
                                  <span
                                    key={b.id}
                                    className="px-2 py-1 bg-slate-950 border border-slate-800 hover:border-amber-400 text-white rounded-lg text-[11px] font-bold flex items-center space-x-1 shadow-sm transition group-hover:scale-105"
                                    title={`${b.title}: ${b.description}`}
                                  >
                                    <span>{b.icon === 'Zap' ? '⚡' : b.icon === 'Rocket' ? '🚀' : b.icon === 'Trophy' ? '🏆' : b.icon === 'Star' ? '🌟' : b.icon === 'Shield' ? '🛡️' : '⭐'}</span>
                                    <span className="text-[10px]">{b.title}</span>
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Admin Action Modal for Delay Reason */}
      {selectedDelay && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 text-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-800">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">
              Admin Action: Ticket #{selectedDelay.complaint_number}
            </h3>

            <div className="text-xs space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300">
              <div><b>Manager:</b> {selectedDelay.officer_name}</div>
              <div><b>Reason:</b> {selectedDelay.reason_category}</div>
              <div><b>Expected Completion:</b> {new Date(selectedDelay.expected_completion_time).toLocaleString()}</div>
              <div><b>Remarks:</b> {selectedDelay.additional_remarks || 'None'}</div>
            </div>

            <form onSubmit={handleReviewDelaySubmission} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Select Administrative Decision *</label>
                <select
                  value={reviewAction}
                  onChange={(e) => setReviewAction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ACCEPT">Accept Reason (Log approval notice)</option>
                  <option value="REJECT">Reject Reason (Order immediate execution)</option>
                  <option value="EXTEND">Extend SLA Deadline (Grant extension)</option>
                  <option value="REASSIGN">Reassign Complaint (Transfer to another manager)</option>
                  <option value="ESCALATE">Escalate Complaint (Forward to Commissioner)</option>
                </select>
              </div>

              {reviewAction === 'EXTEND' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">New SLA Deadline Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={extendedDeadline}
                    onChange={(e) => setExtendedDeadline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              )}

              {reviewAction === 'REASSIGN' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select New Manager *</label>
                  <select
                    value={reassignOfficerId}
                    onChange={(e) => setReassignOfficerId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  >
                    <option value="">Choose available manager...</option>
                    {officers.map(o => (
                      <option key={o.id} value={o.id}>{o.full_name} ({o.department_name}) - Active: {o.active_workload}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Action Notes / Directives</label>
                <textarea
                  rows={2}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Notes for manager, commissioner, or audit record..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDelay(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold shadow"
                >
                  Confirm & Execute Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Timeline Modal */}
      {timelineTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Audit Log Timeline: #{timelineTicket.complaint_number}
                </h3>
                <p className="text-xs text-slate-500">{timelineTicket.title}</p>
              </div>
              <button onClick={() => setTimelineTicket(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                ✕ Close
              </button>
            </div>

            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 my-4">
              {timelineEvents.length === 0 ? (
                <p className="text-xs text-slate-500 ml-4 py-4">No recorded timeline events yet.</p>
              ) : (
                timelineEvents.map((evt) => (
                  <div key={evt.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-purple-600 border-2 border-white shadow-md"></div>
                    <div className="text-xs font-bold text-slate-900">{evt.event_type}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{evt.description}</div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-2">
                      <span>Actor: <b>{evt.actor_name}</b> ({evt.actor_type})</span>
                      <span>•</span>
                      <span>{new Date(evt.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Manager Badges Showcase Modal */}
      {selectedOfficerBadgeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 text-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-5 border border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-2xl">
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Manager Achievements & Badges: <span className="text-amber-400">{selectedOfficerBadgeModal.officer_name}</span>
                  </h3>
                  <p className="text-xs text-slate-400">Department: {selectedOfficerBadgeModal.department_name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOfficerBadgeModal(null)}
                className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700"
              >
                ✕ Close
              </button>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center text-xs">
              <div>
                <div className="text-slate-400 text-[11px]">Action Speed</div>
                <div className="font-extrabold text-amber-400 text-sm mt-0.5">⚡ {selectedOfficerBadgeModal.avg_response_time_hours}h</div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">Resolution Speed</div>
                <div className="font-extrabold text-blue-400 text-sm mt-0.5">🚀 {selectedOfficerBadgeModal.avg_resolution_time_hours}h</div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">Complaints Rectified</div>
                <div className="font-extrabold text-emerald-400 text-sm mt-0.5">🏆 {selectedOfficerBadgeModal.total_rectified || selectedOfficerBadgeModal.total_resolved}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">CSAT Rating</div>
                <div className="font-extrabold text-yellow-400 text-sm mt-0.5">⭐ {selectedOfficerBadgeModal.feedback_rating}</div>
              </div>
            </div>

            {/* Badges Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Badge Shelf & Unlock Status</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedOfficerBadgeModal.badges?.map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-2xl border transition space-y-2 ${
                      badge.earned
                        ? 'bg-slate-950 border-amber-500/40 shadow-lg'
                        : 'bg-slate-950/40 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">
                          {badge.icon === 'Zap' ? '⚡' : badge.icon === 'Rocket' ? '🚀' : badge.icon === 'Trophy' ? '🏆' : badge.icon === 'Star' ? '🌟' : badge.icon === 'Shield' ? '🛡️' : '⭐'}
                        </span>
                        <span className="font-bold text-sm text-white">{badge.title}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                        badge.earned ? 'bg-amber-950 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {badge.tier}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{badge.description}</p>

                    <div className="bg-slate-900 p-2 rounded-xl text-[11px] flex justify-between text-slate-400">
                      <span>Criteria: <b className="text-slate-200">{badge.criteria}</b></span>
                      <span>Metric: <b className="text-amber-300">{badge.metric_value}</b></span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                        <span>{badge.earned ? 'UNLOCKED' : 'PROGRESS'}</span>
                        <span>{badge.progress_pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            badge.earned ? 'bg-gradient-to-r from-amber-400 to-yellow-300' : 'bg-blue-500'
                          }`}
                          style={{ width: `${badge.progress_pct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
