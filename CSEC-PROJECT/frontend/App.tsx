import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, AdministrativeProcess, User, Role } from './types';
import { chatService } from './services/chatService';
import { authService } from './services/authService';
import { adminService } from './services/adminService';

type Page = 'landing' | 'auth' | 'portal' | 'admin';
type AuthMode = 'login' | 'signup';
type AuthContext = 'student' | 'admin';

const App: React.FC = () => {
  // Global State
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authContext, setAuthContext] = useState<AuthContext>('student');
  const [authError, setAuthError] = useState<string | null>(null);
  const [uiNotice, setUiNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin Dashboard State
  const [adminStats, setAdminStats] = useState({
    totalInquiries: 0,
    activeSessions: 0,
    aiResolutionRate: 0,
    avgWaitTime: '0s',
    totalDocuments: 0,
    totalUsers: 0,
    activeUsers: 0
  });
  const [adminView, setAdminView] = useState<'overview' | 'knowledge' | 'users' | 'inquiries'>('overview');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [systemStatus, setSystemStatus] = useState({ database: 'checking', server: 'checking' });

  // Signup State
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    universityId: '',
    password: ''
  });

  // Login State
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Stable handlers to avoid remounting/replacing inputs which can cause focus/caret loss
  const handleSignupChange = useCallback(
    (field: keyof typeof signupForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement;
      const value = target.value;
      const caret = target.selectionStart ?? value.length;
      const id = `signup-${String(field)}`;

      setSignupForm(prev => ({ ...prev, [field]: value }));
      console.debug('signup change', field, value);

      // restore focus & caret after React updates
      requestAnimationFrame(() => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (el) {
          el.focus();
          try { el.setSelectionRange(caret, caret); } catch (err) { /* ignore */ }
        }
      });
    },
    [setSignupForm]
  );

  const handleLoginChange = useCallback(
    (field: keyof typeof loginForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement;
      const value = target.value;
      const caret = target.selectionStart ?? value.length;
      const id = `login-${String(field)}`;

      setLoginForm(prev => ({ ...prev, [field]: value }));
      console.debug('login change', field, value);

      requestAnimationFrame(() => {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (el) {
          el.focus();
          try { el.setSelectionRange(caret, caret); } catch (err) { /* ignore */ }
        }
      });
    },
    [setLoginForm]
  );

  // Student Portal State
  const [viewMode, setViewMode] = useState<'dashboard' | 'processes' | 'offices'>('dashboard');
  const [selectedProcess, setSelectedProcess] = useState<AdministrativeProcess | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am አሳሽ AI. How can I assist your academic journey today?",
      timestamp: Date.now(),
    }
  ]);
  // Conversation history (saved locally to mimic GPT UI)
  interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
  }

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const raw = localStorage.getItem('conversations');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showConversations, setShowConversations] = useState<boolean>(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<AdministrativeProcess[]>([]);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({
    title: '',
    content: '',
    category: 'procedure',
    tags: ''
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatInputRef = useRef<HTMLInputElement | null>(null);

  const handleChatChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.value;
    const caret = target.selectionStart ?? value.length;

    setInput(value);

    requestAnimationFrame(() => {
      const el = chatInputRef.current || document.getElementById('chat-input') as HTMLInputElement | null;
      if (el) {
        el.focus();
        try { el.setSelectionRange(caret, caret); } catch (err) { /* ignore */ }
      }
    });
  }, [setInput]);

  // render counter for debugging
  const renderCount = useRef(0);
  renderCount.current += 1;
  // log a lightweight snapshot to help debug interrupted typing
  console.debug('App render', renderCount.current, { authMode, signupForm: { name: signupForm.name.length ? 'len:' + signupForm.name.length : '(empty)' } });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isStaffRole = (role?: Role) => role === 'admin' || role === 'staff';
  const routeByRole = (role?: Role): Page => (isStaffRole(role) ? 'admin' : 'portal');

  useEffect(() => {
    const checkSession = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        const page = routeByRole(user.role);
        setCurrentPage(page);
        fetchDocuments();
        if (page === 'admin') {
          fetchAdminStats();
        }
      }
    };
    checkSession();
  }, []);

  const fetchDocuments = async () => {
    try {
      const result = await chatService.getDocuments();
      setDocuments(result.data.documents);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setUiNotice({ type: 'error', text: 'Unable to load documents from the server.' });
    }
  };

  const fetchAdminStats = async () => {
    try {
      const result = await adminService.getDashboardStats();
      if (result.success && result.data) {
        setAdminStats(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      setUiNotice({ type: 'error', text: 'Unable to load dashboard statistics.' });
    }
  };

  const fetchAllUsers = async () => {
    try {
      const result = await adminService.getAllUsers();
      if (result.success && result.data) {
        setAllUsers(result.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUiNotice({ type: 'error', text: 'Unable to load users list.' });
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const result = await adminService.getSystemStatus();
      if (result.success && result.data) {
        setSystemStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (uploadFile) {
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('title', adminForm.title);
        formData.append('category', adminForm.category);
        if (adminForm.tags) formData.append('tags', adminForm.tags);

        await chatService.uploadFile(formData);
      } else {
        await chatService.uploadText({
          ...adminForm,
          tags: adminForm.tags ? adminForm.tags.split(',').map(t => t.trim()) : []
        });
      }

      setAdminForm({ title: '', content: '', category: 'procedure', tags: '' });
      setUploadFile(null);
      setIsAdminModalOpen(false);
      fetchDocuments();
      setUiNotice({ type: 'success', text: 'Document uploaded successfully.' });
    } catch (error: any) {
      setUiNotice({ type: 'error', text: `Upload failed: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await chatService.deleteDocument(id);
      fetchDocuments();
      setUiNotice({ type: 'success', text: 'Document deleted successfully.' });
    } catch (error: any) {
      setUiNotice({ type: 'error', text: `Delete failed: ${error.message}` });
    }
  };

  useEffect(() => {
    if (currentPage === 'portal' || currentPage === 'admin') scrollToBottom();
  }, [messages, isLoading, currentPage]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      let result;
      if (authMode === 'login') {
        result = await authService.login({ ...loginForm });
      } else {
        // Don't allow client to set role; backend forces 'student'
        result = await authService.signup({ ...signupForm });
      }

      setCurrentUser(result.user);
      const page = routeByRole(result.user.role);
      setCurrentPage(page);
      
      // Fetch admin data if logged in as admin/staff
      if (page === 'admin') {
        fetchAdminStats();
        fetchAllUsers();
        fetchSystemStatus();
        fetchDocuments();
      }
    } catch (error: any) {
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentPage('landing');
    setUiNotice(null);
  };

  // Conversation helpers
  const persistConversations = (next: Conversation[]) => {
    try {
      localStorage.setItem('conversations', JSON.stringify(next));
    } catch (err) {
      console.error('Failed to persist conversations', err);
    }
    setConversations(next);
  };

  const newChat = () => {
    const initial: Message = { role: 'assistant', content: "Hello! I am አሳሽ AI. How can I assist your academic journey today?", timestamp: Date.now() };
    setMessages([initial]);
    setActiveConversationId(null);
  };

  const saveConversation = async () => {
    const title = window.prompt('Enter a title for this conversation', `Chat ${new Date().toLocaleString()}`) || `Chat ${new Date().toLocaleString()}`;
    // local id as fallback
    let id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const conv: Conversation = { id, title, messages, createdAt: Date.now() };

    // If user is authenticated, attempt to save on server
    try {
      if (currentUser) {
        const payload = { title, messages };
        const resp = await chatService.createSession(payload as any);
        if (resp && resp.success && resp.data && resp.data.id) {
          id = resp.data.id;
          conv.id = id;
          conv.createdAt = new Date(resp.data.createdAt || resp.data.createdAt).valueOf() || conv.createdAt;
        }
      }
    } catch (err) {
      console.warn('Server save failed, falling back to local save', err);
      setUiNotice({ type: 'error', text: 'Server save failed, saved locally' });
      setTimeout(() => setUiNotice(null), 1800);
    }

    const next = [conv, ...conversations.filter(c => c.id !== id)].slice(0, 50);
    persistConversations(next);
    setActiveConversationId(id);
  };

  const loadConversation = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (!conv) return;
    setMessages(conv.messages);
    setActiveConversationId(id);
  };

  const deleteConversation = (id: string) => {
    if (!window.confirm('Delete this conversation?')) return;
    const next = conversations.filter(c => c.id !== id);
    persistConversations(next);

    // If it's a server id (24 hex chars) and user logged in, request server delete
    try {
      if (currentUser && /^[0-9a-fA-F]{24}$/.test(id)) {
        chatService.deleteSession(id).catch((e) => console.warn('Failed to delete session on server', e));
      }
    } catch (e) { /* ignore */ }

    if (activeConversationId === id) newChat();
  };

  // Fetch server sessions when user logs in and merge into local conversations
  useEffect(() => {
    const fetchSessions = async () => {
      if (!currentUser) return;
      try {
        const resp = await chatService.listSessions();
        if (resp && resp.success && resp.data && resp.data.sessions) {
          const serverSessions = resp.data.sessions.map((s: any) => ({
            id: s._id || s.id,
            title: s.title || (`Chat ${new Date(s.createdAt).toLocaleString()}`),
            messages: (s.messages || []).map((m: any) => ({ role: m.role, content: m.content, timestamp: new Date(m.timestamp).valueOf() })),
            createdAt: new Date(s.createdAt).valueOf()
          } as Conversation));

          // Merge with local, prefer server entries for same id
          const mergedMap = new Map<string, Conversation>();
          serverSessions.forEach((s: Conversation) => mergedMap.set(s.id, s));
          conversations.forEach((c) => { if (!mergedMap.has(c.id)) mergedMap.set(c.id, c); });

          const merged = Array.from(mergedMap.values()).sort((a, b) => (b.createdAt - a.createdAt));
          persistConversations(merged.slice(0, 50));
        }
      } catch (err) {
        console.warn('Failed to fetch server sessions', err);
      }
    };
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // small feedback
      setUiNotice({ type: 'success', text: 'Copied to clipboard' });
      setTimeout(() => setUiNotice(null), 1800);
    } catch (err) {
      setUiNotice({ type: 'error', text: 'Copy failed' });
      setTimeout(() => setUiNotice(null), 1800);
    }
  };

  const handleSend = async (customQuery?: string) => {
    const query = customQuery || input;
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatService.ask(query);

      const aiResponse = result.data.answer;
      const sources = result.data.sources || [];

      let sourceInfo = "";
      if (sources.length > 0) {
        sourceInfo = "\n\n**Sources:**\n" + sources.map((s: any) => `- ${s.title}`).join('\n');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiResponse + sourceInfo,
        timestamp: Date.now(),
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message || "I'm having trouble connecting to the knowledge base. Please try again."}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- VIEW COMPONENTS ---

  const LandingPage = () => (
    <div className="home-bg min-h-screen bg-transparent font-sans text-slate-900">
      <nav className="flex items-center justify-between px-6 py-4 glass-panel sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-blue-700 p-2 rounded-lg text-white shadow-lg">
            <i className="fa-solid fa-graduation-cap text-xl"></i>
          </div>
          <span className="text-xl font-black tracking-tight text-blue-900">አሳሽ AI</span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => { setAuthMode('login'); setAuthContext('student'); setCurrentPage('auth'); }} className="text-sm font-bold text-slate-600 hover:text-blue-600 px-4 py-2 transition-colors">Login</button>
          <button onClick={() => { setAuthMode('signup'); setAuthContext('student'); setCurrentPage('auth'); }} className="text-sm font-bold bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 shadow-md transition-all">Get Started</button>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="py-20 px-6 max-w-7xl mx-auto text-center">
          <div className="hero-outer">
            <div className="floating-blob floating-blob--left" aria-hidden="true"></div>
            <div className="hero-card mx-auto p-10 md:p-16 rounded-[28px] relative overflow-hidden" style={{maxWidth: '1100px'}}>
              <h1 className="hero-title mb-4">
                Simplify University <br />
                <span className="text-primary-400">Administrative Processes</span>
              </h1>
              <p className="hero-subtitle mb-8">
                The intelligent co-pilot for ASTU students. Get step-by-step guidance on clearance, ID replacement, and more—driven by Gemini AI.
              </p>

              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button onClick={() => { setAuthMode('signup'); setAuthContext('student'); setCurrentPage('auth'); }} className="cta-gradient">
                  Launch Student Portal
                </button>
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setAuthContext('admin');
                    setCurrentPage('auth');
                  }}
                  className="btn-secondary"
                >
                  <i className="fa-solid fa-play text-sm mr-2"></i> Watch Demo
                </button>
              </div>

            </div>
            <div className="decorative-shape" aria-hidden="true"></div>
          </div>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 grayscale opacity-60">
            <div className="flex items-center justify-center gap-2 font-bold text-lg text-slate-700"><i className="fa-solid fa-university"></i> ASTU</div>
            <div className="flex items-center justify-center gap-2 font-bold text-lg text-slate-700"><i className="fa-solid fa-check-double"></i> REGISTRAR</div>
            <div className="flex items-center justify-center gap-2 font-bold text-lg text-slate-700"><i className="fa-solid fa-shield"></i> SECURITY</div>
            <div className="flex items-center justify-center gap-2 font-bold text-lg text-slate-700"><i className="fa-solid fa-flask"></i> RESEARCH</div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-slate-800 mb-4">Why use አሳሽ AI?</h2>
              <div className="w-20 h-1 bg-blue-600 mx-auto rounded-full"></div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass-panel p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-white/40">
                <div className="w-14 h-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-lg">
                  <i className="fa-solid fa-bolt"></i>
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800">Instant RAG Retrieval</h3>
                <p className="text-slate-600 leading-relaxed font-medium">Our AI indexes every official university document to provide instant, verified answers.</p>
              </div>
              <div className="glass-panel p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-white/40">
                <div className="w-14 h-14 bg-purple-500 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-lg">
                  <i className="fa-solid fa-location-crosshairs"></i>
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800">Office Maps</h3>
                <p className="text-slate-600 leading-relaxed font-medium">Never get lost on campus again. Know exactly where each office is located.</p>
              </div>
              <div className="glass-panel p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-white/40">
                <div className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-lg">
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800">24/7 Availability</h3>
                <p className="text-slate-600 leading-relaxed font-medium">The administrative office is closed, but አሳሽ AI is always open to help you prepare.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );

  const AuthPage = () => {
    return (
      <div className="auth-bg min-h-screen flex items-center justify-center p-6">
        <div className="glass-panel w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="p-8 pb-0 flex flex-col items-center">
            <div onClick={() => setCurrentPage('landing')} className="cursor-pointer bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl mb-6 hover:scale-105 transition-transform">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <h2 className="text-3xl font-black text-slate-800">
              {authContext === 'admin' ? 'Admin Dashboard Access' : (authMode === 'login' ? 'Welcome Back' : 'Join አሳሽ AI')}
            </h2>
            <p className="text-slate-500 text-sm font-medium text-center mt-2">
              {authContext === 'admin' ? 'Enter your admin credentials to access the dashboard' : 'Enter your ASTU credentials to continue'}
            </p>
          </div>

          <form className="p-8 space-y-4" onSubmit={handleAuth}>

            {authError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold animate-pulse">
                <i className="fa-solid fa-circle-exclamation mr-2"></i>
                {authError}
              </div>
            )}

            <div className="space-y-4">
              {authMode === 'signup' && authContext === 'student' && (
                <>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Full Name</label>
                    <input
                      id="signup-name"
                      type="text"
                      required
                      value={signupForm.name}
                      onChange={handleSignupChange('name')}
                      onKeyDown={(e) => console.debug('keydown signup-name', e.key)}
                      onFocus={() => console.debug('focus signup-name')}
                      onBlur={() => console.debug('blur signup-name')}
                      placeholder="John Doe"
                      className="w-full bg-white/50 border border-white/50 rounded-2xl py-4 px-5 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">University ID</label>
                    <input
                      id="signup-universityId"
                      type="text"
                      required
                      value={signupForm.universityId}
                      onChange={handleSignupChange('universityId')}
                      placeholder="ugr/12345/16"
                      onFocus={() => console.debug('focus signup-universityId')}
                      onBlur={() => console.debug('blur signup-universityId')}
                      onKeyDown={(e) => console.debug('keydown signup-universityId', e.key)}
                      className="w-full bg-white/50 border border-white/50 rounded-2xl py-4 px-5 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-sm font-medium"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Email Address</label>
                {authMode === 'login' ? (
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={handleLoginChange('email')}
                    placeholder="user@astu.edu.et"
                    onFocus={() => console.debug('focus login-email')}
                    onBlur={() => console.debug('blur login-email')}
                    className="w-full bg-white/50 border border-white/50 rounded-2xl py-4 px-5 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-sm font-medium"
                  />
                ) : (
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={signupForm.email}
                    onChange={handleSignupChange('email')}
                    placeholder="user@astu.edu.et"
                    onFocus={() => console.debug('focus signup-email')}
                    onBlur={() => console.debug('blur signup-email')}
                    onKeyDown={(e) => console.debug('keydown signup-email', e.key)}
                    className="w-full bg-white/50 border border-white/50 rounded-2xl py-4 px-5 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-sm font-medium"
                  />
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Password</label>
                {authMode === 'login' ? (
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={handleLoginChange('password')}
                    placeholder="••••••••"
                    onFocus={() => console.debug('focus login-password')}
                    onBlur={() => console.debug('blur login-password')}
                    className="w-full bg-white/50 border border-white/50 rounded-2xl py-4 px-5 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-sm font-medium"
                  />
                ) : (
                  <input
                    id="signup-password"
                    type="password"
                    required
                    value={signupForm.password}
                    onChange={handleSignupChange('password')}
                    placeholder="••••••••"
                    onFocus={() => console.debug('focus signup-password')}
                    onBlur={() => console.debug('blur signup-password')}
                    onKeyDown={(e) => console.debug('keydown signup-password', e.key)}
                    className="w-full bg-white/50 border border-white/50 rounded-2xl py-4 px-5 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-sm font-medium"
                  />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-blue-400/20 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <i className="fa-solid fa-circle-notch animate-spin text-xl"></i>
              ) : (
                <>{authMode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</>
              )}
            </button>
          </form>

          {authContext === 'student' && (
            <div className="px-8 pb-8 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const AdminDashboard = () => (
    <div className="flex h-screen overflow-hidden bg-transparent">
      {/* Sidebar */}
      <aside className="w-64 glass-panel m-4 rounded-[32px] shadow-xl flex flex-col border border-white/40">
        <div className="p-6 border-b border-white/40">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2.5 rounded-xl text-white shadow-lg">
              <i className="fa-solid fa-user-shield"></i>
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Admin Panel</h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase">Registrar Office</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: 'fa-chart-line' },
            { id: 'knowledge', label: 'Knowledge Base', icon: 'fa-database' },
            { id: 'users', label: 'Student Users', icon: 'fa-users' },
            { id: 'inquiries', label: 'Inquiries', icon: 'fa-comments' }
          ].map(nav => (
            <button
              key={nav.id}
              onClick={() => setAdminView(nav.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wide transition-all ${
                adminView === nav.id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-600 hover:bg-white/50'
              }`}
            >
              <i className={`fa-solid ${nav.icon} w-4`}></i>
              {nav.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/40">
          <button
            onClick={() => {
              fetchAdminStats();
              fetchAllUsers();
              fetchSystemStatus();
              fetchDocuments();
              setUiNotice({ type: 'success', text: 'Data refreshed successfully' });
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <i className="fa-solid fa-rotate"></i>
            Refresh Data
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="glass-panel px-8 py-4 m-4 mb-0 rounded-[32px] flex items-center justify-between shadow-sm border border-white/40">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-800">
              {adminView === 'overview' && 'Dashboard Overview'}
              {adminView === 'knowledge' && 'Knowledge Base Management'}
              {adminView === 'users' && 'User Management'}
              {adminView === 'inquiries' && 'Student Inquiries'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-black text-slate-900 uppercase">{currentUser?.name}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase">{currentUser?.role}</p>
            </div>
            <button onClick={handleLogout} className="w-11 h-11 rounded-2xl glass-panel flex items-center justify-center hover:bg-white transition-all shadow-sm">
              <i className="fa-solid fa-right-from-bracket text-red-500"></i>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {adminView === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Inquiries', val: adminStats.totalInquiries.toString(), icon: 'fa-comments', color: 'blue' },
                  { label: 'Active Sessions', val: adminStats.activeSessions.toString(), icon: 'fa-users-viewfinder', color: 'green' },
                  { label: 'AI Resolution Rate', val: `${adminStats.aiResolutionRate.toFixed(1)}%`, icon: 'fa-brain', color: 'purple' },
                  { label: 'Avg Wait Time', val: adminStats.avgWaitTime, icon: 'fa-clock', color: 'orange' }
                ].map((stat, i) => (
                  <div key={i} className="glass-panel p-6 rounded-[32px] shadow-sm hover:shadow-md transition-all">
                    <div className={`w-11 h-11 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm text-blue-600`}>
                      <i className={`fa-solid ${stat.icon}`}></i>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">{stat.val}</p>
                  </div>
                ))}
              </div>
            )}

            {(adminView === 'overview' || adminView === 'knowledge') && (
              <section className="glass-panel rounded-[40px] shadow-lg overflow-hidden border border-white/60">
                <div className="p-8 border-b border-white/40 flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs">
                      <i className="fa-solid fa-database"></i>
                    </div>
                    Administrative Documentation
                  </h3>
                  <button
                    onClick={() => setIsAdminModalOpen(true)}
                    className="text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100"
                  >
                    + Add New Process
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/40 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-8 py-5">Process Name</th>
                        <th className="px-8 py-5">Primary Office</th>
                        <th className="px-8 py-5">Requirements</th>
                        <th className="px-8 py-5">Last Updated</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-white/40">
                      {documents.map(proc => (
                        <tr key={proc.id} className="hover:bg-white/40 transition-colors">
                          <td className="px-8 py-5 font-bold text-slate-800">{proc.title}</td>
                          <td className="px-8 py-5 text-slate-600 font-medium">{(proc as any).category || 'General'}</td>
                          <td className="px-8 py-5 text-slate-500">
                            <span className="bg-slate-100/50 px-2 py-1 rounded-lg text-xs font-bold text-slate-600 border border-slate-200">
                              {(proc as any).isChunk ? 'Chunk' : 'Document'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-slate-500 font-medium">{proc.createdAt ? new Date(proc.createdAt).toLocaleDateString() : 'N/A'}</td>
                          <td className="px-8 py-5 text-right">
                            <button
                              onClick={() => handleDeleteDocument(proc.id)}
                              className="text-red-500 font-black hover:text-red-700 text-[10px] uppercase tracking-widest"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {adminView === 'users' && (
              <section className="glass-panel rounded-[40px] shadow-lg overflow-hidden border border-white/60">
                <div className="p-8 border-b border-white/40">
                  <h3 className="text-lg font-black text-slate-800">Student User Directory</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/40 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-8 py-5">Student Name</th>
                        <th className="px-8 py-5">Email</th>
                        <th className="px-8 py-5">University ID</th>
                        <th className="px-8 py-5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-white/40">
                      {allUsers.map(user => (
                        <tr key={user.id} className="hover:bg-white/40 transition-colors">
                          <td className="px-8 py-5 font-bold text-slate-800">{user.name}</td>
                          <td className="px-8 py-5 text-slate-600">{user.email}</td>
                          <td className="px-8 py-5 text-slate-500">{user.universityId || 'N/A'}</td>
                          <td className="px-8 py-5">
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">Active</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );

  const StudentPortal = () => (
    <div className="flex flex-col h-screen max-h-screen bg-transparent text-slate-800 overflow-hidden">
      {/* Top Header */}
      <header className="glass-panel px-6 py-4 flex items-center justify-between z-10 shadow-sm border-b-white/40">
        <div className="flex items-center gap-4">
          <div onClick={() => setCurrentPage('landing')} className="cursor-pointer bg-blue-800 p-2.5 rounded-xl text-white shadow-lg hover:scale-105 transition-all">
            <i className="fa-solid fa-graduation-cap text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-none">አሳሽ AI Portal</h1>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1.5">ASTU Student Support</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: 'fa-house' },
            { id: 'processes', label: 'Processes', icon: 'fa-list-check' },
            { id: 'offices', label: 'Offices', icon: 'fa-building' }
          ].map(nav => (
            <button
              key={nav.id}
              onClick={() => setViewMode(nav.id as any)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === nav.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                }`}
            >
              <i className={`fa-solid ${nav.icon}`}></i>
              {nav.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-900 uppercase">{currentUser?.name}</p>
            <p className="text-[10px] text-slate-500 font-bold tracking-widest">ID: 102934</p>
          </div>
          <button onClick={handleLogout} className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center hover:bg-white transition-all text-red-500">
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
          <div className="w-10 h-10 rounded-2xl border-2 border-white shadow-md overflow-hidden bg-white">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-blue-700 text-xs font-black uppercase">
                {(currentUser?.name || 'U').slice(0, 1)}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Workspace Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            {viewMode === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <section>
                  <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome Back! 👋</h2>
                  <p className="text-slate-600 text-sm font-medium">What administrative hurdle can we clear today?</p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setViewMode('processes')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewMode('processes'); } }}
                    className="col-span-1 md:col-span-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group border border-white/20 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-300"
                  >
                    <div className="relative z-10">
                      <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block">Recommended</div>
                      <h3 className="text-3xl font-black mb-3">Campus Procedures</h3>
                      <p className="text-blue-100 text-sm mb-8 max-w-xs font-medium leading-relaxed">Search and discover all official university processes and policies in our AI-powered knowledge base.</p>
                      <button
                        onClick={() => setViewMode('processes')}
                        className="bg-white text-blue-700 px-8 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0"
                      >
                        Explore Directory
                      </button>
                    </div>
                    <i className="fa-solid fa-certificate absolute -right-8 -bottom-8 text-[200px] text-white/10 group-hover:rotate-12 group-hover:scale-110 transition-all duration-700"></i>
                  </div>

                  {documents.slice(0, 3).map(p => (
                    <div key={p.id} className="glass-panel rounded-[32px] p-8 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-white/60">
                      <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                        <i className={`fa-solid text-xl ${(p as any).category === 'safety' ? 'fa-shield-heart' : (p as any).category === 'policy' ? 'fa-scale-balanced' : 'fa-file-signature'}`}></i>
                      </div>
                      <h3 className="font-black text-slate-900 mb-2 text-lg">{p.title}</h3>
                      <p className="text-xs text-slate-500 mb-6 line-clamp-2 font-medium leading-relaxed">{(p as any).category || 'General Procedure'}</p>
                      <button
                        onClick={() => setSelectedProcess(p)}
                        className="text-blue-600 text-xs font-black uppercase tracking-widest hover:text-blue-800 flex items-center gap-2 group"
                      >
                        Learn More <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-all"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'processes' && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">Process Directory</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Full library of official university procedures</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {documents.filter(d => !(d as any).isChunk).map(proc => (
                    <button
                      key={proc.id}
                      onClick={() => setSelectedProcess(proc)}
                      className="flex items-center justify-between p-6 glass-panel rounded-[32px] hover:border-blue-400 transition-all text-left group border border-white/40"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          <i className="fa-solid fa-file-text text-xl"></i>
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800">{proc.title}</h4>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-tight mt-1">{(proc as any).category || 'General'}</p>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-300 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all shadow-sm">
                        <i className="fa-solid fa-chevron-right text-xs transform group-hover:translate-x-1 transition-all"></i>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'offices' && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">Campus Offices</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Location and operating hours for ASTU departments</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { name: 'Registrar Office', loc: 'Administration Building, G+1', hours: '8:30 AM - 5:30 PM', icon: 'fa-user-graduate', color: 'blue' },
                    { name: 'Dorm Administration', loc: 'Main Campus, Student Services', hours: '24/7 (Emergency)', icon: 'fa-bed', color: 'indigo' },
                    { name: 'University Security', loc: 'Gate 1 & Gate 2', hours: '24/7', icon: 'fa-shield-halved', color: 'slate' },
                    { name: 'Finance Office', loc: 'Finance Block, Room 102', hours: '9:00 AM - 4:00 PM', icon: 'fa-vault', color: 'emerald' },
                  ].map((office, idx) => (
                    <div key={idx} className="glass-panel p-8 rounded-[40px] shadow-sm border border-white/60 hover:shadow-lg transition-all">
                      <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                        <i className={`fa-solid ${office.icon} text-xl`}></i>
                      </div>
                      <h4 className="text-xl font-black text-slate-900 mb-4">{office.name}</h4>
                      <div className="space-y-3 text-sm font-medium text-slate-600">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-[10px]">
                            <i className="fa-solid fa-location-dot"></i>
                          </div>
                          <div>{office.loc}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 text-[10px]">
                            <i className="fa-solid fa-clock"></i>
                          </div>
                          <div>{office.hours}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* AI Assistant Sidebar */}
        <aside className="hidden lg:flex flex-col w-[400px] glass-panel m-4 rounded-[40px] shrink-0 shadow-2xl z-20 overflow-hidden border border-white/40">
          <div className="p-6 border-b border-white/40 bg-white/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-lg shadow-lg shadow-blue-200">
                <i className="fa-solid fa-robot"></i>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">አሳሽ AI</h3>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">አሳሽ AI</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Verified Knowledge</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => newChat()}
              className="text-slate-400 hover:text-blue-600 w-10 h-10 rounded-xl glass-panel flex items-center justify-center transition-all"
            >
              <i className="fa-solid fa-rotate-right text-sm"></i>
            </button>
          </div>

          <div className="p-4 border-b border-white/30 flex items-center gap-3">
            <button onClick={() => newChat()} title="New chat" className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/80 hover:bg-white text-slate-800">
              <i className="fa-solid fa-plus"></i>
            </button>
            <button onClick={() => saveConversation()} title="Save chat" className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-600 hover:brightness-105 text-white">
              <i className="fa-solid fa-floppy-disk"></i>
            </button>
            <button onClick={() => setShowConversations(v => !v)} title="Toggle history" className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/40 text-slate-800 ml-2">
              <i className={`fa-solid ${showConversations ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
            </button>
            <div className="ml-auto flex items-center gap-2">
              <i className="fa-regular fa-folder text-slate-400"></i>
              <div className="text-xs text-slate-500">{conversations.length}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-hide">
            {showConversations && conversations.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-slate-500 mb-2 font-bold">Conversations</div>
                <div className="space-y-2">
                  {conversations.map(c => (
                    <div key={c.id} className="flex items-center justify-between bg-white/40 p-3 rounded-lg">
                      <button onClick={() => loadConversation(c.id)} className="text-sm text-slate-800 text-left truncate max-w-[65%]">
                        <div className="font-bold text-sm truncate">{c.title}</div>
                        <div className="text-xs text-slate-500 truncate">{(c.messages && c.messages.length>0) ? c.messages[c.messages.length-1].content.slice(0,80) : ''}</div>
                      </button>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-400 mr-2">{new Date(c.createdAt).toLocaleString()}</div>
                        <button onClick={() => { navigator.clipboard.writeText(c.messages.map(m=>`${m.role}: ${m.content}`).join('\n\n')); setUiNotice({ type: 'success', text: 'Conversation copied' }); setTimeout(() => setUiNotice(null), 1500); }} title="Copy conversation" className="text-slate-400 hover:text-blue-600 p-2 rounded"><i className="fa-regular fa-copy"></i></button>
                        <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(c.messages)); setUiNotice({ type: 'success', text: 'Exported to clipboard' }); setTimeout(() => setUiNotice(null), 1500); }} title="Export JSON" className="text-slate-400 hover:text-blue-600 p-2 rounded"><i className="fa-solid fa-download"></i></button>
                        <button onClick={() => deleteConversation(c.id)} title="Delete" className="text-red-400 hover:text-red-600 p-2 rounded"><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-[28px] p-5 text-sm shadow-sm font-medium leading-relaxed ${msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-100'
                  : 'bg-white text-slate-800 rounded-tl-none border border-white/60'
                  }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button onClick={() => copyToClipboard(msg.content)} title="Copy message" className="text-slate-400 hover:text-slate-700 p-1 rounded">
                      <i className="fa-regular fa-copy"></i>
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(msg.content); setUiNotice({ type: 'success', text: 'Copied' }); setTimeout(() => setUiNotice(null), 1200); }} title="Export message" className="text-slate-400 hover:text-slate-700 p-1 rounded">
                      <i className="fa-solid fa-download"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-white/60 rounded-[24px] p-4 shadow-sm flex items-center gap-2">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 bg-white/40 border-t border-white/40">
            <div className="relative flex items-center">
              <input
                id="chat-input"
                ref={chatInputRef}
                type="text"
                value={input}
                onChange={handleChatChange}
                onKeyDown={(e) => { console.debug('keydown chat-input', e.key); if (e.key === 'Enter') handleSend(); }}
                placeholder="Ask about university processes..."
                className="w-full bg-white border border-white/40 rounded-[28px] py-4.5 px-6 pr-14 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-sm font-medium shadow-sm"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={`absolute right-2 w-11 h-11 rounded-[22px] transition-all flex items-center justify-center ${input.trim() && !isLoading ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 active:scale-95' : 'bg-slate-100 text-slate-300'
                  }`}
              >
                <i className="fa-solid fa-arrow-up text-sm"></i>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Process Modal */}
      {selectedProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-[24px] flex items-center justify-center text-2xl shadow-sm">
                  <i className="fa-solid fa-file-invoice"></i>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedProcess.title}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedProcess.office}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProcess(null)} className="text-slate-400 hover:text-red-500 w-10 h-10 rounded-full hover:bg-slate-50 transition-all flex items-center justify-center"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[70vh] space-y-8">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-4">Official Information</h4>
                <div className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                  {(selectedProcess as any).content}
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedProcess(null)} className="px-10 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 transition-all active:scale-95">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Main Router
  const renderPage = () => {
    switch (currentPage) {
      case 'landing': return <LandingPage />;
      case 'auth': return <AuthPage />;
      case 'portal': return <StudentPortal />;
      case 'admin': return <AdminDashboard />;
      default: return <LandingPage />;
    }
  };

  return (
    <>
      {uiNotice && (
        <div className={`fixed top-4 right-4 z-[100] max-w-sm px-4 py-3 rounded-2xl shadow-xl text-sm font-bold ${uiNotice.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <div className="flex items-center justify-between gap-4">
            <span>{uiNotice.text}</span>
            <button
              onClick={() => setUiNotice(null)}
              className="text-inherit opacity-70 hover:opacity-100"
              aria-label="Close notification"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      )}
      {renderPage()}

      {/* Admin Add Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-800">Add Knowledge Base Item</h3>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleAdminSubmit} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Process Title</label>
                  <input
                    type="text"
                    required={!uploadFile}
                    value={adminForm.title}
                    onChange={(e) => setAdminForm({ ...adminForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-medium"
                    placeholder="e.g., Graduation Clearance"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                  <select
                    value={adminForm.category}
                    onChange={(e) => setAdminForm({ ...adminForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-medium"
                  >
                    <option value="procedure">Procedure</option>
                    <option value="policy">Policy</option>
                    <option value="safety">Safety</option>
                    <option value="resource">Resource</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tags (CSV)</label>
                  <input
                    type="text"
                    value={adminForm.tags}
                    onChange={(e) => setAdminForm({ ...adminForm, tags: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-medium"
                    placeholder="tag1, tag2"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Content Method</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setUploadFile(null)}
                    className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all ${!uploadFile ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}
                  >
                    Text Input
                  </button>
                  <button
                    type="button"
                    onClick={() => { }} // Handled by input below
                    className={`flex-1 relative py-3 rounded-2xl text-xs font-bold transition-all ${uploadFile ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}
                  >
                    Upload File
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </button>
                </div>
              </div>

              {!uploadFile ? (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Process Content</label>
                  <textarea
                    required
                    rows={6}
                    value={adminForm.content}
                    onChange={(e) => setAdminForm({ ...adminForm, content: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-medium resize-none"
                    placeholder="Enter process steps and details..."
                  ></textarea>
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-blue-200 rounded-3xl bg-blue-50 flex flex-col items-center justify-center text-blue-600 gap-2">
                  <i className="fa-solid fa-file-pdf text-3xl"></i>
                  <p className="font-bold text-sm tracking-tight">{uploadFile.name}</p>
                  <p className="text-[10px] font-black uppercase text-blue-400">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : 'SUBMIT TO KNOWLEDGE BASE'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
