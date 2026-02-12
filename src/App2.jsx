import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, Users, Inbox, MessageSquare, AlertTriangle, CheckCircle, 
  XCircle, Search, LogOut, Loader2, Lock, Shield, ChevronRight, Send, 
  Clock, Flag, UserX, Trash2, Crown, BadgeCheck, Activity
} from 'lucide-react';

// --- CONFIGURATION WITH CRASH PROTECTION ---
let SUPABASE_URL = "https://wcavpryumlohjccxiohq.supabase.co";
let SUPABASE_KEY = "sb_publishable_EoFH2MIrf4Xc1cJJaiAlHg_ct72t-ru";

try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
        SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || SUPABASE_KEY;
    }
} catch (e) {
    console.warn("Environment variables not accessible, using fallback defaults.");
}

// --- SUB-COMPONENTS ---
const NavItem = ({ icon, label, active, onClick, badge }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-zinc-800 hover:text-slate-200'}`}>
        {icon} 
        <span className="text-sm font-semibold flex-1 text-left">{label}</span>
        {badge > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>}
    </button>
);

const RoleBadge = ({ role }) => {
    if (!role) return <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700">Civilian</span>;
    if (role === 'owner') return <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30 flex items-center gap-1 w-fit"><Crown size={12}/> Owner</span>;
    if (role === 'admin') return <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded border border-orange-500/30 flex items-center gap-1 w-fit"><Shield size={12}/> Admin</span>;
    if (role === 'moderator') return <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded border border-cyan-500/30 flex items-center gap-1 w-fit"><ShieldAlert size={12}/> Mod</span>;
    return <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700 uppercase">{role}</span>;
};

// --- MAIN APP ---
function App() {
  const [supabase, setSupabase] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Adjusted State for Better Debugging
  const [authLoading, setAuthLoading] = useState(true);
  const [systemError, setSystemError] = useState(null);
  const [authError, setAuthError] = useState(null);
  
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Data States
  const [reports, setReports] = useState([]);
  const [applications, setApplications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  
  // Staff Management (Owner)
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [staffResults, setStaffResults] = useState([]);

  const messagesEndRef = useRef(null);

  // 1. SUPABASE INIT WITH ERROR HANDLING
  useEffect(() => {
    if (supabase) return;
    
    const initClient = () => {
      try {
          if (window.supabase && !window._supabaseInstance) {
            window._supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
          }
          if (window.supabase) {
              setSupabase(window._supabaseInstance);
          } else {
              throw new Error("Supabase library failed to initialize.");
          }
      } catch (err) {
          setSystemError("Database connection failed. Check console for details.");
          setAuthLoading(false);
          console.error("Supabase Init Error:", err);
      }
    };

    if (window.supabase) { 
        initClient(); 
        return; 
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/@supabase/supabase-js@2";
    script.async = true;
    script.onload = initClient;
    script.onerror = () => {
        setSystemError("Network error: Could not load database scripts. You might have an adblocker blocking unpkg.com.");
        setAuthLoading(false);
    };
    document.body.appendChild(script);
  }, [supabase]);

  // 2. AUTHENTICATION CHECK WITH PROMISE CATCHING
  useEffect(() => {
    if (!supabase) return;
    
    const checkSession = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            
            setAuthUser(session?.user ?? null);
            if (!session?.user) {
                setAuthLoading(false);
            }
        } catch (err) {
            console.error("Session Error:", err);
            setSystemError("Failed to check authentication status.");
            setAuthLoading(false);
        }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (!session?.user) { 
          setCurrentUser(null); 
          setAuthLoading(false); 
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // 3. PROFILE FETCH WITH FAILSAFE
  useEffect(() => {
    if (!authUser || !supabase) return;
    
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
        if (error) throw error;
        setCurrentUser(data);
      } catch (err) { 
        console.error("Error fetching profile", err);
        // Even if fetching profile fails, we stop the loading spinner
      } finally {
        setAuthLoading(false);
      }
    };
    fetchProfile();
  }, [authUser, supabase]);

  // 4. DATA FETCHING
  useEffect(() => {
    if (!supabase || !currentUser || !['owner', 'admin', 'moderator'].includes(currentUser.global_role)) return;

    const loadData = async () => {
        try {
            const { data: reps } = await supabase.from('reports').select(`*, profiles:reporter_id (name, username)`).eq('status', 'pending').order('created_at', { ascending: false });
            if (reps) setReports(reps);

            let appQuery = supabase.from('applications').select(`*, profiles:user_id (name, username, badges, global_role)`).eq('status', 'pending').order('created_at', { ascending: false });
            if (currentUser.global_role !== 'owner') {
                appQuery = appQuery.eq('type', 'verification');
            }
            const { data: apps } = await appQuery;
            if (apps) setApplications(apps);

            const { data: tix } = await supabase.from('support_tickets').select('*').eq('status', 'open').order('created_at', { ascending: false });
            if (tix) setTickets(tix);
        } catch (err) {
            console.error("Error loading dashboard data:", err);
        }
    };

    loadData();

    const sub = supabase.channel('moderation_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, loadData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, loadData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, loadData)
        .subscribe();

    return () => supabase.removeChannel(sub);
  }, [supabase, currentUser]);

  useEffect(() => {
      if (!activeTicket || !supabase) return;
      const loadMessages = async () => {
          const { data } = await supabase.from('support_messages').select(`*, profiles:sender_id (name, global_role)`).eq('ticket_id', activeTicket.id).order('created_at', { ascending: true });
          if (data) {
              setMessages(data);
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
      };
      loadMessages();

      const msgSub = supabase.channel(`messages:${activeTicket.id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${activeTicket.id}` }, async (payload) => {
              const { data: sender } = await supabase.from('profiles').select('name, global_role').eq('id', payload.new.sender_id).single();
              setMessages(prev => [...prev, { ...payload.new, profiles: sender }]);
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }).subscribe();

      return () => supabase.removeChannel(msgSub);
  }, [activeTicket, supabase]);

  // HANDLERS
  const handleLogin = async (e) => {
      e.preventDefault();
      setAuthError(null);
      const fd = new FormData(e.target);
      try {
          const { error } = await supabase.auth.signInWithPassword({ email: fd.get('email'), password: fd.get('password') });
          if (error) throw error;
      } catch (err) { setAuthError(err.message); }
  };

  const handleLogout = async () => {
      if (supabase) await supabase.auth.signOut();
  };

  // RENDERING LOGIC

  // System Error Screen (Caught a crash)
  if (systemError) {
      return (
          <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
              <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Initialization Error</h1>
              <p className="text-zinc-400 mb-6 text-center max-w-md">{systemError}</p>
              <button onClick={() => window.location.reload()} className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg transition-colors">Reload Application</button>
          </div>
      );
  }

  // Loading Screen
  if (authLoading || !supabase) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm tracking-widest uppercase">Connecting to Command...</p>
        </div>
      );
  }

  // Auth Screen
  if (!authUser) {
      return (
          <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                  <div className="flex flex-col items-center mb-8">
                      <div className="bg-red-500/10 p-4 rounded-full mb-4 ring-1 ring-red-500/30"><ShieldAlert className="w-10 h-10 text-red-500" /></div>
                      <h1 className="text-2xl font-black text-white tracking-tight">Liberty Command</h1>
                      <p className="text-zinc-400 text-sm mt-1 uppercase tracking-widest font-semibold">Authorized Personnel Only</p>
                  </div>
                  {authError && <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg text-red-400 text-sm mb-4 text-center">{authError}</div>}
                  <form onSubmit={handleLogin} className="space-y-4">
                      <div><input name="email" type="email" required placeholder="Staff Email" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors" /></div>
                      <div><input name="password" type="password" required placeholder="Password" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors" /></div>
                      <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors flex justify-center items-center gap-2">Access Terminal <ChevronRight size={18}/></button>
                  </form>
              </div>
          </div>
      );
  }

  // RBAC Guard
  const isStaff = currentUser && ['owner', 'admin', 'moderator'].includes(currentUser.global_role);
  const isOwner = currentUser?.global_role === 'owner';

  if (!isStaff) {
      return (
          <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
              <Lock className="w-16 h-16 text-red-500 mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
              <p className="text-zinc-400 mb-6 text-center max-w-md">Your account does not have the necessary clearance to access the Moderation Terminal.</p>
              <button onClick={handleLogout} className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg transition-colors">Return to Login</button>
          </div>
      );
  }

  // Render Dashboard
  return (
      <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
          
          {/* SIDEBAR */}
          <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
              <div className="p-6 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                      <ShieldAlert className="w-8 h-8 text-blue-500" />
                      <div>
                          <h1 className="font-black text-lg tracking-tight">COMMAND</h1>
                          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold -mt-1">Terminal</p>
                      </div>
                  </div>
              </div>
              
              <div className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
                  <NavItem icon={<Activity size={18} />} label="Dashboard" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
                  <NavItem icon={<Flag size={18} />} label="Reports" active={currentView === 'reports'} onClick={() => setCurrentView('reports')} badge={reports.length} />
                  <NavItem icon={<Inbox size={18} />} label="Applications" active={currentView === 'applications'} onClick={() => setCurrentView('applications')} badge={applications.length} />
                  <NavItem icon={<MessageSquare size={18} />} label="Active Calls" active={currentView === 'support'} onClick={() => setCurrentView('support')} badge={tickets.length} />
                  
                  {isOwner && (
                      <div className="mt-6">
                          <p className="text-[10px] font-bold uppercase text-zinc-500 px-4 mb-2">Owner Controls</p>
                          <NavItem icon={<Users size={18} />} label="Manage Staff" active={currentView === 'staff'} onClick={() => setCurrentView('staff')} />
                      </div>
                  )}
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                  <div className="flex items-center justify-between">
                      <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                          <RoleBadge role={currentUser.global_role} />
                      </div>
                      <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" title="Logout"><LogOut size={18}/></button>
                  </div>
              </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
              <div className="h-16 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-8 z-10 shrink-0">
                  <h2 className="text-lg font-bold capitalize">System Overview</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-8 relative">
                  {currentView === 'dashboard' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4">
                              <div className="bg-red-500/10 p-4 rounded-xl text-red-500"><Flag size={24}/></div>
                              <div><p className="text-zinc-400 text-sm font-semibold uppercase tracking-wider">Open Reports</p><p className="text-3xl font-black text-white">{reports.length}</p></div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
}

export default App;
