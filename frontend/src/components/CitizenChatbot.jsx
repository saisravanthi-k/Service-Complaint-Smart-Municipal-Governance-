import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles, Shield, BookOpen, Clock, AlertTriangle, Scale, HelpCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const CitizenChatbot = () => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Initial welcome message
  const getWelcomeMessage = () => {
    if (language === 'te') {
      return "నమస్తే! నేను GVMC పౌర హక్కుల & మున్సిపల్ సహాయక బాట్ (Citizen Rights Bot). మీ పౌర హక్కులు, SLA సమయపరిమితులు, ఆటోమేటిక్ ఎస్కలేషన్ రూల్స్ మరియు ఫిర్యాదుల విధానం గురించి నన్ను అడగండి.";
    } else if (language === 'hi') {
      return "नमस्ते! मैं जीवीएमसी नागरिक अधिकार और नगरपालिका सहायक बॉट हूँ। आप मुझसे अपने नागरिक अधिकारों, एसएलए समय सीमा, स्वचालित वृद्धि नियमों और शिकायत दर्ज करने के बारे में पूछ सकते हैं।";
    }
    return "Welcome to GVMC Citizen Rights & Municipal Assistant Bot! Ask me about your Citizen Rights Charter, SLA Time Limits, Automatic Escalation Rules, Manager Accountability, or how to file complaints using Voice AI.";
  };

  // Quick Action Topic Buttons
  const topicButtons = [
    { id: 'rights', icon: Shield, label: language === 'te' ? '📜 పౌర హక్కుల చార్టర్' : language === 'hi' ? '📜 नागरिक अधिकार चार्टर' : '📜 Citizen Rights Charter' },
    { id: 'sla', icon: Clock, label: language === 'te' ? '⏱️ SLA సమయ పరిమితులు' : language === 'hi' ? '⏱️ SLA समय सीमाएं' : '⏱️ SLA Time Limits' },
    { id: 'escalate', icon: AlertTriangle, label: language === 'te' ? '🚨 ఎస్కలేషన్ నియమాలు' : language === 'hi' ? '🚨 ऑटो एस्केलेशन नियम' : '🚨 Escalation Rules' },
    { id: 'compensation', icon: Scale, label: language === 'te' ? '⚖️ జాప్యం & జవాబుదారీతనం' : language === 'hi' ? '⚖️ विलंब और जवाबदेही' : '⚖️ Delay & Accountability' },
    { id: 'voice', icon: Sparkles, label: language === 'te' ? '🎤 వాయిస్ ఏఐ ఫిర్యాదు' : language === 'hi' ? '🎤 वॉयस एआई शिकायत' : '🎤 Voice AI Complaints' }
  ];

  const handleTopicClick = (topicId) => {
    let topicText = '';
    if (topicId === 'rights') topicText = 'What are my Citizen Rights under GVMC Municipal By-Laws?';
    else if (topicId === 'sla') topicText = 'What are the SLA time limits for water, roads, electricity, and health?';
    else if (topicId === 'escalate') topicText = 'How does automatic 30-minute and 1-hour escalation work?';
    else if (topicId === 'compensation') topicText = 'What are my rights if a manager delays my complaint resolution?';
    else if (topicId === 'voice') topicText = 'How do I use Telugu Voice AI to register a complaint?';

    processUserInput(topicText);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const txt = input;
    setInput('');
    processUserInput(txt);
  };

  const processUserInput = (userText) => {
    const userMsg = { sender: 'user', text: userText };
    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const lower = userText.toLowerCase();
      let botResponse = '';

      if (['right', 'rights', 'charter', 'హక్కులు', 'అధికారం', 'అధికారాలు', 'अधिकार', 'कानून'].some(k => lower.includes(k))) {
        botResponse = "📜 GVMC CITIZEN RIGHTS CHARTER:\n• Right to Safe Water: Emergency pipeline leaks must be addressed within 4 hours.\n• Right to Pothole-Free Roads: Hazardous main road potholes must be repaired within 24-48 hours.\n• Right to 24/7 Power Grid Support: Transformer faults must be inspected within 2 hours.\n• Right to Waste Sanitation: Unattended garbage dumps must be cleared within 12-24 hours.\n• Right to Transparent Audit Timeline: Every citizen can view step-by-step progression log from creation to resolution.";
      } else if (['sla', 'limit', 'deadline', 'time', 'కాలావధి', 'గడువు', 'समय', 'अवधि'].some(k => lower.includes(k))) {
        botResponse = "⏱️ GVMC DEPARTMENT SLA TIME LIMIT MATRIX:\n• ⚡ Electricity Grid: Critical: 2 hrs | High: 6 hrs | Medium: 12 hrs\n• 💧 Water Supply & Sanitation: Critical: 4 hrs | High: 12 hrs | Medium: 24 hrs\n• 🧹 Public Health & Waste: High: 12 hrs | Medium: 24 hrs | Low: 48 hrs\n• 🛣️ Roads & Infrastructure: Critical: 6 hrs | High: 24 hrs | Medium: 48 hrs\n• 🏢 Town Planning: High: 24 hrs | Medium: 48 hrs | Low: 72 hrs";
      } else if (['escalat', 'admin', 'commissioner', 'delay', 'ఎస్కలేషన్', 'జాప్యం', 'అధికారి', 'अधिकारी', 'शिकायत'].some(k => lower.includes(k))) {
        botResponse = "🚨 AUTOMATIC MULTI-LEVEL ESCALATION ENGINE:\n1. SLA Breach: Once the SLA deadline is missed, the status becomes 'SLA Violated' and instant SMS/Email alerts go to the Manager & Admin.\n2. 30-Minute Manager Rule: If the assigned Manager fails to submit a valid delay reason within 30 minutes, ticket auto-escalates to 'Escalated' with Admin alert.\n3. 1-Hour Commissioner Rule: If unaddressed after 1 hour post-breach, it escalates directly to the Municipal Commissioner's Desk for high-level intervention.";
      } else if (['compensat', 'penalt', 'accountab', 'లేట్', 'రూల్స్', 'जवाबदेही', 'जुर्माना'].some(k => lower.includes(k))) {
        botResponse = "⚖️ MANAGER ACCOUNTABILITY & CITIZEN REMEDIES:\n• Managers MUST provide valid reasons (e.g., Heavy rainfall, Material unavailable) for review by the Admin Console.\n• Admin can Reject unsatisfactory delay reasons or Reassign the ticket to another manager.\n• Monthly Manager Performance Leaderboards track on-time resolution rates (%) to ensure maximum public accountability.";
      } else if (['voice', 'telugu', 'speak', 'వాయిస్', 'మాట్లాడి', 'बोल', 'आवाज'].some(k => lower.includes(k))) {
        botResponse = "🎤 HOW TO FILE A VOICE COMPLAINT:\n1. Click the Record Audio button on the Citizen Portal.\n2. Speak your complaint naturally in Telugu, Hindi, or English.\n3. OpenAI Whisper STT transcribes your voice, automatically translates to English, predicts priority, and detects the target department!\n4. Select your Ward (WARD-01 to WARD-05) to automatically route your complaint to the assigned Ward Manager!";
      } else {
        botResponse = "🤖 I am here to assist with GVMC Citizen Rights! You can ask me about:\n• Citizen Rights Charter & By-Laws\n• SLA Time Limits by Department\n• 30-Min & 1-Hour Automatic Escalation Workflow\n• Ward Manager Assignment & Routing\n• How to file complaints via Telugu Voice AI";
      }

      setMessages((prev) => [...prev, { sender: 'bot', text: botResponse }]);
    }, 500);
  };

  const displayedMessages = messages.length > 0 ? messages : [{ sender: 'bot', text: getWelcomeMessage() }];

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white p-4 rounded-full shadow-2xl flex items-center justify-center space-x-2 transition transform hover:scale-105 active:scale-95 border border-white/20"
      >
        <Shield className="w-6 h-6 text-amber-300 animate-pulse" />
        <span className="font-bold text-xs hidden sm:inline tracking-wide">
          {language === 'te' ? 'పౌర హక్కుల బాట్' : language === 'hi' ? 'नागरिक अधिकार बॉट' : 'Citizen Rights Bot'}
        </span>
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2.5rem)] bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700 z-50 flex flex-col h-[540px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-blue-600 text-white flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight flex items-center space-x-1">
                  <span>GVMC Citizen Rights Bot</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h4>
                <p className="text-[10px] text-slate-400">Civic Rights • SLA Rules • Manager Accountability</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Topic Chips */}
          <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex overflow-x-auto space-x-1.5 scrollbar-none">
            {topicButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleTopicClick(btn.id)}
                className="shrink-0 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white text-[11px] font-semibold transition border border-slate-700"
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/90">
            {displayedMessages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-2 ${m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${m.sender === 'user' ? 'bg-blue-600' : 'bg-gradient-to-tr from-amber-500 to-blue-600 text-white'}`}>
                  {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div
                  className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none font-medium shadow'
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700 shadow-md'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={language === 'te' ? 'హక్కులు లేదా SLA గురించి అడగండి...' : language === 'hi' ? 'अधिकारों या एसएलए के बारे में पूछें...' : 'Ask about your Rights, SLA, or Rules...'}
              className="flex-1 bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 font-medium"
            />
            <button
              onClick={handleSend}
              className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition shadow"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CitizenChatbot;
