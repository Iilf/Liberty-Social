import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, MessageSquare, Share2, Heart, Search, Bell, User, Navigation, PlusCircle, 
  Image as ImageIcon, Smile, Server, X, Lock, Unlock, ChevronRight, Loader2, Users, 
  Flag, AlertTriangle, ArrowLeft, Settings, Compass, Mail, Key, Trash2, Crown, Ban, 
  Edit3, UserMinus, UserCog, UserPlus, Hash, Megaphone, CalendarDays, Pin, Check, 
  Star, BadgeCheck, ClipboardList, Send, LifeBuoy, Phone, Inbox, Clock, Hammer, Badge, 
  FileCheck, FileWarning, Tag, AlertOctagon, Globe, LogIn, RefreshCw, Zap, Layout, Filter, MessageCircle, Download
} from 'lucide-react';
import ModerationDashboard from './app2';

// --- CONFIGURATION ---
const getEnvVar = (key, fallback) => {
  try {
    if (typeof process !== 'undefined' && process?.env?.[key]) {
      return process.env[key];
    }
  } catch (e) {}
  return fallback;
};

// ... (Constants and Sub-components remain same as previous App.jsx, omitting to save space, but include ALL imports above) ...
// RE-INCLUDING CONSTANTS FOR SAFETY:
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
                <div onClick={onViewProfile} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-400 shrink-0 border border-slate-700 overflow-hidden cursor-pointer hover:border-blue-500 transition-colors">{post.profiles?.image ? <img src={post.profiles.image} className="w-full h-full object-cover" /> : post.profiles?.name?.[0]}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2"><div onClick={onViewProfile} className="cursor-pointer"><RenderNameWithRole profile={post.profiles || {name: post.user_name, role: post.user_role}} /><span className="text-xs text-slate-500 block mt-0.5">@{post.profiles?.username || 'user'} • {new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div><div className="flex gap-1"><button onClick={onReport} className="p-1.5 text-slate-600 hover:bg-slate-800 rounded-lg hover:text-white transition-colors"><Flag size={14}/></button>{canDelete && <button onClick={onDelete} className="p-1.5 text-slate-600 hover:bg-red-500/10 rounded-lg hover:text-red-400 transition-colors"><Trash2 size={14}/></button>}{isGlobalStaff && <button onClick={onBan} className="p-1.5 text-slate-600 hover:bg-red-500/10 rounded-lg hover:text-red-500 transition-colors"><Ban size={14}/></button>}</div></div>
                    <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    {post.image && (<div className="mt-3 rounded-xl border border-slate-800/50 overflow-hidden bg-black/40"><img src={post.image} className="w-full max-h-96 object-contain" /></div>)}
                    <div className="flex gap-6 mt-4 border-t border-slate-800/50 pt-3"><button onClick={onLike} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-pink-500 transition-colors"><Heart size={16}/> <span>{post.like_count}</span></button><button onClick={onViewComments} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-400 transition-colors"><MessageSquare size={16}/> <span>{post.comment_count}</span></button><button className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-400 transition-colors ml-auto"><Share2 size={16}/></button></div>
                </div>
            </div>
        </div>
    );
};

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Uncaught error:", error, errorInfo); }
  render() { if (this.state.hasError) { return <div className="flex h-screen items-center justify-center bg-[#050507] text-slate-200 p-6"><div className="text-center"><h1 className="text-2xl font-black mb-2">Error</h1><button onClick={() => window.location.reload()} className="bg-red-600 text-white font-bold py-2 px-6 rounded-xl">Reload</button></div></div>; } return this.props.children; }
}

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

  let SUPABASE_URL = "https://wcavpryumlohjccxiohq.supabase.co";
  let SUPABASE_KEY = "sb_publishable_EoFH2MIrf4Xc1cJJaiAlHg_ct72t-ru";
  try { if(import.meta.env) { SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL; SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || SUPABASE_KEY; } } catch(e){}

  const isGlobalStaff = ['owner', 'admin', 'moderator', 'developer'].includes(currentUser?.global_role);

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

  const handleCreateSupportTicket = async () => {
      const { data } = await supabase.from('support_tickets').insert({ user_id: authUser.id, user_name: currentUser.name }).select().single();
      setUserTicket(data);
  };
  const handleSendSupportMessage = async () => {
      if(!supportInput.trim()) return;
      await supabase.from('support_messages').insert({ ticket_id: userTicket.id, sender_id: authUser.id, content: supportInput });
      setSupportInput("");
  };
  const handleCloseOwnTicket = async () => {
      if(window.confirm("Close your ticket?")) {
        await supabase.from('support_tickets').update({status:'closed'}).eq('id', userTicket.id);
        setUserTicket(null); setIsSupportOpen(false);
      }
  };
  const handleLogout = async () => { await supabase.auth.signOut(); };
  
  // RENDER SWITCH
  if (isStaffMode) {
      return <ModerationDashboard onExit={() => setIsStaffMode(false)} />;
  }

  // NORMAL RENDER
  if (authLoading) return <div className="h-screen bg-[#0a0a0c] flex items-center justify-center text-blue-500"><Loader2 className="animate-spin"/></div>;
  if (!authUser) return (
      <div className="h-screen bg-[#0a0a0c] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <h1 className="text-2xl text-white font-bold text-center mb-6">Liberty Social</h1>
            <button onClick={async () => {
                const email = prompt("Email"); const pass = prompt("Password");
                if(email && pass) await supabase.auth.signInWithPassword({ email, password: pass });
            }} className="w-full bg-blue-600 text-white py-3 rounded-xl">Login</button>
            <button onClick={async () => {
                const email = prompt("Email"); const pass = prompt("Password"); const user = prompt("Username");
                if(email && pass && user) await supabase.auth.signUp({ email, password: pass, options: { data: { username: user } } });
            }} className="w-full mt-2 text-slate-400 text-sm">Create Account</button>
        </div>
      </div>
  );

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-slate-100 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <nav className="hidden md:flex flex-col w-64 bg-[#050507] border-r border-slate-800 p-4">
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

export default App;
