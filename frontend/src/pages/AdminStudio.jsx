import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Settings, Code2, HelpCircle, Shield, Cpu, Users, 
  FileText, Plus, Trash2, CheckCircle2, AlertTriangle, Play, RefreshCw, Key, ShieldAlert,
  Calendar, Upload, Sparkles, Trophy, BarChart2, ChevronLeft, ChevronRight, Menu,
  Layers, Shuffle, Lock, Unlock, Eye, Activity, Award, UserCheck, UserX, Database,
  Sliders, Search, ArrowRight, ExternalLink, Image as ImageIcon, Terminal, X, Copy,
  Check, Download, AlertCircle, Clock, Zap, Flag, Filter, CheckSquare
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { adminService, authService, dsaService } from '../services/api';
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
    if (path.includes('/teams')) return 'teams';
    if (path.includes('/registrations')) return 'registrations';
    if (path.includes('/judge')) return 'judge_ops';
    if (path.includes('/leaderboard')) return 'leaderboards';
    if (path.includes('/results')) return 'results';
    if (path.includes('/banners')) return 'banners';
    if (path.includes('/content')) return 'content';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [preselectedTemplate, setPreselectedTemplate] = useState(null);

  // Global Scope & Filter State
  const [eventsList, setEventsList] = useState([]);
  const [selectedEventFilter, setSelectedEventFilter] = useState('all');

  // Global counts for metrics
  const [metrics, setMetrics] = useState({
    eventsCount: 0,
    activeEventsCount: 0,
    dsaCount: 0,
    mcqCount: 0,
    ctfCount: 0,
    usersCount: 0,
    submissionsCount: 0,
    teamsCount: 0,
    registrationsCount: 0
  });

  // Tab-specific datasets
  const [dsaList, setDsaList] = useState([]);
  const [mcqList, setMcqList] = useState([]);
  const [ctfList, setCtfList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [teamList, setTeamList] = useState([]);
  const [registrationsList, setRegistrationsList] = useState([]);
  const [submissionList, setSubmissionList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [platformSettings, setPlatformSettings] = useState({});
  const [siteContent, setSiteContent] = useState({});
  const [questionSubTab, setQuestionSubTab] = useState('dsa'); // 'dsa' | 'ctf' | 'mcq'
  const [loading, setLoading] = useState(false);
  const [questionSearch, setQuestionSearch] = useState('');

  // Interactive Programming Console Modal State
  const [codingConsoleQuestion, setCodingConsoleQuestion] = useState(null);
  const [consoleLang, setConsoleLang] = useState('python3');
  const [consoleCode, setConsoleCode] = useState('');
  const [consoleRunning, setConsoleRunning] = useState(false);
  const [consoleResult, setConsoleResult] = useState(null);
  const [consoleError, setConsoleError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Leaderboard tab state
  const [activeLeaderboardEventId, setActiveLeaderboardEventId] = useState(null);
  const [eventLeaderboardData, setEventLeaderboardData] = useState(null);
  const [freezeLoading, setFreezeLoading] = useState(false);

  // Quick Assign Question Modal
  const [quickAssignQuestion, setQuickAssignQuestion] = useState(null);
  const [quickAssignEventId, setQuickAssignEventId] = useState('');

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

  // Branding / Banner state
  const [bannerEventId, setBannerEventId] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerUploading, setBannerUploading] = useState(false);

  useEffect(() => {
    loadGlobalMetrics();
  }, []);

  useEffect(() => {
    loadTabData(activeTab, selectedEventFilter);
  }, [activeTab, selectedEventFilter]);

  const loadGlobalMetrics = async () => {
    try {
      const [events, dsa, mcq, ctf, users, subs, teams, regs] = await Promise.all([
        adminService.listEvents().catch(() => []),
        adminService.listDSA().catch(() => []),
        adminService.listMCQs().catch(() => []),
        adminService.listCTF().catch(() => []),
        adminService.listUsers().catch(() => []),
        adminService.listSubmissions().catch(() => ({ submissions: [] })),
        adminService.listTeams ? adminService.listTeams().catch(() => []) : [],
        adminService.listRegistrations ? adminService.listRegistrations().catch(() => []) : []
      ]);

      setEventsList(events);
      if (events.length > 0 && !activeLeaderboardEventId) {
        setActiveLeaderboardEventId(events[0].id);
      }
      if (events.length > 0 && !bannerEventId) {
        setBannerEventId(events[0].id);
      }

      setMetrics({
        eventsCount: events.length,
        activeEventsCount: events.filter(e => e.status === 'live' || e.status === 'registration_open' || e.status === 'active').length,
        dsaCount: dsa.length,
        mcqCount: mcq.length,
        ctfCount: ctf.length,
        usersCount: users.length,
        submissionsCount: subs.submissions?.length || 0,
        teamsCount: teams.length,
        registrationsCount: regs.length
      });
    } catch (e) {
      console.error('Error fetching admin metrics:', e);
    }
  };

  const loadTabData = async (tab, eventFilter = selectedEventFilter) => {
    setLoading(true);
    const filterParams = eventFilter !== 'all' ? { event_id: parseInt(eventFilter) } : {};
    try {
      if (tab === 'questions' || tab === 'dsa') {
        const d = await adminService.listDSA(filterParams);
        setDsaList(d);
      }
      if (tab === 'questions' || tab === 'mcq') {
        const m = await adminService.listMCQs(filterParams);
        setMcqList(m);
      }
      if (tab === 'questions' || tab === 'ctf') {
        const c = await adminService.listCTF(filterParams);
        setCtfList(c);
      }
      if (tab === 'users' || tab === 'dashboard') {
        const u = await adminService.listUsers();
        setUserList(u);
      }
      if (tab === 'teams') {
        const t = await adminService.listTeams(filterParams);
        setTeamList(t || []);
      }
      if (tab === 'registrations') {
        const r = await adminService.listRegistrations(filterParams);
        setRegistrationsList(r || []);
      }
      if (tab === 'submissions' || tab === 'judge_ops') {
        const s = await adminService.listSubmissions();
        setSubmissionList(s.submissions || []);
      }
      if (tab === 'leaderboards') {
        const targetId = eventFilter !== 'all' ? parseInt(eventFilter) : (activeLeaderboardEventId || (eventsList[0]?.id));
        if (targetId) {
          setActiveLeaderboardEventId(targetId);
          const lb = await adminService.getEventLeaderboard(targetId);
          setEventLeaderboardData(lb);
        }
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
      console.error('Tab loading error:', err);
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

  // Handle Event Scope Filter Change
  const handleEventScopeChange = (val) => {
    setSelectedEventFilter(val);
    if (val !== 'all') {
      setActiveLeaderboardEventId(parseInt(val));
      setBannerEventId(parseInt(val));
    }
  };

  // Rejudge Solution
  const handleRejudge = async (subId) => {
    try {
      await adminService.rejudgeSubmission(subId);
      alert(`Submission #${subId} successfully queued for sandbox re-evaluation.`);
      loadTabData(activeTab);
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
      alert('Test case added successfully!');
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

  const handleDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`Permanently disband and delete squad "${teamName}" (#${teamId})?`)) return;
    try {
      await adminService.deleteTeam(teamId);
      alert(`Team "${teamName}" disbanded.`);
      loadTabData('teams');
    } catch (e) {
      alert('Failed to delete team.');
    }
  };

  const handleDeleteRegistration = async (regId, username, eventTitle) => {
    if (!window.confirm(`Revoke registration for cadet "${username}" from "${eventTitle}"?`)) return;
    try {
      await adminService.deleteRegistration(regId);
      alert('Registration revoked.');
      loadTabData('registrations');
    } catch (e) {
      alert('Failed to delete registration.');
    }
  };

  // Quick Assign Question to Event
  const handleAssignQuestionToEvent = async () => {
    if (!quickAssignQuestion || !quickAssignEventId) return;
    try {
      await adminService.assignEventQuestions(parseInt(quickAssignEventId), [quickAssignQuestion.id]);
      alert(`Question "${quickAssignQuestion.title}" successfully assigned to tournament!`);
      setQuickAssignQuestion(null);
      setQuickAssignEventId('');
      loadTabData('questions');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to assign question to event.');
    }
  };

  // =========================================================================
  // INTERACTIVE MONACO PROGRAMMING CONSOLE CONTROLS
  // =========================================================================
  const handleOpenConsole = async (question) => {
    setCodingConsoleQuestion(question);
    setConsoleLang('python3');
    setConsoleResult(null);
    setConsoleError(null);
    setCopiedCode(false);

    // Fetch full details if statement or test cases are missing
    let fullQ = question;
    if (!question.statement || !question.sample_tests) {
      try {
        fullQ = await adminService.getDSA(question.id);
        setCodingConsoleQuestion(fullQ);
      } catch (err) {
        console.warn('Could not fetch complete question detail:', err);
      }
    }

    // Default starter template
    const starter = fullQ.starter_py || 
`# CyberAnzen Programming Console // Python 3.14 Sandbox
import sys

def solve():
    # Read standard input and produce expected output
    lines = sys.stdin.read().split()
    if not lines:
        return
    # TODO: Implement your solution logic here
    print(lines[0])

if __name__ == "__main__":
    solve()
`;
    setConsoleCode(starter);
  };

  const handleConsoleLangChange = (lang) => {
    setConsoleLang(lang);
    if (!codingConsoleQuestion) return;
    if (lang === 'python3') {
      setConsoleCode(codingConsoleQuestion.starter_py || 
`# CyberAnzen Programming Console // Python 3.14 Sandbox
import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    print(lines[0])

if __name__ == "__main__":
    solve()
`);
    } else if (lang === 'cpp') {
      setConsoleCode(codingConsoleQuestion.starter_cpp || 
`// CyberAnzen Programming Console // C++ 17 (G++ 13) Sandbox
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    string s;
    if (cin >> s) {
        cout << s << "\\n";
    }
    return 0;
}
`);
    } else if (lang === 'c') {
      setConsoleCode(codingConsoleQuestion.starter_c || 
`/* CyberAnzen Programming Console // C 11 (GCC 13) Sandbox */
#include <stdio.h>
#include <stdlib.h>

int main() {
    char buf[1024];
    if (scanf("%1023s", buf) == 1) {
        printf("%s\\n", buf);
    }
    return 0;
}
`);
    }
  };

  const handleRunConsoleCode = async () => {
    if (!codingConsoleQuestion) return;
    setConsoleRunning(true);
    setConsoleResult(null);
    setConsoleError(null);
    try {
      const res = await dsaService.runSample(
        codingConsoleQuestion.id,
        consoleLang,
        consoleCode
      );
      setConsoleResult(res);
    } catch (err) {
      setConsoleError(err.response?.data?.detail || err.message || 'Sandbox execution error.');
    } finally {
      setConsoleRunning(false);
    }
  };

  const handleCopyConsoleCode = () => {
    navigator.clipboard.writeText(consoleCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Toggle Leaderboard Freeze
  const handleToggleFreeze = async () => {
    if (!activeLeaderboardEventId) return;
    setFreezeLoading(true);
    try {
      const res = await adminService.toggleFreezeLeaderboard(activeLeaderboardEventId);
      alert(`Scoreboard is now ${res.is_frozen ? 'FROZEN ❄' : 'LIVE UNRESTRICTED ●'}`);
      const lb = await adminService.getEventLeaderboard(activeLeaderboardEventId);
      setEventLeaderboardData(lb);
    } catch (e) {
      alert('Failed to toggle scoreboard freeze state.');
    } finally {
      setFreezeLoading(false);
    }
  };

  // Banner Upload
  const handleBannerUpload = async (e) => {
    e.preventDefault();
    if (!bannerEventId || !bannerFile) {
      alert('Please select an event and select a banner image file.');
      return;
    }
    setBannerUploading(true);
    try {
      await adminService.uploadEventBanner(bannerEventId, bannerFile);
      alert('Event tournament banner updated successfully!');
      setBannerFile(null);
      loadGlobalMetrics();
    } catch (err) {
      alert('Failed to upload banner.');
    } finally {
      setBannerUploading(false);
    }
  };

  const handleRemoveBanner = async () => {
    if (!bannerEventId) return;
    if (!window.confirm('Remove banner for this event?')) return;
    try {
      await adminService.removeEventBanner(bannerEventId);
      alert('Banner removed.');
      loadGlobalMetrics();
    } catch (err) {
      alert('Failed to remove banner.');
    }
  };

  // Current active event object (if scoped)
  const activeEventObject = selectedEventFilter !== 'all' 
    ? eventsList.find(e => e.id === parseInt(selectedEventFilter)) 
    : null;

  // Filtered Question lists
  const filteredDsa = dsaList.filter(q => {
    if (!questionSearch) return true;
    const match = q.title?.toLowerCase().includes(questionSearch.toLowerCase()) ||
                  q.category?.toLowerCase().includes(questionSearch.toLowerCase());
    return match;
  });

  const filteredCtf = ctfList.filter(c => {
    if (!questionSearch) return true;
    return c.title?.toLowerCase().includes(questionSearch.toLowerCase()) ||
           c.category?.toLowerCase().includes(questionSearch.toLowerCase());
  });

  const filteredMcq = mcqList.filter(m => {
    if (!questionSearch) return true;
    return m.title?.toLowerCase().includes(questionSearch.toLowerCase()) ||
           m.prompt?.toLowerCase().includes(questionSearch.toLowerCase());
  });

  // Nav Groups Definition matching specification:
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
        { id: 'registrations', label: 'Registrations', icon: UserCheck, badge: metrics.registrationsCount }
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
              <img src="/favicon(1).png" alt="CyberAnzen" className="w-6 h-6 object-contain" />
              <div className="leading-none">
                <span className="font-mono font-bold text-xs tracking-wider text-white block">ADMIN CONTROL</span>
                <span className="text-[10px] font-mono text-[#00CFFF]">CyberAnzen Center</span>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <img src="/favicon(1).png" alt="CyberAnzen" className="w-6 h-6 object-contain mx-auto" />
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
      <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8 space-y-6">

        {/* =======================================================================
            GLOBAL EVENT SCOPE SELECTOR BAR
            ======================================================================= */}
        <div className="p-4 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#061329] border border-[#18385E] text-[#00CFFF]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold text-[#A9BCD6] uppercase tracking-wider">
                  EVENT CONTEXT SCOPE
                </span>
                {selectedEventFilter !== 'all' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-[#00CFFF] border border-[#00CFFF]/40">
                    Filtered Scope
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                    Global (All Events)
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <select
                  value={selectedEventFilter}
                  onChange={(e) => handleEventScopeChange(e.target.value)}
                  className="px-3 py-1.5 bg-[#061329] border border-[#18385E] rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-[#00CFFF]"
                >
                  <option value="all">🌐 Global Platform Scope (All Tournaments)</option>
                  {eventsList.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      #{ev.id} — {ev.title} [{ev.event_type?.toUpperCase()}] ({ev.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Active Event Badges & Direct Participant Links */}
          {activeEventObject && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                activeEventObject.status === 'live' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 animate-pulse' :
                activeEventObject.status === 'registration_open' ? 'bg-blue-950 text-blue-400 border border-blue-500/40' :
                'bg-slate-800 text-slate-300'
              }`}>
                ● {activeEventObject.status}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[10px] bg-[#102746] text-[#00CFFF] border border-[#18385E]">
                Type: {activeEventObject.event_type?.toUpperCase()}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[10px] bg-[#102746] text-purple-300 border border-[#18385E]">
                Mode: {activeEventObject.participation_mode}
              </span>
              <a
                href={`/events/${activeEventObject.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-[#00CFFF]/10 text-[#00CFFF] border border-[#00CFFF]/30 hover:bg-[#00CFFF]/20 transition-all font-bold"
              >
                <span>Participant Workspace</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => handleEventScopeChange('all')}
                className="px-2.5 py-1 rounded-lg bg-[#102746] text-[#A9BCD6] hover:text-white border border-[#18385E]"
                title="Clear event filter and return to global scope"
              >
                Reset Scope
              </button>
            </div>
          )}
        </div>

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
                <span className="text-[10px] text-slate-500 font-mono">
                  {metrics.teamsCount} Squads Registered
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-lg">
                <span className="text-[10px] font-mono text-[#A9BCD6] uppercase block">Judge Submissions</span>
                <span className="text-2xl font-bold font-mono text-purple-400 mt-1 block">
                  {metrics.submissionsCount}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Multi-Language Judge
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
            {/* Question Filter & Search Header */}
            <div className="p-4 rounded-2xl bg-[#0B1D38] border border-[#18385E] flex flex-wrap items-center justify-between gap-4">
              <div className="flex border-b border-[#18385E] space-x-4 text-xs font-mono">
                <button
                  onClick={() => setQuestionSubTab('dsa')}
                  className={`pb-2 border-b-2 font-bold transition-all ${questionSubTab === 'dsa' ? 'border-[#00CFFF] text-[#00CFFF]' : 'border-transparent text-[#A9BCD6] hover:text-white'}`}
                >
                  DSA Problem Bank ({dsaList.length})
                </button>
                <button
                  onClick={() => setQuestionSubTab('ctf')}
                  className={`pb-2 border-b-2 font-bold transition-all ${questionSubTab === 'ctf' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-[#A9BCD6] hover:text-white'}`}
                >
                  CTF Challenges ({ctfList.length})
                </button>
                <button
                  onClick={() => setQuestionSubTab('mcq')}
                  className={`pb-2 border-b-2 font-bold transition-all ${questionSubTab === 'mcq' ? 'border-amber-400 text-amber-400' : 'border-transparent text-[#A9BCD6] hover:text-white'}`}
                >
                  MCQ Quiz Questions ({mcqList.length})
                </button>
              </div>

              <div className="flex items-center space-x-3 text-xs font-mono">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search questions &amp; topics..."
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-[#061329] border border-[#18385E] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00CFFF] w-56 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Sub-tab 1: DSA Problem Bank */}
            {questionSubTab === 'dsa' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Authoring form */}
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
                        className="px-5 py-2 rounded-xl bg-[#00CFFF] hover:bg-cyan-300 text-slate-950 font-mono font-bold transition-all"
                      >
                        Publish to Bank
                      </button>
                    </div>
                  </form>
                </div>

                {/* Published DSA List & Test Cases */}
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#0B1D38] border border-[#18385E]">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-mono font-bold text-xs uppercase">
                        Published DSA Questions ({filteredDsa.length})
                      </h4>
                      <span className="text-[10px] text-[#A9BCD6] font-mono">
                        Click "Interactive Code Console" to test code in Monaco IDE
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                      {filteredDsa.map(q => (
                        <div
                          key={q.id}
                          className="p-3.5 rounded-xl bg-[#061329] border border-[#18385E] hover:border-[#1F497D] space-y-2.5 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-white text-xs">{q.title}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                                  q.difficulty === 'Beginner' ? 'bg-emerald-950 text-emerald-400' :
                                  q.difficulty === 'Intermediate' ? 'bg-amber-950 text-amber-400' :
                                  'bg-rose-950 text-rose-400'
                                }`}>
                                  {q.difficulty}
                                </span>
                                <span className="text-[10px] text-[#00CFFF] font-mono font-bold">
                                  {q.points} pts
                                </span>
                              </div>

                              {/* Assigned Event Badges */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                {q.assigned_events && q.assigned_events.length > 0 ? (
                                  q.assigned_events.map(ev => (
                                    <span 
                                      key={ev.id}
                                      className="px-2 py-0.5 rounded-md bg-[#102746] text-[#00CFFF] text-[10px] font-mono border border-[#00CFFF]/30 flex items-center space-x-1"
                                    >
                                      <Trophy className="w-2.5 h-2.5 text-[#00CFFF]" />
                                      <span>Event: {ev.title}</span>
                                    </span>
                                  ))
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono">
                                    📦 Universal Bank (Unassigned)
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteDSA(q.id, q.title)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="Delete Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick Action Bar for DSA Question */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#18385E]/50">
                            {/* Interactive Monaco Code Console Button */}
                            <button
                              onClick={() => handleOpenConsole(q)}
                              className="px-3 py-1.5 bg-gradient-to-r from-[#00CFFF]/20 to-[#087FFF]/20 hover:from-[#00CFFF]/30 hover:to-[#087FFF]/30 border border-[#00CFFF]/50 text-[#00CFFF] rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shadow-[0_0_10px_rgba(0,207,255,0.15)]"
                            >
                              <Terminal className="w-3.5 h-3.5 text-[#00CFFF]" />
                              <span>Interactive Code Console</span>
                            </button>

                            <div className="flex items-center space-x-2">
                              {/* Assign to event quick button */}
                              <button
                                onClick={() => {
                                  setQuickAssignQuestion(q);
                                  setQuickAssignEventId(eventsList[0]?.id || '');
                                }}
                                className="px-2.5 py-1 bg-[#102746] hover:bg-[#18385E] text-[#A9BCD6] hover:text-white rounded-lg text-[10px] font-mono"
                              >
                                + Assign to Event
                              </button>

                              {/* Manage Test Cases */}
                              <button
                                onClick={() => handleSelectDsa(q.id)}
                                className="px-2.5 py-1 bg-[#102746] hover:bg-[#18385E] text-[#00CFFF] rounded-lg text-[10px] font-mono"
                              >
                                Test Cases ({q.test_count || 0})
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Test Case Manager Box */}
                  {selectedDsaDetail && (
                    <div className="p-4 rounded-2xl bg-[#0B1D38] border border-[#00CFFF]/40 space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-xs">
                          Test Cases for: {selectedDsaDetail.title}
                        </h4>
                        <button
                          onClick={() => setSelectedDsaDetail(null)}
                          className="text-slate-400 hover:text-white"
                        >
                          ✕ Close
                        </button>
                      </div>

                      <form onSubmit={handleAddTestCase} className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <textarea
                            placeholder="Input Data (e.g. 5\n1 2 3 4 5)"
                            rows={3}
                            required
                            value={tcInput}
                            onChange={(e) => setTcInput(e.target.value)}
                            className="p-2 bg-[#061329] border border-[#18385E] rounded text-white text-xs"
                          />
                          <textarea
                            placeholder="Expected Output (e.g. 15)"
                            rows={3}
                            required
                            value={tcOutput}
                            onChange={(e) => setTcOutput(e.target.value)}
                            className="p-2 bg-[#061329] border border-[#18385E] rounded text-white text-xs"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <select
                            value={tcType}
                            onChange={(e) => setTcType(e.target.value)}
                            className="bg-[#061329] border border-[#18385E] rounded p-1.5 text-white text-xs"
                          >
                            <option value="public_sample">Public Sample (Visible in Console)</option>
                            <option value="hidden_test">Hidden Test Case (Judge Scoring)</option>
                          </select>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-[#087FFF] hover:bg-[#00CFFF] text-white hover:text-slate-950 rounded-lg font-bold transition-colors"
                          >
                            + Add Test Case
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
                  <h4 className="text-white font-mono font-bold text-xs uppercase mb-3">
                    Published CTF Challenges ({filteredCtf.length})
                  </h4>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredCtf.map(c => (
                      <div key={c.id} className="p-3.5 rounded-xl bg-[#061329] border border-[#18385E] space-y-2 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white">{c.title}</span>
                            <span className="text-[10px] text-emerald-400 ml-2">[{c.category} • {c.points}pts]</span>
                          </div>
                          <button
                            onClick={() => handleDeleteCTF(c.id, c.title)}
                            className="p-1 text-rose-400 hover:text-rose-300"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Assigned Event Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#18385E]/40">
                          <div className="flex flex-wrap items-center gap-1">
                            {c.assigned_events && c.assigned_events.length > 0 ? (
                              c.assigned_events.map(ev => (
                                <span key={ev.id} className="px-2 py-0.5 rounded bg-[#102746] text-[#00CFFF] text-[10px]">
                                  Event: {ev.title}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                                📦 Universal Bank
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              setQuickAssignQuestion(c);
                              setQuickAssignEventId(eventsList[0]?.id || '');
                            }}
                            className="px-2 py-0.5 bg-[#102746] hover:bg-[#18385E] text-[#A9BCD6] hover:text-white rounded text-[10px]"
                          >
                            + Assign to Event
                          </button>
                        </div>
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
                  <h4 className="text-white font-mono font-bold text-xs uppercase mb-3">
                    Published MCQs ({filteredMcq.length})
                  </h4>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredMcq.map(m => (
                      <div key={m.id} className="p-3.5 rounded-xl bg-[#061329] border border-[#18385E] space-y-2 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white">{m.title || m.prompt?.slice(0, 40)}</span>
                            <span className="text-[10px] text-amber-400 ml-2">[{m.points_positive}pts]</span>
                          </div>
                          <button
                            onClick={() => handleDeleteMCQ(m.id, m.title || `MCQ #${m.id}`)}
                            className="p-1 text-rose-400 hover:text-rose-300"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Assigned Event Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#18385E]/40">
                          <div className="flex flex-wrap items-center gap-1">
                            {m.assigned_events && m.assigned_events.length > 0 ? (
                              m.assigned_events.map(ev => (
                                <span key={ev.id} className="px-2 py-0.5 rounded bg-[#102746] text-[#00CFFF] text-[10px]">
                                  Event: {ev.title}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                                📦 Universal Bank
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              setQuickAssignQuestion(m);
                              setQuickAssignEventId(eventsList[0]?.id || '');
                            }}
                            className="px-2 py-0.5 bg-[#102746] hover:bg-[#18385E] text-[#A9BCD6] hover:text-white rounded text-[10px]"
                          >
                            + Assign to Event
                          </button>
                        </div>
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
            VIEW 7: TEAMS & SQUADS DIRECTORY
            ======================================================================= */}
        {activeTab === 'teams' && (
          <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-mono font-bold text-sm text-white flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-[#00CFFF]" />
                  <span>TEAMS &amp; SQUADS DIRECTORY ({teamList.length})</span>
                </h3>
                <p className="text-xs text-[#A9BCD6] mt-0.5 font-mono">
                  Manage competitive squads, invitations, member rosters, and assigned tournaments.
                </p>
              </div>

              <button
                onClick={() => loadTabData('teams')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#102746] hover:bg-[#18385E] text-[#00CFFF] text-xs font-mono"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Squads</span>
              </button>
            </div>

            {teamList.length === 0 ? (
              <div className="p-8 text-center text-[#A9BCD6] font-mono text-xs border border-dashed border-[#18385E] rounded-xl">
                No teams or squads found for the current event filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamList.map(t => (
                  <div key={t.id} className="p-4 rounded-xl bg-[#061329] border border-[#18385E] space-y-3 font-mono text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-white text-sm block">{t.name}</span>
                        <span className="text-[10px] text-[#A9BCD6]">Squad #{t.id}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#102746] text-[#00CFFF] font-bold">
                        {t.points || 0} pts
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-[#A9BCD6]">
                      <div className="flex justify-between">
                        <span>Tournament:</span>
                        <span className="text-white font-bold">{t.event_title || `Event #${t.event_id}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Leader:</span>
                        <span className="text-emerald-400 font-bold">{t.leader_username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Join Code:</span>
                        <span className="bg-[#102746] px-2 py-0.5 rounded text-[#00CFFF] select-all font-mono">
                          {t.invitation_code}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Roster Size:</span>
                        <span className="text-white">{t.member_count} / {t.max_members}</span>
                      </div>
                    </div>

                    {/* Member pills */}
                    {t.members && t.members.length > 0 && (
                      <div className="pt-2 border-t border-[#18385E]/60 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase block">Operatives:</span>
                        <div className="flex flex-wrap gap-1">
                          {t.members.map((m, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-[#08172B] text-slate-300 border border-[#18385E]">
                              {m.username} {m.role === 'leader' && '👑'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#18385E]/60 flex justify-end">
                      <button
                        onClick={() => handleDeleteTeam(t.id, t.name)}
                        className="px-2.5 py-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded text-[10px] font-mono transition-colors"
                      >
                        Disband Squad
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =======================================================================
            VIEW 8: REGISTRATIONS ROSTER
            ======================================================================= */}
        {activeTab === 'registrations' && (
          <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-mono font-bold text-sm text-white flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-[#00CFFF]" />
                  <span>EVENT REGISTRATIONS &amp; OPERATIVE ROSTERS ({registrationsList.length})</span>
                </h3>
                <p className="text-xs text-[#A9BCD6] mt-0.5 font-mono">
                  Inspect tournament enrolments, participation modes, and squad assignments.
                </p>
              </div>

              <button
                onClick={() => loadTabData('registrations')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#102746] hover:bg-[#18385E] text-[#00CFFF] text-xs font-mono"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Roster</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#08172B] text-[#A9BCD6] uppercase text-[10px] border-b border-[#18385E]">
                  <tr>
                    <th className="p-3">Reg ID</th>
                    <th className="p-3">Operative</th>
                    <th className="p-3">Tournament</th>
                    <th className="p-3">Event Type</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Assigned Squad</th>
                    <th className="p-3">Enrolled At</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#18385E]/60">
                  {registrationsList.map(r => (
                    <tr key={r.id} className="hover:bg-[#102746]/40">
                      <td className="p-3 text-slate-400">#{r.id}</td>
                      <td className="p-3">
                        <span className="text-white font-bold block">{r.username}</span>
                        <span className="text-[10px] text-slate-400 block">{r.email}</span>
                      </td>
                      <td className="p-3 text-[#00CFFF] font-bold">{r.event_title}</td>
                      <td className="p-3 uppercase text-slate-300">{r.event_type}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.mode === 'team' ? 'bg-purple-950 text-purple-400' : 'bg-cyan-950 text-cyan-400'
                        }`}>
                          {r.mode || 'Solo'}
                        </span>
                      </td>
                      <td className="p-3 text-white">
                        {r.team_name ? (
                          <span className="text-emerald-400 font-bold">{r.team_name}</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400">
                        {r.registered_at ? new Date(r.registered_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteRegistration(r.id, r.username, r.event_title)}
                          className="px-2 py-1 rounded text-rose-400 hover:bg-rose-950/40 text-[10px]"
                        >
                          Revoke
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
            VIEW 9: SUBMISSIONS & REJUDGE
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
            VIEW 10: JUDGE OPERATIONS & SANDBOX HEALTH
            ======================================================================= */}
        {activeTab === 'judge_ops' && (
          <div className="space-y-6">
            {/* Real-Time Sandbox Diagnostics */}
            <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4 font-mono text-xs">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#00CFFF]" />
                <span>JUDGE OPERATIONS &amp; SANDBOX ENGINES</span>
              </h3>
              <p className="text-slate-400 text-xs">
                Real-time execution status for isolated compilers, interpreters, and forensic evaluation runtimes.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#061329] border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">Python 3.14 Sandbox</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 font-bold">
                      ● ONLINE
                    </span>
                  </div>
                  <span className="text-[11px] text-[#A9BCD6] block">Process Isolation • Built-in Import Guards</span>
                  <span className="text-[10px] text-slate-500 block">Memory Ceiling: 256 MB • Default Wall Timeout: 2000 ms</span>
                </div>

                <div className="p-4 rounded-xl bg-[#061329] border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">C++ 17 G++ Sandbox</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 font-bold">
                      ● ONLINE
                    </span>
                  </div>
                  <span className="text-[11px] text-[#A9BCD6] block">GCC 13 • -O2 Optimization • Static Linking</span>
                  <span className="text-[10px] text-slate-500 block">Memory Ceiling: 256 MB • Strict Wall Timeout: 2000 ms</span>
                </div>

                <div className="p-4 rounded-xl bg-[#061329] border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">C 11 GCC Sandbox</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 font-bold">
                      ● ONLINE
                    </span>
                  </div>
                  <span className="text-[11px] text-[#A9BCD6] block">GCC 13 • ISO C11 Standards • Temporary Dir</span>
                  <span className="text-[10px] text-slate-500 block">Memory Ceiling: 256 MB • Strict Wall Timeout: 2000 ms</span>
                </div>
              </div>
            </div>

            {/* Recent Submissions Queue */}
            <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-mono font-bold text-xs text-white uppercase">Recent Judge Submissions Queue</h4>
                <button
                  onClick={() => loadTabData('judge_ops')}
                  className="px-2.5 py-1 bg-[#102746] text-[#00CFFF] rounded text-xs font-mono"
                >
                  Refresh Queue
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#08172B] text-[#A9BCD6] uppercase text-[10px] border-b border-[#18385E]">
                    <tr>
                      <th className="p-3">Sub ID</th>
                      <th className="p-3">Cadet</th>
                      <th className="p-3">Target</th>
                      <th className="p-3">Verdict</th>
                      <th className="p-3">Runtime</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#18385E]/60">
                    {submissionList.slice(0, 15).map(sub => (
                      <tr key={sub.id} className="hover:bg-[#102746]/40">
                        <td className="p-3 text-slate-400">#{sub.id}</td>
                        <td className="p-3 text-white font-bold">{sub.user_username || `User #${sub.user_id}`}</td>
                        <td className="p-3 text-[#00CFFF]">{sub.target_id || sub.case_id}</td>
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
                            Re-Evaluate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================================
            VIEW 11: TOURNAMENT LEADERBOARDS & FREEZE CONTROL
            ======================================================================= */}
        {activeTab === 'leaderboards' && (
          <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-6 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>LIVE TOURNAMENT SCOREBOARD &amp; FREEZE CONTROLS</span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Inspect real-time rankings, toggle scoreboard confidentiality, and export official standings.
                </p>
              </div>

              {/* Tournament Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-[#A9BCD6] text-xs">Select Tournament:</span>
                <select
                  value={activeLeaderboardEventId || ''}
                  onChange={async (e) => {
                    const evId = parseInt(e.target.value);
                    setActiveLeaderboardEventId(evId);
                    const lb = await adminService.getEventLeaderboard(evId);
                    setEventLeaderboardData(lb);
                  }}
                  className="px-3 py-1.5 bg-[#061329] border border-[#18385E] rounded-xl text-white font-bold"
                >
                  {eventsList.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      #{ev.id} — {ev.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scoreboard Control & Freeze Header */}
            {eventLeaderboardData && (
              <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <span className="text-white font-bold text-sm">{eventLeaderboardData.event_title}</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    eventLeaderboardData.is_frozen 
                      ? 'bg-amber-950 text-amber-400 border border-amber-500/40' 
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {eventLeaderboardData.is_frozen ? '❄ SCOREBOARD FROZEN' : '● LIVE SCORING ACTIVE'}
                  </span>
                  <span className="text-[10px] text-slate-400">Mode: {eventLeaderboardData.mode}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    disabled={freezeLoading}
                    onClick={handleToggleFreeze}
                    className={`px-4 py-1.5 rounded-xl font-bold transition-all ${
                      eventLeaderboardData.is_frozen
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    {freezeLoading ? 'Toggling...' : eventLeaderboardData.is_frozen ? 'Unfreeze Scoreboard' : 'Freeze Scoreboard'}
                  </button>
                </div>
              </div>
            )}

            {/* Standings Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#08172B] text-[#A9BCD6] uppercase text-[10px] border-b border-[#18385E]">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Competitor / Squad</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Solves</th>
                    <th className="p-3">Score / Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#18385E]/60">
                  {eventLeaderboardData?.standings?.map((st, idx) => (
                    <tr key={idx} className="hover:bg-[#102746]/40">
                      <td className="p-3">
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-[10px] ${
                          idx === 0 ? 'bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.5)]' :
                          idx === 1 ? 'bg-slate-300 text-slate-950' :
                          idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {st.rank || idx + 1}
                        </span>
                      </td>
                      <td className="p-3 text-white font-bold">
                        {st.name || st.username || st.team_name}
                      </td>
                      <td className="p-3 uppercase text-slate-400">{st.entity_type || 'Operative'}</td>
                      <td className="p-3 text-[#00CFFF]">{st.solved_count || 0} solves</td>
                      <td className="p-3 text-emerald-400 font-bold">{st.points} pts</td>
                    </tr>
                  ))}
                  {(!eventLeaderboardData?.standings || eventLeaderboardData.standings.length === 0) && (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-slate-500">
                        No submissions or scores recorded for this event yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =======================================================================
            VIEW 12: RESULTS & OFFICIAL REPORTS
            ======================================================================= */}
        {activeTab === 'results' && (
          <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-6 font-mono text-xs">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span>TOURNAMENT RESULTS &amp; OFFICIAL DOSSIERS</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] space-y-1">
                <span className="text-[10px] text-[#A9BCD6] uppercase block">Total Solves Platform-Wide</span>
                <span className="text-xl font-bold text-emerald-400 block">{metrics.submissionsCount} Solves</span>
              </div>
              <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] space-y-1">
                <span className="text-[10px] text-[#A9BCD6] uppercase block">Enrolled Cadets</span>
                <span className="text-xl font-bold text-white block">{metrics.usersCount} Cadets</span>
              </div>
              <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] space-y-1">
                <span className="text-[10px] text-[#A9BCD6] uppercase block">Registered Teams</span>
                <span className="text-xl font-bold text-[#00CFFF] block">{metrics.teamsCount} Squads</span>
              </div>
            </div>

            <p className="text-slate-400 text-xs">
              Official export dossiers can be downloaded containing submission timestamps, solve verification proofs, and immutable integrity checksums.
            </p>
          </div>
        )}

        {/* =======================================================================
            VIEW 13: BRANDING & EVENT POSTER / BANNERS
            ======================================================================= */}
        {activeTab === 'banners' && (
          <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-6 font-mono text-xs">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-[#00CFFF]" />
              <span>BRANDING &amp; EVENT TOURNAMENT BANNERS</span>
            </h3>

            {/* Official Logo Display */}
            <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] flex items-center space-x-4">
              <img src="/favicon(1).png" alt="Official CyberAnzen Logo" className="w-16 h-16 object-contain" />
              <div>
                <span className="text-white font-bold block text-sm">Official CyberAnzen Shield &amp; Globe Asset</span>
                <span className="text-[#A9BCD6] text-[11px] block">
                  Original brand mark: <code className="text-[#00CFFF]">/favicon(1).png</code>
                </span>
                <span className="text-slate-500 text-[10px] block mt-1">
                  Primary: #061329 (Deep Navy) • Electric Blue: #087FFF • Cyan: #00CFFF
                </span>
              </div>
            </div>

            {/* Tournament Banner Uploader */}
            <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] space-y-4">
              <h4 className="text-white font-bold text-xs uppercase">Tournament Banner Management</h4>
              <form onSubmit={handleBannerUpload} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#A9BCD6] mb-1">Select Tournament:</label>
                    <select
                      value={bannerEventId}
                      onChange={(e) => setBannerEventId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B1D38] border border-[#18385E] rounded-lg text-white"
                    >
                      {eventsList.map(ev => (
                        <option key={ev.id} value={ev.id}>
                          #{ev.id} — {ev.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#A9BCD6] mb-1">Banner Image (PNG, JPG, WebP):</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setBannerFile(e.target.files[0] || null)}
                      className="w-full px-3 py-1.5 bg-[#0B1D38] border border-[#18385E] rounded-lg text-white text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-[#102746] file:text-[#00CFFF]"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={bannerUploading}
                    className="px-4 py-2 bg-[#00CFFF] hover:bg-cyan-300 text-slate-950 font-bold rounded-xl transition-all"
                  >
                    {bannerUploading ? 'Uploading...' : 'Upload Tournament Banner'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveBanner}
                    className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl transition-all"
                  >
                    Remove Banner
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =======================================================================
            VIEW 14: SITE CONTENT
            ======================================================================= */}
        {activeTab === 'content' && (
          <div className="p-6 rounded-2xl bg-[#0B1D38] border border-[#18385E] shadow-xl space-y-4 font-mono text-xs">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-[#00CFFF]" />
              <span>PLATFORM SITE CONTENT &amp; LANDING HERO</span>
            </h3>

            <div className="p-4 rounded-xl bg-[#061329] border border-[#18385E] space-y-3">
              <div>
                <label className="block text-[#A9BCD6] mb-1">Master Landing Headline:</label>
                <input
                  type="text"
                  readOnly
                  value="THE ARENA IS OPEN. THINK YOU CAN BREAK IT? PROVE IT."
                  className="w-full px-3 py-2 bg-[#08172B] border border-[#18385E] rounded-lg text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-[#A9BCD6] mb-1">Supporting Callout:</label>
                <input
                  type="text"
                  readOnly
                  value="Investigate the evidence. Solve the challenge. Write the exploit. Master the code. Climb the leaderboard."
                  className="w-full px-3 py-2 bg-[#08172B] border border-[#18385E] rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* =======================================================================
            VIEW 15: PLATFORM SETTINGS
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
            VIEW 16: AUDIT LOGS
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

      {/* =========================================================================
          INTERACTIVE MONACO PROGRAMMING CONSOLE MODAL
          ========================================================================= */}
      {codingConsoleQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 md:p-6 animate-fade-in">
          <div className="w-full max-w-7xl h-[94vh] bg-[#08172B] border border-[#00CFFF]/40 rounded-2xl flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,207,255,0.2)]">
            
            {/* Modal Top Bar */}
            <div className="p-4 bg-[#061329] border-b border-[#18385E] flex flex-wrap items-center justify-between gap-3 shrink-0 font-mono">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-[#102746] text-[#00CFFF] border border-[#00CFFF]/30">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-bold text-sm md:text-base">
                      {codingConsoleQuestion.title}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#102746] text-[#00CFFF] border border-[#18385E]">
                      DSA Problem #{codingConsoleQuestion.id}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] text-[#A9BCD6] mt-0.5">
                    <span>Difficulty: <strong className="text-white">{codingConsoleQuestion.difficulty}</strong></span>
                    <span>•</span>
                    <span>Points: <strong className="text-white">{codingConsoleQuestion.points}</strong></span>
                    <span>•</span>
                    <span>Time Limit: <strong className="text-[#00CFFF]">{codingConsoleQuestion.time_limit_ms || 2000} ms</strong></span>
                  </div>
                </div>
              </div>

              {/* Language Selection Bar & Close */}
              <div className="flex items-center space-x-3">
                <div className="flex rounded-xl bg-[#061329] p-1 border border-[#18385E]">
                  <button
                    onClick={() => handleConsoleLangChange('python3')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      consoleLang === 'python3' 
                        ? 'bg-[#00CFFF] text-slate-950 shadow-[0_0_10px_rgba(0,207,255,0.4)]' 
                        : 'text-[#A9BCD6] hover:text-white'
                    }`}
                  >
                    Python 3.14
                  </button>
                  <button
                    onClick={() => handleConsoleLangChange('cpp')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      consoleLang === 'cpp' 
                        ? 'bg-[#00CFFF] text-slate-950 shadow-[0_0_10px_rgba(0,207,255,0.4)]' 
                        : 'text-[#A9BCD6] hover:text-white'
                    }`}
                  >
                    C++ 17
                  </button>
                  <button
                    onClick={() => handleConsoleLangChange('c')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      consoleLang === 'c' 
                        ? 'bg-[#00CFFF] text-slate-950 shadow-[0_0_10px_rgba(0,207,255,0.4)]' 
                        : 'text-[#A9BCD6] hover:text-white'
                    }`}
                  >
                    C 11
                  </button>
                </div>

                <button
                  onClick={() => setCodingConsoleQuestion(null)}
                  className="p-2 rounded-xl bg-[#061329] hover:bg-[#102746] text-[#A9BCD6] hover:text-white border border-[#18385E] transition-colors"
                  title="Close Programming Console"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Split Screen (Left: Problem Dossier, Right: Monaco IDE + Output) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              
              {/* LEFT: Problem Dossier & Public Samples (lg:col-span-5) */}
              <div className="lg:col-span-5 border-r border-[#18385E] flex flex-col bg-[#061329] overflow-y-auto p-5 space-y-5 text-xs font-sans">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-[#00CFFF] block tracking-wider">
                    PROBLEM STATEMENT
                  </span>
                  <div className="mt-2 text-slate-200 leading-relaxed whitespace-pre-line font-normal text-xs bg-[#08172B] p-3 rounded-xl border border-[#18385E]">
                    {codingConsoleQuestion.statement || 'No description provided.'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#A9BCD6] block mb-1">Input Format</span>
                    <div className="bg-[#08172B] p-2.5 rounded-lg border border-[#18385E] text-slate-300 text-[11px] whitespace-pre-wrap">
                      {codingConsoleQuestion.input_spec || 'Standard Input'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#A9BCD6] block mb-1">Output Format</span>
                    <div className="bg-[#08172B] p-2.5 rounded-lg border border-[#18385E] text-slate-300 text-[11px] whitespace-pre-wrap">
                      {codingConsoleQuestion.output_spec || 'Standard Output'}
                    </div>
                  </div>
                </div>

                {codingConsoleQuestion.constraints && (
                  <div className="font-mono">
                    <span className="text-[10px] font-bold uppercase text-[#A9BCD6] block mb-1">Constraints</span>
                    <div className="bg-[#08172B] p-2.5 rounded-lg border border-[#18385E] text-slate-400 text-[11px] whitespace-pre-wrap">
                      {codingConsoleQuestion.constraints}
                    </div>
                  </div>
                )}

                {/* Public Samples List */}
                <div className="space-y-3 font-mono">
                  <span className="text-[10px] font-bold uppercase text-[#00CFFF] block tracking-wider">
                    PUBLIC SAMPLE TEST CASES
                  </span>
                  {codingConsoleQuestion.sample_tests && codingConsoleQuestion.sample_tests.length > 0 ? (
                    codingConsoleQuestion.sample_tests.map((st, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#08172B] border border-[#18385E] space-y-2 text-[11px]">
                        <span className="text-[10px] text-emerald-400 font-bold block">Sample Case #{idx + 1}</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase block mb-0.5">Input:</span>
                            <pre className="p-2 rounded bg-[#061329] border border-[#18385E] text-slate-200 overflow-x-auto text-[10px]">
                              {st.input}
                            </pre>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase block mb-0.5">Expected Output:</span>
                            <pre className="p-2 rounded bg-[#061329] border border-[#18385E] text-slate-200 overflow-x-auto text-[10px]">
                              {st.output}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-xl bg-[#08172B] border border-dashed border-[#18385E] text-slate-400 text-center text-[11px]">
                      No public sample test cases configured for this question. Add sample test cases via the Question Bank to enable live evaluation.
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Monaco Editor & Judge Console (lg:col-span-7) */}
              <div className="lg:col-span-7 flex flex-col bg-[#08172B] overflow-hidden">
                
                {/* Editor Top Bar Controls */}
                <div className="p-2.5 bg-[#08172B] border-b border-[#18385E] flex items-center justify-between shrink-0 font-mono text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-bold flex items-center space-x-1.5">
                      <Code2 className="w-4 h-4 text-[#00CFFF]" />
                      <span>Solution Code Editor</span>
                    </span>
                    <button
                      onClick={handleCopyConsoleCode}
                      className="px-2 py-0.5 bg-[#102746] hover:bg-[#18385E] text-[#A9BCD6] rounded text-[10px] flex items-center space-x-1"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <button
                    disabled={consoleRunning}
                    onClick={handleRunConsoleCode}
                    className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-[#00CFFF] to-[#087FFF] hover:opacity-95 shadow-[0_0_15px_rgba(0,207,255,0.4)] disabled:opacity-50 transition-all"
                  >
                    {consoleRunning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Evaluating in Sandbox...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Run Code Against Samples</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Monaco Code Editor Instance */}
                <div className="h-[52%] border-b border-[#18385E] relative">
                  <Editor
                    height="100%"
                    language={consoleLang === 'python3' ? 'python' : consoleLang}
                    value={consoleCode}
                    onChange={(val) => setConsoleCode(val || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 4,
                      suggestOnTriggerCharacters: true
                    }}
                  />
                </div>

                {/* Bottom Judge Diagnostics Output Area */}
                <div className="flex-1 flex flex-col bg-[#061329] p-4 overflow-y-auto font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#18385E] pb-2 shrink-0">
                    <span className="font-bold text-white flex items-center space-x-2">
                      <Terminal className="w-3.5 h-3.5 text-[#00CFFF]" />
                      <span>JUDGE EXECUTION MATRIX</span>
                    </span>
                    {consoleResult && (
                      <div className="flex items-center space-x-3 text-[11px]">
                        <span className={`px-2.5 py-0.5 rounded font-bold uppercase ${
                          consoleResult.verdict === 'ACCEPTED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
                          consoleResult.verdict === 'WRONG ANSWER' ? 'bg-rose-950 text-rose-400 border border-rose-500/40' :
                          'bg-amber-950 text-amber-400 border border-amber-500/40'
                        }`}>
                          {consoleResult.verdict}
                        </span>
                        <span className="text-slate-400">Time: {consoleResult.execution_time_ms} ms</span>
                      </div>
                    )}
                  </div>

                  {/* Empty state */}
                  {!consoleResult && !consoleRunning && !consoleError && (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-2 py-6">
                      <Terminal className="w-8 h-8 text-slate-600" />
                      <p className="text-xs">
                        Click "Run Code Against Samples" to execute your solution in the sandboxed judge engine.
                      </p>
                    </div>
                  )}

                  {/* Running State */}
                  {consoleRunning && (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#00CFFF] space-y-3 py-6">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                      <p className="text-xs font-bold">
                        Spawning sandboxed process • Compiling • Feeding sample inputs...
                      </p>
                    </div>
                  )}

                  {/* Error State */}
                  {consoleError && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs space-y-1">
                      <span className="font-bold block flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>Execution Error:</span>
                      </span>
                      <pre className="text-[11px] whitespace-pre-wrap">{consoleError}</pre>
                    </div>
                  )}

                  {/* Verdict & Test Results Matrix */}
                  {consoleResult && (
                    <div className="space-y-3">
                      {consoleResult.compile_output && (
                        <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-800 text-rose-300 text-[11px]">
                          <span className="font-bold block mb-1">Compiler Output:</span>
                          <pre className="whitespace-pre-wrap">{consoleResult.compile_output}</pre>
                        </div>
                      )}

                      {consoleResult.tests && consoleResult.tests.map((t, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-xl border text-[11px] space-y-1.5 ${
                            t.status === 'PASSED' 
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
                              : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>Sample Test #{idx + 1} ({t.test_id})</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              t.status === 'PASSED' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                            }`}>
                              {t.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                            <div>
                              <span className="text-slate-500 block">Expected:</span>
                              <pre className="p-1.5 rounded bg-[#08172B] border border-[#18385E] text-slate-200 overflow-x-auto">
                                {t.expected_output}
                              </pre>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Your Output:</span>
                              <pre className="p-1.5 rounded bg-[#08172B] border border-[#18385E] text-slate-200 overflow-x-auto">
                                {t.actual_output || '<no output>'}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          QUICK ASSIGN QUESTION MODAL
          ========================================================================= */}
      {quickAssignQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#08172B] border border-[#18385E] rounded-2xl p-6 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Assign Question to Tournament</span>
              <button onClick={() => setQuickAssignQuestion(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-slate-300">
              Attach <strong className="text-[#00CFFF]">"{quickAssignQuestion.title}"</strong> to an active competition event:
            </p>

            <div>
              <label className="block text-[#A9BCD6] mb-1">Target Event Tournament:</label>
              <select
                value={quickAssignEventId}
                onChange={(e) => setQuickAssignEventId(e.target.value)}
                className="w-full p-2 bg-[#061329] border border-[#18385E] rounded-lg text-white font-bold"
              >
                {eventsList.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    #{ev.id} — {ev.title} [{ev.event_type?.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setQuickAssignQuestion(null)}
                className="px-3 py-1.5 bg-[#102746] text-[#A9BCD6] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignQuestionToEvent}
                className="px-4 py-1.5 bg-[#00CFFF] hover:bg-cyan-300 text-slate-950 font-bold rounded-lg"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

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
