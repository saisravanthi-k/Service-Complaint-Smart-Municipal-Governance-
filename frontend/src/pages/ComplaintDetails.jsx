import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SLATimer from '../components/SLATimer';
import { complaintAPI, officerAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, Clock, CheckCircle2, AlertTriangle, ShieldCheck, History, Award, Zap, Rocket, Trophy, Image as ImageIcon, Maximize2, X } from 'lucide-react';

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [complaint, setComplaint] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [managerBadges, setManagerBadges] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    complaintAPI.getById(id)
      .then((res) => {
        setComplaint(res.data);
        if (res.data.assigned_officer_id) {
          officerAPI.getOfficerBadges(res.data.assigned_officer_id)
            .then(bRes => setManagerBadges(bRes.data))
            .catch(console.error);
        }
        return complaintAPI.getTimeline(res.data.id);
      })
      .then((tRes) => setTimelineEvents(tRes.data))
      .catch(console.error);
  }, [id]);

  if (!complaint) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm text-slate-400">{t('complaint_details.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-blue-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('complaint_details.back_button')}</span>
        </button>

        <div className="bg-slate-900 text-white rounded-3xl shadow-2xl p-8 border border-slate-800 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="font-mono text-sm font-bold text-blue-300 bg-blue-950 border border-blue-500/30 px-3 py-1 rounded-md">
                {complaint.complaint_number}
              </span>
              <h2 className="text-2xl font-bold text-white mt-2">{complaint.title}</h2>
            </div>
            <SLATimer deadline={complaint.sla_deadline} />
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('complaint_details.detailed_description')}</h4>
            <p className="text-sm text-slate-300 bg-slate-950 p-4 rounded-2xl border border-slate-800 leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>
          </div>

          {/* Attached Image Evidence Box */}
          {complaint.image_url && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span>Attached Photo Evidence</span>
              </h4>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center">
                <div
                  onClick={() => setPreviewImage(complaint.image_url)}
                  className="relative group rounded-xl overflow-hidden cursor-pointer max-w-lg w-full bg-black/40 border border-slate-800"
                >
                  <img
                    src={complaint.image_url}
                    alt="Complaint photo evidence"
                    className="w-full max-h-80 object-contain rounded-xl group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold text-white space-x-1">
                    <Maximize2 className="w-4 h-4 text-blue-400" />
                    <span>Click to Zoom Full Photo</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-b border-slate-800 py-4 text-xs">
            <div>
              <span className="text-slate-400">{t('complaint_details.ward_location')}</span>
              <div className="font-semibold text-slate-200">{t('wards.' + complaint.ward_id) || complaint.ward_id}</div>
            </div>
            <div>
              <span className="text-slate-400">{t('complaint_details.priority_level')}</span>
              <div className="font-semibold text-amber-400">{t('priorities.' + complaint.priority + '_short') || complaint.priority}</div>
            </div>
            <div>
              <span className="text-slate-400">{t('complaint_details.status')}</span>
              <div className="font-semibold text-blue-400">{t('status.' + complaint.status) || complaint.status}</div>
            </div>
            <div>
              <span className="text-slate-400">{t('complaint_details.resolution_sla')}</span>
              <div className="font-semibold text-slate-200">{new Date(complaint.sla_deadline).toLocaleString()}</div>
            </div>
          </div>

          {/* Assigned Manager Credentials & Badges Box */}
          {managerBadges && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Assigned Ward Manager Credentials & Performance</span>
                </div>
                <span className="text-[10px] text-amber-300 font-mono font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                  ⭐ {managerBadges.feedback_rating} / 5.0 Rating
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
                <div>
                  <div className="font-bold text-white">{managerBadges.officer_name}</div>
                  <div className="text-[11px] text-slate-400">Department: {managerBadges.department}</div>
                </div>

                <div className="flex items-center space-x-3 text-[11px] text-slate-300">
                  <span>Action Speed: <b className="text-amber-400">⚡ {managerBadges.avg_response_time_hours}h</b></span>
                  <span>Rectified: <b className="text-emerald-400">🏆 {managerBadges.total_rectified} complaints</b></span>
                </div>
              </div>

              {/* Earned Badges Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {managerBadges.badges?.filter(b => b.earned).map(b => (
                  <span key={b.id} className="px-2 py-1 bg-slate-900 border border-slate-700 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 shadow-sm">
                    <span>{b.icon === 'Zap' ? '⚡' : b.icon === 'Rocket' ? '🚀' : b.icon === 'Trophy' ? '🏆' : b.icon === 'Star' ? '🌟' : b.icon === 'Shield' ? '🛡️' : '⭐'}</span>
                    <span>{b.title}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Step-by-Step Audit Timeline */}
          <div className="space-y-4 pt-2">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <History className="w-5 h-5 text-blue-400" />
              <span>Complaint Progress Audit Timeline</span>
            </h3>

            <div className="relative border-l-2 border-slate-800 ml-4 space-y-6 my-4">
              {timelineEvents.length === 0 ? (
                <p className="text-xs text-slate-400 ml-4">No recorded timeline events.</p>
              ) : (
                timelineEvents.map((evt) => (
                  <div key={evt.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-slate-900 shadow-md"></div>
                    <div className="text-xs font-bold text-white">{evt.event_type}</div>
                    <div className="text-xs text-slate-300 mt-0.5">{evt.description}</div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center space-x-2">
                      <span>By: <b>{evt.actor_name}</b> ({evt.actor_type})</span>
                      <span>•</span>
                      <span>{new Date(evt.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 overflow-hidden shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 px-2">
              <div className="text-sm font-bold text-white flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span>Complaint Photo Evidence - Full View</span>
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

export default ComplaintDetails;
