import React, { useState, useEffect } from 'react';
import { 
  Settings, Code2, HelpCircle, Shield, Cpu, Users, 
  FileText, Plus, Trash2, CheckCircle2, AlertTriangle, Play, RefreshCw, Key, ShieldAlert,
  Calendar, Upload, Sparkles
} from 'lucide-react';
import { adminService } from '../services/api';
import EventsManagementTab from '../components/admin/EventsManagementTab';
import QuestionImportTab from '../components/admin/QuestionImportTab';

export default function AdminStudio() {
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'imports' | 'dsa' | 'mcq' | 'ctf' | 'dynamic' | 'labs' | 'users' | 'audits'

  // DSA state
  const [dsaList, setDsaList] = useState([]);
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

  // MCQ state
  const [mcqList, setMcqList] = useState([]);
  const [mcqForm, setMcqForm] = useState({
    title: '', prompt: '', question_type: 'single_choice', difficulty: 'Beginner',
    category: 'Cybersecurity', points_positive: 10, points_negative: 0, time_limit_sec: 60,
    explanation: '', options: [
      { id: 1, text: '', is_correct: true, explanation: '' },
      { id: 2, text: '', is_correct: false, explanation: '' }
    ]
  });

  // CTF state
  const [ctfList, setCtfList] = useState([]);
  const [ctfForm, setCtfForm] = useState({
    title: '', description: '', category: 'web', difficulty: 'Beginner',
    points: 100, flag_type: 'static', static_flag: '', has_docker_lab: false,
    docker_image: '', lab_timeout_min: 60, lab_port_exposed: 80
  });

  // Dynamic Generator state
  const [templates, setTemplates] = useState([]);
  const [genSeed, setGenSeed] = useState(42);

  // Users state
  const [userList, setUserList] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmUsername, setConfirmUsername] = useState('');

  // Audits state
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadTabData = async () => {
    try {
      if (activeTab === 'dsa') {
        const data = await adminService.listDSA();
        setDsaList(data);
      } else if (activeTab === 'mcq') {
        const data = await adminService.listMCQs();
        setMcqList(data);
      } else if (activeTab === 'ctf') {
        const data = await adminService.listCTF();
        setCtfList(data);
      } else if (activeTab === 'dynamic') {
        const data = await adminService.listTemplates();
        setTemplates(data);
      } else if (activeTab === 'users') {
        const data = await adminService.listUsers();
        setUserList(data);
      } else if (activeTab === 'audits') {
        const data = await adminService.getAuditLogs();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- DSA Handlers ---
  const handleCreateDsa = async (e) => {
    e.preventDefault();
    try {
      await adminService.createDSA(dsaForm);
      alert('DSA Question created successfully!');
      setDsaForm({
        title: '', statement: '', input_spec: '', output_spec: '', constraints: '',
        difficulty: 'Beginner', category: 'Data Structures & Algorithms', points: 100,
        time_limit_ms: 2000, memory_limit_mb: 256, starter_py: '', starter_cpp: '', starter_c: '',
        reference_solution: '', allow_copy_paste: false
      });
      loadTabData();
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

  const handleValidateReference = async () => {
    if (!selectedDsaId) return;
    try {
      const res = await adminService.validateDSAReference(selectedDsaId);
      if (res.valid) {
        alert(`Validation Passed! 100% of ${res.total_tests} tests accepted by reference solution.`);
      } else {
        alert(`Validation Warning: Verdict ${res.verdict}. Check reference solution or testcases.`);
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Validation failed.');
    }
  };

  // --- MCQ Handlers ---
  const handleCreateMcq = async (e) => {
    e.preventDefault();
    try {
      await adminService.createMCQ(mcqForm);
      alert('MCQ created successfully!');
      loadTabData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create MCQ.');
    }
  };

  // --- CTF Handlers ---
  const handleCreateCtf = async (e) => {
    e.preventDefault();
    try {
      await adminService.createCTF(ctfForm);
      alert('CTF Challenge created successfully!');
      loadTabData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create CTF challenge.');
    }
  };

  // --- User Deletion ---
  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.deleteUser(deleteTarget.id, confirmUsername);
      alert(`User '${deleteTarget.username}' deleted.`);
      setDeleteTarget(null);
      setConfirmUsername('');
      loadTabData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user.');
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 mb-8 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono flex items-center space-x-3">
            <Settings className="w-8 h-8 text-cyan-400" />
            <span>ADMINISTRATION CONTROL CENTER</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Author and configure DSA problems, MCQ quizzes, CTF targets, dynamic generators, and user governance.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap rounded-xl bg-slate-900/80 p-1 border border-slate-800 text-xs font-mono gap-1">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${activeTab === 'events' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Event Builder</span>
          </button>
          <button
            onClick={() => setActiveTab('imports')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${activeTab === 'imports' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Question Imports</span>
          </button>
          <button
            onClick={() => setActiveTab('dsa')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'dsa' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            DSA Studio
          </button>
          <button
            onClick={() => setActiveTab('mcq')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'mcq' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            MCQ Studio
          </button>
          <button
            onClick={() => setActiveTab('ctf')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'ctf' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            CTF Studio
          </button>
          <button
            onClick={() => setActiveTab('dynamic')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'dynamic' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            Dynamic Generator
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            Cadets & Squads
          </button>
          <button
            onClick={() => setActiveTab('audits')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'audits' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'}`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {/* TAB 0: EVENT BUILDER */}
      {activeTab === 'events' && (
        <EventsManagementTab />
      )}

      {/* TAB 0.5: QUESTION IMPORT ENGINE */}
      {activeTab === 'imports' && (
        <QuestionImportTab onQuestionsPublished={loadTabData} />
      )}

      {/* TAB 1: DSA STUDIO */}
      {activeTab === 'dsa' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Creator Form */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>AUTHOR DSA QUESTION</span>
            </h3>
            <form onSubmit={handleCreateDsa} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={dsaForm.title}
                  onChange={(e) => setDsaForm({ ...dsaForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  placeholder="e.g. Inverted Memory Traversal"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Problem Statement (Markdown)</label>
                <textarea
                  required
                  rows={4}
                  value={dsaForm.statement}
                  onChange={(e) => setDsaForm({ ...dsaForm, statement: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  placeholder="Provide complete problem narrative and algorithm objectives..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Input Specification</label>
                  <textarea
                    required
                    rows={2}
                    value={dsaForm.input_spec}
                    onChange={(e) => setDsaForm({ ...dsaForm, input_spec: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Output Specification</label>
                  <textarea
                    required
                    rows={2}
                    value={dsaForm.output_spec}
                    onChange={(e) => setDsaForm({ ...dsaForm, output_spec: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Difficulty</label>
                  <select
                    value={dsaForm.difficulty}
                    onChange={(e) => setDsaForm({ ...dsaForm, difficulty: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Points</label>
                  <input
                    type="number"
                    value={dsaForm.points}
                    onChange={(e) => setDsaForm({ ...dsaForm, points: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Time Limit (ms)</label>
                  <input
                    type="number"
                    value={dsaForm.time_limit_ms}
                    onChange={(e) => setDsaForm({ ...dsaForm, time_limit_ms: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Trusted Python 3 Reference Solution</label>
                <textarea
                  rows={4}
                  value={dsaForm.reference_solution}
                  onChange={(e) => setDsaForm({ ...dsaForm, reference_solution: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-cyan-300 font-mono text-xs"
                  placeholder="# Python 3 reference solution..."
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="cp_toggle"
                  checked={dsaForm.allow_copy_paste}
                  onChange={(e) => setDsaForm({ ...dsaForm, allow_copy_paste: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-cyan-500"
                />
                <label htmlFor="cp_toggle" className="text-slate-300 font-mono">
                  Permit Clipboard Copy/Paste for Exam Candidates
                </label>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-2.5 rounded-xl font-bold font-mono text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
              >
                Publish Question Dossier
              </button>
            </form>
          </div>

          {/* Test Case Manager & Inspection */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <h3 className="text-base font-bold text-white font-mono mb-3">
                EXISTING DSA QUESTIONS ({dsaList.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto font-mono text-xs">
                {dsaList.map(q => (
                  <button
                    key={q.id}
                    onClick={() => handleSelectDsa(q.id)}
                    className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                      selectedDsaId === q.id
                        ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{q.title}</span>
                    <span className="text-[10px] text-slate-400">{q.test_count} Tests • {q.points} pts</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedDsaDetail && (
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white font-mono">
                    TEST CASE MANAGER: {selectedDsaDetail.title}
                  </h4>
                  <button
                    onClick={handleValidateReference}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-purple-950/60 text-purple-300 border border-purple-800 hover:bg-purple-900/40"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Validate Reference</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto font-mono text-xs">
                  {selectedDsaDetail.test_cases?.map(tc => (
                    <div key={tc.id} className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300">#{tc.index} [{tc.type}]</span>
                      <button
                        onClick={async () => {
                          await adminService.deleteDSATestCase(tc.id);
                          const updated = await adminService.getDSA(selectedDsaId);
                          setSelectedDsaDetail(updated);
                        }}
                        className="text-rose-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddTestCase} className="space-y-2 pt-2 border-t border-slate-800 font-mono text-xs">
                  <span className="text-[10px] text-slate-400 uppercase block">Add Testcase</span>
                  <select
                    value={tcType}
                    onChange={(e) => setTcType(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-300"
                  >
                    <option value="public_sample">Public Sample (Visible to cadets)</option>
                    <option value="hidden_test">Hidden Test (Strict evaluation only)</option>
                  </select>
                  <textarea
                    required
                    rows={2}
                    placeholder="Standard Input..."
                    value={tcInput}
                    onChange={(e) => setTcInput(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-300"
                  />
                  <textarea
                    required
                    rows={2}
                    placeholder="Expected Output..."
                    value={tcOutput}
                    onChange={(e) => setTcOutput(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-300"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700"
                  >
                    + Append Test Case
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MCQ STUDIO */}
      {activeTab === 'mcq' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
              <Plus className="w-4 h-4 text-purple-400" />
              <span>AUTHOR MCQ QUIZ</span>
            </h3>
            <form onSubmit={handleCreateMcq} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={mcqForm.title}
                  onChange={(e) => setMcqForm({ ...mcqForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  placeholder="e.g. TCP SYN Flood & Half-Open Sockets"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Question Prompt</label>
                <textarea
                  required
                  rows={3}
                  value={mcqForm.prompt}
                  onChange={(e) => setMcqForm({ ...mcqForm, prompt: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-slate-400 font-mono">Answer Options & Correct Key</label>
                {mcqForm.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={opt.is_correct}
                      onChange={(e) => {
                        const newOpts = [...mcqForm.options];
                        newOpts[idx].is_correct = e.target.checked;
                        setMcqForm({ ...mcqForm, options: newOpts });
                      }}
                      className="rounded bg-slate-950 border-slate-800 text-purple-500"
                    />
                    <input
                      type="text"
                      required
                      placeholder={`Option ${idx + 1}...`}
                      value={opt.text}
                      onChange={(e) => {
                        const newOpts = [...mcqForm.options];
                        newOpts[idx].text = e.target.value;
                        setMcqForm({ ...mcqForm, options: newOpts });
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextId = mcqForm.options.length + 1;
                  setMcqForm({
                    ...mcqForm,
                    options: [...mcqForm.options, { id: nextId, text: '', is_correct: false, explanation: '' }]
                  });
                }}
                className="text-xs text-purple-400 hover:underline font-mono"
              >
                + Add Another Option
              </button>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Points (+)</label>
                  <input
                    type="number"
                    value={mcqForm.points_positive}
                    onChange={(e) => setMcqForm({ ...mcqForm, points_positive: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Penalty (-)</label>
                  <input
                    type="number"
                    value={mcqForm.points_negative}
                    onChange={(e) => setMcqForm({ ...mcqForm, points_negative: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-2.5 rounded-xl font-bold font-mono text-slate-950 bg-purple-400 hover:bg-purple-300 transition-colors"
              >
                Publish MCQ Assessment
              </button>
            </form>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-white font-mono mb-4">
              ACTIVE MCQS ({mcqList.length})
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto font-mono text-xs">
              {mcqList.map(m => (
                <div key={m.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{m.title}</span>
                    <span className="text-emerald-400">+{m.points_positive} pts</span>
                  </div>
                  <p className="text-slate-400 font-sans text-xs">{m.prompt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CTF STUDIO */}
      {activeTab === 'ctf' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>AUTHOR CTF CHALLENGE</span>
            </h3>
            <form onSubmit={handleCreateCtf} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Challenge Title</label>
                <input
                  type="text"
                  required
                  value={ctfForm.title}
                  onChange={(e) => setCtfForm({ ...ctfForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  placeholder="e.g. Broken JWT Infiltration"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Mission Briefing (Markdown)</label>
                <textarea
                  required
                  rows={4}
                  value={ctfForm.description}
                  onChange={(e) => setCtfForm({ ...ctfForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Category</label>
                  <select
                    value={ctfForm.category}
                    onChange={(e) => setCtfForm({ ...ctfForm, category: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  >
                    <option value="web">Web Exploitation</option>
                    <option value="crypto">Cryptography</option>
                    <option value="forensics">Digital Forensics</option>
                    <option value="pwn">Binary Exploitation</option>
                    <option value="reverse">Reverse Engineering</option>
                    <option value="osint">OSINT</option>
                    <option value="network">Network Analysis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Difficulty</label>
                  <select
                    value={ctfForm.difficulty}
                    onChange={(e) => setCtfForm({ ...ctfForm, difficulty: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Points</label>
                  <input
                    type="number"
                    value={ctfForm.points}
                    onChange={(e) => setCtfForm({ ...ctfForm, points: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Static Flag Secret (Optional if dynamic)</label>
                <input
                  type="text"
                  value={ctfForm.static_flag}
                  onChange={(e) => setCtfForm({ ...ctfForm, static_flag: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-cyan-300 font-mono"
                  placeholder="FLAG{CYBERANZEN_SECRET}"
                />
              </div>

              {/* Docker Lab toggle */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="lab_toggle"
                    checked={ctfForm.has_docker_lab}
                    onChange={(e) => setCtfForm({ ...ctfForm, has_docker_lab: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500"
                  />
                  <label htmlFor="lab_toggle" className="text-white font-mono font-bold text-xs">
                    Attach Interactive Docker Lab Environment
                  </label>
                </div>

                {ctfForm.has_docker_lab && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Docker Image (e.g. alpine:latest)"
                      value={ctfForm.docker_image}
                      onChange={(e) => setCtfForm({ ...ctfForm, docker_image: e.target.value })}
                      className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Exposed Port (e.g. 80)"
                      value={ctfForm.lab_port_exposed}
                      onChange={(e) => setCtfForm({ ...ctfForm, lab_port_exposed: parseInt(e.target.value) })}
                      className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-2.5 rounded-xl font-bold font-mono text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
              >
                Publish CTF Target
              </button>
            </form>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-white font-mono mb-4">
              ACTIVE CTF CHALLENGES ({ctfList.length})
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto font-mono text-xs">
              {ctfList.map(c => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{c.title}</span>
                    <span className="text-cyan-400">{c.points} pts</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                    <span className="uppercase">{c.category}</span>
                    {c.has_docker_lab && <span className="text-emerald-400">• Docker Lab</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CADETS & SQUADS */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <h3 className="text-base font-bold text-white font-mono mb-4">
            CADET & OPERATIVE GOVERNANCE ({userList.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Username</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Points</th>
                  <th className="pb-3">Squad</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {userList.map(u => (
                  <tr key={u.id} className="text-slate-300">
                    <td className="py-3">{u.id}</td>
                    <td className="py-3 font-bold text-white">{u.username}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 text-[10px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-cyan-400 font-bold">{u.points}</td>
                    <td className="py-3">{u.team ? u.team.team_name : 'Solo'}</td>
                    <td className="py-3">
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="text-rose-400 hover:text-rose-300 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Delete User Modal */}
          {deleteTarget && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-rose-800/80 shadow-2xl space-y-4">
                <div className="flex items-center space-x-2 text-rose-400 font-mono font-bold">
                  <AlertTriangle className="w-5 h-5" />
                  <span>CONFIRM CADET TERMINATION</span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Permanently deleting account ID {deleteTarget.id} (callsign: <span className="font-mono font-bold text-white">{deleteTarget.username}</span>).
                  Type the exact username below to execute cascade wipe:
                </p>
                <input
                  type="text"
                  placeholder={deleteTarget.username}
                  value={confirmUsername}
                  onChange={(e) => setConfirmUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-mono"
                />
                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    onClick={() => { setDeleteTarget(null); setConfirmUsername(''); }}
                    className="px-4 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={confirmUsername !== deleteTarget.username}
                    className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-40"
                  >
                    Confirm Wipe
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audits' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <h3 className="text-base font-bold text-white font-mono mb-4">
            IMMUTABLE SYSTEM AUDIT LOGS ({auditLogs.length})
          </h3>
          <div className="space-y-2 font-mono text-xs max-h-[600px] overflow-y-auto">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-cyan-400">{log.action}</span>
                    <span className="text-[10px] text-slate-500">by {log.actor_username || 'SYSTEM'}</span>
                  </div>
                  <p className="text-slate-300 font-sans text-xs">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
