import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Settings, Code2, HelpCircle, Shield, Cpu, Users, 
  FileText, Plus, Trash2, CheckCircle2, AlertTriangle, Play, RefreshCw, Key, ShieldAlert,
  Calendar, Upload, Sparkles, Trophy, BarChart2, ChevronLeft, ChevronRight, Menu,
  Layers, Shuffle, Lock, Unlock, Eye, Activity, Award, UserCheck, UserX, Database,
  Sliders, Search, ArrowRight, ExternalLink, Image as ImageIcon
} from 'lucide-react';
import { adminService, authService } from '../services/api';
import EventsManagementTab from '../components/admin/EventsManagementTab';
import QuestionImportTab from '../components/admin/QuestionImportTab';
import CompetitionDevelopmentTab from '../components/admin/CompetitionDevelopmentTab';
import EventWizardModal from '../components/admin/EventWizardModal';

export default function AdminStudio({ user, defaultView = null }) {
  const { view } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Resolve initial tab based on route URL or defaultView
  const getInitialTab = () => {
    if (defaultView) return defaultView;
    if (view) return view.toLowerCase();
    const path = location.pathname.toLowerCase();
    if (path.includes('competition-development')) return 'competition_dev';
    if (path.includes('/events/new')) return 'events_new';
    if (path.includes('/events')) return 'events';
    if (path.includes('/questions')) return 'questions';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [preselectedTemplate, setPreselectedTemplate] = useState(null);

  // Global counts for metrics
  const [metrics, setMetrics] = useState({
    eventsCount: 0,
    activeEventsCount: 0,
    dsaCount: 0,
    mcqCount: 0,
    ctfCount: 0,
    usersCount: 0,
    submissionsCount: 0,
    teamsCount: 0
  });

  // Tab-specific datasets
  const [dsaList, setDsaList] = useState([]);
  const [mcqList, setMcqList] = useState([]);
  const [ctfList, setCtfList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [teamList, setTeamList] = useState([]);
  const [submissionList, setSubmissionList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [platformSettings, setPlatformSettings] = useState({});
  const [siteContent, setSiteContent] = useState({});
  const [questionSubTab, setQuestionSubTab] = useState('dsa'); // 'dsa' | 'ctf' | 'mcq'
  const [loading, setLoading] = useState(false);

  // Forms
  const [dsaForm, setDsaForm] = useState({
    title: '', statement: '', input_spec: '', output_spec: '', constraints: '',
    difficulty: 'Beginner', category: 'Data Structures & Algorithms', points: 100,
    time_limit_ms: 2000, memory_limit_mb: 256, starter_py: '', starter_cpp: '', starter_c: '',
    reference_solution: '', allow_copy_paste: false
  });

  const [selectedDsaId, setSelectedDsaId] = useState(null);
  const [selectedDsaDetail, setSelectedDsaDetail] = useState(null);
  const [tcInput, setTcInput] = useState('');
  const [tcOutput, setTcOutput] = useState('');
  const [tcType, setTcType] = useState('public_sample');

  const [mcqForm, setMcqForm] = useState({
    title: '', prompt: '', question_type: 'single_choice', difficulty: 'Beginner',
    category: 'Cybersecurity', points_positive: 10, points_negative: 0, time_limit_sec: 60,
    explanation: '', options: [
      { id: 1, text: '', is_correct: true, explanation: '' },
      { id: 2, text: '', is_correct: false, explanation: '' }
    ]
  });

  const [ctfForm, setCtfForm] = useState({
    title: '', description: '', category: 'web', difficulty: 'Beginner',
    points: 100, flag_type: 'static', static_flag: '', has_docker_lab: false,
    docker_image: '', lab_timeout_min: 60, lab_port_exposed: 80
  });

  useEffect(() => {
    loadGlobalMetrics();
  }, []);

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const loadGlobalMetrics = async () => {
    try {
      const [events, dsa, mcq, ctf, users, subs, teams] = await Promise.all([
        adminService.listEvents().catch(() => []),
        adminService.listDSA().catch(() => []),
        adminService.listMCQs().catch(() => []),
        adminService.listCTF().catch(() => []),
        adminService.listUsers().catch(() => []),
        adminService.listSubmissions().catch(() => ({ submissions: [] })),
        adminService.listTeams ? adminService.listTeams().catch(() => []) : []
      ]);

      setMetrics({
        eventsCount: events.length,
        activeEventsCount: events.filter(e => e.status === 'live' || e.status === 'registration_open' || e.status === 'active').length,
        dsaCount: dsa.length,
        mcqCount: mcq.length,
        ctfCount: ctf.length,
        usersCount: users.length,
        submissionsCount: subs.submissions?.length || 0,
        teamsCount: teams.length
      });
    } catch (e) {
      console.error('Error fetching admin metrics:', e);
    }
  };

  const loadTabData = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'questions' || tab === 'dsa') {
        const d = await adminService.listDSA();
        setDsaList(d);
      }
      if (tab === 'questions' || tab === 'mcq') {
        const m = await adminService.listMCQs();
        setMcqList(m);
      }
      if (tab === 'questions' || tab === 'ctf') {
        const c = await adminService.listCTF();
        setCtfList(c);
      }
      if (tab === 'users' || tab === 'dashboard') {
        const u = await adminService.listUsers();
        setUserList(u);
      }
      if (tab === 'teams') {
        if (adminService.listTeams) {
          const t = await adminService.listTeams();
          setTeamList(t);
        }
      }
      if (tab === 'submissions') {
        const s = await adminService.listSubmissions();
        setSubmissionList(s.submissions || []);
      }
      if (tab === 'audits' || tab === 'dashboard') {
        const a = await adminService.getAuditLogs();
        setAuditLogs(a || []);
      }
      if (tab === 'settings') {
        const setts = await adminService.getSettings();
        setPlatformSettings(setts || {});
      }
      if (tab === 'content') {
        const cnt = await adminService.getSiteContent();
        setSiteContent(cnt.content || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Switch tabs
  const handleSelectTab = (tabId) => {
    if (tabId === 'events_new') {
      setWizardOpen(true);
      return;
    }
    setActiveTab(tabId);
    navigate(`/admin/${tabId}`);
  };

  const handleLaunchEventWithTemplate = (template) => {
    setPreselectedTemplate(template);
    setWizardOpen(true);
  };

  // Rejudge Solution
  const handleRejudge = async (subId) => {
    try {
      await adminService.rejudgeSubmission(subId);
      alert(`Submission #${subId} successfully queued for re-evaluation.`);
      loadTabData('submissions');
    } catch (e) {
      alert('Failed to rejudge submission.');
    }
  };

  // Question creators
  const handleCreateDsa = async (e) => {
    e.preventDefault();
    try {
      await adminService.createDSA(dsaForm);
      alert('DSA Question authored successfully!');
      setDsaForm({
        title: '', statement: '', input_spec: '', output_spec: '', constraints: '',
        difficulty: 'Beginner', category: 'Data Structures & Algorithms', points: 100,
        time_limit_ms: 2000, memory_limit_mb: 256, starter_py: '', starter_cpp: '', starter_c: '',
        reference_solution: '', allow_copy_paste: false
      });
      loadTabData('questions');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create question.');
    }
  };

  const handleSelectDsa = async (id) => {
    setSelectedDsaId(id);
    const detail = await adminService.getDSA(id);
    setSelectedDsaDetail(detail);
  };

  const handleAddTestCase = async (e) => {
    e.preventDefault();
    if (!selectedDsaId) return;
    try {
      await adminService.addDSATestCase(selectedDsaId, {
        test_type: tcType,
        input_data: tcInput,
        expected_output: tcOutput,
        points: tcType === 'hidden_test' ? 50 : 0
      });
      setTcInput('');
      setTcOutput('');
      const updated = await adminService.getDSA(selectedDsaId);
      setSelectedDsaDetail(updated);
    } catch (err) {
      alert('Failed to add testcase.');
    }
  };

  const handleCreateMcq = async (e) => {
    e.preventDefault();
    try {
      await adminService.createMCQ(mcqForm);
      alert('MCQ created successfully!');
      loadTabData('questions');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create MCQ.');
    }
  };

  const handleCreateCtf = async (e) => {
    e.preventDefault();
    try {
      await adminService.createCTF(ctfForm);
      alert('CTF Challenge created successfully!');
      loadTabData('questions');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create CTF challenge.');
    }
  };

  const handleDeleteDSA = async (id, title) => {
    if (!window.confirm(`Permanently delete DSA question "${title}" (#${id})?`)) return;
    try {
      await adminService.deleteDSA(id);
      loadTabData('questions');
    } catch (e) {
      alert('Failed to delete question.');
    }
  };

  const handleDeleteMCQ = async (id, title) => {
    if (!window.confirm(`Permanently delete MCQ "${title}" (#${id})?`)) return;
    try {
      await adminService.deleteMCQ(id);
      loadTabData('questions');
    } catch (e) {
      alert('Failed to delete MCQ.');
    }
  };

  const handleDeleteCTF = async (id, title) => {
    if (!window.confirm(`Permanently delete CTF challenge "${title}" (#${id})?`)) return;
    try {
      await adminService.deleteCTF(id);
      loadTabData('questions');
    } catch (e) {
      alert('Failed to delete CTF challenge.');
    }
  };

  // Nav Groups Definition matching specification exactly:
  // Overview: Dashboard
  // Competition Management: All Events, Create Event, Competition Development, Question Bank, Import Questions
  // Participants: Participants, Teams, Registrations
  // Evaluation: Submissions, Judge Operations, Leaderboards, Results and Reports
  // Platform: Site Content, Branding and Banners, Audit Logs, Settings
  const navGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart2 }
      ]
    },
    {
      group: 'COMPETITION MANAGEMENT',
      items: [
        { id: 'events', label: 'All Events', icon: Calendar, badge: metrics.eventsCount },
        { id: 'events_new', label: 'Create Event', icon: Plus },
        { id: 'competition_dev', label: 'Competition Development', icon: Cpu },
        { id: 'questions', label: 'Question Bank', icon: Code2, badge: metrics.dsaCount + metrics.ctfCount + metrics.mcqCount },
        { id: 'imports', label: 'Import Questions', icon: Upload }
      ]
    },
    {
      group: 'PARTICIPANTS',
      items: [
        { id: 'users', label: 'Participants', icon: Users, badge: metrics.usersCount },
        { id: 'teams', label: 'Teams & Squads', icon: Shield, badge: metrics.teamsCount },
        { id: 'registrations', label: 'Registrations', icon: UserCheck }
      ]
    },
    {
      group: 'EVALUATION',
      items: [
        { id: 'submissions', label: 'Submissions', icon: FileText, badge: metrics.submissionsCount },
        { id: 'judge_ops', label: 'Judge Operations', icon: Activity },
        { id: 'leaderboards', label: 'Leaderboards', icon: Trophy },
        { id: 'results', label: 'Results & Reports', icon: Award }
      ]
    },
    {
      group: 'PLATFORM',
      items: [
        { id: 'content', label: 'Site Content', icon: Sliders },
        { id: 'banners', label: 'Branding & Banners', icon: ImageIcon },
        { id: 'audits', label: 'Audit Logs', icon: Database },
        { id: 'settings', label: 'Platform Settings', icon: Settings }
      ]
    }
  ];

  return (
    <div className="flex-1 flex min-h-[calc(100vh-4rem)] bg-[#061329] text-[#F2F7FF] font-sans overflow-hidden">
      
      {/* =========================================================================
          RESPONSIVE COLLAPSIBLE ADMIN SIDEBAR
          ========================================================================= */}
      <aside 
        className={`bg-[#08172B] border-r border-[#18385E] flex flex-col transition-all duration-300 shrink-0 z-30 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Sidebar Header / Branding */}
        <div className="p-4 border-b border-[#18385E] flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-[#00CFFF]" />
              <div className="leading-none">
                <span className="font-mono font-bold text-xs tracking-wider text-white block">ADMIN CONTROL</span>
                <span className="text-[10px] font-mono text-[#00CFFF]">CyberAnzen Center</span>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <Shield className="w-5 h-5 text-[#00CFFF] mx-auto" />
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded-lg text-[#A9BCD6] hover:text-white hover:bg-[#102746] transition-colors"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {navGroups.map(grp => (
            <div key={grp.group} className="space-y-1">
              {!sidebarCollapsed && (
                <span className="px-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold block mb-1">
                  {grp.group}
                </span>
              )}
              {grp.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.id === 'events' && activeTab === 'events_tab');
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all ${
                      isActive
                        ? 'bg-[#102746] text-[#00CFFF] font-bold border border-[#00CFFF]/50 shadow-[0_0_15px_rgba(0,207,255,0.15)]'
                        : 'text-[#A9BCD6] hover:text-white hover:bg-[#0B1D38] border border-transparent'
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </div>

                    {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#061329] text-[#00CFFF] border border-[#18385E]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Current Admin User footer */}
        <div className="p-3 border-t border-[#18385E] bg-[#061329]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#087FFF] to-[#00CFFF] text-slate-950 font-bold flex items-center justify-center shrink-0 text-xs">
              {user?.username ? user.username.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden leading-tight">
                <span className="text-xs font-bold text-white block truncate">{user?.username || 'Administrator'}</span>
                <span className="text-[10px] text-emerald-400 font-mono capitalize">{user?.role || 'Super Admin'}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN CENTRAL ADMIN WORKSPACE
          ========================================================================= */}
      <main className="flex-1 flex flex-col overflow-y-auto p-6 md:p-8 space-y-6">

        {/* =======================================================================
            VIEW 1: ADMIN FIRST SCREEN // DASHBOARD OVERVIEW
            ======================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Welcome & Quick Actions Grid */}
            <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono text-[#00CFFF] uppercase tracking-wider">COMMAND CENTER</span>
                  <h1 className="text-xl md:text-2xl font-bold font-mono text-white mt-0.5">
                    CyberAnzen Arena — Control Center
                  </h1>
                  <p className="text-xs text-[#A9BCD6] mt-1">
                    Manage tournaments, design competition templates, evaluate real-time sandboxed code, and inspect forensic submissions.
                  </p>
                </div>

                <button
                  onClick={() => setWizardOpen(true)}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-[#00CFFF] to-[#087FFF] hover:opacity-95 shadow-[0_0_20px_rgba(0,207,255,0.4)] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create New Event</span>
                </button>
              </div>

              {/* 7 Required Quick Action Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 pt-3 border-t border-[#18385E]">
                <button
                  onClick={() => setWizardOpen(true)}
                  className="p-3.5 rounded-xl bg-[#061329] border border-[#18385E] hover:border-[#00CFFF] transition-all text-left group"
                >
                  <Plus className="w-4 h-4 text-[#00CFFF] mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-white block">Create New Event</span>
                  <span className="text-[10px] text-[#A9BCD6] block mt-0.5">8-Step Wizard</span>
                </button>

                <button
                  onClick={() => handleSelectTab('events')}
                  className="p-3.5 rounded-xl bg-[#061329] border border-[#18385E] hover:border-[#00CFFF] transition-all text-left group"
                >
                  <Calendar className="w-4 h-4 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-white block">Manage Events</span>
                  <span className="text-[10px] text-[#A9BCD6] block mt-0.5">{metrics.eventsCount} tournaments</span>
                </button>

                <button
                  onClick={() => handleSelectTab('questions')}
                  className="p-3.5 rounded-xl bg-[#061329] border border-[#18385E] hover:border-[#00CFFF] transition-all text-left group"
                >
                  <Code2 className="w-4 h-4 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-white block">Questions &amp; Challenges</span>
                  <span className="text-[10px] text-[#A9BCD6] block mt-0.5">Author DSA, CTF, MCQ</span>
                </button>

                <button
                  onClick={() => handleSelectTab('competition_dev')}
                  className="p-3.5 rounded-xl bg-[#061329] border border-[#18385E] hover:border-[#00CFFF] transition-all text-left group"
                >
                  <Cpu className="w-4 h-4 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-white block">Competition Dev Studio</span>
                  <span className="text-[10px] text-[#A9BCD6] block mt-0.5">Templates &amp; Layouts</span>
                </button>

                <button
                  onClick={() => handleSelectTab('users')}
                  className="p-3.5 rounded-xl bg-[#061329] border border-[#18385E] hover:border-[#00CFFF] transition-all text-left group"
                >
                  <Users className="w-4 h-4 text-[#00CFFF] mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-white block">Participants &amp; Teams</span>
                  <span className="text-[10px] text-[#A9BCD6] block mt-0.5">{metrics.usersCount} Cadets</span>
                </button>

                <button
                  onClick={() => handleSelectTab('submissions')}
                  className="p-3.5 rounded-xl bg-[#061329] border border-[#18385E] hover:border-[#00CFFF] transition-all text-left group"
                >
                  <FileText className="w-4 h-4 text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-white block">Submissions &amp; Results</span>
                  <span className="text-[10px] text-[#A9BCD6] block mt-0.5">Judge Diagnostics</span>
                </button>

                <button
                  onClick={() => handleSelectTab('settings')}
                  className="p-3.5 rounded-xl bg-[#061329] border border-[#18385E] hover:border-[#00CFFF] transition-all text-left group"
                >
                  <Settings className="w-4 h-4 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-white block">Platform Settings</span>
                  <span className="text-[10px] text-[#A9BCD6] block mt-0.5">Security &amp; Sandboxes</span>
                </button>
              </div>
            </div>

            {/* High-Level Metric Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-lg">
                <span className="text-[10px] font-mono text-[#A9BCD6] uppercase block">Active Competitions</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                  {metrics.activeEventsCount} <span className="text-xs text-slate-400 font-normal">/ {metrics.eventsCount} total</span>
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-lg">
                <span className="text-[10px] font-mono text-[#A9BCD6] uppercase block">Question Bank Items</span>
                <span className="text-2xl font-bold font-mono text-[#00CFFF] mt-1 block">
                  {metrics.dsaCount + metrics.ctfCount + metrics.mcqCount}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {metrics.dsaCount} DSA • {metrics.ctfCount} CTF • {metrics.mcqCount} MCQ
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-lg">
                <span className="text-[10px] font-mono text-[#A9BCD6] uppercase block">Registered Operatives</span>
                <span className="text-2xl font-bold font-mono text-white mt-1 block">
                  {metrics.usersCount}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-lg">
                <span className="text-[10px] font-mono text-[#A9BCD6] uppercase block">Judge Submissions</span>
                <span className="text-2xl font-bold font-mono text-purple-400 mt-1 block">
                  {metrics.submissionsCount}
                </span>
              </div>
            </div>

            {/* Recent Audit Stream */}
            <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#18385E] pb-3">
                <span className="font-bold text-white flex items-center space-x-2">
                  <Database className="w-4 h-4 text-[#00CFFF]" />
                  <span>Recent Security &amp; Tournament Audit Trail</span>
                </span>
                <button
                  onClick={() => handleSelectTab('audits')}
                  className="text-[10px] text-[#00CFFF] hover:underline"
                >
                  View Full Logs →
                </button>
              </div>

              {auditLogs.length === 0 ? (
                <div className="p-4 text-center text-[#A9BCD6]">No security incidents or audit entries logged.</div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.slice(0, 5).map((log, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#061329] border border-[#18385E] flex justify-between items-center text-[11px]">
                      <div>
                        <span className="text-[#00CFFF] font-bold">{log.action}</span>
                        <span className="text-slate-400 ml-2">by {log.actor_username || 'SYSTEM'}</span>
                        <span className="text-slate-500 ml-2">({log.entity_type} #{log.entity_id})</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">{log.created_at ? new Date(log.created_at).toLocaleTimeString() : 'Recent'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =======================================================================
            VIEW 2: ALL EVENTS
            ======================================================================= */}
        {activeTab === 'events' && (
          <EventsManagementTab
            onOpenWizard={() => setWizardOpen(true)}
            preselectedTemplate={preselectedTemplate}
          />
        )}

        {/* =======================================================================
            VIEW 3: COMPETITION DEVELOPMENT STUDIO
            ======================================================================= */}
        {activeTab === 'competition_dev' && (
          <CompetitionDevelopmentTab
            onCreateEventWithTemplate={handleLaunchEventWithTemplate}
          />
        )}

        {/* =======================================================================
            VIEW 4: QUESTION BANK (DSA, CTF, MCQ STUDIOS)
            ======================================================================= */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            <div className="flex border-b border-[#18385E] space-x-4 text-xs font-mono">
              <button
                onClick={() => setQuestionSubTab('dsa')}
                className={`pb-2 border-b-2 font-bold ${questionSubTab === 'dsa' ? 'border-[#00CFFF] text-[#00CFFF]' : 'border-transparent text-[#A9BCD6] hover:text-white'}`}
              >
                DSA Problem Studio ({dsaList.length})
              </button>
              <button
                onClick={() => setQuestionSubTab('ctf')}
                className={`pb-2 border-b-2 font-bold ${questionSubTab === 'ctf' ? 'border-[#00CFFF] text-[#00CFFF]' : 'border-transparent text-[#A9BCD6] hover:text-white'}`}
              >
                CTF Challenge Studio ({ctfList.length})
              </button>
              <button
                onClick={() => setQuestionSubTab('mcq')}
                className={`pb-2 border-b-2 font-bold ${questionSubTab === 'mcq' ? 'border-[#00CFFF] text-[#00CFFF]' : 'border-transparent text-[#A9BCD6] hover:text-white'}`}
              >
                MCQ Question Studio ({mcqList.length})
              </button>
            </div>

            {/* Sub-tab 1: DSA Authoring */}
            {questionSubTab === 'dsa' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] space-y-4">
                  <h4 className="font-bold text-white font-mono text-sm flex items-center space-x-2">
                    <Plus className="w-4 h-4 text-[#00CFFF]" />
                    <span>AUTHOR DSA CODING QUESTION</span>
                  </h4>
                  <form onSubmit={handleCreateDsa} className="space-y-3 font-sans text-xs">
                    <div>
                      <label className="block text-[#A9BCD6] font-mono mb-1">Title *</label>
                      <input
                        type="text"
                        required
                        value={dsaForm.title}
                        onChange={(e) => setDsaForm({ ...dsaForm, title: e.target.value })}
                        className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-mono"
                        placeholder="e.g. Reverse Binary Tree Inversion"
                      />
                    </div>
                    <div>
                      <label className="block text-[#A9BCD6] font-mono mb-1">Problem Statement (Markdown) *</label>
                      <textarea
                        required
                        rows={4}
                        value={dsaForm.statement}
                        onChange={(e) => setDsaForm({ ...dsaForm, statement: e.target.value })}
                        className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#A9BCD6] font-mono mb-1">Input Format *</label>
                        <textarea
                          required
                          rows={2}
                          value={dsaForm.input_spec}
                          onChange={(e) => setDsaForm({ ...dsaForm, input_spec: e.target.value })}
                          className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A9BCD6] font-mono mb-1">Output Format *</label>
                        <textarea
                          required
                          rows={2}
                          value={dsaForm.output_spec}
                          onChange={(e) => setDsaForm({ ...dsaForm, output_spec: e.target.value })}
                          className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[#A9BCD6] font-mono mb-1">Difficulty</label>
                        <select
                          value={dsaForm.difficulty}
                          onChange={(e) => setDsaForm({ ...dsaForm, difficulty: e.target.value })}
                          className="w-full px-2 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-mono"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[#A9BCD6] font-mono mb-1">Points</label>
                        <input
                          type="number"
                          value={dsaForm.points}
                          onChange={(e) => setDsaForm({ ...dsaForm, points: parseInt(e.target.value) || 100 })}
                          className="w-full px-2 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A9BCD6] font-mono mb-1">Time Limit (ms)</label>
                        <input
                          type="number"
                          value={dsaForm.time_limit_ms}
                          onChange={(e) => setDsaForm({ ...dsaForm, time_limit_ms: parseInt(e.target.value) || 2000 })}
                          className="w-full px-2 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#00CFFF] hover:bg-cyan-300 text-slate-950 font-mono font-bold"
                      >
                        Publish to Bank
                      </button>
                    </div>
                  </form>
                </div>

                {/* DSA List & Test Cases */}
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#0B1D38] border border-[#18385E]">
                    <h4 className="text-white font-mono font-bold text-xs uppercase mb-3">Published DSA Bank ({dsaList.length})</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {dsaList.map(q => (
                        <div
                          key={q.id}
                          className="p-3 rounded-xl bg-[#061329] border border-[#18385E] flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-white text-xs">{q.title}</span>
                            <span className="text-[10px] text-[#A9BCD6] ml-2 font-mono">[{q.difficulty} • {q.points}pts]</span>
                          </div>
                          <div className="space-x-2">
                            <button
                              onClick={() => handleSelectDsa(q.id)}
                              className="px-2 py-1 bg-[#102746] text-[#00CFFF] rounded text-[10px] font-mono"
                            >
                              Test Cases
                            </button>
                            <button
                              onClick={() => handleDeleteDSA(q.id, q.title)}
                              className="p-1 text-rose-400 hover:text-rose-300"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedDsaDetail && (
                    <div className="p-4 rounded-2xl bg-[#0B1D38] border border-[#00CFFF]/40 space-y-3 font-mono text-xs">
                      <h4 className="font-bold text-white text-xs">Test Cases for: {selectedDsaDetail.title}</h4>
                      <form onSubmit={handleAddTestCase} className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <textarea
                            placeholder="Input Data"
                            rows={2}
                            required
                            value={tcInput}
                            onChange={(e) => setTcInput(e.target.value)}
                            className="p-2 bg-[#061329] border border-[#18385E] rounded text-white"
                          />
                          <textarea
                            placeholder="Expected Output"
                            rows={2}
                            required
                            value={tcOutput}
                            onChange={(e) => setTcOutput(e.target.value)}
                            className="p-2 bg-[#061329] border border-[#18385E] rounded text-white"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <select
                            value={tcType}
                            onChange={(e) => setTcType(e.target.value)}
                            className="bg-[#061329] border border-[#18385E] rounded p-1 text-white text-xs"
                          >
                            <option value="public_sample">Public Sample</option>
                            <option value="hidden_test">Hidden Test Case</option>
                          </select>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-[#087FFF] text-white rounded font-bold"
                          >
                            Add Test Case
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-tab 2: CTF Challenges */}
            {questionSubTab === 'ctf' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] space-y-4">
                  <h4 className="font-bold text-white font-mono text-sm flex items-center space-x-2">
                    <Flag className="w-4 h-4 text-emerald-400" />
                    <span>AUTHOR CTF CHALLENGE</span>
                  </h4>
                  <form onSubmit={handleCreateCtf} className="space-y-3 font-sans text-xs">
                    <div>
                      <label className="block text-[#A9BCD6] font-mono mb-1">Challenge Title *</label>
                      <input
                        type="text"
                        required
                        value={ctfForm.title}
                        onChange={(e) => setCtfForm({ ...ctfForm, title: e.target.value })}
                        className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[#A9BCD6] font-mono mb-1">Description / Brief *</label>
                      <textarea
                        required
                        rows={3}
                        value={ctfForm.description}
                        onChange={(e) => setCtfForm({ ...ctfForm, description: e.target.value })}
                        className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[#A9BCD6] font-mono mb-1">Category</label>
                        <select
                          value={ctfForm.category}
                          onChange={(e) => setCtfForm({ ...ctfForm, category: e.target.value })}
                          className="w-full px-2 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-mono"
                        >
                          <option value="web">Web Exploitation</option>
                          <option value="forensics">Digital Forensics</option>
                          <option value="reverse">Reverse Engineering</option>
                          <option value="crypto">Cryptography</option>
                          <option value="puzzle">Logic Puzzle</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[#A9BCD6] font-mono mb-1">Points</label>
                        <input
                          type="number"
                          value={ctfForm.points}
                          onChange={(e) => setCtfForm({ ...ctfForm, points: parseInt(e.target.value) || 100 })}
                          className="w-full px-2 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A9BCD6] font-mono mb-1">Flag Value *</label>
                        <input
                          type="text"
                          required
                          value={ctfForm.static_flag}
                          onChange={(e) => setCtfForm({ ...ctfForm, static_flag: e.target.value })}
                          placeholder="CYBER{...}"
                          className="w-full px-2 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold"
                      >
                        Publish CTF Challenge
                      </button>
                    </div>
                  </form>
                </div>

                {/* CTF List */}
                <div className="p-4 rounded-2xl bg-[#0B1D38] border border-[#18385E]">
                  <h4 className="text-white font-mono font-bold text-xs uppercase mb-3">Published CTF Challenges ({ctfList.length})</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {ctfList.map(c => (
                      <div key={c.id} className="p-3 rounded-xl bg-[#061329] border border-[#18385E] flex items-center justify-between font-mono text-xs">
                        <div>
                          <span className="font-bold text-white">{c.title}</span>
                          <span className="text-[10px] text-emerald-400 ml-2">[{c.category} • {c.points}pts]</span>
                        </div>
                        <button
                          onClick={() => handleDeleteCTF(c.id, c.title)}
                          className="p-1 text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 3: MCQ Studio */}
            {questionSubTab === 'mcq' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] space-y-4">
                  <h4 className="font-bold text-white font-mono text-sm flex items-center space-x-2">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span>AUTHOR MCQ QUIZ QUESTION</span>
                  </h4>
                  <form onSubmit={handleCreateMcq} className="space-y-3 font-sans text-xs">
                    <div>
                      <label className="block text-[#A9BCD6] font-mono mb-1">Question Prompt *</label>
                      <textarea
                        required
                        rows={3}
                        value={mcqForm.prompt}
                        onChange={(e) => setMcqForm({ ...mcqForm, prompt: e.target.value, title: e.target.value.slice(0, 50) })}
                        className="w-full px-3 py-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[#A9BCD6] font-mono">Answer Options:</label>
                      {mcqForm.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="correct_option"
                            checked={opt.is_correct}
                            onChange={() => {
                              const updated = mcqForm.options.map((o, i) => ({ ...o, is_correct: i === idx }));
                              setMcqForm({ ...mcqForm, options: updated });
                            }}
                          />
                          <input
                            type="text"
                            required
                            placeholder={`Option #${idx + 1}`}
                            value={opt.text}
                            onChange={(e) => {
                              const updated = [...mcqForm.options];
                              updated[idx].text = e.target.value;
                              setMcqForm({ ...mcqForm, options: updated });
                            }}
                            className="flex-1 px-3 py-1.5 bg-[#061329] border border-[#18385E] rounded text-white"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-bold"
                      >
                        Publish MCQ
                      </button>
                    </div>
                  </form>
                </div>

                {/* MCQ List */}
                <div className="p-4 rounded-2xl bg-[#0B1D38] border border-[#18385E]">
                  <h4 className="text-white font-mono font-bold text-xs uppercase mb-3">Published MCQs ({mcqList.length})</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {mcqList.map(m => (
                      <div key={m.id} className="p-3 rounded-xl bg-[#061329] border border-[#18385E] flex items-center justify-between font-mono text-xs">
                        <div>
                          <span className="font-bold text-white">{m.title || m.prompt?.slice(0, 40)}</span>
                          <span className="text-[10px] text-amber-400 ml-2">[{m.points_positive}pts]</span>
                        </div>
                        <button
                          onClick={() => handleDeleteMCQ(m.id, m.title || `MCQ #${m.id}`)}
                          className="p-1 text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =======================================================================
            VIEW 5: QUESTION IMPORTS
            ======================================================================= */}
        {activeTab === 'imports' && (
          <QuestionImportTab onQuestionsPublished={() => loadTabData('questions')} />
        )}

        {/* =======================================================================
            VIEW 6: PARTICIPANTS / CADETS
            ======================================================================= */}
        {activeTab === 'users' && (
          <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
            <h3 className="font-mono font-bold text-sm text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#00CFFF]" />
              <span>AUTHENTICATED CADETS &amp; ROLES ({userList.length})</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#08172B] text-[#A9BCD6] uppercase text-[10px] border-b border-[#18385E]">
                  <tr>
                    <th className="p-3">Cadet ID</th>
                    <th className="p-3">Username</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#18385E]/60">
                  {userList.map(u => (
                    <tr key={u.id} className="hover:bg-[#102746]/40">
                      <td className="p-3 text-slate-400">#{u.id}</td>
                      <td className="p-3 text-white font-bold">{u.username}</td>
                      <td className="p-3 text-[#A9BCD6]">{u.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          u.role === 'super_admin' ? 'bg-rose-950 text-rose-400' :
                          u.role === 'admin' ? 'bg-purple-950 text-purple-400' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-[#00CFFF] font-bold">{u.points || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =======================================================================
            VIEW 7: SUBMISSIONS & REJUDGE
            ======================================================================= */}
        {activeTab === 'submissions' && (
          <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
            <h3 className="font-mono font-bold text-sm text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>JUDGE SUBMISSIONS &amp; SANDBOX RE-EVALUATION ({submissionList.length})</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#08172B] text-[#A9BCD6] uppercase text-[10px] border-b border-[#18385E]">
                  <tr>
                    <th className="p-3">Sub ID</th>
                    <th className="p-3">Cadet</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">Verdict</th>
                    <th className="p-3">Runtime</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#18385E]/60">
                  {submissionList.map(sub => (
                    <tr key={sub.id} className="hover:bg-[#102746]/40">
                      <td className="p-3 text-slate-400">#{sub.id}</td>
                      <td className="p-3 text-white font-bold">{sub.user_username || `User #${sub.user_id}`}</td>
                      <td className="p-3 uppercase text-[#00CFFF]">{sub.submission_type}</td>
                      <td className="p-3 text-[#A9BCD6]">{sub.case_id || sub.target_id}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sub.verdict === 'ACCEPTED' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                        }`}>
                          {sub.verdict}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{sub.execution_time_ms ? `${sub.execution_time_ms} ms` : '-'}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRejudge(sub.id)}
                          className="px-2 py-1 rounded bg-[#102746] hover:bg-[#18385E] text-[#00CFFF] text-[10px]"
                        >
                          Rejudge
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =======================================================================
            VIEW 8: PLATFORM SETTINGS
            ======================================================================= */}
        {activeTab === 'settings' && (
          <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4 font-mono text-xs">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <Settings className="w-4 h-4 text-[#00CFFF]" />
              <span>PLATFORM SETTINGS &amp; EXECUTION LIMITS</span>
            </h3>
            <p className="text-slate-400 text-xs">
              System governance parameters for sandbox resource controls, rate limiting, and security compliance.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] space-y-1">
                <span className="text-white font-bold block">Sandbox Execution Timeout</span>
                <span className="text-[#A9BCD6] text-[11px] block">Max wall-clock run threshold: 10,000 ms</span>
              </div>
              <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] space-y-1">
                <span className="text-white font-bold block">Source Code Upload Ceiling</span>
                <span className="text-[#A9BCD6] text-[11px] block">Hard limit: 64 KB per submission</span>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================================
            VIEW 9: AUDIT LOGS
            ======================================================================= */}
        {activeTab === 'audits' && (
          <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4 font-mono text-xs">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-[#00CFFF]" />
              <span>IMMUTABLE AUDIT LOGS ({auditLogs.length})</span>
            </h3>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#061329] border border-[#18385E] flex justify-between items-center text-[11px]">
                  <div>
                    <span className="text-[#00CFFF] font-bold">{log.action}</span>
                    <span className="text-slate-400 ml-2">by {log.actor_username || 'SYSTEM'}</span>
                    <span className="text-slate-500 ml-2">[{log.entity_type} #{log.entity_id}]</span>
                  </div>
                  <span className="text-slate-500 text-[10px]">{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Global Event Wizard Modal */}
      <EventWizardModal
        isOpen={wizardOpen}
        onClose={() => {
          setWizardOpen(false);
          setPreselectedTemplate(null);
        }}
        onEventCreated={() => {
          loadGlobalMetrics();
          loadTabData('events');
        }}
        initialTemplate={preselectedTemplate}
      />
    </div>
  );
}
