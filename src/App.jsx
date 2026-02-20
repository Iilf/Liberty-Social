import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield, MessageSquare, Share2, Heart, Search, Bell, User, Navigation, PlusCircle,
  Image as ImageIcon, Smile, Server, X, Lock, Unlock, ChevronRight, Loader2, Users,
  Flag, AlertTriangle, ArrowLeft, Settings, Compass, Mail, Key, Trash2, Crown,
  Ban, Edit3, UserCog, Hash, Megaphone, CalendarDays, Pin, Star, BadgeCheck,
  Send, LifeBuoy, Inbox, Clock, Hammer, Badge, AlertOctagon, Globe, RefreshCw,
  MessageCircle, Download, ShieldAlert, Activity, CheckCircle, XCircle, Eye, Camera
} from 'lucide-react';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const getEnv = (k, fb) => { try { if (typeof process !== 'undefined' && process?.env?.[k]) return process.env[k]; } catch (_) {} return fb; };
const SUPABASE_URL = getEnv('REACT_APP_SUPABASE_URL', 'https://wcavpryumlohjccxiohq.supabase.co');
const SUPABASE_KEY = getEnv('REACT_APP_SUPABASE_ANON_KEY', 'sb_publishable_EoFH2MIrf4Xc1cJJaiAlHg_ct72t-ru');

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// NOTE: icons are kept separate and NOT stored in DB (would serialize as [object Object])
const TAGS = [
  { id: 'discussion', label: 'Discussion', color: 'text-blue-400' },
  { id: 'funny',      label: 'Funny',      color: 'text-yellow-400' },
  { id: 'server',     label: 'Server',     color: 'text-emerald-400' },
];
const TAG_ICONS = { discussion: <MessageCircle size={14} />, funny: <Smile size={14} />, server: <Server size={14} /> };

// Safe error message extractor — Supabase errors are plain objects, not Error instances
const errMsg = (err) => {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (typeof err.message === 'string') return err.message;
  try { return JSON.stringify(err); } catch (_) { return String(err); }
};
const GROUP_CHANNELS = [
  { id: 'announcements', label: 'Announcements', icon: <Megaphone size={16} />,     restricted: true },
  { id: 'events',        label: 'Events',        icon: <CalendarDays size={16} />,  restricted: true },
  { id: 'general',       label: 'General',       icon: <Hash size={16} />,          restricted: false },
];
const AVAILABLE_GROUP_TAGS = [
  { id: 'Roleplay', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { id: 'Strict',   color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { id: 'Casual',   color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  { id: 'Police',   color: 'bg-blue-600/20 text-blue-300 border-blue-600/30' },
  { id: 'Fire/EMS', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { id: 'Mafia',    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { id: 'Events',   color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
];
const STAFF_ROLES = ['owner', 'admin', 'moderator', 'developer'];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  if (!role || role === 'civilian' || role === 'user')
    return <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 font-bold uppercase tracking-wider">Civilian</span>;
  if (role === 'owner')
    return <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 flex items-center gap-1 w-fit font-bold uppercase tracking-wider"><Crown size={10} /> Owner</span>;
  if (role === 'admin')
    return <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded border border-orange-500/30 flex items-center gap-1 w-fit font-bold uppercase tracking-wider"><Shield size={10} /> Admin</span>;
  if (role === 'moderator')
    return <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1 w-fit font-bold uppercase tracking-wider"><ShieldAlert size={10} /> Mod</span>;
  return <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 uppercase font-bold tracking-wider">{role}</span>;
};

const DashboardNavItem = ({ icon, label, active, onClick, badge }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-zinc-800 hover:text-slate-200'}`}>
    {icon}
    <span className="text-sm font-semibold flex-1 text-left">{label}</span>
    {badge > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>}
  </button>
);

const NavItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${active ? 'bg-blue-500/10 text-blue-500 font-medium' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
    {icon} <span className="text-sm">{label}</span>
  </div>
);

const RenderNameWithRole = ({ profile, nickname }) => {
  if (!profile) return <span className="text-slate-400">Unknown</span>;
  const displayName   = nickname || profile.name;
  const role          = profile.role;
  const globalRole    = profile.global_role;
  const badges        = Array.isArray(profile.badges) ? profile.badges : [];
  const isInfluencer  = globalRole === 'influencer' || badges.includes('influencer');
  const isDeveloper   = globalRole === 'developer'  || badges.includes('developer');
  const isOfficial    = badges.includes('official');

  let nameColor = 'text-slate-200';
  if (isDeveloper)             nameColor = 'text-green-400';
  else if (globalRole === 'owner')  nameColor = 'text-blue-400';
  else if (isInfluencer)       nameColor = 'text-yellow-200';
  else if (globalRole === 'admin')  nameColor = 'text-orange-400';
  else if (globalRole === 'moderator') nameColor = 'text-cyan-400';

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className={`font-bold text-sm ${nameColor} flex items-center gap-1.5`}>
        {displayName}
        {globalRole === 'owner'     && <Crown  size={12} className="text-yellow-500" fill="currentColor" />}
        {globalRole === 'admin'     && <Shield size={12} className="text-orange-500" fill="currentColor" />}
        {globalRole === 'moderator' && <Shield size={12} className="text-cyan-400" />}
        {isDeveloper                && <Hammer size={12} fill="currentColor" />}
        {isInfluencer               && <Star   size={12} className="text-yellow-500" fill="currentColor" />}
      </span>
      {isOfficial   && <span className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/30 px-1 rounded font-bold uppercase flex items-center gap-0.5"><BadgeCheck size={8} /> Official</span>}
      {isInfluencer && !isDeveloper && !isOfficial && <span className="text-[9px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1 rounded font-bold uppercase">Influencer</span>}
      {role && <span className="text-[9px] text-slate-500 uppercase font-semibold border border-slate-800 px-1 rounded bg-slate-900/50">{role}</span>}
    </div>
  );
};

const PostCard = ({ post, onReport, onDelete, onLike, onBan, onViewComments, currentUser, isLiked, groupRole, onViewProfile }) => {
  const globalRole = post.profiles?.global_role;
  let cardStyle = 'bg-slate-900/40 border-slate-800/60';
  if (globalRole === 'owner')     cardStyle = 'bg-blue-950/30 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]';
  else if (globalRole === 'developer') cardStyle = 'bg-green-950/20 border-green-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
  else if (globalRole === 'admin')     cardStyle = 'bg-red-950/20 border-red-500/30';
  else if (globalRole === 'moderator') cardStyle = 'bg-cyan-950/20 border-cyan-500/30';
  else if (globalRole === 'influencer' || (post.profiles?.badges || []).includes('influencer'))
    cardStyle = 'bg-pink-950/20 border-pink-500/30';

  const isGlobalStaff = STAFF_ROLES.includes(currentUser?.global_role);
  const isGroupStaff  = ['admin', 'moderator'].includes(groupRole);
  const isAuthor      = post.uid === currentUser?.id;
  const canDelete     = isGlobalStaff || (post.group_id && isGroupStaff) || isAuthor;

  return (
    <div className={`${cardStyle} border rounded-2xl p-5 mb-4 transition-all shadow-sm relative overflow-hidden`}>
      {(globalRole === 'owner' || globalRole === 'developer') &&
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />}
      <div className="flex gap-4 relative z-10">
        <div onClick={onViewProfile} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-400 shrink-0 border border-slate-700 overflow-hidden cursor-pointer hover:border-blue-500 transition-colors">
          {post.profiles?.image
            ? <img src={post.profiles.image} className="w-full h-full object-cover" alt="" />
            : post.profiles?.name?.[0] ?? <User size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div onClick={onViewProfile} className="cursor-pointer">
              <RenderNameWithRole profile={post.profiles || { name: post.user_name, role: post.user_role }} />
              <span className="text-xs text-slate-500 block mt-0.5">
                @{post.profiles?.username || 'user'} · {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex gap-1">
              <button onClick={onReport}  className="p-1.5 text-slate-600 hover:bg-slate-800 rounded-lg hover:text-white  transition-colors" title="Report"><Flag    size={14} /></button>
              {canDelete  && <button onClick={onDelete} className="p-1.5 text-slate-600 hover:bg-red-500/10  rounded-lg hover:text-red-400 transition-colors"><Trash2 size={14} /></button>}
              {isGlobalStaff && <button onClick={onBan} className="p-1.5 text-slate-600 hover:bg-red-500/10  rounded-lg hover:text-red-500 transition-colors"><Ban    size={14} /></button>}
            </div>
          </div>
          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
          {post.image && (
            <div className="mt-3 rounded-xl border border-slate-800/50 overflow-hidden bg-black/40">
              <img src={post.image} className="w-full max-h-96 object-contain" alt="" />
            </div>
          )}
          <div className="flex gap-6 mt-4 border-t border-slate-800/50 pt-3">
            <button onClick={onLike} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isLiked ? 'text-pink-500' : 'text-slate-500 hover:text-pink-500'}`}>
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} /> <span>{post.like_count}</span>
            </button>
            <button onClick={onViewComments} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-400 transition-colors">
              <MessageSquare size={16} /> <span>{post.comment_count}</span>
            </button>
            <button className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-400 transition-colors ml-auto">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MODERATION DASHBOARD ─────────────────────────────────────────────────────
function ModerationDashboard({ supabase, sessionUser, profile, onExit }) {
  const [currentView,    setCurrentView]    = useState('dashboard');
  const [reports,        setReports]        = useState([]);
  const [reportFilter,   setReportFilter]   = useState('pending');
  const [inspectedReport, setInspectReport] = useState(null);
  const [applications,   setApplications]   = useState([]);
  const [tickets,        setTickets]        = useState([]);
  const [activeTicket,   setActiveTicket]   = useState(null);
  const [messages,       setMessages]       = useState([]);
  const [replyText,      setReplyText]      = useState('');
  const [isRefreshing,   setIsRefreshing]   = useState(false);
  const [dataError,      setDataError]      = useState(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffResults,   setStaffResults]   = useState([]);
  const messagesEndRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!supabase || !profile) return;
    setIsRefreshing(true); setDataError(null);
    try {
      const { data: reps } = await supabase.from('reports')
        .select('*, profiles:reporter_id(name,username)')
        .eq('status', reportFilter).order('created_at', { ascending: false });
      setReports(reps || []);

      let appQ = supabase.from('applications')
        .select('*, profiles:user_id(name,username,badges,global_role)')
        .eq('status', 'pending').order('created_at', { ascending: false });
      if (profile.global_role !== 'owner') appQ = appQ.eq('type', 'verification');
      const { data: apps } = await appQ;
      setApplications(apps || []);

      const { data: tix } = await supabase.from('support_tickets')
        .select('*').neq('status', 'closed').order('created_at', { ascending: false });
      setTickets(tix || []);
    } catch (err) { setDataError(errMsg(err)); }
    finally { setIsRefreshing(false); }
  }, [supabase, profile, reportFilter]);

  useEffect(() => {
    loadData();
    if (currentView === 'staff') fetchStaff();
    if (!supabase) return;
    const sub = supabase.channel('mod_room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, loadData)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [profile, reportFilter, currentView, loadData]);

  useEffect(() => {
    if (!activeTicket || !supabase) return;
    const load = async () => {
      const { data } = await supabase.from('support_messages')
        .select('*, profiles:sender_id(name,global_role)')
        .eq('ticket_id', activeTicket.id).order('created_at', { ascending: true });
      setMessages(data || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };
    load();
    const sub = supabase.channel(`ticket:${activeTicket.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${activeTicket.id}` },
        async (payload) => {
          const { data: sender } = await supabase.from('profiles').select('name,global_role').eq('id', payload.new.sender_id).single();
          setMessages(prev => [...prev, { ...payload.new, profiles: sender }]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [activeTicket, supabase]);

  const fetchStaff = async () => {
    const { data } = await supabase.from('profiles').select('*').in('global_role', STAFF_ROLES);
    setStaffResults(data || []);
  };

  const handleUpdateReport = async (id, newStatus) => {
    if (!window.confirm(`Mark as ${newStatus}?`)) return;
    const { error } = await supabase.from('reports').update({ status: newStatus }).eq('id', id);
    if (error) return alert('Failed: ' + errMsg(error));
    setReports(prev => prev.filter(r => r.id !== id)); setInspectReport(null);
  };

  const handleInspectReport = async (report) => {
    let content = null, authorId = null, authorName = 'Unknown';
    try {
      if (report.target_type === 'post') {
        const { data } = await supabase.from('posts').select('content,uid,profiles(name,username)').eq('id', report.target_id).single();
        if (data) { content = data.content; authorId = data.uid; authorName = data.profiles?.username; }
      } else if (report.target_type === 'comment') {
        const { data } = await supabase.from('comments').select('content,user_id,profiles(name,username)').eq('id', report.target_id).single();
        if (data) { content = data.content; authorId = data.user_id; authorName = data.profiles?.username; }
      } else if (report.target_type === 'user') {
        const { data } = await supabase.from('profiles').select('name,username').eq('id', report.target_id).single();
        if (data) { content = 'User Profile Report'; authorId = report.target_id; authorName = data.username; }
      } else if (report.target_type === 'community') {
        const { data } = await supabase.from('groups').select('name,description').eq('id', report.target_id).single();
        if (data) { content = `Community: ${data.name}\nDesc: ${data.description}`; authorName = data.name; }
      }
    } catch (e) { console.error(e); }
    setInspectReport({ ...report, content_snapshot: content, target_author_id: authorId, target_author_name: authorName });
  };

  const handleWarnUser = async (userId) => {
    if (!userId || !window.confirm('Issue a formal warning?')) return;
    const { data } = await supabase.from('profiles').select('warning_count').eq('id', userId).single();
    const newCount = (data?.warning_count || 0) + 1;
    const { error } = await supabase.from('profiles').update({ warning_count: newCount }).eq('id', userId);
    if (error) alert('Failed: ' + errMsg(error));
    else alert(`User warned. Total warnings: ${newCount}`);
  };

  const handleReviewApplication = async (app, action) => {
    if (action === 'approve') {
      if (app.type === 'verification') {
        const badges = app.profiles?.badges || [];
        if (!badges.includes('influencer')) await supabase.from('profiles').update({ badges: [...badges, 'influencer'] }).eq('id', app.user_id);
      } else if (app.type === 'staff' && profile.global_role === 'owner') {
        await supabase.from('profiles').update({ global_role: 'moderator' }).eq('id', app.user_id);
      }
    }
    await supabase.from('applications').update({ status: action === 'approve' ? 'approved' : 'rejected' }).eq('id', app.id);
    setApplications(prev => prev.filter(a => a.id !== app.id));
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeTicket) return;
    const { error } = await supabase.from('support_messages').insert({ ticket_id: activeTicket.id, sender_id: sessionUser.id, content: replyText });
    if (error) alert('Failed: ' + errMsg(error)); else setReplyText('');
  };

  const handleCloseTicket = async () => {
    if (!activeTicket || !window.confirm('Close this ticket?')) return;
    await supabase.from('support_tickets').update({ status: 'closed' }).eq('id', activeTicket.id);
    setTickets(prev => prev.filter(t => t.id !== activeTicket.id)); setActiveTicket(null);
  };

  const handleSearchUser = async () => {
    if (!staffSearchQuery.trim()) return;
    const { data } = await supabase.from('profiles').select('*').ilike('username', `%${staffSearchQuery}%`).limit(10);
    setStaffResults(data || []);
  };

  const handleUpdateRole = async (userId, newRole) => {
    if (!window.confirm(`Change role to ${newRole || 'Civilian'}?`)) return;
    await supabase.from('profiles').update({ global_role: newRole }).eq('id', userId);
    setStaffResults(prev => prev.map(u => u.id === userId ? { ...u, global_role: newRole } : u));
  };

  const isOwner = profile?.global_role === 'owner';

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#0a0a0c] border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-blue-500" />
          <div><h1 className="font-black text-lg tracking-tight">COMMAND</h1><p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold -mt-1">Terminal</p></div>
        </div>
        <div className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          <DashboardNavItem icon={<Activity size={18} />}      label="Dashboard"      active={currentView === 'dashboard'}    onClick={() => setCurrentView('dashboard')} />
          <DashboardNavItem icon={<Flag size={18} />}          label="Investigations" active={currentView === 'reports'}      onClick={() => setCurrentView('reports')}   badge={reports.length} />
          <DashboardNavItem icon={<Inbox size={18} />}         label="Applications"  active={currentView === 'applications'} onClick={() => setCurrentView('applications')} badge={applications.length} />
          <DashboardNavItem icon={<MessageSquare size={18} />} label="Active Calls"  active={currentView === 'support'}     onClick={() => setCurrentView('support')}   badge={tickets.length} />
          {isOwner && (
            <div className="mt-6">
              <p className="text-[10px] font-bold uppercase text-slate-500 px-4 mb-2">Owner Controls</p>
              <DashboardNavItem icon={<Users size={18} />} label="Manage Staff" active={currentView === 'staff'} onClick={() => setCurrentView('staff')} />
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="min-w-0"><p className="text-sm font-bold text-white truncate">{profile.name}</p><RoleBadge role={profile.global_role} /></div>
          <button onClick={onExit} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><ArrowLeft size={16} /> Exit</button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center px-8 justify-between shrink-0">
          <h2 className="text-lg font-bold capitalize">{currentView.replace('_', ' ')}</h2>
          <button onClick={loadData} disabled={isRefreshing} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg transition-colors">
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
        {dataError && <div className="m-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">Error: {dataError}</div>}
        <div className="flex-1 overflow-y-auto p-8 relative">

          {/* Dashboard */}
          {currentView === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { label: 'Reports',      count: reports.length,      bg: 'bg-red-500/10',    text: 'text-red-500',    Icon: Flag },
                { label: 'Applications', count: applications.length, bg: 'bg-yellow-500/10', text: 'text-yellow-500', Icon: Inbox },
                { label: 'Tickets',      count: tickets.length,      bg: 'bg-green-500/10',  text: 'text-green-500',  Icon: MessageSquare },
              ].map(({ label, count, bg, text, Icon }) => (
                <div key={label} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
                  <div className={`${bg} p-4 rounded-xl ${text}`}><Icon size={24} /></div>
                  <div><p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">{label}</p><p className="text-3xl font-black text-white">{count}</p></div>
                </div>
              ))}
            </div>
          )}

          {/* Reports */}
          {currentView === 'reports' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex gap-2 border-b border-slate-800 pb-4">
                {['pending', 'resolved', 'dismissed'].map(s => (
                  <button key={s} onClick={() => { setReportFilter(s); setInspectReport(null); }}
                    className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${reportFilter === s ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>{s}</button>
                ))}
              </div>
              {reports.length === 0
                ? <p className="text-center text-slate-500 py-10">No {reportFilter} reports.</p>
                : reports.map(r => (
                  <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded font-bold uppercase border border-red-500/30">Target: {r.target_type}</span>
                          <span className="text-slate-400 text-sm">By: <span className="text-white">@{r.profiles?.username || 'unknown'}</span></span>
                        </div>
                        <p className="text-slate-300 font-medium">Reason: {r.reason}</p>
                        <p className="text-xs text-slate-500 mt-1 font-mono">ID: {r.target_id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.status === 'pending' && (<>
                          <button onClick={() => handleInspectReport(r)} className="bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 border border-slate-700 hover:border-blue-500/50 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Eye size={14} /> Inspect</button>
                          <button onClick={() => handleUpdateReport(r.id, 'resolved')}  className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 px-4 py-2 rounded-lg text-xs font-bold">Resolve</button>
                          <button onClick={() => handleUpdateReport(r.id, 'dismissed')} className="bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 px-4 py-2 rounded-lg text-xs font-bold">Dismiss</button>
                        </>)}
                        {r.status !== 'pending' && <span className="text-xs uppercase font-bold text-slate-500 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">{r.status}</span>}
                      </div>
                    </div>
                    {inspectedReport?.id === r.id && (
                      <div className="bg-slate-950 border-t border-slate-800 p-5">
                        <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Content Snapshot</h4>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 mb-4 whitespace-pre-wrap">{inspectedReport.content_snapshot || 'Content not found or deleted.'}</div>
                        <div className="flex gap-3 pt-2 border-t border-slate-800">
                          <button onClick={() => handleWarnUser(inspectedReport.target_author_id)} disabled={!inspectedReport.target_author_id}
                            className="flex-1 bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-500 border border-yellow-900/50 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                            <AlertTriangle size={14} /> Warn Accused (@{inspectedReport.target_author_name})
                          </button>
                          <button onClick={() => handleWarnUser(r.reporter_id)}
                            className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                            <AlertOctagon size={14} /> Warn Reporter (False Report)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* Applications */}
          {currentView === 'applications' && (
            <div className="max-w-4xl mx-auto space-y-4">
              {applications.length === 0
                ? <p className="text-center text-slate-500 py-10">No pending applications.</p>
                : applications.map(app => (
                  <div key={app.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {app.type === 'verification'
                          ? <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded font-bold uppercase border border-yellow-500/30 flex items-center gap-1"><BadgeCheck size={12} /> Influencer</span>
                          : <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded font-bold uppercase border border-blue-500/30 flex items-center gap-1"><Shield size={12} /> Staff</span>}
                        <span className="text-white font-bold">{app.profiles?.name} <span className="text-slate-500 font-normal">(@{app.profiles?.username})</span></span>
                      </div>
                      <p className="text-slate-300 text-sm bg-slate-950 p-3 rounded-lg border border-slate-800 mt-2 font-mono">{app.content}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleReviewApplication(app, 'reject')}  className="p-2 bg-slate-800 hover:bg-red-500/20 text-red-400 rounded-lg"><XCircle size={20} /></button>
                      <button onClick={() => handleReviewApplication(app, 'approve')} className="p-2 bg-slate-800 hover:bg-green-500/20 text-green-400 rounded-lg"><CheckCircle size={20} /></button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Support */}
          {currentView === 'support' && (
            <div className="absolute inset-4 md:inset-8 flex gap-4">
              <div className="w-1/3 min-w-[220px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-800 bg-slate-950/50"><h3 className="font-bold text-slate-300 text-sm uppercase">Open Calls ({tickets.length})</h3></div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {tickets.map(t => (
                    <button key={t.id} onClick={() => setActiveTicket(t)}
                      className={`w-full text-left p-3 rounded-xl transition-colors ${activeTicket?.id === t.id ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
                      <p className="font-bold text-sm text-white">{t.user_name || 'User'}</p>
                      <p className="text-xs text-slate-400 mt-1"><Clock size={10} className="inline mr-1" />{new Date(t.created_at).toLocaleTimeString()}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
                {activeTicket ? (<>
                  <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                    <p className="font-bold text-white">{activeTicket.user_name}</p>
                    <button onClick={handleCloseTicket} className="text-xs bg-slate-800 text-red-400 px-3 py-1.5 rounded-lg font-bold">Close Call</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/30">
                    {messages.map(m => (
                      <div key={m.id} className={`flex flex-col max-w-[80%] ${m.profiles?.global_role && m.profiles.global_role !== 'civilian' && m.profiles.global_role !== 'user' ? 'ml-auto items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-slate-500 mb-1 ml-1">{m.profiles?.name}</span>
                        <div className={`p-3 rounded-2xl text-sm ${m.profiles?.global_role && m.profiles.global_role !== 'civilian' && m.profiles.global_role !== 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>{m.content}</div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
                    <input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendReply()} placeholder="Type dispatch response..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none" />
                    <button onClick={handleSendReply} className="bg-blue-600 text-white p-2.5 rounded-xl"><Send size={18} /></button>
                  </div>
                </>) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500"><MessageSquare size={48} className="mb-4 opacity-20" /><p>Select a call.</p></div>
                )}
              </div>
            </div>
          )}

          {/* Staff Management */}
          {currentView === 'staff' && isOwner && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-6 flex gap-2">
                <input value={staffSearchQuery} onChange={e => setStaffSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchUser()} placeholder="Search username..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none" />
                <button onClick={handleSearchUser} className="bg-blue-600 text-white px-6 rounded-xl font-bold">Search</button>
              </div>
              <div className="space-y-3">
                {staffResults.map(u => (
                  <div key={u.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                    <div><p className="font-bold text-white">{u.name}</p><RoleBadge role={u.global_role} /></div>
                    <div className="flex gap-2">
                      {u.global_role !== 'owner' && (<>
                        {u.global_role !== 'admin'      && <button onClick={() => handleUpdateRole(u.id, 'admin')}     className="bg-orange-500/10 text-orange-400 px-3 py-1.5 rounded-lg text-xs font-bold">Admin</button>}
                        {u.global_role !== 'moderator'  && <button onClick={() => handleUpdateRole(u.id, 'moderator')} className="bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-lg text-xs font-bold">Mod</button>}
                        <button onClick={() => handleUpdateRole(u.id, 'user')} className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold">Demote</button>
                      </>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ERROR BOUNDARY ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('Uncaught error:', error, info); }
  render() {
    if (this.state.hasError) return (
      <div className="flex h-screen w-full items-center justify-center bg-[#050507] text-slate-200 p-6">
        <div className="max-w-md text-center">
          <AlertOctagon size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black mb-2 text-white">System Critical</h1>
          <p className="text-slate-400 mb-6">The application encountered an unexpected error.</p>
          <button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl">Reboot System</button>
          <div className="mt-8 p-4 bg-black/40 rounded-xl border border-slate-800 text-left overflow-auto max-h-32 text-xs font-mono text-red-400">{errMsg(this.state.error)}</div>
        </div>
      </div>
    );
    return this.props.children;
  }
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function MainApp() {
  const [supabase,        setSupabase]        = useState(null);
  const [authUser,        setAuthUser]        = useState(null);
  const [currentUser,     setCurrentUser]     = useState(null);
  const [currentGroupRole, setCurrentGroupRole] = useState(null);
  const [authLoading,     setAuthLoading]     = useState(true);
  const [isSignUp,        setIsSignUp]        = useState(false);
  const [authError,       setAuthError]       = useState(null);

  const [currentView,      setCurrentView]     = useState('feed');
  const [feedMode,         setFeedMode]        = useState('posts');
  const [activeGroup,      setActiveGroup]     = useState(null);
  const [activeChannel,    setActiveChannel]   = useState('general');
  const [activeModal,      setActiveModal]     = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const [userLikes,        setUserLikes]       = useState([]);
  const [isStaffMode,      setIsStaffMode]     = useState(false);

  const [posts,            setPosts]           = useState([]);
  const [globalChatMessages, setGlobalChatMessages] = useState([]);
  const [groups,           setGroups]          = useState([]);
  const [joinedGroupIds,   setJoinedGroupIds]  = useState([]);
  const [groupMembers,     setGroupMembers]    = useState([]);
  const [notifications,    setNotifications]   = useState([]);

  const [viewingUser,      setViewingUser]     = useState(null);
  const [isSupportOpen,    setIsSupportOpen]   = useState(false);
  const [userTicket,       setUserTicket]      = useState(null);
  const [supportMessages,  setSupportMessages] = useState([]);
  const [supportInput,     setSupportInput]    = useState('');
  const [reportTarget,     setReportTarget]    = useState(null);

  const [viewingCommentsPost, setViewingCommentsPost] = useState(null);
  const [comments,         setComments]        = useState([]);
  const [commentText,      setCommentText]     = useState('');

  const [newPostText,      setNewPostText]     = useState('');
  const [chatInput,        setChatInput]       = useState('');
  const [newGroupText,     setNewGroupText]    = useState('');
  const [newGroupDesc,     setNewGroupDesc]    = useState('');
  const [newGroupImage,    setNewGroupImage]   = useState('');
  const [newGroupTags,     setNewGroupTags]    = useState([]);
  const [editGroupTags,    setEditGroupTags]   = useState([]);
  const [editingMemberId,  setEditingMemberId] = useState(null);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupFilterTag,   setGroupFilterTag]  = useState('All');

  const [selectedTag,      setSelectedTag]     = useState(TAGS[0].id);
  const [selectedImage,    setSelectedImage]   = useState(null);
  const [isSubmitting,     setIsSubmitting]    = useState(false);

  const fileInputRef    = useRef(null);
  const supportScrollRef = useRef(null);
  const chatScrollRef   = useRef(null);
  const commentInputRef = useRef(null);

  const isGlobalStaff = STAFF_ROLES.includes(currentUser?.global_role);

  // ── Derived helpers ─────────────────────────────────────────────────────────
  const canPostInChannel = useCallback(() => {
    if (!activeGroup) return true;
    const channel = GROUP_CHANNELS.find(c => c.id === activeChannel);
    if (!channel) return true;
    if (!channel.restricted) return true;
    return ['admin', 'moderator'].includes(currentGroupRole) || isGlobalStaff;
  }, [activeGroup, activeChannel, currentGroupRole, isGlobalStaff]);

  // ── Supabase init ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (supabase) return;
    const init = () => {
      if (!window.supabase) return;
      if (!window._sb) window._sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      setSupabase(window._sb);
    };
    if (window.supabase) { init(); return; }
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/@supabase/supabase-js@2'; s.async = true; s.onload = init;
    document.body.appendChild(s);
  }, [supabase]);

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      if (!session?.user) setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthUser(session?.user ?? null);
      if (!session?.user) { setCurrentUser(null); setAuthLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // ── Initial data fetch ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!authUser || !supabase) return;
    const load = async () => {
      try {
        let { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
        if (!profile) {
          const { data: np } = await supabase.from('profiles').insert({
            id: authUser.id,
            name: authUser.user_metadata?.display_name || 'User',
            username: authUser.user_metadata?.username || `user_${authUser.id.substring(0, 6)}`,
            role: authUser.user_metadata?.role || 'Civilian',
          }).select().single();
          profile = np;
        }
        setCurrentUser(profile);

        const [{ data: g }, { data: m }, { data: n }, { data: t }, { data: p }, { data: l }, { data: chat }] = await Promise.all([
          supabase.from('groups').select('*').order('created_at', { ascending: false }),
          supabase.from('group_members').select('group_id').eq('user_id', authUser.id),
          supabase.from('notifications').select('*, profiles:actor_id(name)').eq('user_id', authUser.id).order('created_at', { ascending: false }).limit(30),
          supabase.from('support_tickets').select('*').eq('user_id', authUser.id).neq('status', 'closed').limit(1),
          supabase.from('posts').select('*, profiles:uid(id,name,username,role,global_role,badges,image)').is('group_id', null).order('created_at', { ascending: false }).limit(50),
          supabase.from('likes').select('post_id').eq('user_id', authUser.id),
          supabase.from('global_chat').select('*, profiles:user_id(id,name,username,global_role,badges,image)').order('created_at', { ascending: false }).limit(100),
        ]);

        setGroups(g || []);
        setJoinedGroupIds((m || []).map(x => x.group_id));
        setNotifications(n || []);
        if (t && t.length > 0) setUserTicket(t[0]);
        setPosts(p || []);
        setUserLikes((l || []).map(x => x.post_id));
        setGlobalChatMessages((chat || []).reverse()); // oldest first
      } catch (err) { console.error(err); }
      finally { setAuthLoading(false); }
    };
    load();
  }, [authUser, supabase]);

  // ── Global chat realtime ───────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase || !authUser) return;
    const sub = supabase.channel('global_chat_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_chat' }, async (payload) => {
        const { data: sender } = await supabase.from('profiles').select('id,name,username,global_role,badges,image').eq('id', payload.new.user_id).single();
        setGlobalChatMessages(prev => [...prev, { ...payload.new, profiles: sender }]);
        setTimeout(() => chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'global_chat' }, (payload) => {
        setGlobalChatMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [supabase, authUser]);

  // ── Posts realtime (feed) ──────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase || !authUser) return;
    const sub = supabase.channel('posts_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
        if (payload.new.group_id && !activeGroup) return; // only add group posts when in that group
        if (!payload.new.group_id && activeGroup) return; // only add global posts on global feed
        const { data: prof } = await supabase.from('profiles').select('id,name,username,role,global_role,badges,image').eq('id', payload.new.uid).single();
        setPosts(prev => [{ ...payload.new, profiles: prof }, ...prev]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload) => {
        setPosts(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [supabase, authUser, activeGroup]);

  // ── Comments fetch when modal opens ───────────────────────────────────────
  useEffect(() => {
    if (!viewingCommentsPost || !supabase) return;
    setComments([]);
    const load = async () => {
      const { data } = await supabase.from('comments')
        .select('*, profiles:user_id(id,name,username,role,global_role,badges,image)')
        .eq('post_id', viewingCommentsPost.id).order('created_at', { ascending: true });
      setComments(data || []);
    };
    load();
    const sub = supabase.channel(`comments_${viewingCommentsPost.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${viewingCommentsPost.id}` },
        async (payload) => {
          const { data: prof } = await supabase.from('profiles').select('id,name,username,role,global_role,badges,image').eq('id', payload.new.user_id).single();
          setComments(prev => [...prev, { ...payload.new, profiles: prof }]);
        })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [viewingCommentsPost, supabase]);

  // ── Support messages fetch ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userTicket || !supabase) return;
    const load = async () => {
      const { data } = await supabase.from('support_messages')
        .select('*, profiles:sender_id(name,global_role)')
        .eq('ticket_id', userTicket.id).order('created_at', { ascending: true });
      setSupportMessages(data || []);
      setTimeout(() => supportScrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };
    load();
    const sub = supabase.channel(`user_ticket_${userTicket.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${userTicket.id}` },
        async (payload) => {
          const { data: prof } = await supabase.from('profiles').select('name,global_role').eq('id', payload.new.sender_id).single();
          setSupportMessages(prev => [...prev, { ...payload.new, profiles: prof }]);
          setTimeout(() => supportScrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [userTicket, supabase]);

  // ─── ACTION HANDLERS ────────────────────────────────────────────────────────
  const handleAuthSubmit = async (e) => {
    e.preventDefault(); if (!supabase) return;
    setIsSubmitting(true); setAuthError(null);
    const fd = new FormData(e.target);
    try {
      if (isSignUp) {
        const username = fd.get('username').toLowerCase().replace(/\s/g, '');
        const { data, error } = await supabase.auth.signUp({
          email: fd.get('email'), password: fd.get('password'),
          options: { data: { username, display_name: fd.get('displayName'), role: fd.get('role') } },
        });
        if (error) throw error;
        if (data.user && !data.session) { alert('Account created! Check your email to verify.'); setIsSignUp(false); }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: fd.get('email'), password: fd.get('password') });
        if (error) throw error;
      }
    } catch (err) { setAuthError(errMsg(err)); }
    finally { setIsSubmitting(false); }
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    try { await supabase.auth.signOut(); } catch (_) {}
    setAuthUser(null); setCurrentUser(null); setAuthLoading(false);
  };

  const handleWarnUser = async (userId) => {
    if (!userId || !supabase) return;
    if (!window.confirm('Issue a formal warning to this user?')) return;
    const { data } = await supabase.from('profiles').select('warning_count').eq('id', userId).single();
    const newCount = (data?.warning_count || 0) + 1;
    const { error } = await supabase.from('profiles').update({ warning_count: newCount }).eq('id', userId);
    if (error) alert('Failed: ' + errMsg(error)); else alert(`User warned. Total warnings: ${newCount}`);
  };

  const handleBanUser = async (uid) => {
    if (!window.confirm('Globally ban this user?')) return;
    await supabase.from('profiles').update({ is_banned: true }).eq('id', uid);
    alert('User has been banned.');
  };

  const handleCreatePost = async () => {
    if ((!newPostText.trim() && !selectedImage) || !currentUser || !supabase) return;
    setIsSubmitting(true);
    const tagInfo = TAGS.find(t => t.id === selectedTag);
    // Only store serializable fields — never store React elements (icon) to DB
    const tagForDB = tagInfo ? { id: tagInfo.id, label: tagInfo.label, color: tagInfo.color } : null;
    const targetChannel = activeGroup ? activeChannel : 'general';
    try {
      const { data, error } = await supabase.from('posts').insert({
        uid: authUser.id, user_name: currentUser.name, user_role: currentUser.role,
        content: newPostText, tag: tagForDB, group_id: activeGroup ? activeGroup.id : null,
        channel: targetChannel, image: selectedImage,
      }).select('*, profiles:uid(id,name,username,role,global_role,badges,image)').single();
      if (error) throw error;
      setPosts(prev => [data, ...prev]);
      setNewPostText(''); setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) { alert('Error posting: ' + errMsg(err)); }
    finally { setIsSubmitting(false); }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !supabase) return;
    try {
      const { error } = await supabase.from('global_chat').insert({ user_id: authUser.id, content: chatInput });
      if (error) throw error;
      setChatInput('');
    } catch (err) { alert('Failed to send: ' + errMsg(err)); }
  };

  const handleDeleteChatMessage = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    setGlobalChatMessages(prev => prev.filter(m => m.id !== msgId));
    await supabase.from('global_chat').delete().eq('id', msgId);
  };

  const handleLikePost = async (postId, currentLikes) => {
    if (!supabase || !authUser) return;
    const isLiked = userLikes.includes(postId);
    const newCount = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
    const newLikesList = isLiked ? userLikes.filter(id => id !== postId) : [...userLikes, postId];
    setUserLikes(newLikesList);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, like_count: newCount } : p));
    if (isLiked) { await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', authUser.id); }
    else { await supabase.from('likes').insert({ post_id: postId, user_id: authUser.id }); }
    await supabase.from('posts').update({ like_count: newCount }).eq('id', postId);
  };

  const handleDeletePost = async (pid) => {
    if (!window.confirm('Delete this post?')) return;
    setPosts(prev => prev.filter(p => p.id !== pid));
    await supabase.from('posts').delete().eq('id', pid);
  };

  const handlePostComment = async () => {
    if (!supabase || !authUser || !commentText.trim()) return;
    try {
      const { data, error } = await supabase.from('comments').insert({
        post_id: viewingCommentsPost.id, user_id: authUser.id,
        user_name: currentUser.name, content: commentText,
      }).select('*, profiles:user_id(id,name,username,role,global_role,badges,image)').single();
      if (error) throw error;
      setComments(prev => [...prev, data]);
      setCommentText('');
      // increment comment count optimistically
      setPosts(prev => prev.map(p => p.id === viewingCommentsPost.id ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p));
      await supabase.from('posts').update({ comment_count: (viewingCommentsPost.comment_count || 0) + 1 }).eq('id', viewingCommentsPost.id);
    } catch (err) { alert('Failed to comment: ' + errMsg(err)); }
  };

  const handleDeleteComment = async (cid) => {
    if (!window.confirm('Delete this comment?')) return;
    setComments(prev => prev.filter(c => c.id !== cid));
    await supabase.from('comments').delete().eq('id', cid);
  };

  const handleReplyToComment = (comment) => {
    if (commentInputRef.current) {
      setCommentText(`@${comment.profiles?.username || comment.user_name} `);
      commentInputRef.current.focus();
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupText.trim()) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from('groups').insert({
        name: newGroupText, description: newGroupDesc, image: newGroupImage,
        badges: newGroupTags, creator_id: authUser.id,
      }).select().single();
      if (error) throw error;
      await supabase.from('group_members').insert({ group_id: data.id, user_id: authUser.id, role: 'admin' });
      setJoinedGroupIds(prev => [...prev, data.id]);
      setGroups(prev => [data, ...prev]);
      setNewGroupText(''); setNewGroupDesc(''); setNewGroupImage(''); setNewGroupTags([]);
      setActiveModal(null);
    } catch (err) { alert('Error: ' + errMsg(err)); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteGroup = async () => {
    if (!activeGroup || !window.confirm('Delete this community? This cannot be undone.')) return;
    await supabase.from('groups').delete().eq('id', activeGroup.id);
    setGroups(prev => prev.filter(g => g.id !== activeGroup.id));
    setActiveGroup(null); setCurrentView('groups'); setActiveModal(null);
  };

  const handleJoinGroup  = async (e, gid) => { e.stopPropagation(); const { error } = await supabase.from('group_members').insert({ group_id: gid, user_id: authUser.id, role: 'member' }); if (!error) setJoinedGroupIds(prev => [...prev, gid]); };
  const handleLeaveGroup = async (e, gid) => { e.stopPropagation(); if (!window.confirm('Leave this community?')) return; const { error } = await supabase.from('group_members').delete().eq('group_id', gid).eq('user_id', authUser.id); if (!error) setJoinedGroupIds(prev => prev.filter(id => id !== gid)); };

  const handleReport = async (reason) => {
    if (!reportTarget) return;
    try {
      const { error } = await supabase.from('reports').insert({ reporter_id: authUser.id, target_type: reportTarget.type, target_id: String(reportTarget.id), reason, status: 'pending' });
      if (error) throw error;
      setReportTarget(null); alert('Report submitted.');
    } catch (err) { alert('Failed to report: ' + errMsg(err)); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updates = { name: fd.get('displayName'), role: fd.get('role'), image: fd.get('image') };
    await supabase.from('profiles').update(updates).eq('id', authUser.id);
    setCurrentUser(prev => ({ ...prev, ...updates }));
    setActiveModal(null);
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updates = { name: fd.get('groupName'), description: fd.get('groupDesc'), image: fd.get('groupImage'), banner: fd.get('groupBanner'), badges: editGroupTags };
    await supabase.from('groups').update(updates).eq('id', activeGroup.id);
    // Update local state for both the groups list and activeGroup
    setGroups(prev => prev.map(g => g.id === activeGroup.id ? { ...g, ...updates } : g));
    setActiveGroup(prev => ({ ...prev, ...updates }));
    setActiveModal(null);
  };

  const handleSubmitApplication = async (e, type, content) => {
    if (e) e.preventDefault();
    try {
      const fd = new FormData(e.target);
      const link = fd.get('link'); const reason = fd.get('reason');
      const { error } = await supabase.from('applications').insert({ user_id: authUser.id, type, content: `${link}\n\n${reason}` });
      if (error) throw error;
      alert('Application submitted!'); setActiveModal(null);
    } catch (err) { alert(errMsg(err)); }
  };

  const handleCreateSupportTicket = async () => {
    try {
      const { data, error } = await supabase.from('support_tickets').insert({ user_id: authUser.id, user_name: currentUser.name }).select().single();
      if (error) throw error;
      setUserTicket(data);
    } catch (err) { alert(errMsg(err)); }
  };

  const handleSendSupportMessage = async () => {
    if (!supportInput.trim() || !userTicket) return;
    await supabase.from('support_messages').insert({ ticket_id: userTicket.id, sender_id: authUser.id, content: supportInput });
    setSupportInput('');
  };

  const handleCloseOwnTicket = async () => {
    if (!window.confirm('Close this support ticket?')) return;
    await supabase.from('support_tickets').update({ status: 'closed' }).eq('id', userTicket.id);
    setUserTicket(null); setSupportMessages([]); setIsSupportOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Permanently delete your account? This cannot be undone.')) return;
    try { await supabase.rpc('delete_own_user'); await handleLogout(); } catch (err) { alert(errMsg(err)); }
  };

  const handleRequestData = () => alert('Your data is being prepared and will be emailed to you.');

  const handleOpenMembers = async () => {
    setActiveModal('members');
    const { data } = await supabase.from('group_members')
      .select('*, profiles:user_id(id,name,username,role,global_role,badges,image)')
      .eq('group_id', activeGroup.id);
    if (data) setGroupMembers(data);
  };

  const handleKickMember = async (uid) => {
    if (!window.confirm('Kick this user from the community?')) return;
    await supabase.from('group_members').delete().eq('group_id', activeGroup.id).eq('user_id', uid);
    setGroupMembers(prev => prev.filter(m => m.user_id !== uid));
  };

  const handleBanMember = async (uid) => {
    if (!window.confirm('Ban this user from the community?')) return;
    await supabase.from('group_members').update({ role: 'banned' }).eq('group_id', activeGroup.id).eq('user_id', uid);
    setGroupMembers(prev => prev.map(m => m.user_id === uid ? { ...m, role: 'banned' } : m));
  };

  const handleUpdateMemberRole = async (uid, role) => {
    await supabase.from('group_members').update({ role }).eq('group_id', activeGroup.id).eq('user_id', uid);
    setGroupMembers(prev => prev.map(m => m.user_id === uid ? { ...m, role } : m));
  };

  const handleSetNickname = async (uid, newNick) => {
    await supabase.from('group_members').update({ nickname: newNick || null }).eq('group_id', activeGroup.id).eq('user_id', uid);
    setGroupMembers(prev => prev.map(m => m.user_id === uid ? { ...m, nickname: newNick || null } : m));
    setEditingMemberId(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleNotificationClick = async (n) => {
    await supabase.from('notifications').update({ read: true }).eq('id', n.id);
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    if (n.post_id) {
      const { data } = await supabase.from('posts').select('*, profiles:uid(id,name,username,role,global_role,badges,image)').eq('id', n.post_id).single();
      if (data) setViewingCommentsPost(data);
    }
    setShowNotifications(false);
  };

  const handleViewProfile = (p) => { if (p) { setViewingUser(p); setActiveModal('view_profile'); } };

  const toggleGroupTag = (tag, isEdit) => {
    if (isEdit) setEditGroupTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    else        setNewGroupTags(prev  => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const goHome = () => { setActiveGroup(null); setCurrentGroupRole(null); setCurrentView('feed'); setPosts([]); loadGlobalPosts(); };
  const goProfile = () => { setActiveGroup(null); setCurrentView('profile'); loadGlobalPosts(); };

  const loadGlobalPosts = useCallback(async () => {
    if (!supabase || !authUser) return;
    const { data } = await supabase.from('posts').select('*, profiles:uid(id,name,username,role,global_role,badges,image)').is('group_id', null).order('created_at', { ascending: false }).limit(50);
    setPosts(data || []);
  }, [supabase, authUser]);

  const goToGroup = useCallback(async (g) => {
    setActiveGroup(g); setCurrentView('single_group'); setActiveChannel('general'); setPosts([]);
    // Get the user's role in this group
    if (authUser && supabase) {
      const { data: member } = await supabase.from('group_members').select('role').eq('group_id', g.id).eq('user_id', authUser.id).single();
      setCurrentGroupRole(member?.role || null);
      // Load group posts
      const { data: gPosts } = await supabase.from('posts')
        .select('*, profiles:uid(id,name,username,role,global_role,badges,image)')
        .eq('group_id', g.id).eq('channel', 'general').order('created_at', { ascending: false }).limit(50);
      setPosts(gPosts || []);
    }
  }, [supabase, authUser]);

  // Reload posts when channel changes inside a group
  useEffect(() => {
    if (!activeGroup || !supabase) return;
    const load = async () => {
      const { data } = await supabase.from('posts')
        .select('*, profiles:uid(id,name,username,role,global_role,badges,image)')
        .eq('group_id', activeGroup.id).eq('channel', activeChannel).order('created_at', { ascending: false }).limit(50);
      setPosts(data || []);
    };
    load();
  }, [activeChannel, activeGroup, supabase]);

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  if (!supabase || authLoading)
    return <div className="h-screen bg-[#0a0a0c] flex items-center justify-center text-blue-500"><Loader2 className="animate-spin w-10 h-10" /></div>;

  if (!authUser) return (
    <div className="h-screen bg-[#0a0a0c] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-2xl text-white font-bold text-center mb-6">Liberty Social</h1>
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {authError && <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg text-red-400 text-sm text-center">{authError}</div>}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Email</label>
            <div className="relative"><Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              <input name="email" required type="email" placeholder="officer@liberty.com" className="w-full bg-black/40 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-all" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Password</label>
            <div className="relative"><Key className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              <input name="password" required type="password" placeholder="••••••••" className="w-full bg-black/40 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-all" />
            </div>
          </div>
          {isSignUp && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Handle (@)</label>
                  <input name="username" required type="text" placeholder="officer_bob" className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Display Name</label>
                  <input name="displayName" required type="text" placeholder="Bob Smith" className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Department / Role</label>
                <div className="relative"><Badge className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  <select name="role" className="w-full bg-black/40 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white outline-none cursor-pointer appearance-none focus:border-blue-500 transition-all">
                    <option value="Civilian">Civilian</option><option value="Law Enforcement">Law Enforcement</option>
                    <option value="Fire/EMS">Fire/EMS</option><option value="DOT">DOT</option>
                  </select>
                  <ChevronRight className="absolute right-3 top-3.5 w-4 h-4 text-slate-600 rotate-90 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
          <button disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center mt-6 transition-all">
            {isSubmitting ? <Loader2 className="animate-spin" /> : isSignUp ? 'Create Account' : 'Secure Login'}
          </button>
        </form>
        <div className="mt-6 text-center pt-6 border-t border-slate-800/50">
          <button onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); }} className="text-xs text-slate-400 hover:text-white transition-colors">
            {isSignUp ? 'Already have an account? Sign In' : 'New to the city? Create Account'}
          </button>
        </div>
      </div>
    </div>
  );

  if (isStaffMode)
    return <ModerationDashboard supabase={supabase} sessionUser={authUser} profile={currentUser} onExit={() => setIsStaffMode(false)} />;

  const filteredGroups = groups.filter(g => {
    const matchesSearch = (g.name || '').toLowerCase().includes(groupSearchQuery.toLowerCase());
    const badges = Array.isArray(g.badges) ? g.badges : [];
    const matchesTag = groupFilterTag === 'All' || badges.includes(groupFilterTag);
    return matchesSearch && matchesTag;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-slate-100 font-sans overflow-hidden text-sm">
      {/* ── SIDEBAR ─── */}
      <nav className="hidden lg:flex flex-col w-60 bg-[#0a0a0c]/90 backdrop-blur-xl border-r border-slate-800/60 p-4 space-y-6">
        <div className="flex items-center space-x-2 px-2 pt-1">
          <h1 className="text-lg font-black italic">LIBERTY<span className="text-blue-500 text-xs block -mt-1 not-italic">Social</span></h1>
        </div>
        <div className="space-y-1">
          <NavItem icon={<Navigation size={18} />} label="The Dispatch"  active={currentView === 'feed'}         onClick={goHome} />
          <NavItem icon={<Users size={18} />}      label="Communities"   active={currentView === 'groups' || currentView === 'single_group'} onClick={() => setCurrentView('groups')} />
          <NavItem icon={<User size={18} />}       label="Profile"       active={currentView === 'profile'}      onClick={goProfile} />
          <NavItem icon={<Inbox size={18} />}      label="Applications"  active={currentView === 'applications'} onClick={() => setCurrentView('applications')} />
          <NavItem icon={<Settings size={18} />}   label="Settings"      onClick={() => { setActiveModal('settings'); }} />
          {isGlobalStaff && (
            <button onClick={() => setIsStaffMode(true)} className="w-full bg-blue-900/20 text-blue-400 border border-blue-500/30 p-3 rounded-xl flex items-center gap-3 font-bold hover:bg-blue-900/40 transition-colors mt-4">
              <Shield size={18} /> Staff Panel
            </button>
          )}
        </div>
        <div className="mt-auto pt-4 border-t border-slate-800">
          <button onClick={() => setIsSupportOpen(!isSupportOpen)} className="flex items-center gap-3 px-3 py-3 w-full rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <LifeBuoy size={18} /> <span className="text-sm font-semibold">Get Help</span>
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-3 w-full rounded-xl hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors mt-1">
            <ArrowLeft size={18} /> <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>
      </nav>

      {/* ── MOBILE NAV ─── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#050507] border-t border-slate-800 z-50 flex justify-around p-3">
        <button onClick={goHome}                             className={currentView === 'feed'    ? 'text-blue-500' : 'text-slate-500'}><Compass size={24} /></button>
        <button onClick={() => setCurrentView('groups')}    className={currentView === 'groups'  ? 'text-blue-500' : 'text-slate-500'}><Users   size={24} /></button>
        <button onClick={goProfile}                         className={currentView === 'profile' ? 'text-blue-500' : 'text-slate-500'}><User    size={24} /></button>
        <button onClick={() => setActiveModal('settings')}  className="text-slate-500"><Settings size={24} /></button>
        <button onClick={handleLogout}                      className="text-slate-500"><ArrowLeft size={24} /></button>
      </div>

      {/* ── MAIN CONTENT ─── */}
      <main className="flex-1 overflow-y-auto border-r border-slate-800/60 bg-[#0a0a0c] relative pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-slate-800/60 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeGroup && currentView === 'single_group' && (
              <button onClick={() => setCurrentView('groups')} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><ArrowLeft size={18} /></button>
            )}
            <h2 className="text-lg font-bold truncate">
              {currentView === 'feed'          && 'Dispatch Feed'}
              {currentView === 'groups'        && 'Explore Communities'}
              {currentView === 'single_group'  && (activeGroup?.name || 'Community')}
              {currentView === 'applications'  && 'Applications'}
              {currentView === 'profile'       && 'My Profile'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveModal('verify')} className="text-xs bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-full border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors flex items-center gap-1 font-medium">
              <BadgeCheck size={14} /> Verify
            </button>
            <div className="relative">
              <button className="p-2 hover:bg-slate-800 rounded-full transition-colors" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell className="w-5 h-5 text-slate-400 hover:text-white" />
                {unreadCount > 0 && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#0a0a0c]" />}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-800/50 font-bold text-xs uppercase tracking-wider text-slate-500 flex justify-between items-center">
                    Notifications <button onClick={() => setShowNotifications(false)}><X size={14} /></button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0
                      ? <div className="p-6 text-center text-xs text-slate-500">No new alerts.</div>
                      : notifications.map(n => (
                        <div key={n.id} onClick={() => handleNotificationClick(n)} className={`p-4 border-b border-slate-800/30 hover:bg-slate-800/50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-500/5' : ''}`}>
                          <p className="text-sm text-slate-300"><span className="font-bold text-white">{n.profiles?.name}</span> {n.content}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">{new Date(n.created_at).toLocaleTimeString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── PROFILE VIEW ─── */}
        {currentView === 'profile' && currentUser && (
          <div className="pb-10">
            <div className="h-48 bg-gradient-to-r from-blue-900 to-slate-900 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '200px' }} />
            </div>
            <div className="px-6 sm:px-10">
              <div className="relative -mt-16 mb-6 flex items-end gap-4">
                <div className="w-32 h-32 rounded-3xl bg-slate-900 border-4 border-[#0a0a0c] p-1 shadow-2xl relative group overflow-hidden">
                  <div className="w-full h-full bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden">
                    {currentUser.image ? <img src={currentUser.image} className="w-full h-full object-cover" alt="" /> : <User size={48} className="text-slate-500" />}
                  </div>
                  <button onClick={() => setActiveModal('settings')} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera size={24} />
                  </button>
                </div>
                <div className="mb-2">
                  <h1 className="text-3xl font-black italic tracking-tight text-white flex items-center gap-2">
                    {currentUser.name}
                    {currentUser.global_role === 'owner' && <Crown size={24} className="text-yellow-500" fill="currentColor" />}
                  </h1>
                  <p className="text-slate-400">@{currentUser.username}</p>
                  <div className="flex gap-2 mt-2 items-center flex-wrap">
                    <span className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-300 border border-slate-700">{currentUser.role}</span>
                    <RoleBadge role={currentUser.global_role} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl text-center"><div className="text-2xl font-bold text-white">{posts.length}</div><div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Posts</div></div>
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl text-center"><div className="text-2xl font-bold text-red-500">{currentUser.warning_count || 0}</div><div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Warnings</div></div>
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl text-center"><div className="text-2xl font-bold text-emerald-500">Active</div><div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Status</div></div>
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-800 pb-2">Patrol Log</h3>
              <div className="space-y-4">
                {posts.length === 0
                  ? <div className="text-center py-10 text-slate-500">No posts yet.</div>
                  : posts.map(post => (
                    <PostCard key={post.id} post={post} currentUser={currentUser} groupRole={currentGroupRole}
                      onReport={() => setReportTarget({ type: 'post', id: post.id })} onDelete={() => handleDeletePost(post.id)}
                      onLike={() => handleLikePost(post.id, post.like_count)} isLiked={userLikes.includes(post.id)}
                      onBan={() => handleBanUser(post.uid)} onViewComments={() => setViewingCommentsPost(post)}
                      onViewProfile={() => handleViewProfile(post.profiles)} />
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ── FEED VIEW ─── */}
        {currentView === 'feed' && (
          <div className="pb-10 max-w-3xl mx-auto">
            <div className="flex gap-2 px-4 pt-4 mb-4">
              <button onClick={() => setFeedMode('posts')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${feedMode === 'posts' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}>Posts</button>
              <button onClick={() => setFeedMode('chat')}  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${feedMode === 'chat'  ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}>Global Chat</button>
            </div>

            {feedMode === 'posts' ? (<>
              {/* Post composer */}
              <div className="mx-4 mb-6">
                <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-4 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                  <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)} placeholder="What's happening in the city?" className="w-full bg-transparent border-none outline-none text-slate-200 h-20 resize-none text-sm placeholder-slate-500" />
                  {selectedImage && (
                    <div className="mt-2 mb-3 relative inline-block">
                      <img src={selectedImage} className="max-h-32 rounded-xl border border-slate-700" alt="" />
                      <button onClick={() => { setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X size={12} /></button>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800/50">
                    <div className="flex gap-2">
                      <input type="file" ref={fileInputRef} hidden onChange={handleImageChange} accept="image/*" />
                      <button onClick={() => fileInputRef.current.click()} className="p-2 hover:bg-slate-800 rounded-xl text-blue-500 transition-colors"><ImageIcon size={20} /></button>
                    </div>
                    <button onClick={handleCreatePost} disabled={(!newPostText.trim() && !selectedImage) || isSubmitting}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
                      {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <><Send size={14} /> Post</>}
                    </button>
                  </div>
                </div>
              </div>
              {/* Posts list */}
              <div className="space-y-4 px-4 pb-20">
                {posts.length === 0 && <div className="text-center py-20 text-slate-500"><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No posts yet. Be the first!</p></div>}
                {posts.map(post => (
                  <PostCard key={post.id} post={post} currentUser={currentUser} groupRole={currentGroupRole}
                    onReport={() => setReportTarget({ type: 'post', id: post.id })} onDelete={() => handleDeletePost(post.id)}
                    onLike={() => handleLikePost(post.id, post.like_count)} isLiked={userLikes.includes(post.id)}
                    onBan={() => handleBanUser(post.uid)} onViewComments={() => setViewingCommentsPost(post)}
                    onViewProfile={() => handleViewProfile(post.profiles)} />
                ))}
              </div>
            </>) : (
              // Global Chat
              <div className="flex flex-col h-[calc(100vh-140px)] mx-4 bg-slate-900/50 border border-slate-800/60 rounded-2xl overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {globalChatMessages.length === 0 && <div className="text-center py-20 text-slate-500 text-sm">No messages yet. Say hello!</div>}
                  {globalChatMessages.map(msg => {
                    const isMe = msg.user_id === authUser?.id;
                    const role = msg.profiles?.global_role;
                    const avatarCls = role === 'developer' ? 'bg-green-500/20 text-green-400 border-green-500/40'
                      : role === 'owner' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      : ['admin', 'moderator'].includes(role) ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700';
                    return (
                      <div key={msg.id} className="group flex gap-3 hover:bg-slate-800/30 p-2 rounded-xl transition-colors relative">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0 border overflow-hidden cursor-pointer ${avatarCls}`}
                          onClick={() => handleViewProfile(msg.profiles)}>
                          {msg.profiles?.image ? <img src={msg.profiles.image} className="w-full h-full object-cover" alt="" /> : (msg.profiles?.name?.[0] ?? '?')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 cursor-pointer" onClick={() => handleViewProfile(msg.profiles)}>
                            <RenderNameWithRole profile={msg.profiles || { name: 'Unknown' }} />
                            <span className="text-[10px] text-slate-500">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed break-words">{msg.content}</p>
                        </div>
                        <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 rounded-lg p-1 border border-slate-800 backdrop-blur-sm">
                          <button onClick={() => setReportTarget({ type: 'chat', id: msg.id })} className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-white"><Flag size={12} /></button>
                          {(isGlobalStaff || isMe) && <button onClick={() => handleDeleteChatMessage(msg.id)} className="p-1.5 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400"><Trash2 size={12} /></button>}
                          {isGlobalStaff && <>
                            <button onClick={() => handleWarnUser(msg.user_id)} className="p-1.5 hover:bg-yellow-500/10 rounded text-slate-500 hover:text-yellow-400"><AlertOctagon size={12} /></button>
                            <button onClick={() => handleBanUser(msg.user_id)}  className="p-1.5 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-500"><Ban size={12} /></button>
                          </>}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatScrollRef} />
                </div>
                <div className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                    placeholder="Global chat..." />
                  <button onClick={handleSendChat} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500 transition-colors"><Send size={16} /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── APPLICATIONS VIEW ─── */}
        {currentView === 'applications' && (
          <div className="p-6 max-w-5xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Open Applications</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 bg-yellow-500/10 w-40 h-40 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all" />
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center border border-yellow-500/40 text-yellow-500 mb-4"><Star size={24} fill="currentColor" /></div>
                <h3 className="text-xl font-bold text-white">Influencer Verification</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed mb-6">Get the <span className="text-yellow-500 font-bold">Verified Badge</span> next to your name. Requirements: 1000+ followers on any major social platform.</p>
                <button onClick={() => setActiveModal('verify')} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold shadow-lg transition-all">Apply for Verification</button>
              </div>
              <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-500/30 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 bg-blue-500/10 w-40 h-40 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/40 text-blue-500 mb-4"><Shield size={24} fill="currentColor" /></div>
                <h3 className="text-xl font-bold text-white">Staff Application</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed mb-6">Join the team as a <span className="text-blue-400 font-bold">Global Moderator</span>. Help keep the community safe and enforce the rules.</p>
                <button onClick={() => setActiveModal('apply_staff')} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg transition-all">Apply for Staff</button>
              </div>
            </div>
          </div>
        )}

        {/* ── GROUPS LIST ─── */}
        {currentView === 'groups' && (
          <div className="pb-10 max-w-3xl mx-auto p-6">
            {/* Search + filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                <input value={groupSearchQuery} onChange={e => setGroupSearchQuery(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none" placeholder="Search communities..." />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button onClick={() => setGroupFilterTag('All')} className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border shrink-0 ${groupFilterTag === 'All' ? 'bg-white text-black border-white' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'}`}>All</button>
                {AVAILABLE_GROUP_TAGS.map(t => (
                  <button key={t.id} onClick={() => setGroupFilterTag(t.id)} className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border shrink-0 ${groupFilterTag === t.id ? t.color : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'}`}>{t.id}</button>
                ))}
              </div>
            </div>

            {/* Create group */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl p-6 mb-6 shadow-lg">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><PlusCircle className="text-blue-500" /> Create Community</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <input value={newGroupText}  onChange={e => setNewGroupText(e.target.value)}  className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-white" placeholder="Community Name *" />
                  <input value={newGroupImage} onChange={e => setNewGroupImage(e.target.value)} className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-white" placeholder="Logo URL (optional)" />
                </div>
                <div className="flex flex-col gap-3">
                  <textarea value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-white flex-1 resize-none" placeholder="Description (optional)" />
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_GROUP_TAGS.map(tag => (
                      <button key={tag.id} onClick={() => toggleGroupTag(tag.id, false)} className={`text-[10px] px-2 py-1 rounded border transition-all ${newGroupTags.includes(tag.id) ? tag.color : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'}`}>{tag.id}</button>
                    ))}
                  </div>
                  <button onClick={handleCreateGroup} disabled={isSubmitting || !newGroupText.trim()} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold w-full transition-all disabled:opacity-50">
                    {isSubmitting ? 'Creating...' : 'Launch Community'}
                  </button>
                </div>
              </div>
            </div>

            {/* Groups grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredGroups.map(g => {
                const isMember = joinedGroupIds.includes(g.id);
                const isMyGroup = g.creator_id === authUser.id;
                const badges = Array.isArray(g.badges) ? g.badges : [];
                return (
                  <div key={g.id} onClick={() => goToGroup(g)} className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl cursor-pointer hover:bg-slate-800/60 hover:border-slate-700/80 transition-all relative overflow-hidden group">
                    {isMyGroup && <div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase flex items-center gap-1"><Crown size={12} fill="currentColor" /> Owner</div>}
                    {!isMyGroup && (
                      <div className="absolute top-4 right-4 z-10">
                        <button onClick={(e) => isMember ? handleLeaveGroup(e, g.id) : handleJoinGroup(e, g.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isMember ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'}`}>
                          {isMember ? 'Leave' : 'Join'}
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                        {g.image ? <img src={g.image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-lg">{(g.name || '').substring(0, 2)}</div>}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-200 truncate flex items-center gap-2">
                          {g.name}
                          {badges.includes('Official') && <span className="text-[8px] bg-green-500/20 text-green-300 border border-green-500/30 px-1.5 py-0.5 rounded uppercase font-bold">Official</span>}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{g.description || 'No description.'}</p>
                        {badges.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {badges.filter(t => t !== 'Official').slice(0, 4).map(t => {
                              const style = AVAILABLE_GROUP_TAGS.find(x => x.id === t);
                              return <div key={t} className={`w-2 h-2 rounded-full ${style ? style.color.split(' ')[0] : 'bg-slate-600'}`} title={t} />;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredGroups.length === 0 && <div className="col-span-2 text-center py-10 text-slate-500">No communities found.</div>}
            </div>
          </div>
        )}

        {/* ── SINGLE GROUP VIEW ─── */}
        {currentView === 'single_group' && activeGroup && (
          <div className="pb-10 max-w-3xl mx-auto">
            {/* Group header */}
            <div className="rounded-b-3xl overflow-hidden bg-slate-900 border-b border-x border-slate-800 shadow-xl mx-4 mt-0">
              <div className="h-40 bg-slate-950 relative">
                {activeGroup.banner
                  ? <img src={activeGroup.banner} className="w-full h-full object-cover" alt="" />
                  : <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-indigo-900" />}
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-md p-2 flex justify-center gap-2">
                  {GROUP_CHANNELS.map(c => (
                    <button key={c.id} onClick={() => setActiveChannel(c.id)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${activeChannel === c.id ? 'bg-white text-black border-white shadow-lg scale-105' : 'bg-black/30 text-slate-300 border-transparent hover:bg-black/50'}`}>
                      {c.icon && React.cloneElement(c.icon, { size: 12 })} {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4 -mt-12 relative z-10">
                  <div className="w-24 h-24 rounded-2xl bg-slate-900 border-4 border-[#0f1014] overflow-hidden shadow-lg">
                    {activeGroup.image ? <img src={activeGroup.image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center"><Users className="text-slate-600" /></div>}
                  </div>
                  <div className="mt-8">
                    <h1 className="text-xl font-bold text-white">{activeGroup.name}</h1>
                    <p className="text-xs text-slate-400 line-clamp-1 max-w-[200px]">{activeGroup.description}</p>
                    {Array.isArray(activeGroup.badges) && activeGroup.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {activeGroup.badges.map(tag => {
                          if (tag === 'Official') return <span key="official" className="text-[10px] px-2 py-0.5 rounded border bg-green-500/20 text-green-300 border-green-500/30 font-bold uppercase">Official</span>;
                          const tagStyle = AVAILABLE_GROUP_TAGS.find(t => t.id === tag);
                          return <span key={tag} className={`text-[10px] px-2 py-0.5 rounded border ${tagStyle ? tagStyle.color : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{tag}</span>;
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={handleOpenMembers} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"><Users size={18} /></button>
                  {activeGroup.creator_id === authUser.id && (
                    <button onClick={() => { setActiveModal('group_settings'); setEditGroupTags(Array.isArray(activeGroup.badges) ? activeGroup.badges : []); }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"><Edit3 size={18} /></button>
                  )}
                  <button onClick={() => setReportTarget({ type: 'community', id: activeGroup.id })} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-red-400 hover:text-white transition-colors"><Flag size={18} /></button>
                </div>
              </div>
            </div>

            {/* Post composer (if allowed) */}
            {canPostInChannel() && (
              <div className="mx-4 mb-4 mt-6">
                <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-4 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                  <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)} placeholder={`Post in #${activeChannel}...`} className="w-full bg-transparent border-none outline-none text-slate-200 h-16 resize-none text-sm placeholder-slate-500" />
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800/50">
                    <div className="flex gap-2">
                      <input type="file" ref={fileInputRef} hidden onChange={handleImageChange} accept="image/*" />
                      <button onClick={() => fileInputRef.current.click()} className="p-2 hover:bg-slate-800 rounded-xl text-blue-500 transition-colors"><ImageIcon size={20} /></button>
                    </div>
                    <button onClick={handleCreatePost} disabled={(!newPostText.trim() && !selectedImage) || isSubmitting}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2">
                      {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <><Send size={14} /> Post</>}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {!canPostInChannel() && (
              <div className="mx-4 mt-6 mb-4 p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl flex items-center gap-3 text-slate-500 text-sm">
                <Lock size={16} /> Only admins and moderators can post in #{activeChannel}.
              </div>
            )}

            {/* Group posts */}
            <div className="space-y-4 px-4 pb-20">
              {posts.length === 0 && <div className="text-center py-20 text-slate-500"><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No posts in #{activeChannel} yet.</p></div>}
              {posts.map(post => (
                <PostCard key={post.id} post={post} currentUser={currentUser} groupRole={currentGroupRole}
                  onReport={() => setReportTarget({ type: 'post', id: post.id })} onDelete={() => handleDeletePost(post.id)}
                  onLike={() => handleLikePost(post.id, post.like_count)} isLiked={userLikes.includes(post.id)}
                  onBan={() => handleBanUser(post.uid)} onViewComments={() => setViewingCommentsPost(post)}
                  onViewProfile={() => handleViewProfile(post.profiles)} />
              ))}
            </div>
          </div>
        )}

        {/* ── SUPPORT WIDGET ─── */}
        {isSupportOpen && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 rounded-2xl w-80 h-96 shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <h4 className="font-bold flex items-center gap-2"><LifeBuoy size={18} /> Support Chat</h4>
              <div className="flex gap-2">
                {userTicket && <button onClick={handleCloseOwnTicket} className="text-[10px] bg-white/20 px-2 py-1 rounded font-bold">Close</button>}
                <button onClick={() => setIsSupportOpen(false)}><X size={18} /></button>
              </div>
            </div>
            <div className="flex-1 bg-slate-950 p-4 overflow-y-auto space-y-3">
              {!userTicket
                ? <div className="text-center mt-10"><p className="text-slate-400 text-sm mb-4">Need help? Start a live chat.</p><button onClick={handleCreateSupportTicket} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm">Start Chat</button></div>
                : supportMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_id === authUser.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.sender_id === authUser.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>{msg.content}</div>
                  </div>
                ))}
              <div ref={supportScrollRef} />
            </div>
            {userTicket && (
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                <input value={supportInput} onChange={e => setSupportInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendSupportMessage()} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none" placeholder="Type here..." />
                <button onClick={handleSendSupportMessage} className="bg-blue-600 text-white p-2 rounded-lg"><Send size={16} /></button>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────── MODALS ─────────────────────── */}

        {/* Profile Viewer */}
        {activeModal === 'view_profile' && viewingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-900 to-slate-900" />
              <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full z-10"><X size={16} /></button>
              <div className="relative mt-8 flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-950 rounded-full border-4 border-slate-900 flex items-center justify-center mb-4 overflow-hidden shadow-lg">
                  {viewingUser.image ? <img src={viewingUser.image} className="w-full h-full object-cover" alt="" /> : <User size={48} className="text-slate-500" />}
                </div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {viewingUser.name}
                  {viewingUser.global_role === 'owner' && <Crown size={20} className="text-yellow-500" fill="currentColor" />}
                </h2>
                <p className="text-slate-400 text-sm">@{viewingUser.username}</p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300 border border-slate-700">{viewingUser.role}</span>
                  {(Array.isArray(viewingUser.badges) ? viewingUser.badges : []).map(b => (
                    <span key={b} className="text-xs bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 capitalize">{b}</span>
                  ))}
                </div>
                {isGlobalStaff && (
                  <div className="w-full mt-6 pt-6 border-t border-slate-800">
                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Moderation Tools</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center"><div className="text-xl font-bold text-white">{viewingUser.warning_count || 0}</div><div className="text-[10px] text-slate-500 uppercase font-bold">Warnings</div></div>
                      <button onClick={() => handleWarnUser(viewingUser.id)} className="bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-500 border border-yellow-500/20 rounded-xl font-bold text-xs transition-colors">Issue Warning</button>
                    </div>
                    <button onClick={() => handleBanUser(viewingUser.id)} className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-500/20 py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2">
                      <Ban size={14} /> Ban User Globally
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {reportTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-red-500 flex items-center gap-2"><AlertTriangle size={20} /> Report Content</h3>
                <button onClick={() => setReportTarget(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
              </div>
              <p className="text-sm text-slate-400 mb-4">Why are you reporting this {reportTarget.type}?</p>
              <div className="space-y-2">
                {['Fail RP', 'Toxicity / Harassment', 'Spam', 'Inappropriate Content', 'Other'].map(reason => (
                  <button key={reason} onClick={() => handleReport(reason)} className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors">{reason}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Verify / Staff Application */}
        {(activeModal === 'verify' || activeModal === 'apply_staff') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${activeModal === 'verify' ? 'from-yellow-600 to-yellow-400' : 'from-blue-600 to-blue-400'}`} />
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-white">
                {activeModal === 'verify' ? <><Star size={20} className="text-yellow-500" fill="currentColor" /> Influencer Application</> : <><Shield size={20} className="text-blue-500" fill="currentColor" /> Staff Application</>}
              </h3>
              <form onSubmit={(e) => handleSubmitApplication(e, activeModal === 'verify' ? 'verification' : 'staff')} className="space-y-3">
                <input name="link" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none" placeholder={activeModal === 'verify' ? 'Social Media Link' : 'Portfolio / Experience Link'} required />
                <textarea name="reason" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none h-24 resize-none" placeholder="Why should you be accepted?" required />
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-2.5 text-sm font-bold">Cancel</button>
                  <button type="submit" className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${activeModal === 'verify' ? 'bg-yellow-600 hover:bg-yellow-500 text-black' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>Apply</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {activeModal === 'settings' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-white">Account Settings</h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500">Display Name</label><input name="displayName" defaultValue={currentUser.name} className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors" /></div>
                <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500">Role / Department</label>
                  <select name="role" defaultValue={currentUser.role} className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors">
                    <option value="Civilian">Civilian</option><option value="Law Enforcement">Law Enforcement</option><option value="Fire/EMS">Fire/EMS</option><option value="DOT">DOT / Public Works</option>
                  </select>
                </div>
                <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500">Profile Picture URL</label><input name="image" defaultValue={currentUser.image || ''} className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors" placeholder="https://..." /></div>
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all">Save Changes</button>
              </form>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-sm hover:bg-slate-700 transition-colors border border-slate-700" onClick={() => alert('Terms of Service:\n\n1. Be respectful.\n2. No illegal content.\n3. Follow roleplay rules.')}>TOS</button>
                <button className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-sm hover:bg-slate-700 transition-colors border border-slate-700" onClick={() => alert('Privacy Policy:\n\nWe collect your email and profile data to facilitate the app experience.')}>Privacy</button>
              </div>
              <button onClick={handleRequestData} className="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-slate-700">
                <Download size={16} /> Request Account Data (GDPR)
              </button>
              <div className="mt-6 pt-6 border-t border-slate-800">
                <button onClick={handleDeleteAccount} className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 py-3 rounded-xl font-bold transition-all">Delete Account</button>
              </div>
            </div>
          </div>
        )}

        {/* Group Settings Modal */}
        {activeModal === 'group_settings' && activeGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-white">Group Settings</h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleUpdateGroup} className="space-y-4">
                <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500">Name</label><input name="groupName" defaultValue={activeGroup.name} className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500" /></div>
                <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500">Logo URL</label><input name="groupImage" defaultValue={activeGroup.image || ''} className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500" placeholder="https://..." /></div>
                <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500">Banner URL</label><input name="groupBanner" defaultValue={activeGroup.banner || ''} className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500" placeholder="https://..." /></div>
                <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500">Description</label><textarea name="groupDesc" defaultValue={activeGroup.description || ''} className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 h-24 resize-none" /></div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Community Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_GROUP_TAGS.map(tag => (
                      <button type="button" key={tag.id} onClick={() => toggleGroupTag(tag.id, true)} className={`text-[10px] px-2 py-1 rounded border transition-all ${editGroupTags.includes(tag.id) ? tag.color : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'}`}>{tag.id}</button>
                    ))}
                    {isGlobalStaff && (
                      <button type="button" onClick={() => toggleGroupTag('Official', true)} className={`text-[10px] px-2 py-1 rounded border transition-all ${editGroupTags.includes('Official') ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'}`}>Official</button>
                    )}
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold">Save Changes</button>
              </form>
              <div className="mt-6 pt-6 border-t border-slate-800">
                <button onClick={handleDeleteGroup} className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 py-3 rounded-xl font-bold">Delete Community</button>
              </div>
            </div>
          </div>
        )}

        {/* Members Modal */}
        {activeModal === 'members' && activeGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 relative h-[70vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Members ({groupMembers.length})</h3>
                <button onClick={() => { setActiveModal(null); setEditingMemberId(null); }}><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {groupMembers.map(member => {
                  const isMe = member.user_id === authUser.id;
                  const canManage = (['admin', 'moderator'].includes(currentGroupRole) || isGlobalStaff) && !isMe && member.role !== 'admin';
                  const isExpanded = editingMemberId === member.user_id;
                  return (
                    <div key={member.user_id} className="flex flex-col p-3 bg-slate-950/50 rounded-xl border border-slate-800 gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                            {member.profiles?.image ? <img src={member.profiles.image} className="w-full h-full object-cover" alt="" /> : <User size={14} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-200">
                              {member.nickname || member.profiles?.name || 'User'}
                              {member.nickname && <span className="text-[10px] font-normal text-slate-500 ml-1">(@{member.profiles?.username})</span>}
                            </p>
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${member.role === 'admin' ? 'bg-red-500/20 text-red-400' : member.role === 'moderator' ? 'bg-blue-500/20 text-blue-400' : member.role === 'banned' ? 'bg-red-900/40 text-red-600' : 'bg-slate-800 text-slate-500'}`}>{member.role}</span>
                          </div>
                        </div>
                        {canManage && (
                          <button onClick={() => setEditingMemberId(isExpanded ? null : member.user_id)} className={`p-1.5 rounded transition-colors ${isExpanded ? 'bg-slate-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}><Settings size={14} /></button>
                        )}
                      </div>
                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
                          <div className="col-span-2 flex gap-2">
                            <input type="text" defaultValue={member.nickname || ''} placeholder="Set Nickname (blank to clear)" className="flex-1 bg-black/40 border border-slate-700 rounded p-1.5 text-xs text-white outline-none"
                              onKeyDown={e => { if (e.key === 'Enter') handleSetNickname(member.user_id, e.target.value.trim()); }} />
                          </div>
                          {currentGroupRole === 'admin' || isGlobalStaff ? (
                            <select className="bg-slate-800 text-white text-xs p-2 rounded border border-slate-700 outline-none" value={member.role}
                              onChange={e => handleUpdateMemberRole(member.user_id, e.target.value)}>
                              <option value="member">Member</option><option value="moderator">Moderator</option><option value="admin">Admin</option>
                            </select>
                          ) : <div />}
                          <button onClick={() => handleKickMember(member.user_id)} className="bg-orange-900/20 text-orange-500 hover:bg-orange-900/40 p-2 rounded text-xs font-bold border border-orange-900/50">Kick</button>
                          <button onClick={() => handleBanMember(member.user_id)} className="col-span-2 bg-red-900/20 text-red-500 hover:bg-red-900/40 p-2 rounded text-xs font-bold border border-red-900/50 flex items-center justify-center gap-2">
                            <Ban size={12} /> Ban from Community
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Comments Modal */}
        {viewingCommentsPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg h-[80vh] flex flex-col shadow-2xl">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
                <h3 className="font-bold text-white flex items-center gap-2"><MessageSquare size={18} className="text-blue-500" /> Thread</h3>
                <button onClick={() => { setViewingCommentsPost(null); setComments([]); setCommentText(''); }} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {/* Original post */}
                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800/50 mb-4">
                  <p className="text-slate-300 text-sm mb-2 whitespace-pre-wrap">{viewingCommentsPost.content}</p>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1"><User size={10} /> {viewingCommentsPost.profiles?.name || viewingCommentsPost.user_name}</div>
                </div>
                {/* Comments */}
                {comments.length === 0 && <div className="text-center text-slate-500 text-sm py-4">No replies yet.</div>}
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3 p-3 rounded-xl hover:bg-slate-800/30 transition-all">
                    <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700 text-slate-400 overflow-hidden">
                      {c.profiles?.image ? <img src={c.profiles.image} className="w-full h-full object-cover" alt="" /> : c.user_name?.[0] ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <RenderNameWithRole profile={c.profiles || { name: c.user_name }} />
                        <span className="text-[10px] text-slate-500">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {c.is_pinned && <Pin size={12} className="text-yellow-500 fill-current" />}
                      </div>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                      <div className="flex gap-4 mt-2">
                        <button onClick={() => handleReplyToComment(c)} className="text-[10px] text-slate-500 hover:text-blue-400 font-medium transition-colors">Reply</button>
                        {(isGlobalStaff || c.user_id === authUser?.id) && (
                          <button onClick={() => handleDeleteComment(c.id)} className="text-[10px] text-red-500 hover:text-red-400 transition-colors flex items-center gap-1"><Trash2 size={10} /> Delete</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-800 bg-slate-900 rounded-b-2xl">
                {viewingCommentsPost.comments_disabled
                  ? <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-2"><Lock size={14} /> Comments are locked</div>
                  : (
                    <div className="flex gap-2 relative">
                      <input ref={commentInputRef} value={commentText} onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 pr-12 text-sm text-white focus:border-blue-500 outline-none transition-all" placeholder="Write a reply..." />
                      <button onClick={handlePostComment} disabled={!commentText.trim()}
                        className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-0 transition-all">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return <ErrorBoundary><MainApp /></ErrorBoundary>;
}
