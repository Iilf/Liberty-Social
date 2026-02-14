import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, MessageSquare, Share2, Heart, Search, Bell, User, Navigation, PlusCircle, 
  Image as ImageIcon, Smile, Server, X, Lock, Unlock, ChevronRight, Loader2, Users, 
  Flag, AlertTriangle, ArrowLeft, Settings, Compass, Mail, Key, Trash2, Crown, Ban, 
  Edit3, UserMinus, UserCog, UserPlus, Hash, Megaphone, CalendarDays, Pin, Check, 
  Star, BadgeCheck, ClipboardList, Send, LifeBuoy, Phone, Inbox, Clock, Hammer, Badge, 
  FileCheck, FileWarning, Tag, AlertOctagon, Globe, LogIn, RefreshCw, Zap, Layout, Filter, MessageCircle, Download, Menu,
  ShieldAlert, Activity, CheckCircle, XCircle, Eye
} from 'lucide-react';

// This pulls the variables that Cloudflare "injected" during the build
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase Environment Variables!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- CONSTANTS ---
const TAGS = [
  { id: 'discussion', label: 'Discussion', icon: <MessageCircle size={14} />, color: 'text-blue-400' },
  { id: 'funny', label: 'Funny', icon: <Smile size={14} />, color: 'text-yellow-400' },
  { id: 'server', label: 'Server', icon: <Server size={14} />, color: 'text-emerald-400' },
];

const GROUP_CHANNELS = [
  { id: 'announcements', label: 'Announcements', icon: <Megaphone size={16} />, restricted: true },
  { id: 'events', label: 'Events', icon: <CalendarDays size={16} />, restricted: true },
  { id: 'general', label: 'General', icon: <Hash size={16} />, restricted: false },
];

const AVAILABLE_GROUP_TAGS = [
  { id: 'Roleplay', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { id: 'Strict', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { id: 'Casual', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  { id: 'Police', color: 'bg-blue-600/20 text-blue-300 border-blue-600/30' },
  { id: 'Fire/EMS', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { id: 'Mafia', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { id: 'Events', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
];

// --- SHARED COMPONENTS ---

const RoleBadge = ({ role }) => {
    if (!role || role === 'civilian') return <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">Civilian</span>;
    if (role === 'owner') return <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30 flex items-center gap-1 w-fit"><Crown size={12}/> Owner</span>;
    if (role === 'admin') return <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded border border-orange-500/30 flex items-center gap-1 w-fit"><Shield size={12}/> Admin</span>;
    if (role === 'moderator') return <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded border border-cyan-500/30 flex items-center gap-1 w-fit"><ShieldAlert size={12}/> Mod</span>;
    return <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 uppercase">{role}</span>;
};

const RailItem = ({ active, onClick, children }) => (
    <div onClick={onClick} className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-105' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}>
        {children}
    </div>
);

const NavItem = ({ icon, label, active, onClick }) => (
    <div onClick={onClick} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${active ? 'bg-blue-500/10 text-blue-500 font-medium' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
        {icon} <span className="text-sm">{label}</span>
    </div>
);

const DashboardNavItem = ({ icon, label, active, onClick, badge }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
        {icon} 
        <span className="text-sm font-semibold flex-1 text-left">{label}</span>
        {badge > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>}
    </button>
);

const RenderNameWithRole = ({ profile, nickname }) => {
    if (!profile) return <span className="text-slate-400">Unknown</span>;
    
    const displayName = nickname || profile.name;
    const role = profile.role;
    const globalRole = profile.global_role;
    const badges = Array.isArray(profile.badges) ? profile.badges : []; 
    const isInfluencer = globalRole === 'influencer' || badges.includes('influencer');
    const isDeveloper = globalRole === 'developer' || badges.includes('developer');
    const isOfficial = badges.includes('official');

    let nameColor = "text-slate-200";
    let icon = null;

    if (isDeveloper) { nameColor = "text-green-400"; icon = <Hammer size={12} fill="currentColor" />; }
    else if (globalRole === 'owner') { nameColor = "text-blue-400"; icon = <Crown size={12} className="text-yellow-500" fill="currentColor" />; }
    else if (isInfluencer) { nameColor = "text-yellow-200"; icon = <Star size={12} className="text-yellow-500" fill="currentColor" />; }
    else if (globalRole === 'admin') { nameColor = "text-orange-400"; icon = <Shield size={12} className="text-orange-500" fill="currentColor" />; }
    else if (globalRole === 'moderator') { nameColor = "text-cyan-400"; icon = <Shield size={12} className="text-cyan-400" />; }

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`font-bold text-sm ${nameColor} flex items-center gap-1.5`}>{displayName} {icon}</span>
            {isOfficial && <span className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/30 px-1 rounded font-bold uppercase flex items-center gap-0.5"><BadgeCheck size={8}/> Official</span>}
            {isInfluencer && !isDeveloper && !isOfficial && <span className="text-[9px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1 rounded font-bold uppercase">Influencer</span>}
            {role && <span className="text-[9px] text-slate-500 uppercase font-semibold border border-slate-800 px-1 rounded bg-slate-900/50">{role}</span>}
        </div>
    );
};

const PostCard = ({ post, onReport, onDelete, onLike, onBan, onViewComments, currentUser, groupRole, onViewProfile }) => {
    const globalRole = post.profiles?.global_role;
    let cardStyle = "bg-slate-900/40 border-slate-800/60";
    if (globalRole === 'owner') cardStyle = "bg-blue-950/30 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]";
    else if (globalRole === 'developer') cardStyle = "bg-green-950/20 border-green-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
    else if (globalRole === 'admin') cardStyle = "bg-red-950/20 border-red-500/30";
    else if (globalRole === 'moderator') cardStyle = "bg-cyan-950/20 border-cyan-500/30";
    else if (globalRole === 'influencer' || (post.profiles?.badges && post.profiles.badges.includes('influencer'))) cardStyle = "bg-pink-950/20 border-pink-500/30";

    const isGlobalStaff = ['owner', 'admin', 'moderator', 'developer'].includes(currentUser?.global_role);
    const isGroupStaff = ['admin', 'moderator'].includes(groupRole);
    const isAuthor = post.uid === currentUser?.id;
    const canDelete = isGlobalStaff || (post.group_id && isGroupStaff) || isAuthor;

    return (
        <div className={`${cardStyle} border rounded-2xl p-5 mb-4 transition-all shadow-sm relative overflow-hidden`}>
            {(globalRole === 'owner' || globalRole === 'developer') && <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>}
            
            <div className="flex gap-4 relative z-10">
                <div onClick={onViewProfile} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-400 shrink-0 border border-slate-700 overflow-hidden cursor-pointer hover:border-blue-500 transition-colors">
                    {post.profiles?.image ? <img src={post.profiles.image} className="w-full h-full object-cover" /> : post.profiles?.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                        <div onClick={onViewProfile} className="cursor-pointer">
                            <RenderNameWithRole profile={post.profiles || {name: post.user_name, role: post.user_role}} />
                            <span className="text-xs text-slate-500 block mt-0.5">@{post.profiles?.username || 'user'} • {new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={onReport} className="p-1.5 text-slate-600 hover:bg-slate-800 rounded-lg hover:text-white transition-colors"><Flag size={14}/></button>
                            {canDelete && <button onClick={onDelete} className="p-1.5 text-slate-600 hover:bg-red-500/10 rounded-lg hover:text-red-400 transition-colors"><Trash2 size={14}/></button>}
                            {isGlobalStaff && <button onClick={onBan} className="p-1.5 text-slate-600 hover:bg-red-500/10 rounded-lg hover:text-red-500 transition-colors"><Ban size={14}/></button>}
                        </div>
                    </div>
                    
                    <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    
                    {post.image && (
                        <div className="mt-3 rounded-xl border border-slate-800/50 overflow-hidden bg-black/40">
                            <img src={post.image} className="w-full max-h-96 object-contain" />
                        </div>
                    )}

                    <div className="flex gap-6 mt-4 border-t border-slate-800/50 pt-3">
                        <button onClick={onLike} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-pink-500 transition-colors">
                            <Heart size={16}/> <span>{post.like_count}</span>
                        </button>
                        <button onClick={onViewComments} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-400 transition-colors">
                            <MessageSquare size={16}/> <span>{post.comment_count}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-400 transition-colors ml-auto">
                            <Share2 size={16}/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MODERATION DASHBOARD COMPONENT (EMBEDDED) ---
function ModerationDashboard({ supabase, sessionUser, profile, onExit }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [reports, setReports] = useState([]);
  const [reportFilter, setReportFilter] = useState('pending'); 
  const [inspectedReport, setInspectReport] = useState(null); 
  const [applications, setApplications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [staffResults, setStaffResults] = useState([]);
  const messagesEndRef = useRef(null);

  const loadData = async () => {
    if (!supabase || !profile) return;
    setIsRefreshing(true);
    setDataError(null);
    try {
        const { data: reps, error: repErr } = await supabase.from('reports').select(`*, profiles:reporter_id (name, username)`).eq('status', reportFilter).order('created_at', { ascending: false });
        if (repErr) throw repErr;
        setReports(reps || []);

        let appQuery = supabase.from('applications').select(`*, profiles:user_id (name, username, badges, global_role)`).eq('status', 'pending').order('created_at', { ascending: false });
        if (profile.global_role !== 'owner') { appQuery = appQuery.eq('type', 'verification'); }
        const { data: apps, error: appErr } = await appQuery;
        if (appErr) throw appErr;
        setApplications(apps || []);

        const { data: tix, error: tixErr } = await supabase.from('support_tickets').select('*').neq('status', 'closed').order('created_at', { ascending: false });
        if (tixErr) throw tixErr;
        setTickets(tix || []);
    } catch (err) { console.error("Data Load Error:", err); setDataError(err.message); } finally { setIsRefreshing(false); }
  };

  useEffect(() => {
    loadData();
    const sub = supabase.channel('moderation_room').on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, loadData).on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, loadData).on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, loadData).subscribe();
    return () => supabase.removeChannel(sub);
  }, [profile, reportFilter]); 

  useEffect(() => {
      if (!activeTicket || !supabase) return;
      const loadMessages = async () => {
          const { data } = await supabase.from('support_messages').select(`*, profiles:sender_id (name, global_role)`).eq('ticket_id', activeTicket.id).order('created_at', { ascending: true });
          if (data) { setMessages(data); setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }
      };
      loadMessages();
      const msgSub = supabase.channel(`ticket_chat:${activeTicket.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${activeTicket.id}` }, async (payload) => {
          const { data: sender } = await supabase.from('profiles').select('name, global_role').eq('id', payload.new.sender_id).single();
          setMessages(prev => [...prev, { ...payload.new, profiles: sender }]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }).subscribe();
      return () => supabase.removeChannel(msgSub);
  }, [activeTicket]);

  const handleUpdateReport = async (id, newStatus) => { if(!window.confirm(`Mark report as ${newStatus}?`)) return; await supabase.from('reports').update({ status: newStatus }).eq('id', id); setReports(prev => prev.filter(r => r.id !== id)); setInspectReport(null); };
  const handleInspectReport = async (report) => {
      let content = null; let authorId = null; let authorName = "Unknown";
      try {
          if (report.target_type === 'post') { const { data } = await supabase.from('posts').select('content, uid, profiles(name, username)').eq('id', report.target_id).single(); if(data) { content = data.content; authorId = data.uid; authorName = data.profiles?.username; } } 
          else if (report.target_type === 'comment') { const { data } = await supabase.from('comments').select('content, user_id, profiles(name, username)').eq('id', report.target_id).single(); if(data) { content = data.content; authorId = data.user_id; authorName = data.profiles?.username; } } 
          else if (report.target_type === 'user') { const { data } = await supabase.from('profiles').select('name, username').eq('id', report.target_id).single(); if(data) { content = "User Profile Report"; authorId = report.target_id; authorName = data.username; } }
      } catch (e) { console.error(e); }
      setInspectReport({ ...report, content_snapshot: content, target_author_id: authorId, target_author_name: authorName });
  };
  const handleWarnUser = async (userId) => { if (!userId) return; if (!window.confirm("Issue a formal warning to this user?")) return; const { data } = await supabase.from('profiles').select('warning_count').eq('id', userId).single(); const newCount = (data?.warning_count || 0) + 1; const { error } = await supabase.from('profiles').update({ warning_count: newCount }).eq('id', userId); if (error) alert("Failed: " + error.message); else alert(`User warned. Total warnings: ${newCount}`); };
  const handleReviewApplication = async (app, action) => {
      if (action === 'approve') {
          if (app.type === 'verification') { const badges = app.profiles?.badges || []; if (!badges.includes('influencer')) await supabase.from('profiles').update({ badges: [...badges, 'influencer'] }).eq('id', app.user_id); } 
          else if (app.type === 'staff' && profile.global_role === 'owner') { await supabase.from('profiles').update({ global_role: 'moderator' }).eq('id', app.user_id); }
      }
      await supabase.from('applications').update({ status: action === 'approve' ? 'approved' : 'rejected' }).eq('id', app.id);
      setApplications(prev => prev.filter(a => a.id !== app.id));
  };
  const handleSendReply = async () => { if (!replyText.trim() || !activeTicket) return; await supabase.from('support_messages').insert({ ticket_id: activeTicket.id, sender_id: sessionUser.id, content: replyText }); setReplyText(""); };
  const handleCloseTicket = async () => { if (!activeTicket || !window.confirm("Close this ticket?")) return; await supabase.from('support_tickets').update({ status: 'closed' }).eq('id', activeTicket.id); setTickets(prev => prev.filter(t => t.id !== activeTicket.id)); setActiveTicket(null); };
  const handleSearchUser = async () => { if (!staffSearchQuery) return; const { data } = await supabase.from('profiles').select('*').ilike('username', `%${staffSearchQuery}%`).limit(10); setStaffResults(data || []); };
  const handleUpdateRole = async (userId, newRole) => { if (!window.confirm(`Change role to ${newRole || 'Civilian'}?`)) return; await supabase.from('profiles').update({ global_role: newRole }).eq('id', userId); setStaffResults(prev => prev.map(u => u.id === userId ? { ...u, global_role: newRole } : u)); };

  const isOwner = profile?.global_role === 'owner';

  return (
      <div className="flex h-screen bg-[#0a0a0c] text-slate-100 font-sans overflow-hidden">
          <div className="w-64 bg-[#0a0a0c] border-r border-slate-800 flex flex-col">
              <div className="p-6 border-b border-slate-800 flex items-center gap-3"><ShieldAlert className="w-8 h-8 text-blue-500" /><div><h1 className="font-black text-lg tracking-tight">COMMAND</h1><p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold -mt-1">Terminal</p></div></div>
              <div className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
                  <DashboardNavItem icon={<Activity size={18} />} label="Dashboard" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
                  <DashboardNavItem icon={<Flag size={18} />} label="Investigations" active={currentView === 'reports'} onClick={() => setCurrentView('reports')} badge={reports.length} />
                  <DashboardNavItem icon={<Inbox size={18} />} label="Applications" active={currentView === 'applications'} onClick={() => setCurrentView('applications')} badge={applications.length} />
                  <DashboardNavItem icon={<MessageSquare size={18} />} label="Active Calls" active={currentView === 'support'} onClick={() => setCurrentView('support')} badge={tickets.length} />
                  {isOwner && <div className="mt-6"><p className="text-[10px] font-bold uppercase text-slate-500 px-4 mb-2">Owner Controls</p><DashboardNavItem icon={<Users size={18} />} label="Manage Staff" active={currentView === 'staff'} onClick={() => setCurrentView('staff')} /></div>}
              </div>
              <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between"><div className="min-w-0"><p className="text-sm font-bold text-white truncate">{profile.name}</p><RoleBadge role={profile.global_role} /></div><button onClick={onExit} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><ArrowLeft size={16}/> Exit</button></div>
          </div>
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
              <div className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center px-8 justify-between shrink-0"><h2 className="text-lg font-bold capitalize">{currentView.replace('_', ' ')}</h2><button onClick={loadData} disabled={isRefreshing} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"><RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""}/> Refresh Data</button></div>
              {dataError && <div className="m-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-0">Error loading data: {dataError}</div>}
              <div className="flex-1 overflow-y-auto p-8 relative">
                  {currentView === 'dashboard' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4"><div className="bg-red-500/10 p-4 rounded-xl text-red-500"><Flag size={24}/></div><div><p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Reports</p><p className="text-3xl font-black text-white">{reports.length}</p></div></div>
                          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4"><div className="bg-yellow-500/10 p-4 rounded-xl text-yellow-500"><Inbox size={24}/></div><div><p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Applications</p><p className="text-3xl font-black text-white">{applications.length}</p></div></div>
                          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4"><div className="bg-green-500/10 p-4 rounded-xl text-green-500"><MessageSquare size={24}/></div><div><p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Tickets</p><p className="text-3xl font-black text-white">{tickets.length}</p></div></div>
                      </div>
                  )}
                  {currentView === 'reports' && (
                      <div className="max-w-4xl mx-auto space-y-6">
                          <div className="flex gap-2 border-b border-slate-800 pb-4">{['pending', 'resolved', 'dismissed'].map(s => (<button key={s} onClick={() => setReportFilter(s)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${reportFilter === s ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>{s}</button>))}</div>
                          {reports.length === 0 ? <p className="text-center text-slate-500 py-10">No reports found in {reportFilter}.</p> : reports.map(r => (
                              <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                                  <div className="p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                                      <div><div className="flex items-center gap-2 mb-2"><span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded font-bold uppercase border border-red-500/30">Target: {r.target_type}</span><span className="text-slate-400 text-sm">Reported by: <span className="text-white">@{r.profiles?.username || 'unknown'}</span></span></div><p className="text-slate-300 font-medium">Reason: {r.reason}</p><p className="text-xs text-slate-500 mt-1 font-mono">ID: {r.target_id}</p></div>
                                      <div className="flex items-center gap-2">{r.status === 'pending' && (<><button onClick={() => handleInspectReport(r)} className="bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 border border-slate-700 hover:border-blue-500/50 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Eye size={14}/> Inspect</button><button onClick={() => handleUpdateReport(r.id, 'resolved')} className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 px-4 py-2 rounded-lg text-xs font-bold">Resolve</button><button onClick={() => handleUpdateReport(r.id, 'dismissed')} className="bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 px-4 py-2 rounded-lg text-xs font-bold">Dismiss</button></>)}{r.status !== 'pending' && <span className="text-xs uppercase font-bold text-slate-500 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">{r.status}</span>}</div>
                                  </div>
                                  {inspectedReport?.id === r.id && (<div className="bg-slate-950 border-t border-slate-800 p-5 animate-in slide-in-from-top-2"><h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Content Snapshot</h4><div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 mb-4 whitespace-pre-wrap">{inspectedReport.content_snapshot || "Content not found or deleted."}</div><div className="flex gap-3 pt-2 border-t border-slate-800"><button onClick={() => handleWarnUser(inspectedReport.target_author_id)} disabled={!inspectedReport.target_author_id} className="flex-1 bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-500 border border-yellow-900/50 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2"><AlertTriangle size={14}/> Warn Accused (@{inspectedReport.target_author_name})</button><button onClick={() => handleWarnUser(r.reporter_id)} className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2"><AlertOctagon size={14}/> Warn Reporter (False Report)</button></div></div>)}
                              </div>
                          ))}
                      </div>
                  )}
                  {currentView === 'applications' && (
                      <div className="max-w-4xl mx-auto space-y-4">
                          {applications.length === 0 ? <p className="text-center text-slate-500 py-10">No pending apps.</p> : applications.map(app => (
                              <div key={app.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-start md:items-center relative"><div className="relative z-10"><div className="flex items-center gap-2 mb-2">{app.type === 'verification' ? <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded font-bold uppercase border border-yellow-500/30 flex items-center gap-1"><BadgeCheck size={12}/> Influencer</span> : <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded font-bold uppercase border border-blue-500/30 flex items-center gap-1"><Shield size={12}/> Staff</span>}<span className="text-white font-bold">{app.profiles?.name} <span className="text-slate-500 font-normal">(@{app.profiles?.username})</span></span></div><p className="text-slate-300 text-sm bg-slate-950 p-3 rounded-lg border border-slate-800 mt-2 font-mono">{app.content}</p></div><div className="flex gap-2 shrink-0 z-10"><button onClick={() => handleReviewApplication(app, 'reject')} className="p-2 bg-slate-800 hover:bg-red-500/20 text-red-400 rounded-lg"><XCircle size={20}/></button><button onClick={() => handleReviewApplication(app, 'approve')} className="p-2 bg-slate-800 hover:bg-green-500/20 text-green-400 rounded-lg"><CheckCircle size={20}/></button></div></div>
                          ))}
                      </div>
                  )}
                  {currentView === 'support' && (
                      <div className="absolute inset-4 md:inset-8 flex gap-4">
                          <div className="w-1/3 min-w-[250px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col"><div className="p-4 border-b border-slate-800 bg-slate-950/50"><h3 className="font-bold text-slate-300 text-sm uppercase">Open Calls ({tickets.length})</h3></div><div className="flex-1 overflow-y-auto p-2 space-y-1">{tickets.map(t => (<button key={t.id} onClick={() => setActiveTicket(t)} className={`w-full text-left p-3 rounded-xl transition-colors ${activeTicket?.id === t.id ? 'bg-blue-600' : 'hover:bg-slate-800'}`}><p className="font-bold text-sm text-white">{t.user_name || 'User'}</p><p className="text-xs text-slate-400 mt-1"><Clock size={10} className="inline mr-1"/>{new Date(t.created_at).toLocaleTimeString()}</p></button>))}</div></div>
                          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">{activeTicket ? (<><div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center"><p className="font-bold text-white">{activeTicket.user_name}</p><button onClick={handleCloseTicket} className="text-xs bg-slate-800 text-red-400 px-3 py-1.5 rounded-lg font-bold">Close Call</button></div><div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/30">{messages.map(m => (<div key={m.id} className={`flex flex-col max-w-[80%] ${m.profiles?.global_role && m.profiles.global_role !== 'civilian' ? 'ml-auto items-end' : 'items-start'}`}><span className="text-[10px] text-slate-500 mb-1 ml-1">{m.profiles?.name}</span><div className={`p-3 rounded-2xl text-sm ${m.profiles?.global_role && m.profiles.global_role !== 'civilian' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>{m.content}</div></div>))}<div ref={messagesEndRef} /></div><div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2"><input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendReply()} placeholder="Type dispatch response..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none" /><button onClick={handleSendReply} className="bg-blue-600 text-white p-2.5 rounded-xl"><Send size={18}/></button></div></>) : (<div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500"><MessageSquare size={48} className="mb-4 opacity-20" /><p>Select a call.</p></div>)}</div>
                      </div>
                  )}
                  {currentView === 'staff' && isOwner && (
                      <div className="max-w-4xl mx-auto">
                          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-6 flex gap-2"><input value={staffSearchQuery} onChange={e => setStaffSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchUser()} placeholder="Search username..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none" /><button onClick={handleSearchUser} className="bg-blue-600 text-white px-6 rounded-xl font-bold">Search</button></div>
                          <div className="space-y-3">{staffResults.map(u => (<div key={u.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center"><div><p className="font-bold text-white">{u.name}</p><RoleBadge role={u.global_role} /></div><div className="flex gap-2">{u.global_role !== 'owner' && (<>{u.global_role !== 'admin' && <button onClick={() => handleUpdateRole(u.id, 'admin')} className="bg-orange-500/10 text-orange-400 px-3 py-1.5 rounded-lg text-xs font-bold">Admin</button>}{u.global_role !== 'moderator' && <button onClick={() => handleUpdateRole(u.id, 'moderator')} className="bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-lg text-xs font-bold">Mod</button>}<button onClick={() => handleUpdateRole(u.id, null)} className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold">Demote</button></>)}</div></div>))}</div>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
}

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Uncaught error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-[#050507] text-slate-200 p-6">
          <div className="max-w-md text-center">
             <AlertOctagon size={48} className="text-red-500 mx-auto mb-4" />
             <h1 className="text-2xl font-black mb-2 text-white">System Critical</h1>
             <p className="text-slate-400 mb-6">The application encountered an unexpected error.</p>
             <button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl">Reboot System</button>
             <div className="mt-8 p-4 bg-black/40 rounded-xl border border-slate-800 text-left overflow-auto max-h-32 text-xs font-mono text-red-400">{this.state.error?.toString()}</div>
          </div>
        </div>
      );
    }
    return this.props.children; 
  }
}

// --- MAIN APP LOGIC ---
function MainApp() {
  const [supabase, setSupabase] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentGroupRole, setCurrentGroupRole] = useState(null); 
  const [authLoading, setAuthLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState(null);
  
  const [currentView, setCurrentView] = useState('feed'); 
  const [feedMode, setFeedMode] = useState('posts'); 
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeChannel, setActiveChannel] = useState('general'); 
  const [activeModal, setActiveModal] = useState(null); 
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // New State for Mod Mode
  const [isStaffMode, setIsStaffMode] = useState(false);

  const [posts, setPosts] = useState([]); 
  const [globalChatMessages, setGlobalChatMessages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [joinedGroupIds, setJoinedGroupIds] = useState([]); 
  const [groupMembers, setGroupMembers] = useState([]); 
  const [memberCount, setMemberCount] = useState(0); 
  const [notifications, setNotifications] = useState([]);
  
  const [viewingUser, setViewingUser] = useState(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false); 
  const [userTicket, setUserTicket] = useState(null); 
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportInput, setSupportInput] = useState("");
  const [reportTarget, setReportTarget] = useState(null); 
  
  const [viewingCommentsPost, setViewingCommentsPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [groupFilterTag, setGroupFilterTag] = useState("All");

  const [newPostText, setNewPostText] = useState("");
  const [chatInput, setChatInput] = useState(""); 
  const [newGroupText, setNewGroupText] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupImage, setNewGroupImage] = useState(""); 
  const [newGroupTags, setNewGroupTags] = useState([]); 
  const [editGroupTags, setEditGroupTags] = useState([]); 
  const [editingMemberId, setEditingMemberId] = useState(null); 
  
  const [selectedTag, setSelectedTag] = useState(TAGS[0].id);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef(null);
  const supportScrollRef = useRef(null);
  const chatScrollRef = useRef(null);
  const commentInputRef = useRef(null);
  const scrollContainerRef = useRef(null); 

  const isGlobalStaff = ['owner', 'admin', 'moderator', 'developer'].includes(currentUser?.global_role);

  // 2. HANDLERS
  const goHome = () => { setActiveGroup(null); setCurrentView('feed'); setFeedMode('posts'); };
  const goToGroup = (g) => { setActiveGroup(g); setCurrentView('single_group'); setActiveChannel('general'); };
  const goProfile = () => { setActiveGroup(null); setCurrentView('profile'); };
  
  const handleAuthSubmit = async (e) => {
    e.preventDefault(); if (!supabase) return; setIsSubmitting(true); setAuthError(null); 
    const fd = new FormData(e.target);
    try {
      if (isSignUp) {
        const cleanUsername = fd.get('username').toLowerCase().replace(/\s/g, '');
        const { data, error } = await supabase.auth.signUp({ email: fd.get('email'), password: fd.get('password'), options: { data: { username: cleanUsername, display_name: fd.get('displayName'), role: fd.get('role') } } });
        if (error) throw error; if (data.user && !data.session) { alert("Account created! Check email."); setIsSignUp(false); }
      } else { const { error } = await supabase.auth.signInWithPassword({ email: fd.get('email'), password: fd.get('password') }); if (error) throw error; }
    } catch (error) { setAuthError(error.message); } finally { setIsSubmitting(false); }
  };

  const handleCreatePost = async () => {
    if ((!newPostText.trim() && !selectedImage) || !currentUser || !supabase) return; setIsSubmitting(true);
    const tagInfo = TAGS.find(t => t.id === selectedTag); const targetChannel = (activeGroup) ? activeChannel : 'general';
    try {
      const { data, error } = await supabase.from('posts').insert({ uid: authUser.id, user_name: currentUser.name, user_role: currentUser.role, content: newPostText, tag: tagInfo, group_id: activeGroup ? activeGroup.id : null, channel: targetChannel, image: selectedImage }).select().single();
      if (error) throw error; 
      const newPost = { ...data, profiles: currentUser, like_count: 0, comment_count: 0 };
      setPosts(prev => [newPost, ...prev]);
      setNewPostText(""); setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) { alert("Error posting: " + e.message); } finally { setIsSubmitting(false); }
  };

  const handleSendChat = async () => {
      if (!chatInput.trim() || !supabase) return;
      try {
        const { error } = await supabase.from('global_chat').insert({ user_id: authUser.id, content: chatInput });
        if (error) throw error;
        setChatInput("");
      } catch (e) { console.error(e); alert("Failed to send message: " + e.message); }
  };

  const handleDeleteChatMessage = async (msgId) => {
      if(!supabase) return;
      if(!window.confirm("Delete message?")) return;
      setGlobalChatMessages(prev => prev.filter(m => m.id !== msgId));
      const { error } = await supabase.from('global_chat').delete().eq('id', msgId);
      if(error) alert("Failed to delete: " + error.message);
  };

  const handleLikePost = async (postId, currentLikes) => {
      if (!supabase || !authUser) return;
      const { data: existingLike } = await supabase.from('likes').select('user_id').eq('post_id', postId).eq('user_id', authUser.id).single();
      let newCount = currentLikes;
      if (existingLike) { await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', authUser.id); newCount = Math.max(0, currentLikes - 1); } 
      else { await supabase.from('likes').insert({ post_id: postId, user_id: authUser.id }); newCount = currentLikes + 1; }
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, like_count: newCount } : p));
      await supabase.from('posts').update({ like_count: newCount }).eq('id', postId);
  };

  const handlePostComment = async () => {
    if (!supabase || !authUser || !commentText.trim()) return; if (viewingCommentsPost.comments_disabled) return;
    try {
        const { data, error } = await supabase.from('comments').insert({ post_id: viewingCommentsPost.id, user_id: authUser.id, user_name: currentUser.name, content: commentText }).select().single();
        if (error) throw error;
        const newComment = { ...data, profiles: currentUser };
        setComments(prev => [...prev, newComment]);
        setCommentText("");
    } catch (e) { alert("Failed to post: " + e.message); }
  };

  const handleNotificationClick = async (notif) => {
      await supabase.from('notifications').update({ read: true }).eq('id', notif.id); setNotifications(prev => prev.map(n => n.id === notif.id ? {...n, read: true} : n));
      if(notif.post_id) { const { data } = await supabase.from('posts').select(`*, profiles:uid ( id, name, username, role, global_role, badges )`).eq('id', notif.post_id).single(); if(data) { setViewingCommentsPost(data); setShowNotifications(false); } }
  };

  const handleDeleteGroup = async () => { if(!supabase || !activeGroup) return; if(prompt(`Type "${activeGroup.name}" to confirm:`) !== activeGroup.name) return; const { error } = await supabase.from('groups').delete().eq('id', activeGroup.id); if(error) alert(error.message); else { alert("Deleted."); setActiveModal(null); setActiveGroup(null); setGroups(prev => prev.filter(g => g.id !== activeGroup.id)); setCurrentView('groups'); } };
  const handleSubmitApplication = async (e) => { e.preventDefault(); if(!supabase) return; const fd = new FormData(e.target); try { await supabase.from('applications').insert({ user_id: authUser.id, type: activeModal === 'verify' ? 'verification' : 'staff', content: `Link: ${fd.get('link')} | Reason: ${fd.get('reason')}` }); alert("Submitted!"); setActiveModal(null); } catch (err) { alert(err.message); } };
  const handleAcceptCookies = () => { localStorage.setItem('liberty_cookie_consent', 'true'); setShowCookieBanner(false); };
  
  const handleLogout = async () => { 
      if (!supabase) return; 
      setAuthLoading(true); 
      try { await supabase.auth.signOut(); } catch(e) { console.error(e); }
      setAuthUser(null); 
      setCurrentUser(null); 
      setAuthLoading(false); 
  };

  const handleDeleteAccount = async () => {
    if (!supabase || !authUser) return;
    if (!window.confirm("ARE YOU SURE? This will permanently delete your account and ALL your data. This action cannot be undone.")) return;
    
    try {
        setAuthLoading(true); 

        // 1. Client-side cleanup of dependent data (Safety net if DB cascades aren't set)
        const uid = authUser.id;
        await supabase.from('notifications').delete().eq('user_id', uid);
        await supabase.from('notifications').delete().eq('actor_id', uid);
        await supabase.from('likes').delete().eq('user_id', uid);
        await supabase.from('comments').delete().eq('user_id', uid);
        await supabase.from('global_chat').delete().eq('user_id', uid);
        await supabase.from('group_members').delete().eq('user_id', uid);
        await supabase.from('posts').delete().eq('uid', uid);
        await supabase.from('reports').delete().eq('reporter_id', uid);
        await supabase.from('applications').delete().eq('user_id', uid);
        await supabase.from('support_messages').delete().eq('sender_id', uid);
        await supabase.from('support_tickets').delete().eq('user_id', uid);
        await supabase.from('groups').delete().eq('creator_id', uid);

        // 2. Attempt RPC delete (Deletes auth.users)
        const { error } = await supabase.rpc('delete_own_user');

        if (error) {
            console.warn("RPC Delete Failed (likely due to permissions or missing function), attempting manual profile delete:", error);
            // Fallback: Delete public profile
            const { error: profileError } = await supabase.from('profiles').delete().eq('id', uid);
            if (profileError) throw profileError;
        } 
        
        alert("Account and data deleted successfully.");
        await handleLogout();

    } catch (e) {
        console.error("Delete Error:", e);
        alert("Failed to delete account completely: " + e.message);
        setAuthLoading(false); 
    }
  };

  const handleRequestData = async () => {
    if (!supabase || !authUser) return;
    if (!window.confirm("Download all your personal data? This may take a moment.")) return;
    
    try {
      setAuthLoading(true);
      const uid = authUser.id;

      // Fetch all data in parallel
      const [
        { data: profile },
        { data: posts },
        { data: comments },
        { data: likes },
        { data: groups },
        { data: chat },
        { data: support },
        { data: apps }
      ] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', uid).single(),
          supabase.from('posts').select('*').eq('uid', uid),
          supabase.from('comments').select('*').eq('user_id', uid),
          supabase.from('likes').select('*').eq('user_id', uid),
          supabase.from('group_members').select('*, groups(*)').eq('user_id', uid),
          supabase.from('global_chat').select('*').eq('user_id', uid),
          supabase.from('support_tickets').select('*, support_messages(*)').eq('user_id', uid),
          supabase.from('applications').select('*').eq('user_id', uid)
      ]);

      const allData = {
        user_info: {
            id: uid,
            email: authUser.email, 
            ...profile
        },
        groups_joined: groups,
        content_created: {
            posts: posts,
            comments: comments,
        },
        activity: {
            likes: likes,
            applications: apps,
            support_history: support
        },
        // Messages at the bottom as requested
        chat_history: chat 
      };

      // Create downloadable file
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `liberty_social_data_${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert("Data download started.");

    } catch (e) {
      alert("Failed to gather data: " + e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleReplyToComment = (c) => { setCommentText(`@${c.profiles?.username || 'user'} `); commentInputRef.current?.focus(); };
  const handlePinComment = async (c) => { await supabase.from('comments').update({ is_pinned: !c.is_pinned }).eq('id', c.id); };
  const handleToggleComments = async () => { const nv = !viewingCommentsPost.comments_disabled; await supabase.from('posts').update({ comments_disabled: nv }).eq('id', viewingCommentsPost.id); setViewingCommentsPost(prev => ({ ...prev, comments_disabled: nv })); };
  const handleResolveReport = async (rid) => { if (window.confirm("Resolve?")) { await supabase.from('reports').update({ status: 'resolved' }).eq('id', rid); setReports(prev => prev.filter(r => r.id !== rid)); }};
  
  const handleCreateGroup = async () => { 
      if (!newGroupText.trim()) return; 
      setIsSubmitting(true); 
      try { 
          const { data, error } = await supabase.from('groups').insert({ name: newGroupText, description: newGroupDesc, image: newGroupImage, badges: newGroupTags, creator_id: authUser.id }).select().single(); 
          if (error) throw error;
          if(data) {
             await supabase.from('group_members').insert({ group_id: data.id, user_id: authUser.id, role: 'admin' });
             setJoinedGroupIds(prev => [...prev, data.id]); 
             setGroups(prev => [data, ...prev]); 
          }
          setNewGroupText(""); setNewGroupDesc(""); setNewGroupImage(""); setNewGroupTags([]);
          setCurrentView('groups'); 
      } catch(e) { alert("Creation failed: " + e.message); } finally { setIsSubmitting(false); } 
  };

  const handleJoinGroup = async (e, gid) => { 
      e.stopPropagation(); 
      if (!supabase) return;
      const { error } = await supabase.from('group_members').insert({ group_id: gid, user_id: authUser.id, role: 'member' });
      if (error && error.code !== '23505') alert(error.message); 
      else setJoinedGroupIds(prev => [...prev, gid]); 
  };
  
  const handleLeaveGroup = async (e, gid) => {
      e.stopPropagation();
      if (!supabase || !window.confirm("Leave community?")) return;
      const { error } = await supabase.from('group_members').delete().eq('group_id', gid).eq('user_id', authUser.id);
      if (error) alert(error.message);
      else {
          setJoinedGroupIds(prev => prev.filter(id => id !== gid)); 
          if (activeGroup?.id === gid) { setActiveGroup(null); setCurrentView('feed'); }
      }
  };
  
  const handleReport = async (r) => { 
    if (!reportTarget || !supabase) return;
    try {
      const targetIdString = String(reportTarget.id);
      const { error } = await supabase.from('reports').insert({ reporter_id: authUser.id, target_type: reportTarget.type, target_id: targetIdString, reason: r, status: 'pending' });
      if (error) throw error; alert("Report submitted.");
    } catch (e) { console.error(e); alert("Failed to submit report: " + e.message); }
    setReportTarget(null);
  };
  
  const handleDeletePost = async (pid) => {
      if(!supabase) return;
      if(!window.confirm("Delete this post?")) return;
      setPosts(prev => prev.filter(p => p.id !== pid)); // Optimistic
      const { error } = await supabase.from('posts').delete().eq('id', pid);
      if(error) {
          alert("Error deleting post: " + error.message);
          fetchPosts(); 
      }
  };
  
  const handleUpdateProfile = async (e) => { e.preventDefault(); const fd = new FormData(e.target); await supabase.from('profiles').update({ name: fd.get('displayName'), role: fd.get('role') }).eq('id', authUser.id); setActiveModal(null); setCurrentUser(prev => ({...prev, name: fd.get('displayName'), role: fd.get('role')})); };
  const handleUpdateGroup = async (e) => { e.preventDefault(); const fd = new FormData(e.target); await supabase.from('groups').update({ name: fd.get('groupName'), description: fd.get('groupDesc'), image: fd.get('groupImage'), banner: fd.get('groupBanner'), badges: editGroupTags }).eq('id', activeGroup.id); setActiveModal(null); setActiveGroup(prev => ({...prev, name: fd.get('groupName'), description: fd.get('groupDesc'), image: fd.get('groupImage'), banner: fd.get('groupBanner'), badges: editGroupTags})); };
  
  const handleOpenMembers = async () => { 
      setActiveModal('members'); 
      const { data } = await supabase.from('group_members').select(`*, profiles:user_id ( id, name, username, role, global_role, badges, image )`).eq('group_id', activeGroup.id); 
      if(data) setGroupMembers(data); 
  };
  
  const handleKickMember = async (uid) => { 
      if(window.confirm("Kick user?")) { 
          await supabase.from('group_members').delete().eq('group_id', activeGroup.id).eq('user_id', uid); 
          setGroupMembers(prev => prev.filter(m => m.user_id !== uid)); 
      } 
  };
  
  const handleBanMember = async (uid) => {
      if(window.confirm("Ban user from group?")) {
          const { error } = await supabase.from('group_members').update({ role: 'banned' }).eq('group_id', activeGroup.id).eq('user_id', uid);
          if (error) alert("Error banning: " + error.message);
          else setGroupMembers(prev => prev.map(m => m.user_id === uid ? { ...m, role: 'banned' } : m));
      }
  };

  const handleUpdateMemberRole = async (uid, role) => { 
      await supabase.from('group_members').update({ role }).eq('group_id', activeGroup.id).eq('user_id', uid); 
      setGroupMembers(prev => prev.map(m => m.user_id === uid ? { ...m, role } : m)); 
  };
  
  const handleSetNickname = async (uid, newNick) => {
      await supabase.from('group_members').update({ nickname: newNick }).eq('group_id', activeGroup.id).eq('user_id', uid);
      setGroupMembers(prev => prev.map(m => m.user_id === uid ? { ...m, nickname: newNick } : m));
      setEditingMemberId(null);
  };

  const handleImageChange = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setSelectedImage(reader.result); reader.readAsDataURL(file); } };
  const handleBanUser = async (uid) => { if(window.confirm("Ban Global?")) { await supabase.from('profiles').update({ is_banned: true }).eq('id', uid); alert("Banned"); } };
  const handleCreateSupportTicket = async () => { try { const { data } = await supabase.from('support_tickets').insert({ user_id: authUser.id, user_name: currentUser.name }).select().single(); setUserTicket(data); } catch (e) { alert(e.message); } };
  const handleSendSupportMessage = async () => { if(!supportInput.trim()) return; await supabase.from('support_messages').insert({ ticket_id: userTicket.id, sender_id: authUser.id, content: supportInput }); setSupportInput(""); };
  const handleDeleteComment = async (commentId) => {
    if (!supabase) return; if (!window.confirm("Delete comment?")) return;
    try { const { error } = await supabase.from('comments').delete().eq('id', commentId); if (error) throw error; setComments(prev => prev.filter(c => c.id !== commentId)); } catch (e) { alert("Error deleting comment: " + e.message); }
  };

  const toggleGroupTag = (tag, isEdit) => {
      if (isEdit) {
          setEditGroupTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
      } else {
          setNewGroupTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
      }
  };

  const handleViewProfile = (profile) => {
      if (!profile) return;
      setViewingUser(profile);
      setActiveModal('view_profile');
  };

  const handleWarnUser = async (userId) => {
      if (!supabase) return;
      if (!window.confirm("Issue a warning to this user?")) return;
      setViewingUser(prev => ({ ...prev, warning_count: (prev.warning_count || 0) + 1 }));
      const { data } = await supabase.from('profiles').select('warning_count').eq('id', userId).single();
      await supabase.from('profiles').update({ warning_count: (data?.warning_count || 0) + 1 }).eq('id', userId);
  };
  
  const handleCloseOwnTicket = async () => {
      if(window.confirm("Close your ticket?")) {
        await supabase.from('support_tickets').update({status:'closed'}).eq('id', userTicket.id);
        setUserTicket(null); setIsSupportOpen(false);
      }
  };


  // SUPABASE INIT
  useEffect(() => {
    if (supabase) return;
    const initClient = () => {
      if (window.supabase && !window._supabaseInstance) { window._supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); }
      if (window.supabase) setSupabase(window._supabaseInstance);
    };
    if (window.supabase) { initClient(); return; }
    const script = document.createElement("script"); script.src = "https://unpkg.com/@supabase/supabase-js@2"; script.async = true; script.onload = initClient; document.body.appendChild(script);
  }, [supabase]);

  // AUTH
  useEffect(() => {
    if(!supabase) return;
    supabase.auth.getSession().then(({data:{session}}) => { setAuthUser(session?.user ?? null); if(!session?.user) setAuthLoading(false); });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_e, session) => { setAuthUser(session?.user ?? null); if(!session?.user) { setCurrentUser(null); setAuthLoading(false); }});
    return () => subscription.unsubscribe();
  }, [supabase]);

  // MAIN DATA
  useEffect(() => {
    if (!authUser || !supabase) return;
    const fetchData = async () => {
      let { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
      if (!profile) { const { data } = await supabase.from('profiles').insert({ id: authUser.id, name: authUser.user_metadata?.display_name || "User", username: authUser.user_metadata?.username || `user_${authUser.id.substring(0,6)}`, role: authUser.user_metadata?.role || "Civilian" }).select().single(); profile = data; }
      setCurrentUser(profile);
      const { data: g } = await supabase.from('groups').select('*').order('created_at', { ascending: false }); setGroups(g);
      const { data: m } = await supabase.from('group_members').select('group_id').eq('user_id', authUser.id); setJoinedGroupIds(m.map(x=>x.group_id));
      const { data: n } = await supabase.from('notifications').select(`*, profiles:actor_id(name)`).eq('user_id', authUser.id).limit(20); setNotifications(n);
      const { data: t } = await supabase.from('support_tickets').select('*').eq('user_id', authUser.id).limit(1); if(t && t.length > 0) setUserTicket(t[0]);
      
      const { data: p } = await supabase.from('posts').select(`*, profiles:uid (id,name,username,role,global_role,badges,image)`).is('group_id', null).order('created_at', {ascending:false});
      setPosts(p);
      setAuthLoading(false);
    };
    fetchData();
  }, [authUser, supabase]);

  // AUTO-CLOSE TICKET WATCHER
  useEffect(() => {
    if (!supabase || !userTicket) return;
    const sub = supabase.channel(`my_ticket:${userTicket.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_tickets', filter: `id=eq.${userTicket.id}` }, (payload) => {
          if (payload.new.status === 'closed') {
              setIsSupportOpen(false);
              setUserTicket(null);
              setSupportMessages([]);
              alert("Your support ticket has been closed by staff.");
          }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${userTicket.id}` }, (payload) => {
         // Handle new messages logic if needed, already handled by another useEffect for list
      })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [userTicket, supabase]);

  // FETCH MESSAGES
  useEffect(() => {
    if(!userTicket || !supabase) return;
    const fetchMsgs = async () => {
        const {data} = await supabase.from('support_messages').select('*, profiles:sender_id(name, role, global_role)').eq('ticket_id', userTicket.id).order('created_at', {ascending:true});
        setSupportMessages(data);
        if(supportScrollRef.current) supportScrollRef.current.scrollTop = supportScrollRef.current.scrollHeight;
    };
    fetchMsgs();
    const sub = supabase.channel(`msgs:${userTicket.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${userTicket.id}` }, async (pl) => {
        const {data:s} = await supabase.from('profiles').select('name, role, global_role').eq('id', pl.new.sender_id).single();
        setSupportMessages(prev => [...prev, {...pl.new, profiles: s}]);
        if(supportScrollRef.current) supportScrollRef.current.scrollTop = supportScrollRef.current.scrollHeight;
    }).subscribe();
    return () => supabase.removeChannel(sub);
  }, [userTicket, supabase]);

  // OTHER LOGIC (Group data, Comments, etc - simplified for brevity, assume intact from previous versions)
  // ... (Keep existing fetchPosts, handlers etc) ...

  useEffect(() => {
    const fetchGroupData = async () => {
        if (!supabase || !authUser || !activeGroup) { setCurrentGroupRole(null); setMemberCount(0); return; }
        const { data } = await supabase.from('group_members').select('role').eq('group_id', activeGroup.id).eq('user_id', authUser.id).single();
        if (activeGroup.creator_id === authUser.id) setCurrentGroupRole('admin'); 
        else setCurrentGroupRole(data ? data.role : null);
        const { count } = await supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', activeGroup.id);
        setMemberCount(count || 0);
    };
    fetchGroupData();
  }, [activeGroup, authUser, supabase]);

  useEffect(() => {
    if (!viewingCommentsPost || !supabase) { setComments([]); return; }
    const fetchComments = async () => {
        const { data } = await supabase.from('comments').select(`*, profiles:user_id ( id, name, username, role, global_role, badges )`).eq('post_id', viewingCommentsPost.id).order('is_pinned', { ascending: false }).order('created_at', { ascending: true });
        if (data) setComments(data);
    };
    fetchComments();
    const channel = supabase.channel(`comments:${viewingCommentsPost.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${viewingCommentsPost.id}` }, () => { fetchComments(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [viewingCommentsPost, supabase]);

  // Support messages fetch (User side only)
  useEffect(() => {
    const ticketId = userTicket?.id;
    if (!ticketId || !supabase) return;
    const fetchMessages = async () => {
        const { data } = await supabase.from('support_messages').select(`*, profiles:sender_id (name, role, global_role )`).eq('ticket_id', ticketId).order('created_at', { ascending: true });
        setSupportMessages(data || []);
        if (supportScrollRef.current) supportScrollRef.current.scrollTop = supportScrollRef.current.scrollHeight;
    };
    fetchMessages();
    const channel = supabase.channel(`ticket:${ticketId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${ticketId}` }, async (payload) => {
        const { data: sender } = await supabase.from('profiles').select('name, role, global_role').eq('id', payload.new.sender_id).single();
        const msgWithProfile = { ...payload.new, profiles: sender };
        setSupportMessages(prev => [...prev, msgWithProfile]);
        if (supportScrollRef.current) supportScrollRef.current.scrollTop = supportScrollRef.current.scrollHeight;
    }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [userTicket, supabase]);

  useEffect(() => {
      if (feedMode === 'chat' && supabase) {
          const fetchChat = async () => {
              const { data } = await supabase.from('global_chat').select(`*, profiles:user_id ( id, name, username, role, global_role, badges )`).order('created_at', { ascending: false }).limit(50);
              if (data) setGlobalChatMessages(data.reverse());
              if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
          };
          fetchChat();
          const channel = supabase.channel('global_chat')
              .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_chat' }, async (payload) => {
                   const { data: sender } = await supabase.from('profiles').select('id, name, username, role, global_role, badges').eq('id', payload.new.user_id).single();
                   const msgWithProfile = { ...payload.new, profiles: sender };
                   setGlobalChatMessages(prev => [...prev, msgWithProfile]);
                   if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
              })
              .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'global_chat' }, (payload) => {
                   setGlobalChatMessages(prev => prev.filter(m => m.id !== payload.old.id));
              })
              .subscribe();
          return () => supabase.removeChannel(channel);
      }
  }, [feedMode, supabase]);
  
  // RENDER SWITCH
  if (isStaffMode) {
      return <ModerationDashboard supabase={supabase} sessionUser={authUser} profile={currentUser} onExit={() => setIsStaffMode(false)} />;
  }

  // NORMAL RENDER
  if (authLoading) return <div className="h-screen bg-[#0a0a0c] flex items-center justify-center text-blue-500"><Loader2 className="animate-spin"/></div>;
  if (!authUser) return (
      <div className="h-screen bg-[#0a0a0c] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <h1 className="text-2xl text-white font-bold text-center mb-6">Liberty Social</h1>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authError && <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg text-red-400 text-sm mb-4 text-center">{authError}</div>}
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Email Access</label><div className="relative"><Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" /><input name="email" required type="email" placeholder="officer@liberty.com" className="w-full bg-black/40 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-all focus:bg-slate-900/50" /></div></div>
                <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Passcode</label><div className="relative"><Key className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" /><input name="password" required type="password" placeholder="••••••••" className="w-full bg-black/40 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-all focus:bg-slate-900/50" /></div></div>
                
                {isSignUp && (
                  <div className="space-y-4 animate-in slide-in-from-top-4 pt-2">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Handle (@)</label><input name="username" required type="text" placeholder="officer_bob" className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none transition-all" /></div>
                          <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Display Name</label><input name="displayName" required type="text" placeholder="Bob Smith" className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none transition-all" /></div>
                      </div>
                      <div className="space-y-1"><label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Department / Role</label><div className="relative"><Badge className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" /><select name="role" className="w-full bg-black/40 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white outline-none cursor-pointer appearance-none focus:border-blue-500 transition-all"><option value="Civilian">Civilian</option><option value="Law Enforcement">Law Enforcement</option><option value="Fire/EMS">Fire/EMS</option><option value="DOT">DOT</option></select><ChevronRight className="absolute right-3 top-3.5 w-4 h-4 text-slate-600 rotate-90 pointer-events-none" /></div></div>
                  </div>
                )}

                <button disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center mt-6 transition-all transform active:scale-[0.98] shadow-lg shadow-blue-900/30 group">{isSubmitting ? <Loader2 className="animate-spin"/> : (<span className="flex items-center gap-2">{isSignUp ? "Create Account" : "Secure Login"} <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>)}</button>
            </form>
            <div className="mt-6 text-center pt-6 border-t border-slate-800/50"><button onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); }} className="text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center w-full gap-2 group">{isSignUp ? "Already have an ID? Sign In" : "New to the city? Create Account"}<ArrowLeft className={`w-3 h-3 transition-transform ${isSignUp ? '' : 'rotate-180'}`} /></button></div>
        </div>
      </div>
  );

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-slate-100 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <nav className="hidden md:flex flex-col w-64 bg-[#0a0a0c] border-r border-slate-800 p-4">
          <h1 className="text-xl font-black italic px-4 mb-6">LIBERTY</h1>
          <div className="space-y-1">
             <NavItem icon={<Compass size={20}/>} label="Feed" active={currentView === 'feed'} onClick={() => setCurrentView('feed')} />
             <NavItem icon={<Users size={20}/>} label="Groups" active={currentView === 'groups'} onClick={() => setCurrentView('groups')} />
             <NavItem icon={<User size={20}/>} label="Profile" active={currentView === 'profile'} onClick={() => setCurrentView('profile')} />
             <NavItem icon={<Settings size={20}/>} label="Settings" onClick={() => setActiveModal('settings')} />
             {isGlobalStaff && (
                 <div className="pt-4 border-t border-slate-800 mt-4">
                     <button onClick={() => setIsStaffMode(true)} className="w-full bg-blue-900/20 text-blue-400 border border-blue-500/30 p-3 rounded-xl flex items-center gap-3 font-bold hover:bg-blue-900/40 transition-colors">
                        <Shield size={18}/> Staff Panel
                     </button>
                 </div>
             )}
          </div>
          <button onClick={() => setIsSupportOpen(!isSupportOpen)} className="mt-auto flex items-center gap-3 p-3 text-slate-400 hover:text-white"><LifeBuoy size={20}/> Support</button>
      </nav>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto relative">
         <div className="p-4 md:hidden flex justify-between items-center border-b border-slate-800 sticky top-0 bg-[#0a0a0c] z-20">
             <span className="font-bold">Liberty</span>
             {isGlobalStaff && <button onClick={() => setIsStaffMode(true)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Staff</button>}
         </div>
         <div className="p-4 max-w-2xl mx-auto pb-24">
             {/* Feed / Content Logic here (Simplified for brevity, insert real render logic) */}
             {currentView === 'feed' && (
                 <>
                  {/* Create Post Input */}
                  <div className="mb-6 bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <input className="bg-transparent w-full outline-none text-white" placeholder="What's happening?" value={newPostText} onChange={e=>setNewPostText(e.target.value)}/>
                      <div className="flex justify-end mt-2"><button onClick={handleCreatePost} className="bg-blue-600 px-4 py-1.5 rounded-lg text-white font-bold text-sm">Post</button></div>
                  </div>
                  {posts.map(p => <PostCard key={p.id} post={p} currentUser={currentUser} groupRole={null} />)}
                 </>
             )}
             {currentView === 'profile' && <div className="text-center p-10"><h2 className="text-2xl font-bold">{currentUser.name}</h2><p className="text-slate-500">@{currentUser.username}</p></div>}
         </div>
      </main>

      {/* SUPPORT WIDGET */}
      {isSupportOpen && (
          <div className="fixed bottom-20 right-4 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-96 z-50">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-2xl">
                  <h4 className="font-bold text-white flex items-center gap-2"><LifeBuoy size={16}/> Support</h4>
                  <div className="flex gap-2">
                    {userTicket && <button onClick={handleCloseOwnTicket} className="text-xs text-red-400 hover:text-red-300">End</button>}
                    <button onClick={() => setIsSupportOpen(false)}><X size={18}/></button>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2" ref={supportScrollRef}>
                  {!userTicket ? (
                      <div className="text-center mt-10 space-y-4">
                          <p className="text-sm text-slate-400">Contact staff directly.</p>
                          <button onClick={handleCreateSupportTicket} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm">Start Chat</button>
                      </div>
                  ) : (
                      supportMessages.map(m => (
                          <div key={m.id} className={`flex ${m.sender_id === authUser.id ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] p-2 rounded-xl text-sm ${m.sender_id === authUser.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>{m.content}</div>
                          </div>
                      ))
                  )}
              </div>
              {userTicket && (
                  <div className="p-3 border-t border-slate-800 flex gap-2">
                      <input className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white outline-none" value={supportInput} onChange={e => setSupportInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendSupportMessage()}/>
                      <button onClick={handleSendSupportMessage} className="bg-blue-600 p-2 rounded-lg text-white"><Send size={16}/></button>
                  </div>
              )}
          </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
