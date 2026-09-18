import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import SLATimer from '../components/SLATimer';
import MapPicker from '../components/MapPicker';
import TeluguVoiceRecorder from '../components/TeluguVoiceRecorder';
import CitizenChatbot from '../components/CitizenChatbot';
import { complaintAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { FileText, Send, MapPin, CheckCircle, Clock, Upload, Star, Globe, Image as ImageIcon, Maximize2, X, Eye } from 'lucide-react';

const CitizenPortal = () => {
  const { language, setLanguage, t } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department_id: 1,
    priority: 'MEDIUM',
    ward_id: 'WARD-01',
    language: 'Telugu',
    latitude: 17.3850,
    longitude: 78.4867,
    address: 'Hyderguda, Hyderabad, Telangana'
  });

  const [mediaFile, setMediaFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [previewModalImg, setPreviewModalImg] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [selectedForFeedback, setSelectedForFeedback] = useState(null);
  const [submittedSuccessTicket, setSubmittedSuccessTicket] = useState(null);

  const fetchUserComplaints = async () => {
    try {
      const res = await complaintAPI.list({ citizen_id: 1 });
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUserComplaints();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTeluguAutoFill = (aiResult) => {
    let deptId = 1;
    const deptStr = String(aiResult.detected_department || '').toUpperCase();
    if (deptStr.includes('ROAD')) deptId = 2;
    else if (deptStr.includes('ELEC')) deptId = 3;
    else if (deptStr.includes('HEALTH') || deptStr.includes('SANIT')) deptId = 4;
    else if (deptStr.includes('PLAN')) deptId = 5;

    setFormData((prev) => ({
      ...prev,
      title: aiResult.english_translation || 'Civic Service Complaint',
      description: `[Telugu Transcript]: ${aiResult.telugu_transcript || ''}\n[English Summary]: ${aiResult.english_translation || ''}`,
      department_id: deptId,
      priority: aiResult.priority || 'HIGH'
    }));

    setShowForm(true);

    setTimeout(() => {
      const formElem = document.getElementById('new-complaint-form');
      if (formElem) {
        formElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    const wardManagerNames = {
      'WARD-01': 'Manager Abhi',
      'WARD-02': 'Manager Janu',
      'WARD-03': 'Manager Teja',
      'WARD-04': 'Manager Ravi',
      'WARD-05': 'Manager Srinu'
    };

    try {
      const res = await complaintAPI.create({
        ...formData,
        service_id: 1,
        speech_audio_url: mediaFile ? mediaFile.name : null,
        image_url: imageUrl || null
      });

      const newTicketObj = res.data || {
        complaint_number: 'GVMC-TICKET',
        title: formData.title,
        ward_id: formData.ward_id,
        status: 'ASSIGNED',
        priority: formData.priority
      };

      newTicketObj.manager_name = wardManagerNames[formData.ward_id] || 'Manager Abhi';
      setSubmittedSuccessTicket(newTicketObj);
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        department_id: 1,
        priority: 'MEDIUM',
        ward_id: 'WARD-01',
        language: 'Telugu',
        latitude: 17.3850,
        longitude: 78.4867,
        address: 'Hyderguda, Hyderabad, Telangana'
      });
      setMediaFile(null);
      setImageUrl('');
      fetchUserComplaints();
    } catch (err) {
      console.warn('Backend API unavailable, saving complaint locally:', err);
      const ticketHex = Math.random().toString(36).substring(2, 6).toUpperCase();
      const newTicketNum = `GVMC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${ticketHex}`;
      const wardManagerMap = {
        'WARD-01': 1, // Manager Abhi (Ward 1)
        'WARD-02': 2, // Manager Janu (Ward 2)
        'WARD-03': 3, // Manager Teja (Ward 3)
        'WARD-04': 4, // Manager Ravi (Ward 4)
        'WARD-05': 5  // Manager Srinu (Ward 5)
      };
      const assignedOffId = wardManagerMap[formData.ward_id] || 1;

      const newComplaint = {
        id: Date.now(),
        complaint_number: newTicketNum,
        citizen_id: 1,
        department_id: formData.department_id,
        service_id: 1,
        ward_id: formData.ward_id,
        title: formData.title,
        description: formData.description,
        language: formData.language || 'Telugu',
        status: 'ASSIGNED',
        priority: formData.priority || 'MEDIUM',
        priority_score: 85.0,
        sla_deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        assigned_officer_id: assignedOffId,
        manager_name: wardManagerNames[formData.ward_id] || 'Manager Abhi',
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address,
        image_url: imageUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const existingCached = JSON.parse(localStorage.getItem('my_complaints') || '[]');
      localStorage.setItem('my_complaints', JSON.stringify([newComplaint, ...existingCached]));

      setComplaints((prev) => [newComplaint, ...prev]);
      setSubmittedSuccessTicket(newComplaint);
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        department_id: 1,
        priority: 'MEDIUM',
        ward_id: 'WARD-01',
        language: 'Telugu',
        latitude: 17.3850,
        longitude: 78.4867,
        address: 'Hyderguda, Hyderabad, Telangana'
      });
      setMediaFile(null);
      setImageUrl('');
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!selectedForFeedback) return;
    try {
      await complaintAPI.submitFeedback({
        complaint_id: selectedForFeedback.id,
        rating: feedbackRating,
        comments: feedbackNotes,
        verified_resolved: true
      });

      setSelectedForFeedback(null);
      fetchUserComplaints();
      alert(t('alerts.feedback_success'));
    } catch (err) {
      alert(t('alerts.feedback_error'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Prominent Citizen Language Selection Bar */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
            <Globe className="w-5 h-5 text-blue-400" />
            <span>{t('navbar.languages_bar_label')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm transition font-semibold ${
                language === 'en'
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('te')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm transition font-semibold ${
                language === 'te'
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              తెలుగు (Telugu)
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm transition font-semibold ${
                language === 'hi'
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              हिन्दी (Hindi)
            </button>
          </div>
        </div>

        {/* Banner with Live System Indicator */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-blue-500/20 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-bold border border-blue-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>LIVE GOVERNANCE SYSTEM • AI SLA ESCALATION ACTIVE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
              {t('banner.title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t('banner.subtitle')}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
              <div className="flex items-center space-x-1.5 text-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>Ward Allocation: <b>5 Municipal Wards</b></span>
              </div>
              <div className="flex items-center space-x-1.5 text-blue-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>SLA Speed: <b>2h to 24h Limits</b></span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center space-x-2 shrink-0 border border-blue-400/30 text-sm"
          >
            <FileText className="w-5 h-5 text-blue-200" />
            <span>{showForm ? t('banner.close_form') : t('banner.new_complaint')}</span>
          </button>
        </div>

        {/* Voice Recorder Widget */}
        <TeluguVoiceRecorder onAutoFill={handleTeluguAutoFill} />

        {/* New Complaint Form */}
        {showForm && (
          <div id="new-complaint-form" className="bg-slate-900 text-white rounded-3xl shadow-2xl p-6 border border-slate-800 space-y-4 ring-2 ring-blue-500/30">
            <h3 className="text-lg font-bold border-b border-slate-800 pb-3">{t('form.heading')}</h3>
            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.title_label')}</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('form.title_placeholder')}
                  className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.description_label')}</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('form.description_placeholder')}
                  className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.department_label')}</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  >
                    <option value={1}>{t('departments.1')} ➔ Manager Abhi</option>
                    <option value={2}>{t('departments.2')} ➔ Manager Teja</option>
                    <option value={3}>{t('departments.3')} ➔ Manager Janu</option>
                    <option value={4}>{t('departments.4')} ➔ Manager Ravi</option>
                    <option value={5}>{t('departments.5')} ➔ Manager K. Suresh Rao</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.priority_label')}</label>
                  <select
                    value={formData.priority || 'MEDIUM'}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  >
                    <option value="CRITICAL">{t('priorities.CRITICAL')}</option>
                    <option value="HIGH">{t('priorities.HIGH')}</option>
                    <option value="MEDIUM">{t('priorities.MEDIUM')}</option>
                    <option value="LOW">{t('priorities.LOW')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('form.ward_label')}</label>
                  <select
                    value={formData.ward_id}
                    onChange={(e) => setFormData({ ...formData, ward_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-blue-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
                  >
                    <option value="WARD-01">WARD-01 (Charminar East) ➔ Assigned Manager: Abhi</option>
                    <option value="WARD-02">WARD-02 (Banjara Hills) ➔ Assigned Manager: Janu</option>
                    <option value="WARD-03">WARD-03 (Hitec City North) ➔ Assigned Manager: Teja</option>
                    <option value="WARD-04">WARD-04 (Secunderabad Central) ➔ Assigned Manager: Ravi</option>
                    <option value="WARD-05">WARD-05 (Kukatpally Industrial) ➔ Assigned Manager: Srinu</option>
                  </select>
                </div>
              </div>

              {/* Ward-to-Manager Routing Callout */}
              <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                <span>🎯 <b>Smart Ward Routing</b>: Complaint will automatically go to assigned Manager for selected Ward:</span>
                <span className="font-bold px-3 py-1 bg-emerald-600 text-white rounded-lg shadow-sm">
                  {
                    formData.ward_id === 'WARD-01' ? 'Manager Abhi' :
                    formData.ward_id === 'WARD-02' ? 'Manager Janu' :
                    formData.ward_id === 'WARD-03' ? 'Manager Teja' :
                    formData.ward_id === 'WARD-04' ? 'Manager Ravi' : 'Manager Srinu'
                  }
                </span>
              </div>

              {/* Upload Image / Media Proof with Live Preview */}
              <div className="space-y-3 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                <label className="block text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  <span>Attach Image / Photo Evidence *</span>
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer px-4 py-2.5 bg-blue-950 hover:bg-blue-900 border border-blue-500/40 text-blue-200 text-xs font-bold rounded-xl transition flex items-center space-x-2 shadow-md">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>Upload Image File from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  {/* Preset Sample Civic Issue Photos */}
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                    <span>Or pick sample photo:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const sampleUrl = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80";
                        setImageUrl(sampleUrl);
                        setMediaFile({ name: "pothole_road.jpg" });
                      }}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg font-medium text-[11px] transition"
                    >
                      🚧 Pothole / Road
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const sampleUrl = "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80";
                        setImageUrl(sampleUrl);
                        setMediaFile({ name: "water_pipeline.jpg" });
                      }}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg font-medium text-[11px] transition"
                    >
                      💧 Water Leakage
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const sampleUrl = "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80";
                        setImageUrl(sampleUrl);
                        setMediaFile({ name: "street_light.jpg" });
                      }}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg font-medium text-[11px] transition"
                    >
                      💡 Streetlight
                    </button>
                  </div>
                </div>

                {/* Attached Image Live Preview Thumbnail Box */}
                {imageUrl && (
                  <div className="relative group rounded-xl overflow-hidden border border-emerald-500/40 bg-emerald-950/20 p-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={imageUrl}
                        alt="Uploaded preview"
                        className="w-20 h-16 object-cover rounded-lg border border-emerald-500/30 cursor-pointer shadow-md"
                        onClick={() => setPreviewModalImg(imageUrl)}
                      />
                      <div>
                        <div className="text-xs font-bold text-emerald-300 flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Image Attached Successfully!</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {mediaFile?.name || "Attached_photo.jpg"}
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewModalImg(imageUrl)}
                          className="text-[10px] text-blue-400 hover:underline font-semibold mt-0.5 flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Click to Preview Full Image</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setMediaFile(null);
                      }}
                      className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SLA Time Limit Preview Badge */}
              <div className="p-3.5 bg-blue-950/60 border border-blue-500/40 rounded-xl flex items-center justify-between text-xs text-blue-300">
                <span className="font-medium">{t('form.sla_preview_title')}</span>
                <span className="font-bold px-3 py-1 bg-blue-600 text-white rounded-lg shadow-sm">
                  {
                    (() => {
                      const matrix = {
                        1: { CRITICAL: '4 Hours', HIGH: '12 Hours', MEDIUM: '24 Hours', LOW: '48 Hours' },
                        2: { CRITICAL: '6 Hours', HIGH: '24 Hours', MEDIUM: '48 Hours', LOW: '72 Hours' },
                        3: { CRITICAL: '2 Hours', HIGH: '6 Hours', MEDIUM: '12 Hours', LOW: '24 Hours' },
                        4: { CRITICAL: '6 Hours', HIGH: '12 Hours', MEDIUM: '24 Hours', LOW: '48 Hours' },
                        5: { CRITICAL: '12 Hours', HIGH: '24 Hours', MEDIUM: '48 Hours', LOW: '96 Hours' }
                      };
                      return matrix[formData.department_id]?.[formData.priority || 'MEDIUM'] || '24 Hours';
                    })()
                  }
                </span>
              </div>

              {/* Map Location Picker */}
              <MapPicker
                lat={formData.latitude}
                lng={formData.longitude}
                onChangeLocation={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
              />

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-md transition flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{t('form.submit_button')}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* User Complaint Tracking Queue */}
        <div id="my-complaints-section" className="bg-slate-900 text-white rounded-3xl shadow-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold border-b border-slate-800 pb-3">
            {t('tracking.heading')}
          </h3>

          {complaints.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">{t('tracking.no_complaints')}</p>
          ) : (
            <div className="space-y-4">
              {complaints.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition bg-slate-950/80 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold bg-blue-950 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-md">
                        {c.complaint_number}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-200">
                        {t('status.' + c.status) || c.status}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.priority === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30'}`}>
                        {t('priorities.' + c.priority + '_short') || `${c.priority} Priority`}
                      </span>
                    </div>

                    <SLATimer deadline={c.sla_deadline} />
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base">{c.title}</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{c.description}</p>
                  </div>

                  {/* Attached Image Evidence */}
                  {c.image_url && (
                    <div className="mt-2 relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-900 p-2 space-y-1">
                      <div className="text-[11px] font-bold text-blue-400 flex items-center space-x-1">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Attached Photo Evidence</span>
                      </div>
                      <div
                        onClick={() => setPreviewModalImg(c.image_url)}
                        className="relative rounded-lg overflow-hidden bg-black/40 border border-slate-800 cursor-pointer max-h-40 flex items-center justify-center group"
                      >
                        <img
                          src={c.image_url}
                          alt="Complaint evidence"
                          className="w-full h-36 object-cover rounded-lg group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold text-white space-x-1">
                          <Maximize2 className="w-4 h-4 text-blue-400" />
                          <span>Click to Zoom Photo</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span>{c.address || t('wards.' + c.ward_id) || c.ward_id}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <a
                        href={`/complaint/${c.id}`}
                        className="px-3 py-1 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-500/30 rounded-lg font-medium transition"
                      >
                        View Audit Timeline
                      </a>

                      {c.status === 'RESOLVED' && (
                        <button
                          onClick={() => setSelectedForFeedback(c)}
                          className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 rounded-lg font-medium transition flex items-center space-x-1"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>{t('tracking.rate_resolution')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feedback Modal */}
        {selectedForFeedback && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 text-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-800 space-y-4">
              <h3 className="text-lg font-bold">{t('feedback_modal.heading')}</h3>
              <p className="text-xs text-slate-400">
                {t('feedback_modal.subtitle')} #{selectedForFeedback.complaint_number}
              </p>

              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('feedback_modal.rating_label')}</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className={`p-2 rounded-xl transition ${
                          feedbackRating >= star ? 'text-amber-400 bg-amber-950/60' : 'text-slate-600 bg-slate-950'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('feedback_modal.comments_label')}</label>
                  <textarea
                    rows={3}
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    placeholder={t('feedback_modal.comments_placeholder')}
                    className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedForFeedback(null)}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-semibold"
                  >
                    {t('feedback_modal.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow"
                  >
                    {t('feedback_modal.submit')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <CitizenChatbot />
      </main>

      {/* Image Preview Lightbox Modal */}
      {previewModalImg && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 overflow-hidden shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 px-2">
              <div className="text-sm font-bold text-white flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span>Attached Photo Evidence - Full View</span>
              </div>
              <button
                onClick={() => setPreviewModalImg(null)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center items-center max-h-[75vh] overflow-hidden rounded-2xl bg-black">
              <img
                src={previewModalImg}
                alt="Full evidence"
                className="max-h-[75vh] max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL */}
      {submittedSuccessTicket && (
        <div id="submitted-success-modal" className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 shadow-2xl space-y-5 text-center text-white ring-2 ring-emerald-500/30">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-400/40 animate-bounce">
              <CheckCircle className="w-9 h-9" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-white">Complaint Registered Successfully!</h3>
              <p className="text-xs text-slate-400">Your civic complaint has been logged and assigned to the Ward Manager desk.</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs text-left">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Ticket Number:</span>
                <span className="font-mono font-bold text-amber-300 text-sm">{submittedSuccessTicket.complaint_number}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Assigned Manager:</span>
                <span className="font-bold text-emerald-300">{submittedSuccessTicket.manager_name || 'Manager Abhi'} ({submittedSuccessTicket.ward_id})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Target SLA Limit:</span>
                <span className="font-bold text-blue-300">Resolved within 12h - 24h</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSubmittedSuccessTicket(null);
                setTimeout(() => {
                  const trackElem = document.getElementById('my-complaints-section');
                  if (trackElem) {
                    trackElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 text-sm"
            >
              <span>View Complaint in Tracking List ➔</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenPortal;
