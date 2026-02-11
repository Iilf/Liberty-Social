import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, MessageSquare, Share2, Heart, Search, Bell, User, Navigation, PlusCircle, 
  Image as ImageIcon, Smile, Server, X, Lock, Unlock, ChevronRight, Loader2, Users, 
  Flag, AlertTriangle, ArrowLeft, Settings, Compass, Mail, Key, Trash2, Crown, Ban, 
  Edit3, UserMinus, UserCog, UserPlus, Hash, Megaphone, CalendarDays, Pin, Check, 
  Star, BadgeCheck, ClipboardList, Send, LifeBuoy, Phone, Inbox, Clock, Hammer, Badge, 
  FileCheck, FileWarning, Tag, AlertOctagon, Globe, LogIn, RefreshCw, Zap, Layout, Filter, MessageCircle, Download
} from 'lucide-react';

// --- CONFIGURATION ---
const getEnvVar = (key, fallback) => {
  try {
    if (typeof process !== 'undefined' && process?.env?.[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore error
  }
  return fallback;
};

const SUPABASE_URL = getEnvVar('REACT_APP_SUPABASE_URL', "https://wcavpryumlohjccxiohq.supabase.co");
const SUPABASE_KEY = getEnvVar('REACT_APP_SUPABASE_ANON_KEY', "sb_publishable_EoFH2MIrf4Xc1cJJaiAlHg_ct72t-ru");

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

// --- SUB-COMPONENTS ---

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

  const [posts, setPosts] = useState([]); 
  const [globalChatMessages, setGlobalChatMessages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [joinedGroupIds, setJoinedGroupIds] = useState([]); 
  const [groupMembers, setGroupMembers] = useState([]); 
  const [memberCount, setMemberCount] = useState(0); 
  const [reports, setReports] = useState([]); 
  const [applications, setApplications] = useState([]); 
  const [notifications, setNotifications] = useState([]);
  
  const [viewingUser, setViewingUser] = useState(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false); 
  const [userTicket, setUserTicket] = useState(null); 
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportInput, setSupportInput] = useState("");
  const [supportList, setSupportList] = useState([]);
  const [activeStaffTicket, setActiveStaffTicket] = useState(null);

  const [investigationTab, setInvestigationTab] = useState('pending'); 
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

  // 2. HELPERS & HANDLERS
  const isGlobalStaff = ['owner', 'admin', 'moderator', 'investigator', 'developer'].includes(currentUser?.global_role);
  
  const canPostInChannel = () => {
    if (!activeGroup) return true;
    if (activeChannel === 'general') return true;
    return ['admin', 'moderator'].includes(currentGroupRole);
  };

  const fetchPosts = async () => {
    if (!supabase) return;
    let query = supabase.from('posts').select(`*, profiles:uid ( id, name, username, role, global_role, badges, image )`).order('created_at', { ascending: false });
    if (currentView === 'profile' && authUser) query = query.eq('uid', authUser.id);
    else if (currentView === 'single_group' && activeGroup) { query = query.eq('group_id', activeGroup.id); query = query.eq('channel', activeChannel); }
    else query = query.is('group_id', null);
    const { data } = await query;
    if (data) setPosts(data);
  };

  const fetchNotifications = async () => {
      if(!supabase || !authUser) return;
      const { data } = await supabase.from('notifications').select(`*, profiles:actor_id ( name )`).eq('user_id', authUser.id).order('created_at', { ascending: false }).limit(20);
      if(data) setNotifications(data);
  };

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

  const handleDeleteGroup = async () => { 
      if(!supabase || !activeGroup) return; 
      if(prompt(`Type "${activeGroup.name}" to confirm:`) !== activeGroup.name) return; 
      
      const { error } = await supabase.from('groups').delete().eq('id', activeGroup.id); 
      if(error) {
          alert("Error: " + error.message);
      } else { 
          alert("Deleted."); 
          setActiveModal(null); 
          setActiveGroup(null); 
          setGroups(prev => prev.filter(g => g.id !== activeGroup.id)); 
          setCurrentView('groups'); 
      } 
  };

  const handleSubmitApplication = async (e) => { e.preventDefault(); if(!supabase) return; const fd = new FormData(e.target); try { await supabase.from('applications').insert({ user_id: authUser.id, type: activeModal === 'verify' ? 'verification' : 'staff', content: `Link: ${fd.get('link')} | Reason: ${fd.get('reason')}` }); alert("Submitted!"); setActiveModal(null); } catch (err) { alert(err.message); } };
  
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

        // Attempt RPC delete (This is the cleanest way, assuming the SQL file was run)
        const { error } = await supabase.rpc('delete_own_user');

        if (error) {
            console.error("RPC Delete Failed:", error);
            // Backup manual cleanup for profile only (Auth requires RPC/Admin)
            const { error: profileError } = await supabase.from('profiles').delete().eq('id', authUser.id);
            if(profileError) alert("Could not delete profile: " + profileError.message);
        } else {
            alert("Account deleted successfully.");
        }
        await handleLogout();

    } catch (e) {
        console.error("Delete Error:", e);
        alert("Failed to delete account completely: " + e.message);
        setAuthLoading(false); 
    }
  };

  const handleRequestData = async () => {
    if (!supabase || !authUser) return;
    if (!window.confirm("Download all your personal data?")) return;
    try {
      setAuthLoading(true);
      const uid = authUser.id;
      const [
        { data: profile }, { data: posts }, { data: comments }, { data: likes }, { data: groups }, { data: chat }, { data: support }, { data: apps }
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
      const allData = { user_info: { id: uid, email: authUser.email, ...profile }, groups_joined: groups, content: { posts, comments }, activity: { likes, apps, support }, chat_history: chat };
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `liberty_social_data_${new Date().toISOString()}.json`; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch (e) { alert("Data error: " + e.message); } finally { setAuthLoading(false); }
  };

  const handleReplyToComment = (c) => { setCommentText(`@${c.profiles?.username || 'user'} `); commentInputRef.current?.focus(); };
  const handlePinComment = async (c) => { await supabase.from('comments').update({ is_pinned: !c.is_pinned }).eq('id', c.id); };
  const handleToggleComments = async () => { const nv = !viewingCommentsPost.comments_disabled; await supabase.from('posts').update({ comments_disabled: nv }).eq('id', viewingCommentsPost.id); setViewingCommentsPost(prev => ({ ...prev, comments_disabled: nv })); };
  
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
      e.stopPropagation(); if (!supabase) return;
      const { error } = await supabase.from('group_members').insert({ group_id: gid, user_id: authUser.id, role: 'member' });
      if (error && error.code !== '23505') alert(error.message); else setJoinedGroupIds(prev => [...prev, gid]); 
  };
  
  const handleLeaveGroup = async (e, gid) => {
      e.stopPropagation(); if (!supabase || !window.confirm("Leave community?")) return;
      const { error } = await supabase.from('group_members').delete().eq('group_id', gid).eq('user_id', authUser.id);
      if (error) alert(error.message); else { setJoinedGroupIds(prev => prev.filter(id => id !== gid)); if (activeGroup?.id === gid) { setActiveGroup(null); setCurrentView('feed'); } }
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
      if(error) { alert("Error deleting post: " + error.message); fetchPosts(); }
  };
  
  const handleUpdateProfile = async (e) => { e.preventDefault(); const fd = new FormData(e.target); await supabase.from('profiles').update({ name: fd.get('displayName'), role: fd.get('role') }).eq('id', authUser.id); setActiveModal(null); setCurrentUser(prev => ({...prev, name: fd.get('displayName'), role: fd.get('role')})); };
  const handleUpdateGroup = async (e) => { e.preventDefault(); const fd = new FormData(e.target); await supabase.from('groups').update({ name: fd.get('groupName'), description: fd.get('groupDesc'), image: fd.get('groupImage'), banner: fd.get('groupBanner'), badges: editGroupTags }).eq('id', activeGroup.id); setActiveModal(null); setActiveGroup(prev => ({...prev, name: fd.get('groupName'), description: fd.get('groupDesc'), image: fd.get('groupImage'), banner: fd.get('groupBanner'), badges: editGroupTags})); };
  
  const handleOpenMembers = async () => { setActiveModal('members'); const { data } = await supabase.from('group_members').select(`*, profiles:user_id ( id, name, username, role, global_role, badges, image )`).eq('group_id', activeGroup.id); if(data) setGroupMembers(data); };
  const handleKickMember = async (uid) => { if(window.confirm("Kick user?")) { await supabase.from('group_members').delete().eq('group_id', activeGroup.id).eq('user_id', uid); setGroupMembers(prev => prev.filter(m => m.user_id !== uid)); } };
  const handleBanMember = async (uid) => { if(window.confirm("Ban user from group?")) { const { error } = await supabase.from('group_members').update({ role: 'banned' }).eq('group_id', activeGroup.id).eq('user_id', uid); if (error) alert("Error banning: " + error.message); else setGroupMembers(prev => prev.map(m => m.user_id === uid ? { ...m, role: 'banned' } : m)); } };
  const handleUpdateMemberRole = async (uid, role) => { await supabase.from('group_members').update({ role }).eq('group_id', activeGroup.id).eq('user_id', uid); setGroupMembers(prev => prev.map(m => m.user_id === uid ? { ...m, role } : m)); };
  const handleSetNickname = async (uid, newNick) => { await supabase.from('group_members').update({ nickname: newNick }).eq('group_id', activeGroup.id).eq('user_id', uid); setGroupMembers(prev => prev.map(m => m.user_id === uid ? { ...m, nickname: newNick } : m)); setEditingMemberId(null); };

  const handleImageChange = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setSelectedImage(reader.result); reader.readAsDataURL(file); } };
  const handleBanUser = async (uid) => { if(window.confirm("Ban Global?")) { await supabase.from('profiles').update({ is_banned: true }).eq('id', uid); alert("Banned"); } };
  const handleCreateSupportTicket = async () => { try { const { data } = await supabase.from('support_tickets').insert({ user_id: authUser.id, user_name: currentUser.name }).select().single(); setUserTicket(data); } catch (e) { alert(e.message); } };
  const handleSendSupportMessage = async () => { if(!supportInput.trim()) return; const ticketId = userTicket?.id; await supabase.from('support_messages').insert({ ticket_id: ticketId, sender_id: authUser.id, content: supportInput }); setSupportInput(""); };
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

  // 3. EFFECTS
  useEffect(() => {
    if (supabase) return;
    const initClient = () => {
      if (window.supabase) {
        if (!window._supabaseInstance) {
          window._supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
        setSupabase(window._supabaseInstance);
      }
    };
    if (window.supabase) { initClient(); return; }
    let script = document.querySelector('script[src="https://unpkg.com/@supabase/supabase-js@2"]');
    if (!script) {
      script = document.createElement("script");
      script.src = "https://unpkg.com/@supabase/supabase-js@2";
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener('load', initClient);
    return () => { script.removeEventListener('load', initClient); }
  }, [supabase]);

  useEffect(() => {
    const timeout = setTimeout(() => {
        if (authLoading) setAuthLoading(false);
    }, 7000);

    const consent = localStorage.getItem('liberty_cookie_consent');
    if (!consent) setShowCookieBanner(true);
    if (!supabase) return; 

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      if (!session?.user) setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (!session?.user) {
        setCurrentUser(null);
        setAuthLoading(false);
      }
    });

    return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
    };
  }, [supabase]);

  useEffect(() => {
    if (!authUser || !supabase) return;
    const fetchData = async () => {
      try {
        let { data: profileData } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
        if (!profileData) {
           const { data: newProfile } = await supabase.from('profiles').insert({
              id: authUser.id,
              name: authUser.user_metadata?.display_name || "User",
              username: authUser.user_metadata?.username || `user_${authUser.id.substring(0,6)}`,
              role: authUser.user_metadata?.role || "Civilian",
            }).select().single();
           if (newProfile) profileData = newProfile;
        }
        if (profileData) setCurrentUser(profileData);
        
        const { data: groupsData } = await supabase.from('groups').select('*').order('created_at', { ascending: false });
        if (groupsData) setGroups(groupsData);

        const { data: myMemberships } = await supabase.from('group_members').select('group_id').eq('user_id', authUser.id);
        if (myMemberships) setJoinedGroupIds(myMemberships.map(m => m.group_id));

        fetchNotifications();
        
        const notifChannel = supabase.channel(`notifications:${authUser.id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${authUser.id}` }, () => {
             fetchNotifications();
          })
          .subscribe();

        fetchPosts();

        const { data: tickets } = await supabase.from('support_tickets').select('*').eq('user_id', authUser.id).limit(1);
        if (tickets && tickets.length > 0) {
            setUserTicket(tickets[0]);
        }

        return () => { supabase.removeChannel(notifChannel); };
      } catch (error) { console.error("Error loading data:", error); } finally { setAuthLoading(false); }
    };
    fetchData();
  }, [authUser, currentView, activeGroup, activeChannel, supabase]); 

  // ... (Other useEffects logic kept, simplified to avoid duplication in text but would exist here)

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
        const { data } = await supabase.from('support_messages').select(`*, profiles:sender_id ( name, role, global_role )`).eq('ticket_id', ticketId).order('created_at', { ascending: true });
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

  // 4. LOADING UI
  if (!supabase || authLoading) {
      return (
          <div className="flex h-screen items-center justify-center bg-[#0a0a0c] text-blue-500 flex-col gap-4">
              <Loader2 className="animate-spin w-10 h-10" />
              <p className="text-slate-500 text-sm animate-pulse">Initializing Frequency...</p>
          </div>
      );
  }
  
  if (authUser && !currentUser) {
      return (
          <div className="flex h-screen items-center justify-center bg-[#0a0a0c] text-slate-200 flex-col gap-4 p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mb-2" />
              <h2 className="text-xl font-bold">Profile Sync Issue</h2>
              <p className="text-slate-500 max-w-xs">We couldn't load your profile data. This can happen during first signup or network issues.</p>
              <button onClick={() => window.location.reload()} className="bg-blue-600 px-6 py-2 rounded-xl text-white font-bold mt-4">Retry</button>
              <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-white mt-2 underline">Log Out</button>
          </div>
      );
  }

  if (!currentUser && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050507] text-slate-100 p-6 relative overflow-hidden">
        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-2xl shadow-lg shadow-blue-900/40 mb-5 ring-1 ring-white/20"><Shield className="w-12 h-12 text-white" /></div>
            <h1 className="text-4xl font-black italic mb-2 tracking-tighter">LIBERTY<span className="text-blue-500 not-italic">Social</span></h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide uppercase text-center">Secure Community Frequency</p>
          </div>
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authError && <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /><div><p className="text-xs font-bold text-red-400">Authentication Error</p><p className="text-[10px] text-red-300">{authError}</p></div></div>}
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
  }

  // --- FILTER GROUPS LOGIC ---
  const filteredGroups = groups.filter(g => {
      if (currentView !== 'groups') return true;
      const matchesSearch = (g.name || "").toLowerCase().includes(groupSearchQuery.toLowerCase());
      const badges = Array.isArray(g.badges) ? g.badges : [];
      const matchesTag = groupFilterTag === 'All' || badges.includes(groupFilterTag);
      return matchesSearch && matchesTag;
  });

  // --- RENDER UI ---
  return (
    <div className="flex h-screen bg-[#0a0a0c] text-slate-100 font-sans overflow-hidden text-sm sm:text-base">
      {/* 1. RAIL */}
      <div className="flex flex-col items-center w-[72px] bg-[#050507]/95 backdrop-blur-xl border-r border-slate-800/60 py-4 gap-3 shrink-0 z-20">
        <RailItem active={currentView === 'feed'} onClick={goHome}><Compass size={24} /></RailItem>
        <div className="w-8 h-[2px] bg-slate-800 rounded-full mx-auto my-1"></div>
        <div className="flex-1 flex flex-col gap-3 w-full items-center overflow-y-auto scrollbar-hide">
          {groups.filter(g => joinedGroupIds.includes(g.id) || g.creator_id === authUser.id).map(g => (
             <RailItem key={g.id} active={activeGroup?.id === g.id} onClick={() => goToGroup(g)}>
               <div className="w-full h-full flex items-center justify-center rounded-[24px] overflow-hidden bg-slate-800 border border-slate-700/50">
                  {g.image ? <img src={g.image} className="w-full h-full object-cover" /> : (g.name || "").substring(0, 2)}
               </div>
             </RailItem>
          ))}
          <RailItem onClick={() => setCurrentView('groups')}><PlusCircle size={24} /></RailItem>
        </div>
        <div className="mt-auto"><RailItem active={currentView === 'profile'} onClick={goProfile}><User size={20} /></RailItem></div>
      </div>

      {/* 2. SIDEBAR */}
      <nav className="hidden lg:flex flex-col w-60 bg-[#0a0a0c]/90 backdrop-blur-xl border-r border-slate-800/60 p-4 space-y-6">
        <div className="flex items-center space-x-2 px-2 pt-1"><h1 className="text-lg font-black italic">LIBERTY<span className="text-blue-500 text-xs block -mt-1 not-italic">Social</span></h1></div>
        <div className="space-y-1">
          <NavItem icon={<Navigation size={18}/>} label="The Dispatch" active={currentView === 'feed'} onClick={goHome} />
          <NavItem icon={<Users size={18}/>} label="Communities" active={currentView === 'groups'} onClick={() => setCurrentView('groups')} />
          <NavItem icon={<User size={18}/>} label="Profile" active={currentView === 'profile'} onClick={goProfile} />
          <NavItem icon={<Inbox size={18}/>} label="Applications" active={currentView === 'applications'} onClick={() => setCurrentView('applications')} />
          <NavItem icon={<Settings size={18}/>} label="Settings" onClick={() => { goProfile(); setActiveModal('settings'); }} />
          {/* STAFF AREA REMOVED AS REQUESTED */}
        </div>
        <div className="mt-auto pt-4 border-t border-slate-800"><button onClick={() => setIsSupportOpen(!isSupportOpen)} className="flex items-center gap-3 px-3 py-3 w-full rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><LifeBuoy size={18}/> <span className="text-sm font-semibold">Get Help</span></button></div>
      </nav>

      {/* 3. MAIN */}
      <main ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-hide border-r border-slate-800/60 bg-[#0a0a0c] relative">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-slate-800/60 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold truncate"> {currentView === 'feed' ? 'Dispatch Feed' : currentView === 'groups' ? 'Explore Communities' : currentView === 'investigation' ? 'Investigation Unit' : currentView === 'active_calls' ? 'Active Support Calls' : currentView === 'review_apps' ? 'Review Applications' : currentView === 'applications' ? 'Applications' : activeGroup?.name || 'Dashboard'} </h2>
            <div className="flex space-x-4 items-center relative">
              <button onClick={() => setActiveModal('verify')} className="text-xs bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-full border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors flex items-center gap-1 font-medium"><BadgeCheck size={14} /> Verify</button>
              <div className="relative"><div className="p-2 hover:bg-slate-800 rounded-full transition-colors cursor-pointer" onClick={() => setShowNotifications(!showNotifications)}><Bell className="w-5 h-5 text-slate-400 hover:text-white" /></div>{notifications.filter(n => !n.read).length > 0 && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#0a0a0c]"></div>}{showNotifications && (<div className="absolute right-0 top-12 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-white/10"><div className="p-3 border-b border-slate-800/50 font-bold text-xs uppercase tracking-wider text-slate-500">Notifications</div><div className="max-h-80 overflow-y-auto">{notifications.length === 0 ? <div className="p-6 text-center text-xs text-slate-500">No new alerts.</div> : notifications.map(n => (<div key={n.id} onClick={() => handleNotificationClick(n)} className={`p-4 border-b border-slate-800/30 hover:bg-slate-800/50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-500/5' : ''}`}><p className="text-sm text-slate-300"><span className="font-bold text-white">{n.profiles?.name}</span> {n.content}</p><span className="text-[10px] text-slate-500 mt-1 block">{new Date(n.created_at).toLocaleTimeString()}</span></div>))}</div></div>)}</div>
            </div>
        </div>

        {/* --- VIEWS --- */}
        {currentView === 'profile' && currentUser && (
             <div className="pb-10">
                <div className="h-48 bg-gradient-to-r from-blue-900 to-slate-900 relative overflow-hidden"><div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div></div>
                <div className="px-6 sm:px-10">
                   <div className="relative -mt-16 mb-6 flex items-end gap-4"><div className="w-32 h-32 rounded-3xl bg-slate-900 border-4 border-[#0a0a0c] p-1 shadow-2xl"><div className="w-full h-full bg-slate-800 rounded-2xl flex items-center justify-center"><User size={48} className="text-slate-500" /></div></div><div className="mb-2"><h1 className="text-3xl font-black italic tracking-tight text-white flex items-center gap-2">{currentUser.name}{currentUser.global_role === 'owner' && <Crown size={24} className="text-yellow-500" fill="currentColor" />}</h1><p className="text-slate-400">@{currentUser.username}</p>
                   {/* MOBILE SETTINGS BUTTON */}
                   <div className="flex gap-2 mt-2 items-center">
                       <span className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-300 border border-slate-700">{currentUser.role}</span>
                       <button onClick={() => setActiveModal('settings')} className="bg-slate-800 p-1.5 rounded-full border border-slate-700 text-slate-400 hover:text-white transition-colors lg:hidden"><Settings size={14}/></button>
                   </div>
                   </div></div>
                   <div className="grid grid-cols-3 gap-4 mb-8"><div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl text-center"><div className="text-2xl font-bold text-white">{posts.length}</div><div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Calls</div></div><div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl text-center"><div className="text-2xl font-bold text-red-500">{currentUser.warning_count || 0}</div><div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Warnings</div></div><div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl text-center"><div className="text-2xl font-bold text-emerald-500">Active</div><div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Status</div></div></div>
                   <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-800 pb-2">Patrol Log</h3>
                   <div className="space-y-4">{posts.length === 0 ? <div className="text-center py-10 text-slate-500">No patrol logs found.</div> : posts.map(post => (<PostCard key={post.id} post={post} currentUser={currentUser} groupRole={currentGroupRole} onReport={() => setReportTarget({ type: 'post', id: post.id })} onDelete={() => handleDeletePost(post.id)} onLike={() => handleLikePost(post.id, post.like_count)} onBan={() => handleBanUser(post.uid)} onViewComments={() => setViewingCommentsPost(post)} onViewProfile={() => handleViewProfile(post.profiles)} />))}</div>
                </div>
             </div>
        )}

        {(currentView === 'feed') && (
            <div className="pb-10 max-w-3xl mx-auto">
                <div className="flex gap-2 px-4 pt-4 mb-4">
                    <button onClick={() => setFeedMode('posts')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${feedMode === 'posts' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}>Posts</button>
                    <button onClick={() => setFeedMode('chat')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${feedMode === 'chat' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}>Live Chat</button>
                </div>

                {feedMode === 'posts' ? (
                   <>
                    <div className="mx-4 mb-6">
                        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-4 shadow-sm backdrop-blur-sm focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                            <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)} placeholder={`What's happening? ${activeGroup ? '#' + activeChannel : ''}`} className="w-full bg-transparent border-none outline-none text-slate-200 h-20 resize-none text-sm placeholder-slate-500" />
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800/50">
                                <div className="flex gap-2"><input type="file" ref={fileInputRef} hidden onChange={handleImageChange} /><button onClick={() => fileInputRef.current.click()} className="p-2 hover:bg-slate-800 rounded-xl text-blue-500 transition-colors"><ImageIcon size={20}/></button></div>
                                <button onClick={handleCreatePost} disabled={(!newPostText.trim() && !selectedImage) || isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:shadow-blue-900/20 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2">{isSubmitting ? <Loader2 className="animate-spin w-4 h-4"/> : <><Send size={14}/> Post</>}</button>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4 px-4 pb-20">{posts.map(post => (<PostCard key={post.id} post={post} currentUser={currentUser} groupRole={currentGroupRole} onReport={() => setReportTarget({ type: 'post', id: post.id })} onDelete={() => handleDeletePost(post.id)} onLike={() => handleLikePost(post.id, post.like_count)} onBan={() => handleBanUser(post.uid)} onViewComments={() => setViewingCommentsPost(post)} onViewProfile={() => handleViewProfile(post.profiles)} />))}</div>
                   </>
                ) : (
                    <div className="flex flex-col h-[calc(100vh-140px)] mx-4 bg-slate-900/50 border border-slate-800/60 rounded-2xl overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatScrollRef}>
                            {globalChatMessages.map(msg => {
                                const isMe = msg.user_id === authUser?.id;
                                const canDelete = isGlobalStaff || isMe;
                                const role = msg.profiles?.global_role;
                                const isDev = role === 'developer';
                                const isOwner = role === 'owner';
                                const isMod = role === 'moderator' || role === 'admin';
                                const avatarBg = isDev ? 'bg-green-500/20 text-green-400 border-green-500/40' : isOwner ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : isMod ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' : 'bg-slate-800 text-slate-400 border-slate-700';
                                return (
                                    <div key={msg.id} className="group flex gap-3 hover:bg-slate-800/30 p-2 rounded-xl transition-colors relative">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 border overflow-hidden cursor-pointer transition-colors ${avatarBg}`} onClick={() => handleViewProfile(msg.profiles)}>{msg.profiles?.name?.[0]}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5"><div className="cursor-pointer" onClick={() => handleViewProfile(msg.profiles)}><RenderNameWithRole profile={msg.profiles || {name: 'Unknown'}} /></div><span className="text-[10px] text-slate-500">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                                            <p className="text-sm text-slate-300 leading-relaxed break-words">{msg.content}</p>
                                        </div>
                                        <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 rounded-lg p-1 border border-slate-800 backdrop-blur-sm shadow-lg">
                                             <button onClick={() => setReportTarget({ type: 'chat', id: msg.id })} className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors" title="Report"><Flag size={12}/></button>
                                             {canDelete && <button onClick={() => handleDeleteChatMessage(msg.id)} className="p-1.5 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={12}/></button>}
                                             {isGlobalStaff && (<><button onClick={() => handleWarnUser(msg.user_id)} className="p-1.5 hover:bg-yellow-500/10 rounded text-slate-500 hover:text-yellow-400 transition-colors" title="Warn"><AlertOctagon size={12}/></button><button onClick={() => handleBanUser(msg.user_id)} className="p-1.5 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-500 transition-colors" title="Ban"><Ban size={12}/></button></>)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
                            <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none" placeholder="Global Chat..." onKeyDown={e => e.key === 'Enter' && handleSendChat()} />
                            <button onClick={handleSendChat} className="bg-blue-600 text-white p-2 rounded-lg"><Send size={16}/></button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* APPLICATIONS VIEW */}
        {currentView === 'applications' && (
            <div className="p-6 max-w-5xl mx-auto space-y-6">
                <h2 className="text-2xl font-bold text-white mb-6">Open Applications</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-2xl p-6 flex flex-col justify-between h-full relative overflow-hidden group"><div className="absolute -right-10 -top-10 bg-yellow-500/10 w-40 h-40 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all"></div><div><div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center border border-yellow-500/40 text-yellow-500 mb-4"><Star size={24} fill="currentColor"/></div><h3 className="text-xl font-bold text-white">Influencer Verification</h3><p className="text-sm text-slate-400 mt-2 leading-relaxed">Get the <span className="text-yellow-500 font-bold"><Star size={10} className="inline"/> Verified Badge</span> next to your name. Requirements: 1000+ followers on any major social platform.</p></div><button onClick={() => setActiveModal('verify')} className="mt-6 w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold shadow-lg shadow-yellow-900/20 transition-all">Apply for Verification</button></div>
                    <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-500/30 rounded-2xl p-6 flex flex-col justify-between h-full relative overflow-hidden group"><div className="absolute -right-10 -top-10 bg-blue-500/10 w-40 h-40 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div><div><div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/40 text-blue-500 mb-4"><Shield size={24} fill="currentColor"/></div><h3 className="text-xl font-bold text-white">Staff Application</h3><p className="text-sm text-slate-400 mt-2 leading-relaxed">Join the team as a <span className="text-blue-400 font-bold">Global Moderator</span>. Help keep the community safe and enforce the rules.</p></div><button onClick={() => setActiveModal('apply_staff')} className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all">Apply for Staff</button></div>
                </div>
            </div>
        )}

        {/* Removed 'review_apps', 'investigation', 'active_calls' render blocks to fulfill request */}

        {(currentView === 'single_group' || currentView === 'groups') && (
            <div className="pb-10 max-w-3xl mx-auto">
                {activeGroup && currentView === 'single_group' && (
                    <div className="mb-6 rounded-b-3xl overflow-hidden bg-slate-900 border-b border-x border-slate-800 shadow-xl mx-4 mt-0">
                        <div className="h-40 bg-slate-950 relative">
                             {activeGroup.banner ? (<img src={activeGroup.banner} className="w-full h-full object-cover" />) : (<div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-indigo-900"><div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div></div>)}
                             <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-md p-2 flex justify-center gap-2">{GROUP_CHANNELS.map(c => (<button key={c.id} onClick={() => setActiveChannel(c.id)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${activeChannel === c.id ? 'bg-white text-black border-white shadow-lg scale-105' : 'bg-black/30 text-slate-300 border-transparent hover:bg-black/50'}`}><div className="flex items-center gap-1.5">{c.icon && React.cloneElement(c.icon, { size: 12 })}{c.label}</div></button>))}</div>
                        </div>
                        <div className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4 -mt-12 relative z-10">
                                <div className="w-24 h-24 rounded-2xl bg-slate-900 border-4 border-[#0f1014] overflow-hidden shadow-lg">{activeGroup.image ? <img src={activeGroup.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center"><Users className="text-slate-600"/></div>}</div>
                                <div className="mt-8"><h1 className="text-xl font-bold text-white">{activeGroup.name}</h1><p className="text-xs text-slate-400 line-clamp-1 max-w-[200px]">{activeGroup.description}</p>
                                    {activeGroup.badges && Array.isArray(activeGroup.badges) && activeGroup.badges.length > 0 && (<div className="flex flex-wrap gap-1.5 mt-2">{activeGroup.badges.map(tag => { if (tag === 'Official') return <span key="official" className="text-[10px] px-2 py-0.5 rounded border bg-green-500/20 text-green-300 border-green-500/30 font-bold uppercase tracking-wide">Official</span>; const tagStyle = AVAILABLE_GROUP_TAGS.find(t => t.id === tag); return (<span key={tag} className={`text-[10px] px-2 py-0.5 rounded border ${tagStyle ? tagStyle.color : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{tag}</span>); })}</div>)}
                                </div>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button onClick={handleOpenMembers} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"><Users size={18}/></button>
                                {activeGroup.creator_id === authUser.id && (<button onClick={() => { setActiveModal('group_settings'); setEditGroupTags(Array.isArray(activeGroup.badges) ? activeGroup.badges : []); }} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"><Edit3 size={18}/></button>)}
                            </div>
                        </div>
                    </div>
                )}

                {currentView === 'groups' && (
                  <div className="p-6">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                            <input 
                                value={groupSearchQuery} 
                                onChange={(e) => setGroupSearchQuery(e.target.value)} 
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none" 
                                placeholder="Search communities..." 
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                            <button onClick={() => setGroupFilterTag("All")} className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${groupFilterTag === "All" ? "bg-white text-black border-white" : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"}`}>All</button>
                            {AVAILABLE_GROUP_TAGS.map(t => (
                                <button key={t.id} onClick={() => setGroupFilterTag(t.id)} className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${groupFilterTag === t.id ? t.color.replace('/20', '/40') + ' ring-1 ring-white/20' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'}`}>{t.id}</button>
                            ))}
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl p-6 col-span-1 md:col-span-2 shadow-lg mb-4">
                           <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><PlusCircle className="text-blue-500"/> Create Community</h3>
                           <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-3"><input value={newGroupText} onChange={e => setNewGroupText(e.target.value)} className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-white" placeholder="Community Name" /><input value={newGroupImage} onChange={e => setNewGroupImage(e.target.value)} className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-white" placeholder="Logo URL (Optional)" /></div>
                              <div className="flex flex-col gap-3"><textarea value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-white flex-1 resize-none" placeholder="Description (Optional)" />
                                 <div className="flex flex-wrap gap-2">{AVAILABLE_GROUP_TAGS.map(tag => (<button key={tag.id} onClick={() => toggleGroupTag(tag.id, false)} className={`text-[10px] px-2 py-1 rounded border transition-all ${newGroupTags.includes(tag.id) ? tag.color + ' ring-1 ring-white/50' : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'}`}>{tag.id}</button>))}</div>
                                 <button onClick={handleCreateGroup} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold w-full transition-all active:scale-[0.98]">{isSubmitting ? "Creating..." : "Launch Community"}</button>
                              </div>
                           </div>
                         </div>
                         
                         {filteredGroups.map(g => {
                             const isMember = joinedGroupIds.includes(g.id);
                             const isOwner = g.creator_id === authUser.id;
                             const badges = Array.isArray(g.badges) ? g.badges : [];
                             return (
                                 <div key={g.id} onClick={() => goToGroup(g)} className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl cursor-pointer hover:bg-slate-800/60 hover:border-slate-700/80 transition-all group relative overflow-hidden">
                                     {isOwner && (<div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wide flex items-center gap-1"><Crown size={12} fill="currentColor" /> Owner</div>)}
                                     {!isOwner && (<div className="absolute top-4 right-4 z-10"><button onClick={(e) => isMember ? handleLeaveGroup(e, g.id) : handleJoinGroup(e, g.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isMember ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'}`}>{isMember ? "Leave" : "Join"}</button></div>)}
                                     <div className="flex items-center gap-4">
                                         <div className="w-14 h-14 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shrink-0">{g.image ? <img src={g.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-lg">{(g.name || "").substring(0,2)}</div>}</div>
                                         <div className="min-w-0">
                                             <h4 className="font-bold text-slate-200 truncate flex items-center gap-2">{g.name}{badges.includes('Official') && (<span className="text-[8px] bg-green-500/20 text-green-300 border border-green-500/30 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Official</span>)}</h4>
                                             <p className="text-xs text-slate-500 line-clamp-2 mt-1">{g.description || "No description provided."}</p>
                                             {badges.length > 0 && (<div className="flex gap-1 mt-2">{badges.filter(t => t !== 'Official').slice(0,3).map(t => { const style = AVAILABLE_GROUP_TAGS.find(x => x.id === t); return <div key={t} className={`w-2 h-2 rounded-full ${style ? style.color.split(' ')[0] : 'bg-slate-600'}`} title={t}></div> })}</div>)}
                                         </div>
                                     </div>
                                 </div>
                             );
                         })}
                      </div>
                  </div>
                )}

                {currentView !== 'groups' && (!activeGroup || canPostInChannel()) && (
                    <div className="mx-4 mb-6 mt-6">
                        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-4 shadow-sm backdrop-blur-sm focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                            <textarea value={newPostText} onChange={e => setNewPostText(e.target.value)} placeholder={`What's happening? ${activeGroup ? '#' + activeChannel : ''}`} className="w-full bg-transparent border-none outline-none text-slate-200 h-20 resize-none text-sm placeholder-slate-500" />
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800/50">
                                <div className="flex gap-2"><input type="file" ref={fileInputRef} hidden onChange={handleImageChange} /><button onClick={() => fileInputRef.current.click()} className="p-2 hover:bg-slate-800 rounded-xl text-blue-500 transition-colors"><ImageIcon size={20}/></button></div>
                                <button onClick={handleCreatePost} disabled={(!newPostText.trim() && !selectedImage) || isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:shadow-blue-900/20 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2">{isSubmitting ? <Loader2 className="animate-spin w-4 h-4"/> : <><Send size={14}/> Post</>}</button>
                            </div>
                        </div>
                    </div>
                )}

                {currentView !== 'groups' && (
                    <div className="space-y-4 px-4 pb-20">
                        {posts.length === 0 && !authLoading && (<div className="text-center py-20 text-slate-500"><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No activity yet.</p></div>)}
                        {posts.map(post => (<PostCard key={post.id} post={post} currentUser={currentUser} groupRole={currentGroupRole} onReport={() => setReportTarget({ type: 'post', id: post.id })} onDelete={() => handleDeletePost(post.id)} onLike={() => handleLikePost(post.id, post.like_count)} onBan={() => handleBanUser(post.uid)} onViewComments={() => setViewingCommentsPost(post)} onViewProfile={() => handleViewProfile(post.profiles)} />))}
                    </div>
                )}
            </div>
        )}

        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
             {isSupportOpen && (
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl w-80 h-96 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
                     <div className="bg-blue-600 p-4 flex justify-between items-center text-white"><h4 className="font-bold flex items-center gap-2"><LifeBuoy size={18}/> Support Chat</h4><button onClick={() => setIsSupportOpen(false)}><X size={18}/></button></div>
                     <div className="flex-1 bg-slate-950 p-4 overflow-y-auto space-y-3" ref={supportScrollRef}>
                         {!userTicket && (<div className="text-center mt-10"><p className="text-slate-400 text-sm mb-4">Need help? Start a live chat with our staff.</p><button onClick={handleCreateSupportTicket} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm">Start Chat</button></div>)}
                         {supportMessages.map(msg => (<div key={msg.id} className={`flex ${msg.sender_id === authUser.id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.sender_id === authUser.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-300 text-slate-300 rounded-tl-none'}`}>{msg.content}</div></div>))}
                     </div>
                     {userTicket && (<div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2"><input value={supportInput} onChange={e => setSupportInput(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white outline-none" placeholder="Type here..." onKeyDown={e => e.key === 'Enter' && handleSendSupportMessage()} /><button onClick={handleSendSupportMessage} className="bg-blue-600 text-white p-2 rounded-lg"><Send size={16}/></button></div>)}
                 </div>
             )}
        </div>

        {/* --- MODALS MOVED TO ROOT LEVEL --- */}

        {/* Profile Viewer Modal */}
        {activeModal === 'view_profile' && viewingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm relative overflow-hidden shadow-2xl">
                     <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-900 to-slate-900"></div>
                     <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-colors z-10"><X size={16}/></button>
                     <div className="relative mt-8 flex flex-col items-center">
                         <div className="w-24 h-24 bg-slate-950 rounded-full border-4 border-slate-900 flex items-center justify-center mb-4 overflow-hidden shadow-lg"><User size={48} className="text-slate-500"/></div>
                         <h2 className="text-2xl font-bold text-white flex items-center gap-2">{viewingUser.name} {viewingUser.global_role === 'owner' && <Crown size={20} className="text-yellow-500" fill="currentColor"/>}</h2>
                         <p className="text-slate-400 text-sm">@{viewingUser.username}</p>
                         <div className="flex flex-wrap gap-2 mt-4 justify-center"><span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300 border border-slate-700">{viewingUser.role}</span>{(Array.isArray(viewingUser.badges) ? viewingUser.badges : []).map(b => (<span key={b} className="text-xs bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 capitalize">{b}</span>))}</div>
                         {isGlobalStaff && (<div className="w-full mt-6 pt-6 border-t border-slate-800"><h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Moderation Tools</h4><div className="grid grid-cols-2 gap-3"><div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center"><div className="text-xl font-bold text-white">{viewingUser.warning_count || 0}</div><div className="text-[10px] text-slate-500 uppercase font-bold">Warnings</div></div><button onClick={() => handleWarnUser(viewingUser.id)} className="bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-500 border border-yellow-500/20 rounded-xl font-bold text-xs transition-colors">Issue Warning</button></div><button onClick={() => handleBanUser(viewingUser.id)} className="w-full mt-3 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-500/20 py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"><Ban size={14}/> Ban User Globally</button></div>)}
                     </div>
                </div>
            </div>
        )}
        
        {/* Report Modal */}
        {reportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-red-500 flex items-center gap-2"><AlertTriangle size={20}/> Report Content</h3><button onClick={() => setReportTarget(null)} className="text-slate-500 hover:text-white"><X size={20}/></button></div>
            <p className="text-sm text-slate-400 mb-4">Why are you reporting this {reportTarget.type}?</p>
            <div className="space-y-2">{['Fail RP', 'Toxicity / Harassment', 'Spam', 'Inappropriate Content'].map(reason => (<button key={reason} onClick={() => handleReport(reason)} className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors">{reason}</button>))}</div>
          </div>
        </div>
        )}

        {(activeModal === 'verify' || activeModal === 'apply_staff') && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${activeModal === 'verify' ? 'from-yellow-600 to-yellow-400' : 'from-blue-600 to-blue-400'}`}></div>
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-white">{activeModal === 'verify' ? <><Star size={20} className="text-yellow-500" fill="currentColor"/> Influencer Application</> : <><Shield size={20} className="text-blue-500" fill="currentColor"/> Staff Application</>}</h3>
                    <p className="text-sm text-slate-400 mb-4 leading-relaxed">{activeModal === 'verify' ? "Apply for verification to get the verified star badge. Requirements: 1000+ followers." : "Apply to join the Global Staff team. Must be active and helpful."}</p>
                    <form onSubmit={handleSubmitApplication} className="space-y-3"><input name="link" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-slate-600 transition-colors" placeholder={activeModal === 'verify' ? "Social Media Link" : "Portfolio / Experience Link"} required /><textarea name="reason" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none h-24 resize-none focus:border-slate-600 transition-colors" placeholder="Why should you be accepted?" required /><div className="flex gap-2 pt-2"><button type="button" onClick={() => setActiveModal(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-2.5 text-sm font-bold transition-colors">Cancel</button><button type="submit" className={`flex-1 text-black rounded-xl py-2.5 text-sm font-bold transition-colors ${activeModal === 'verify' ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>Apply</button></div></form>
                </div>
            </div>
        )}

        {/* ACCOUNT & SETTINGS MODALS */}
        {activeModal === 'settings' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in zoom-in-95">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
                <h3 className="font-bold text-lg mb-4 text-white">Account Settings</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4"><div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500">Display Name</label><input name="displayName" defaultValue={currentUser.name} className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors" /></div><div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500">Role</label><select name="role" defaultValue={currentUser.role} className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors"><option value="Civilian">Civilian</option><option value="Law Enforcement">Law Enforcement</option><option value="Fire/EMS">Fire/EMS</option><option value="DOT">DOT / Public Works</option></select></div><button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all">Save Changes</button></form>
                <div className="mt-4 flex gap-2"><button className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-sm hover:bg-slate-700 transition-colors border border-slate-700" onClick={() => alert("Terms of Service:\n\n1. Be respectful.\n2. No illegal content.\n3. Follow roleplay rules.")}>TOS</button><button className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-sm hover:bg-slate-700 transition-colors border border-slate-700" onClick={() => alert("Privacy Policy:\n\nWe collect your email and profile data to facilitate the app experience.")}>Privacy</button></div>
                <button onClick={handleRequestData} className="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-slate-700">
                    <Download size={16} /> Request Account Data (GDPR)
                </button>
                <div className="mt-6 pt-6 border-t border-slate-800"><button onClick={handleDeleteAccount} className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 py-3 rounded-xl font-bold transition-all">Delete Account</button><button onClick={() => setActiveModal(null)} className="w-full mt-2 text-slate-500 hover:text-slate-300 py-2 text-sm">Cancel</button></div>
              </div>
            </div>
        )}

        {activeModal === 'group_settings' && activeGroup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in zoom-in-95">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
                    <h3 className="font-bold text-lg mb-4 text-white">Group Settings</h3>
                    <form onSubmit={handleUpdateGroup} className="space-y-4">
                        <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500">Name</label><input name="groupName" defaultValue={activeGroup.name} className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500" /></div>
                        <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500">Logo</label><input name="groupImage" defaultValue={activeGroup.image} className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500" placeholder="https://..." /></div>
                        <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500">Banner</label><input name="groupBanner" defaultValue={activeGroup.banner} className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500" placeholder="https://..." /></div>
                        <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500">Description</label><textarea name="groupDesc" defaultValue={activeGroup.description} className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 h-24 resize-none" /></div>
                         <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500">Community Tags</label><div className="flex flex-wrap gap-2">{AVAILABLE_GROUP_TAGS.map(tag => (<button type="button" key={tag.id} onClick={() => toggleGroupTag(tag.id, true)} className={`text-[10px] px-2 py-1 rounded border transition-all ${editGroupTags.includes(tag.id) ? tag.color + ' ring-1 ring-white/50' : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'}`}>{tag.id}</button>))}{isGlobalStaff && (<button type="button" onClick={() => toggleGroupTag('Official', true)} className={`text-[10px] px-2 py-1 rounded border transition-all ${editGroupTags.includes('Official') ? 'bg-green-500/20 text-green-300 border-green-500/30 ring-1 ring-white/50' : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'}`}>Official</button>)}</div></div>
                        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold">Save Changes</button>
                    </form>
                    <div className="mt-6 pt-6 border-t border-slate-800"><button onClick={handleDeleteGroup} className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 py-3 rounded-xl font-bold">Delete Group</button><button onClick={() => setActiveModal(null)} className="w-full mt-2 text-slate-500 hover:text-slate-300 py-2 text-sm">Cancel</button></div>
                </div>
            </div>
        )}

        {/* Member Management Modal - UPDATED */}
        {activeModal === 'members' && activeGroup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in zoom-in-95">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md flex flex-col h-[70vh]">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center"><h3 className="font-bold text-white">Members ({memberCount})</h3><button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-800 rounded"><X size={20}/></button></div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {groupMembers.map(member => {
                             const isMe = member.user_id === authUser.id;
                             const isAdmin = currentGroupRole === 'admin';
                             const isMod = currentGroupRole === 'moderator';
                             const canManage = (isAdmin || (isMod && member.role === 'member')) && !isMe;
                             
                             return (
                                <div key={member.user_id} className="flex flex-col p-3 bg-slate-950/50 rounded-xl border border-slate-800 gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                                                {member.profiles?.image ? <img src={member.profiles.image} className="w-full h-full object-cover"/> : <User size={14}/>}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                                    {member.nickname || member.profiles?.name || 'User'}
                                                    {member.nickname && <span className="text-[10px] font-normal text-slate-500">(@{member.profiles?.username})</span>}
                                                </p>
                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${member.role === 'admin' ? 'bg-red-500/20 text-red-400' : member.role === 'moderator' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>{member.role}</span>
                                            </div>
                                        </div>
                                        {canManage && (
                                            <div className="flex gap-2">
                                                 <button onClick={() => setEditingMemberId(member.user_id === editingMemberId ? null : member.user_id)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"><Settings size={14}/></button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Edit Member Actions */}
                                    {editingMemberId === member.user_id && (
                                        <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 animate-in slide-in-from-top-2">
                                            <div className="col-span-2 flex gap-2">
                                                <input type="text" placeholder="Set Nickname" className="flex-1 bg-black/40 border border-slate-700 rounded p-1.5 text-xs text-white" onKeyDown={(e) => { if(e.key === 'Enter') handleSetNickname(member.user_id, e.target.value) }} />
                                            </div>
                                            {isAdmin && (
                                                <select className="bg-slate-800 text-white text-xs p-2 rounded border border-slate-700 outline-none" value={member.role} onChange={(e) => handleUpdateMemberRole(member.user_id, e.target.value)}>
                                                    <option value="member">Member</option>
                                                    <option value="moderator">Moderator</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            )}
                                            <button onClick={() => handleKickMember(member.user_id)} className="bg-orange-900/20 text-orange-500 hover:bg-orange-900/40 p-2 rounded text-xs font-bold border border-orange-900/50">Kick</button>
                                            <button onClick={() => handleBanMember(member.user_id)} className="col-span-2 bg-red-900/20 text-red-500 hover:bg-red-900/40 p-2 rounded text-xs font-bold border border-red-900/50 flex items-center justify-center gap-2"><Ban size={12}/> Ban from Group</button>
                                        </div>
                                    )}
                                </div>
                             );
                        })}
                    </div>
                </div>
            </div>
        )}

        {viewingCommentsPost && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg h-[80vh] flex flex-col shadow-2xl relative">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md absolute top-0 left-0 right-0 z-10 rounded-t-2xl"><h3 className="font-bold text-white flex items-center gap-2"><MessageSquare size={18} className="text-blue-500"/> Thread</h3><div className="flex items-center gap-2">{(currentUser?.global_role === 'owner' || currentUser?.global_role === 'admin' || viewingCommentsPost.uid === authUser?.id) && (<button onClick={handleToggleComments} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">{viewingCommentsPost.comments_disabled ? <Lock size={16} className="text-red-400"/> : <Unlock size={16}/>}</button>)}<button onClick={() => setViewingCommentsPost(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"><X size={20}/></button></div></div>
                    <div className="flex-1 overflow-y-auto p-4 pt-20 space-y-4 scrollbar-hide"><div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800/50 mb-6"><p className="text-slate-300 text-sm mb-2">{viewingCommentsPost.content}</p><div className="text-[10px] text-slate-500 flex items-center gap-1"><User size={10}/> {viewingCommentsPost.profiles?.name || viewingCommentsPost.user_name}</div></div>{comments.map(c => {
                        // Comment Role Highlighting
                        const cRole = c.profiles?.global_role;
                        let cStyle = "hover:bg-slate-800/30";
                        if (cRole === 'owner') cStyle = "bg-blue-900/10 border border-blue-500/20";
                        else if (cRole === 'developer') cStyle = "bg-green-900/10 border border-green-500/20";
                        else if (cRole === 'admin') cStyle = "bg-red-900/10 border border-red-500/20";
                        
                        return (
                            <div key={c.id} className={`flex gap-3 p-3 rounded-xl transition-all ${cStyle} ${c.is_pinned ? 'bg-yellow-500/5 border-yellow-500/20' : ''}`}>
                                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700 text-slate-400 overflow-hidden">{c.profiles?.image ? <img src={c.profiles.image} className="w-full h-full object-cover"/> : c.user_name?.[0]}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1"><RenderNameWithRole profile={c.profiles || {name: c.user_name}} /><span className="text-[10px] text-slate-500">{new Date(c.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>{c.is_pinned && <Pin size={12} className="text-yellow-500 fill-current"/>}</div>
                                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                                    <div className="flex gap-4 mt-2"><button onClick={() => handleReplyToComment(c)} className="text-[10px] text-slate-500 hover:text-blue-400 font-medium transition-colors">Reply</button>{(viewingCommentsPost.uid === authUser?.id) && <button onClick={() => handlePinComment(c)} className="text-[10px] text-slate-500 hover:text-yellow-500 font-medium transition-colors">{c.is_pinned ? 'Unpin' : 'Pin'}</button>}{/* Comment Actions */}<button onClick={() => setReportTarget({ type: 'comment', id: c.id })} className="text-[10px] text-slate-500 hover:text-white transition-colors flex items-center gap-1"><Flag size={10}/> Report</button>{(currentUser?.global_role === 'owner' || currentUser?.global_role === 'admin' || currentUser?.global_role === 'moderator' || c.user_id === authUser.id) && (<button onClick={() => handleDeleteComment(c.id)} className="text-[10px] text-red-500 hover:text-red-400 transition-colors flex items-center gap-1"><Trash2 size={10}/> Delete</button>)}</div>
                                </div>
                            </div>
                        );
                    })}</div>
                    <div className="p-4 border-t border-slate-800 bg-slate-900 rounded-b-2xl"><div className="flex gap-2 relative"><input ref={commentInputRef} value={commentText} onChange={e => setCommentText(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 pr-12 text-sm text-white focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed" placeholder={viewingCommentsPost.comments_disabled ? "Comments locked" : "Write a reply..."} disabled={viewingCommentsPost.comments_disabled}/><button onClick={handlePostComment} disabled={!commentText.trim() || viewingCommentsPost.comments_disabled} className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-0 transition-all"><ChevronRight size={16} /></button></div></div>
                </div>
            </div>
        )}

      </main>
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
