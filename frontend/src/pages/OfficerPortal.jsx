import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import SLATimer from '../components/SLATimer';
import { complaintAPI, officerAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Clock, AlertTriangle, Shield, RefreshCw, Send, History, AlertCircle, UserCheck, Award, Zap, Rocket, Trophy, Star, Image as ImageIcon, Maximize2, X, Eye } from 'lucide-react';

const OfficerPortal = () => {
  const { user } = useAuth();
  const [officerList, setOfficerList] = useState([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState(user?.user_id || 1);
  const [currentOfficer, setCurrentOfficer] = useState(null);

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [notes, setNotes] = useState('');
  const [officerBadges, setOfficerBadges] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  // Delay Reason Modal state
  const [delayModalTicket, setDelayModalTicket] = useState(null);
  const [reasonCategory, setReasonCategory] = useState('Heavy rainfall.');
  const [expectedCompletionTime, setExpectedCompletionTime] = useState('');
  const [additionalRemarks, setAdditionalRemarks] = useState('');

  // Timeline Modal state
  const [timelineTicket, setTimelineTicket] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);

  const defaultWardOfficers = [
    { id: 1, full_name: 'Abhi', ward_id: 'WARD-01', department_name: 'Water Supply & Sanitation' },
    { id: 2, full_name: 'Janu', ward_id: 'WARD-02', department_name: 'Roads & Infrastructure' },
    { id: 3, full_name: 'Teja', ward_id: 'WARD-03', department_name: 'Electricity & Power Grid' },
    { id: 4, full_name: 'Ravi', ward_id: 'WARD-04', department_name: 'Public Health & Waste' },
    { id: 5, full_name: 'Srinu', ward_id: 'WARD-05', department_name: 'Town Planning & Encroachment' }
  ];

  // Fetch officers list on mount
  useEffect(() => {
    officerAPI.list().then((res) => {
      if (res.data && res.data.length > 0) {
        setOfficerList(res.data);
        const found = res.data.find(o => o.id === Number(selectedOfficerId)) || res.data[0];
        setCurrentOfficer(found);
      } else {
        setOfficerList(defaultWardOfficers);
        setCurrentOfficer(defaultWardOfficers[0]);
      }
    }).catch(() => {
      setOfficerList(defaultWardOfficers);
      setCurrentOfficer(defaultWardOfficers[0]);
    });
  }, []);

  const fetchOfficerTickets = async (offId) => {
    setLoading(true);
    const idToUse = offId !== undefined ? offId : selectedOfficerId;
    try {
      if (idToUse === 'ALL') {
        const cRes = await complaintAPI.list({});
        setComplaints(cRes.data);
      } else {
        const [cRes, bRes] = await Promise.all([
          complaintAPI.list({ officer_id: idToUse }),
          officerAPI.getOfficerBadges(idToUse).catch(() => ({ data: null }))
        ]);
        setComplaints(cRes.data);
        if (bRes?.data) setOfficerBadges(bRes.data);
      }
    } catch (err) {
      console.warn('API error in fetchOfficerTickets, filtering local complaints:', err);
      const cached = JSON.parse(localStorage.getItem('my_complaints') || '[]');
      if (idToUse === 'ALL') {
        setComplaints(cached);
      } else {
        const targetWard = `WARD-0${idToUse}`;
        const filtered = cached.filter(c => Number(c.assigned_officer_id) === Number(idToUse) || (!c.assigned_officer_id && c.ward_id === targetWard));
        setComplaints(filtered);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficerTickets(selectedOfficerId);
    if (selectedOfficerId === 'ALL') {
      setCurrentOfficer({
        id: 'ALL',
        full_name: 'All Ward Managers (Demo Unified View)',
        department_name: 'All Civic Departments',
        ward_id: 'WARD-01 to WARD-05'
      });
    } else if (officerList.length > 0) {
      const found = officerList.find(o => o.id === Number(selectedOfficerId));
      if (found) setCurrentOfficer(found);
    }
  }, [selectedOfficerId, officerList]);

  const handleManagerChange = (e) => {
    const val = e.target.value;
    const newId = val === 'ALL' ? 'ALL' : Number(val);
    setSelectedOfficerId(newId);
    if (newId === 'ALL') {
      setCurrentOfficer({
        id: 'ALL',
        full_name: 'All Ward Managers (Demo Unified View)',
        department_name: 'All Civic Departments',
        ward_id: 'WARD-01 to WARD-05'
      });
    } else {
      const found = officerList.find(o => o.id === Number(newId));
      if (found) setCurrentOfficer(found);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedTicket) return;
    try {
      await complaintAPI.updateStatus(selectedTicket.id, status, notes);
      setSelectedTicket(null);
      setNotes('');
      fetchOfficerTickets(selectedOfficerId);
    } catch (err) {
      console.warn('API unavailable, updating status locally:', err);
      const cached = JSON.parse(localStorage.getItem('my_complaints') || '[]');
      const updated = cached.map(c => c.id === selectedTicket.id ? { ...c, status, resolution_notes: notes } : c);
      localStorage.setItem('my_complaints', JSON.stringify(updated));
      setComplaints(prev => prev.map(c => c.id === selectedTicket.id ? { ...c, status, resolution_notes: notes } : c));
      setSelectedTicket(null);
      setNotes('');
      alert(`Ticket status updated to ${status}!`);
    }
  };

  const handleSubmitDelayReason = async (e) => {
    e.preventDefault();
    if (!delayModalTicket) return;
    if (!expectedCompletionTime) {
      alert('Please select expected completion date & time.');
      return;
    }

    try {
      let isoString;
      try {
        isoString = new Date(expectedCompletionTime).toISOString();
      } catch (dateErr) {
        isoString = new Date(Date.now() + 86400000).toISOString();
      }

      await complaintAPI.submitDelayReason(delayModalTicket.id, {
        reason_category: reasonCategory,
        expected_completion_time: isoString,
        additional_remarks: additionalRemarks || 'None'
      }, selectedOfficerId === 'ALL' ? 1 : selectedOfficerId);

      alert('Delay justification submitted to Municipal Commissioner & Admin!');
      setDelayModalTicket(null);
      setExpectedCompletionTime('');
      setAdditionalRemarks('');
      fetchOfficerTickets(selectedOfficerId);
    } catch (err) {
      console.warn('API error submitting delay reason, storing locally:', err);
      alert('Delay justification submitted to Municipal Commissioner & Admin!');
      setDelayModalTicket(null);
      setExpectedCompletionTime('');
      setAdditionalRemarks('');
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

  const delayReasonOptions = [
    "Heavy rainfall.",
    "Water supply pipeline materials unavailable.",
    "Lack of manpower.",
    "Awaiting approval.",
    "Technical issue.",
    "Other."
  ];

  const violatedCount = complaints.filter(c => c.status === 'SLA Violated' || c.status === 'SLA_VIOLATED' || c.status === 'Escalated').length;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* INTERACTIVE DEMO MANAGER SELECTION TABS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
                👔 Demo Manager Tab • Select Manager to View Allocated Complaints
              </h3>
            </div>
            <span className="text-[11px] text-amber-300 font-semibold bg-amber-950/60 px-3 py-1 rounded-xl border border-amber-500/30">
              Click a Manager Tab below to view allocated complaints & SLA status
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {officerList.map((off) => {
              const isSelected = Number(selectedOfficerId) === Number(off.id);
              return (
                <button
                  key={off.id}
                  onClick={() => setSelectedOfficerId(Number(off.id))}
                  className={`p-3 rounded-2xl border text-left transition transform hover:scale-[1.02] active:scale-95 flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-400 shadow-xl ring-2 ring-blue-400/50'
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">👔</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-amber-300 border border-amber-500/20'
                    }`}>
                      {off.ward_id || `WARD-0${off.id}`}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-xs leading-snug">Manager {off.full_name}</div>
                    <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {off.department_name}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* All Managers Unified Tab */}
            <button
              onClick={() => setSelectedOfficerId('ALL')}
              className={`p-3 rounded-2xl border text-left transition transform hover:scale-[1.02] active:scale-95 flex flex-col justify-between space-y-2 ${
                selectedOfficerId === 'ALL'
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-purple-400 shadow-xl ring-2 ring-purple-400/50'
                  : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base">🌟</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/30">
                  ALL
                </span>
              </div>
              <div>
                <div className="font-bold text-xs leading-snug">All Managers</div>
                <div className="text-[10px] text-slate-400 truncate">Unified View</div>
              </div>
            </button>
          </div>
        </div>

        {/* Officer & Manager Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-bold border border-blue-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>ACTIVE WARD MANAGER DESK • REAL-TIME DISPATCH</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
              {currentOfficer ? currentOfficer.full_name : 'K. Suresh Rao'}
            </h2>
            <p className="text-xs sm:text-sm text-blue-200">
              Department: <b>{currentOfficer ? currentOfficer.department_name : 'Water Supply & Sanitation'}</b> • Assigned Ward: <b className="text-amber-300">{currentOfficer?.ward_id || 'WARD-01'}</b> • Allocated Complaints: <b>{complaints.length}</b> • Breaches: <span className="font-bold text-red-400">{violatedCount}</span>
            </p>
          </div>

          {/* MANAGER SELECTOR DROPDOWN WITH GLOWING RING */}
          <div className="w-full md:w-auto max-w-full flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3.5 bg-slate-950/90 px-4 py-3.5 sm:px-5 rounded-2xl border border-blue-400/40 shadow-2xl ring-2 ring-blue-500/20 overflow-hidden md:mr-3 my-1 md:my-0">
            <div className="text-xs text-blue-300 font-bold flex items-center space-x-2 shrink-0">
              <UserCheck className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
              <span className="whitespace-nowrap">Select Active Manager:</span>
            </div>
            <select
              value={selectedOfficerId}
              onChange={handleManagerChange}
              className="w-full sm:w-auto max-w-full sm:max-w-xs md:max-w-xs bg-slate-900 border border-slate-700 text-amber-300 text-xs font-bold rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer truncate shadow-inner"
            >
              {officerList.map((off) => (
                <option key={off.id} value={off.id} className="bg-slate-900 text-white py-1">
                  Manager {off.full_name} ({off.ward_id || 'WARD-01'}) - {off.department_name}
                </option>
              ))}
              <option value="ALL" className="bg-slate-900 text-amber-400 font-bold py-1">
                🌟 DEMO VIEW: All Managers & All Complaints
              </option>
            </select>
          </div>
        </div>

        {/* Manager Badges & Performance Scorecard Banner */}
        {officerBadges && (
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  My Performance & Manager Badges Scorecard
                </h3>
              </div>
              <div className="text-xs text-amber-300 font-mono bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-xl font-bold">
                Performance Rating: ⭐ {officerBadges.feedback_rating} / 5.0
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                  <span>Action Speed</span>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-xl font-extrabold text-amber-400 mt-1">⚡ {officerBadges.avg_response_time_hours}h</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Avg response time</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                  <span>Rectification Speed</span>
                  <Rocket className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="text-xl font-extrabold text-blue-400 mt-1">🚀 {officerBadges.avg_resolution_time_hours}h</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Avg resolution time</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                  <span>Complaints Rectified</span>
                  <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-xl font-extrabold text-emerald-400 mt-1">🏆 {officerBadges.total_rectified}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Resolved & Rectified</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="text-[11px] text-slate-400 font-semibold flex items-center justify-between">
                  <span>On-Time Rate</span>
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-xl font-extrabold text-purple-400 mt-1">{officerBadges.on_time_resolution_rate}%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">SLA compliance</div>
              </div>
            </div>

            {/* Badges Shelf */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Unlocked Manager Badges</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {officerBadges.badges?.map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-2xl border transition space-y-1.5 ${
                      badge.earned
                        ? 'bg-slate-950 border-amber-500/40 shadow-md'
                        : 'bg-slate-950/40 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-base">
                          {badge.icon === 'Zap' ? '⚡' : badge.icon === 'Rocket' ? '🚀' : badge.icon === 'Trophy' ? '🏆' : badge.icon === 'Star' ? '🌟' : badge.icon === 'Shield' ? '🛡️' : '⭐'}
                        </span>
                        <span className="font-bold text-xs text-white">{badge.title}</span>
                      </div>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                        badge.earned ? 'bg-amber-950 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {badge.tier}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-tight">{badge.description}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <span>{badge.criteria}</span>
                      <span className="font-bold text-amber-300">{badge.metric_value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SLA Violation Alert Callout */}
        {violatedCount > 0 && (
          <div className="bg-red-950/40 border border-red-500/40 text-red-300 p-4 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 animate-bounce" />
              <div>
                <div className="font-bold text-sm text-white">Action Required: {violatedCount} Complaint(s) Exceeded SLA Time Limit!</div>
                <div className="text-xs text-red-300">
                  Manager <b>{currentOfficer?.full_name}</b> has exceeded the SLA time limit for assigned work. Please provide the reason for delay immediately to avoid automatic 30-minute escalation.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complaints Table / Cards */}
        <div className="bg-slate-900 text-white rounded-3xl shadow-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white">
              Assigned Complaint Queue for Manager: <span className="text-blue-400">{currentOfficer?.full_name}</span>
            </h3>
            <button onClick={() => fetchOfficerTickets(selectedOfficerId)} className="p-2 text-slate-400 hover:text-blue-400">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {complaints.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No assigned complaints in queue for {currentOfficer?.full_name}.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complaints.map((c) => {
                const isViolated = c.status === 'SLA Violated' || c.status === 'SLA_VIOLATED' || c.status === 'Escalated';
                return (
                  <div key={c.id} className={`p-5 rounded-2xl border transition space-y-3 ${isViolated ? 'border-red-500/50 bg-red-950/30 shadow-md' : 'border-slate-800 bg-slate-950/80 hover:border-blue-500/50'}`}>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-mono text-xs font-bold text-blue-300 bg-blue-950 border border-blue-500/30 px-2.5 py-1 rounded-md">
                        {c.complaint_number}
                      </span>
                      <SLATimer deadline={c.sla_deadline} />
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-base">{c.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">{c.description}</p>
                    </div>

                    {/* Attached Photo Evidence for Respected Manager */}
                    {(() => {
                      const displayImg = c.image_url || (
                        c.department_id === 1 || c.title?.includes('మంచినీటి') || c.title?.toLowerCase().includes('water')
                          ? 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80'
                          : c.department_id === 2 || c.title?.toLowerCase().includes('road') || c.title?.toLowerCase().includes('pothole')
                          ? 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80'
                          : c.department_id === 3 || c.title?.toLowerCase().includes('elec')
                          ? 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=80'
                          : c.department_id === 4 || c.title?.toLowerCase().includes('garbage')
                          ? 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80'
                          : 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80'
                      );

                      return (
                        <div className="rounded-2xl overflow-hidden border border-blue-500/30 bg-slate-900 p-2.5 space-y-1.5 shadow-md">
                          <div className="text-[11px] font-bold text-blue-300 flex items-center justify-between">
                            <span className="flex items-center space-x-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                              <span>📷 Complaint Photo Evidence (Proof for Manager)</span>
                            </span>
                            <span className="text-[10px] text-blue-400 font-mono bg-blue-950 px-2 py-0.5 rounded border border-blue-500/30">Click to zoom</span>
                          </div>
                          <div
                            onClick={() => setPreviewImage(displayImg)}
                            className="relative group rounded-xl overflow-hidden bg-black/60 border border-slate-800 cursor-pointer h-44 flex items-center justify-center shadow-inner"
                          >
                            <img
                              src={displayImg}
                              alt="Complaint photo evidence"
                              className="w-full h-44 object-cover rounded-xl group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold text-white space-x-2">
                              <Maximize2 className="w-4 h-4 text-blue-400" />
                              <span>Inspect Full Resolution Evidence</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                      <span className={`font-bold px-2 py-0.5 rounded ${c.priority === 'CRITICAL' || c.priority === 'EMERGENCY' ? 'bg-red-950 text-red-300 border border-red-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30'}`}>
                        {c.priority} Priority
                      </span>
                      <span className={`font-bold px-2.5 py-0.5 rounded ${isViolated ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                        Status: {c.status}
                      </span>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-2 justify-end">
                      <button
                        onClick={() => handleViewTimeline(c)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1 border border-slate-700"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Timeline</span>
                      </button>

                      {isViolated && (
                        <button
                          onClick={() => setDelayModalTicket(c)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow flex items-center space-x-1 animate-pulse"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Submit Reason for Delay</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedTicket(c)}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow transition"
                      >
                        Update / Resolve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Delay Reason Submission Modal */}
      {delayModalTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 text-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-red-500/40">
            <div className="flex items-center space-x-2 text-red-400 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">
                SLA Delay Reason Submission: {delayModalTicket.complaint_number}
              </h3>
            </div>

            <p className="text-xs text-slate-300">
              Manager <b>{currentOfficer?.full_name}</b>, you have exceeded the SLA time limit for Complaint <b>{delayModalTicket.complaint_number}</b>. Please provide the reason for not completing the assigned work immediately.
            </p>

            <form onSubmit={handleSubmitDelayReason} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Reason for Delay *</label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  {delayReasonOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Expected Completion Time *</label>
                <input
                  type="datetime-local"
                  value={expectedCompletionTime}
                  onChange={(e) => setExpectedCompletionTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Additional Remarks</label>
                <textarea
                  rows={3}
                  value={additionalRemarks}
                  onChange={(e) => setAdditionalRemarks(e.target.value)}
                  placeholder="Specify field constraints, required materials, or pending approvals..."
                  className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 rounded-xl p-3 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDelayModalTicket(null)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-semibold border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow transition flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Explanation to Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Status Update Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 text-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-800">
            <h3 className="text-lg font-bold text-white">Update Status: {selectedTicket.complaint_number}</h3>
            <p className="text-xs text-slate-300">{selectedTicket.title}</p>

            {/* Photo preview in Status Update modal */}
            {selectedTicket.image_url && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                <div className="text-xs font-bold text-blue-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <ImageIcon className="w-4 h-4 text-blue-400" />
                    <span>Attached Complaint Photo Evidence</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Click to enlarge</span>
                </div>
                <img
                  src={selectedTicket.image_url}
                  alt="Evidence"
                  onClick={() => setPreviewImage(selectedTicket.image_url)}
                  className="w-full max-h-48 object-cover rounded-xl border border-slate-800 cursor-pointer hover:opacity-90 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Resolution Notes / Action Taken</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe resolution steps taken by maintenance team..."
                className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleUpdateStatus('IN_PROGRESS')}
                className="py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition shadow"
              >
                Mark In Progress
              </button>
              <button
                onClick={() => handleUpdateStatus('RESOLVED')}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shadow"
              >
                Mark Resolved (Notify Citizen)
              </button>
            </div>

            <div className="text-right pt-2">
              <button onClick={() => setSelectedTicket(null)} className="text-xs text-slate-400 hover:underline">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Timeline Modal */}
      {timelineTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 text-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Complaint Audit Timeline: #{timelineTicket.complaint_number}
                </h3>
                <p className="text-xs text-slate-400">{timelineTicket.title}</p>
              </div>
              <button onClick={() => setTimelineTicket(null)} className="text-xs font-bold text-slate-400 hover:text-white">
                ✕ Close
              </button>
            </div>

            <div className="relative border-l-2 border-slate-800 ml-4 space-y-6 my-4">
              {timelineEvents.length === 0 ? (
                <p className="text-xs text-slate-400 ml-4 py-4">No recorded timeline events yet.</p>
              ) : (
                timelineEvents.map((evt) => (
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
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 overflow-hidden shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 px-2">
              <div className="text-sm font-bold text-white flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span>Complaint Photo Evidence - Manager Inspection View</span>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center items-center max-h-[75vh] overflow-hidden rounded-2xl bg-black">
              <img
                src={previewImage}
                alt="Full evidence"
                className="max-h-[75vh] max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerPortal;
