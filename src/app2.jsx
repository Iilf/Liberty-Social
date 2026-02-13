import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, Users, Inbox, MessageSquare, AlertTriangle, CheckCircle, 
  XCircle, Search, LogOut, Loader2, Lock, Shield, ChevronRight, Send, 
  Clock, Flag, UserX, Trash2, Crown, BadgeCheck, Activity, RefreshCw,
  Eye, AlertOctagon, Filter, ArrowLeft
} from 'lucide-react';

// --- CONFIGURATION ---
let SUPABASE_URL = "https://wcavpryumlohjccxiohq.supabase.co";
let SUPABASE_KEY = "sb_publishable_EoFH2MIrf4Xc1cJJaiAlHg_ct72t-ru";

try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
        SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || SUPABASE_KEY;
    }
} catch (e) {}

// --- SUB-COMPONENTS ---
const NavItem = ({ icon, label, active, onClick, badge }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-zinc-800 hover:text-slate-200'}`}>
        {icon} 
        <span className="text-sm font-semibold flex-1 text-left">{label}</span>
        {badge > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>}
    </button>
);

const RoleBadge = ({ role }) => {
    if (!role || role === 'civilian') return <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700">Civilian</span>;
    if (role === 'owner') return <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30 flex items-center gap-1 w-fit"><Crown size={12}/> Owner</span>;
    if (role === 'admin') return <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded border border-orange-500/30 flex items-center gap-1 w-fit"><Shield size={12}/> Admin</span>;
    if (role === 'moderator') return <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded border border-cyan-500/30 flex items-center gap-1 w-fit"><ShieldAlert size={12}/> Mod</span>;
    return <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700 uppercase">{role}</span>;
};

// --- MAIN DASHBOARD COMPONENT ---
export default function ModerationDashboard({ onExit }) {
  const [supabase, setSupabase] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [dataError, setDataError] = useState(null);
  
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Data States
  const [reports, setReports] = useState([]);
  const [reportFilter, setReportFilter] = useState('pending'); 
  const [inspectedReport, setInspectReport] = useState(null); 
  
  const [applications, setApplications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Staff Management (Owner)
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [staffResults, setStaffResults] = useState([]);

  const messagesEndRef = useRef(null);

  // 1. INIT SUPABASE
  useEffect(() => {
    if (supabase) return;
    const initClient = () => {
      if (window.supabase && !window._supabaseInstance) {
        window._supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      }
      if (window.supabase) setSupabase(window._supabaseInstance);
    };
    if (window.supabase) { initClient(); return; }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@supabase/supabase-js@2";
    script.async = true;
    script.onload = initClient;
    document.body.appendChild(script);
  }, [supabase]);

  // 2. AUTH FLOW
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      if (!session?.user) setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (!session?.user) { setCurrentUser(null); setAuthLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // 3. FETCH PROFILE
  useEffect(() => {
    if (!authUser || !supabase) return;
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
        if (error) throw error;
        setCurrentUser(data);
      } catch (err) { 
        console.error("Profile Error:", err);
        setAuthError("Failed to load profile.");
      } finally {
        setAuthLoading(false);
      }
    };
    fetchProfile();
  }, [authUser, supabase]);

  // 4. MAIN DATA LOADING
  const loadData = async () => {
    if (!supabase || !currentUser) return;
    setIsRefreshing(true);
    setDataError(null);
    try {
        // Reports
        const { data: reps, error: repErr } = await supabase.from('reports')
            .select(`*, profiles:reporter_id (name, username)`)
            .eq('status', reportFilter)
            .order('created_at', { ascending: false });
        if (repErr) throw repErr;
        setReports(reps || []);

        // Applications
        let appQuery = supabase.from('applications').select(`*, profiles:user_id (name, username, badges, global_role)`).eq('status', 'pending').order('created_at', { ascending: false });
        if (currentUser.global_role !== 'owner') {
            appQuery = appQuery.eq('type', 'verification');
        }
        const { data: apps, error: appErr } = await appQuery;
        if (appErr) throw appErr;
        setApplications(apps || []);

        // Tickets
        const { data: tix, error: tixErr } = await supabase.from('support_tickets').select('*').neq('status', 'closed').order('created_at', { ascending: false });
        if (tixErr) throw tixErr;
        setTickets(tix || []);

    } catch (err) {
        console.error("Data Load Error:", err);
        setDataError(err.message);
    } finally {
        setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser && ['owner', 'admin', 'moderator'].includes(currentUser.global_role)) {
        loadData();
    }
  }, [currentUser, supabase, reportFilter]); 

  // 5. CHAT LOGIC
  useEffect(() => {
      if (!activeTicket || !supabase) return;
      const loadMessages = async () => {
          const { data } = await supabase.from('support_messages').select(`*, profiles:sender_id (name, global_role)`).eq('ticket_id', activeTicket.id).order('created_at', { ascending: true });
          if (data) {
              setMessages(data);
              setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }
      };
      loadMessages();

      const msgSub = supabase.channel(`ticket_chat:${activeTicket.id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${activeTicket.id}` }, async (payload) => {
              const { data: sender } = await supabase.from('profiles').select('name, global_role').eq('id', payload.new.sender_id).single();
              setMessages(prev => [...prev, { ...payload.new, profiles: sender }]);
              setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }).subscribe();

      return () => supabase.removeChannel(msgSub);
  }, [activeTicket, supabase]);

  // HANDLERS
  const handleUpdateReport = async (id, newStatus) => {
      if(!window.confirm(`Mark report as ${newStatus}?`)) return;
      await supabase.from('reports').update({ status: newStatus }).eq('id', id);
      setReports(prev => prev.filter(r => r.id !== id));
      setInspectReport(null);
  };

  const handleInspectReport = async (report) => {
      if(!supabase) return;
      let content = null;
      let authorId = null;
      let authorName = "Unknown";

      try {
          if (report.target_type === 'post') {
             const { data } = await supabase.from('posts').select('content, uid, profiles(name, username)').eq('id', report.target_id).single();
             if(data) { content = data.content; authorId = data.uid; authorName = data.profiles?.username; }
          } else if (report.target_type === 'comment') {
             const { data } = await supabase.from('comments').select('content, user_id, profiles(name, username)').eq('id', report.target_id).single();
             if(data) { content = data.content; authorId = data.user_id; authorName = data.profiles?.username; }
          } else if (report.target_type === 'user') {
             const { data } = await supabase.from('profiles').select('name, username').eq('id', report.target_id).single();
             if(data) { content = "User Profile Report"; authorId = report.target_id; authorName = data.username; }
          }
      } catch (e) { console.error(e); }

      setInspectReport({ ...report, content_snapshot: content, target_author_id: authorId, target_author_name: authorName });
  };

  const handleWarnUser = async (userId) => {
      if (!supabase || !userId) return;
      if (!window.confirm("Issue a formal warning to this user?")) return;
      
      const { data } = await supabase.from('profiles').select('warning_count').eq('id', userId).single();
      const newCount = (data?.warning_count || 0) + 1;
      
      const { error } = await supabase.from('profiles').update({ warning_count: newCount }).eq('id', userId);
      
      if (error) alert("Failed to warn: " + error.message);
      else alert(`User warned. Total warnings: ${newCount}`);
  };

  const handleReviewApplication = async (app, action) => {
      if (action === 'approve') {
          if (app.type === 'verification') {
              const badges = app.profiles?.badges || [];
              if (!badges.includes('influencer')) await supabase.from('profiles').update({ badges: [...badges, 'influencer'] }).eq('id', app.user_id);
          } else if (app.type === 'staff' && currentUser.global_role === 'owner') {
              await supabase.from('profiles').update({ global_role: 'moderator' }).eq('id', app.user_id);
          }
      }
      await supabase.from('applications').update({ status: action === 'approve' ? 'approved' : 'rejected' }).eq('id', app.id);
      setApplications(prev => prev.filter(a => a.id !== app.id));
  };

  const handleSendReply = async () => {
      if (!replyText.trim() || !activeTicket) return;
      await supabase.from('support_messages').insert({ ticket_id: activeTicket.id, sender_id: authUser.id, content: replyText });
      setReplyText("");
  };

  const handleCloseTicket = async () => {
      if (!activeTicket || !window.confirm("Close this ticket?")) return;
      await supabase.from('support_tickets').update({ status: 'closed' }).eq('id', activeTicket.id);
      setTickets(prev => prev.filter(t => t.id !== activeTicket.id));
      setActiveTicket(null);
  };

  const handleSearchUser = async () => {
      if (!staffSearchQuery) return;
      const { data } = await supabase.from('profiles').select('*').ilike('username', `%${staffSearchQuery}%`).limit(10);
      setStaffResults(data || []);
  };

  const handleUpdateRole = async (userId, newRole) => {
      if (!window.confirm(`Change role to ${newRole || 'Civilian'}?`)) return;
      await supabase.from('profiles').update({ global_role: newRole }).eq('id', userId);
      setStaffResults(prev => prev.map(u => u.id === userId ? { ...u, global_role: newRole } : u));
  };

  // RENDERING
  if (authLoading) return <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-blue-500"><Loader2 className="w-10 h-10 animate-spin mb-4" /><p className="text-sm font-mono uppercase tracking-widest text-zinc-500">Establishing Secure Connection...</p></div>;

  // Note: We don't handle Login here anymore, as this is accessed via the Main App
  if (!authUser) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Session expired. Please return to the main app.</div>;

  const isStaff = currentUser && ['owner', 'admin', 'moderator'].includes(currentUser.global_role);
  const isOwner = currentUser?.global_role === 'owner';

  if (!isStaff) return <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center"><Lock className="w-16 h-16 text-red-500 mb-4"/><h1 className="text-3xl font-bold text-white">Access Denied</h1><p className="text-zinc-400 mt-2">Security Clearance insufficient.</p><button onClick={onExit} className="mt-6 bg-zinc-800 px-6 py-2 rounded-lg text-white">Return</button></div>;

  return (
      <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
          {/* SIDEBAR */}
          <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
              <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
                  <ShieldAlert className="w-8 h-8 text-blue-500" />
                  <div><h1 className="font-black text-lg tracking-tight">COMMAND</h1><p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold -mt-1">Terminal</p></div>
              </div>
              <div className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
                  <NavItem icon={<Activity size={18} />} label="Dashboard" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
                  <NavItem icon={<Flag size={18} />} label="Investigations" active={currentView === 'reports'} onClick={() => setCurrentView('reports')} badge={reports.length} />
                  <NavItem icon={<Inbox size={18} />} label="Applications" active={currentView === 'applications'} onClick={() => setCurrentView('applications')} badge={applications.length} />
                  <NavItem icon={<MessageSquare size={18} />} label="Active Calls" active={currentView === 'support'} onClick={() => setCurrentView('support')} badge={tickets.length} />
                  {isOwner && <div className="mt-6"><p className="text-[10px] font-bold uppercase text-zinc-500 px-4 mb-2">Owner Controls</p><NavItem icon={<Users size={18} />} label="Manage Staff" active={currentView === 'staff'} onClick={() => setCurrentView('staff')} /></div>}
              </div>
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                  <div className="min-w-0"><p className="text-sm font-bold text-white truncate">{currentUser.name}</p><RoleBadge role={currentUser.global_role} /></div>
                  <button onClick={onExit} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><ArrowLeft size={16}/> Exit</button>
              </div>
          </div>

          {/* CONTENT */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
              <div className="h-16 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-8 justify-between shrink-0">
                  <h2 className="text-lg font-bold capitalize">{currentView.replace('_', ' ')}</h2>
                  <button onClick={loadData} disabled={isRefreshing} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors"><RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""}/> Refresh Data</button>
              </div>

              {dataError && <div className="m-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-0">Error loading data: {dataError}</div>}

              <div className="flex-1 overflow-y-auto p-8 relative">
                  {currentView === 'dashboard' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4"><div className="bg-red-500/10 p-4 rounded-xl text-red-500"><Flag size={24}/></div><div><p className="text-zinc-400 text-sm font-semibold uppercase tracking-wider">Reports</p><p className="text-3xl font-black text-white">{reports.length}</p></div></div>
                          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4"><div className="bg-yellow-500/10 p-4 rounded-xl text-yellow-500"><Inbox size={24}/></div><div><p className="text-zinc-400 text-sm font-semibold uppercase tracking-wider">Applications</p><p className="text-3xl font-black text-white">{applications.length}</p></div></div>
                          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4"><div className="bg-green-500/10 p-4 rounded-xl text-green-500"><MessageSquare size={24}/></div><div><p className="text-zinc-400 text-sm font-semibold uppercase tracking-wider">Tickets</p><p className="text-3xl font-black text-white">{tickets.length}</p></div></div>
                      </div>
                  )}

                  {currentView === 'reports' && (
                      <div className="max-w-4xl mx-auto space-y-6">
                          <div className="flex gap-2 border-b border-zinc-800 pb-4">
                              {['pending', 'resolved', 'dismissed'].map(s => (
                                  <button key={s} onClick={() => setReportFilter(s)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${reportFilter === s ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}>{s}</button>
                              ))}
                          </div>

                          {reports.length === 0 ? <p className="text-center text-zinc-500 py-10">No reports found in {reportFilter}.</p> : reports.map(r => (
                              <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                                  <div className="p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                                      <div>
                                          <div className="flex items-center gap-2 mb-2"><span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded font-bold uppercase border border-red-500/30">Target: {r.target_type}</span><span className="text-zinc-400 text-sm">Reported by: <span className="text-white">@{r.profiles?.username || 'unknown'}</span></span></div>
                                          <p className="text-zinc-300 font-medium">Reason: {r.reason}</p>
                                          <p className="text-xs text-zinc-500 mt-1 font-mono">ID: {r.target_id}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          {r.status === 'pending' && (
                                              <>
                                                  <button onClick={() => handleInspectReport(r)} className="bg-zinc-800 hover:bg-blue-600/20 hover:text-blue-400 border border-zinc-700 hover:border-blue-500/50 text-zinc-300 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Eye size={14}/> Inspect</button>
                                                  <button onClick={() => handleUpdateReport(r.id, 'resolved')} className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 px-4 py-2 rounded-lg text-xs font-bold">Resolve</button>
                                                  <button onClick={() => handleUpdateReport(r.id, 'dismissed')} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 px-4 py-2 rounded-lg text-xs font-bold">Dismiss</button>
                                              </>
                                          )}
                                          {r.status !== 'pending' && <span className="text-xs uppercase font-bold text-zinc-500 bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">{r.status}</span>}
                                      </div>
                                  </div>
                                  
                                  {/* Inspection View */}
                                  {inspectedReport?.id === r.id && (
                                      <div className="bg-zinc-950 border-t border-zinc-800 p-5 animate-in slide-in-from-top-2">
                                          <h4 className="text-xs font-bold uppercase text-zinc-500 mb-2">Content Snapshot</h4>
                                          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-sm text-zinc-300 mb-4 whitespace-pre-wrap">{inspectedReport.content_snapshot || "Content not found or deleted."}</div>
                                          <div className="flex gap-3 pt-2 border-t border-zinc-800">
                                              <button onClick={() => handleWarnUser(inspectedReport.target_author_id)} disabled={!inspectedReport.target_author_id} className="flex-1 bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-500 border border-yellow-900/50 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2"><AlertTriangle size={14}/> Warn Accused (@{inspectedReport.target_author_name})</button>
                                              <button onClick={() => handleWarnUser(r.reporter_id)} className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2"><AlertOctagon size={14}/> Warn Reporter (False Report)</button>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  )}

                  {currentView === 'applications' && (
                      <div className="max-w-4xl mx-auto space-y-4">
                          {applications.length === 0 ? <p className="text-center text-zinc-500 py-10">No pending apps.</p> : applications.map(app => (
                              <div key={app.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-start md:items-center relative">
                                  <div className="relative z-10"><div className="flex items-center gap-2 mb-2">{app.type === 'verification' ? <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded font-bold uppercase border border-yellow-500/30 flex items-center gap-1"><BadgeCheck size={12}/> Influencer</span> : <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded font-bold uppercase border border-blue-500/30 flex items-center gap-1"><Shield size={12}/> Staff</span>}<span className="text-white font-bold">{app.profiles?.name} <span className="text-zinc-500 font-normal">(@{app.profiles?.username})</span></span></div><p className="text-zinc-300 text-sm bg-zinc-950 p-3 rounded-lg border border-zinc-800 mt-2 font-mono">{app.content}</p></div>
                                  <div className="flex gap-2 shrink-0 z-10"><button onClick={() => handleReviewApplication(app, 'reject')} className="p-2 bg-zinc-800 hover:bg-red-500/20 text-red-400 rounded-lg"><XCircle size={20}/></button><button onClick={() => handleReviewApplication(app, 'approve')} className="p-2 bg-zinc-800 hover:bg-green-500/20 text-green-400 rounded-lg"><CheckCircle size={20}/></button></div>
                              </div>
                          ))}
                      </div>
                  )}

                  {currentView === 'support' && (
                      <div className="absolute inset-4 md:inset-8 flex gap-4">
                          <div className="w-1/3 min-w-[250px] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
                              <div className="p-4 border-b border-zinc-800 bg-zinc-950/50"><h3 className="font-bold text-zinc-300 text-sm uppercase">Open Calls ({tickets.length})</h3></div>
                              <div className="flex-1 overflow-y-auto p-2 space-y-1">{tickets.map(t => (<button key={t.id} onClick={() => setActiveTicket(t)} className={`w-full text-left p-3 rounded-xl transition-colors ${activeTicket?.id === t.id ? 'bg-blue-600' : 'hover:bg-zinc-800'}`}><p className="font-bold text-sm text-white">{t.user_name || 'User'}</p><p className="text-xs text-zinc-400 mt-1"><Clock size={10} className="inline mr-1"/>{new Date(t.created_at).toLocaleTimeString()}</p></button>))}</div>
                          </div>
                          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
                              {activeTicket ? (
                                  <><div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center"><p className="font-bold text-white">{activeTicket.user_name}</p><button onClick={handleCloseTicket} className="text-xs bg-zinc-800 text-red-400 px-3 py-1.5 rounded-lg font-bold">Close Call</button></div><div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/30">{messages.map(m => (<div key={m.id} className={`flex flex-col max-w-[80%] ${m.profiles?.global_role && m.profiles.global_role !== 'civilian' ? 'ml-auto items-end' : 'items-start'}`}><span className="text-[10px] text-zinc-500 mb-1 ml-1">{m.profiles?.name}</span><div className={`p-3 rounded-2xl text-sm ${m.profiles?.global_role && m.profiles.global_role !== 'civilian' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-200'}`}>{m.content}</div></div>))}<div ref={messagesEndRef} /></div><div className="p-4 bg-zinc-950 border-t border-zinc-800 flex gap-2"><input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendReply()} placeholder="Type dispatch response..." className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-white outline-none" /><button onClick={handleSendReply} className="bg-blue-600 text-white p-2.5 rounded-xl"><Send size={18}/></button></div></>
                              ) : (<div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500"><MessageSquare size={48} className="mb-4 opacity-20" /><p>Select a call.</p></div>)}
                          </div>
                      </div>
                  )}

                  {currentView === 'staff' && isOwner && (
                      <div className="max-w-4xl mx-auto">
                          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mb-6 flex gap-2"><input value={staffSearchQuery} onChange={e => setStaffSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchUser()} placeholder="Search username..." className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none" /><button onClick={handleSearchUser} className="bg-blue-600 text-white px-6 rounded-xl font-bold">Search</button></div>
                          <div className="space-y-3">{staffResults.map(u => (<div key={u.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex justify-between items-center"><div><p className="font-bold text-white">{u.name}</p><RoleBadge role={u.global_role} /></div><div className="flex gap-2">{u.global_role !== 'owner' && (<>{u.global_role !== 'admin' && <button onClick={() => handleUpdateRole(u.id, 'admin')} className="bg-orange-500/10 text-orange-400 px-3 py-1.5 rounded-lg text-xs font-bold">Admin</button>}{u.global_role !== 'moderator' && <button onClick={() => handleUpdateRole(u.id, 'moderator')} className="bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-lg text-xs font-bold">Mod</button>}<button onClick={() => handleUpdateRole(u.id, null)} className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold">Demote</button></>)}</div></div>))}</div>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
}
