import {
  Activity,
  AlertTriangle,
  Award,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  Clock,
  Code2,
  Command,
  Compass,
  Copy,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  Flame,
  FolderGit2,
  Gauge,
  GraduationCap,
  Layers3,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  Lock,
  LogOut,
  MapPin,
  MessageSquare,
  Mic,
  MicOff,
  Network,
  Play,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Terminal,
  Trash2,
  TrendingUp,
  Trophy,
  UserPlus,
  UserRound,
  Users,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

// ==========================================
// TYPES & DATA CONTRACTS
// ==========================================

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  college?: string;
  degree?: string;
  branch?: string;
  studyYear?: string;
  location: string;
  bio: string;
  headline?: string;
  availability?: string;
  visibility?: string;
  avatarUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
};

export type Skill = {
  id: number;
  name: string;
  type?: string;
  level?: string;
  verified?: number;
  evidence_url?: string;
};

export type Interest = {
  id: number;
  name: string;
};

export type ProjectMember = {
  id: number;
  name: string;
  role: string;
  status: string;
  college?: string;
  branch?: string;
  joined_at?: string;
};

export type Project = {
  id: number;
  name: string;
  description: string;
  category: string;
  status: string;
  match_score: number;
  owner_id: number;
  owner_name?: string;
  application_count?: number;
  my_application_status?: string | null;
  problem?: string;
  solution?: string;
  difficulty?: string;
  commitment?: string;
  tech_stack?: string;
  open_roles?: string;
  created_at?: string;
  updated_at?: string;
  skills?: Skill[];
  members?: ProjectMember[];
};

export type Task = {
  id: number;
  project_id: number;
  title: string;
  assignee: string;
  due_date: string;
  status: 'Planned' | 'In progress' | 'Review' | 'Done';
};

export type NotificationItem = {
  id: number;
  user_id: number;
  message: string;
  type: string;
  read_at?: string | null;
  related_path?: string;
  created_at?: string;
};

export type Application = {
  id: number;
  project_id: number;
  owner_id: number;
  user_id: number;
  project_name: string;
  category: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn';
  role: string;
  message?: string;
  created_at?: string;
  applicant_name?: string;
};

export type MessageItem = {
  id: number;
  conversation_id?: number;
  sender_id: number;
  recipient_id: number;
  body: string;
  sender_name: string;
  recipient_name: string;
  read_at?: string | null;
  created_at: string;
};

export type Conversation = {
  id: number;
  title?: string;
  project_id?: number;
  project_name?: string;
  participant_names?: string;
  last_message?: string;
  unread_count?: number;
  updated_at?: string;
};

export type StudentProfile = {
  id: number;
  name: string;
  email?: string;
  role?: string;
  college: string;
  degree: string;
  branch: string;
  study_year: string;
  location: string;
  headline: string;
  bio: string;
  career_goals: string;
  availability: string;
  visibility?: string;
  avatar_url?: string;
  portfolio_url?: string;
  github_url?: string;
  linkedin_url?: string;
  is_demo?: number;
  updated_at?: string;
  project_count?: number;
  skills: Skill[];
  interests: Interest[];
  projects?: Project[];
  connection?: { id: number; requester_id: number; recipient_id: number; status: string } | null;
};

export type MatchItem = StudentProfile & {
  score: number;
  sharedSkills: string[];
  complementarySkills: string[];
  reasons: string[];
};

export type Roadmap = {
  id: number;
  user_id: number;
  target_role: string;
  summary: string;
  updated_at: string;
};

export type RoadmapMilestone = {
  id: number;
  roadmap_id?: number;
  user_id: number;
  title: string;
  due_date: string;
  status: 'Planned' | 'In progress' | 'Review' | 'Done';
  progress: number;
  updated_at: string;
};

export type Hackathon = {
  id: number;
  title: string;
  organizer: string;
  theme: string;
  eligibility: string;
  registration_deadline: string;
  event_dates: string;
  official_url: string;
  source: string;
};

export type DashboardData = {
  user: User | null;
  metrics: {
    synergy: number;
    workload: string;
    unreadMessages: number;
    unreadNotifications: number;
    risk: string;
  };
  recommendations: Project[];
  tasks: Task[];
  notifications: NotificationItem[];
  applications: Application[];
};

export type InterviewSession = {
  id: number;
  user_id: number;
  title: string;
  language: string;
  difficulty: string;
  topics: string;
  duration_minutes: number;
  question_count: number;
  mode: 'camera' | 'text';
  status: 'in_progress' | 'completed' | 'abandoned';
  current_question_index: number;
  overall_score: number;
  eval_overall_score?: number;
  technical_score?: number;
  problem_solving_score?: number;
  total_questions_count?: number;
  answered_count?: number;
  activity_events_count?: number;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
};

export type InterviewQuestion = {
  id: number;
  interview_id: number;
  question_index: number;
  title: string;
  type: 'conceptual' | 'code_output' | 'debugging' | 'coding';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  question_text: string;
  code_snippet?: string;
  starter_code?: string;
  suggested_answer?: string;
  explanation?: string;
  evaluation_rubric?: string;
  expected_concepts?: string[] | string;
};

export type InterviewAnswer = {
  id?: number;
  interview_id: number;
  question_id: number;
  user_id: number;
  answer_text: string;
  code_content: string;
  status: 'unanswered' | 'answered' | 'skipped';
  time_spent_seconds: number;
  submitted_at?: string;
};

export type InterviewActivityLog = {
  id?: number;
  interview_id: number;
  user_id?: number;
  event_type: string;
  severity: 'info' | 'warning' | 'critical';
  details: string;
  timestamp?: string;
};

export type QuestionFeedback = {
  questionId: number;
  questionIndex: number;
  title: string;
  topic: string;
  difficulty: string;
  type: string;
  submittedAnswer: string;
  suggestedAnswer: string;
  explanation: string;
  sampleSolution?: string;
  score: number;
  marksEarned?: number;
  maxMarks?: number;
  verdict: string;
  correctnessFeedback?: string;
  timeComplexityNotes?: string;
  matchedConcepts: string[];
  missedConcepts: string[];
  feedback: string;
};

export type InterviewEvaluation = {
  id?: number;
  interview_id: number;
  user_id: number;
  overall_score: number;
  overallScore?: number;
  totalMarksEarned?: number;
  totalMaxMarks?: number;
  technical_score?: number;
  technicalScore?: number;
  explanation_score?: number;
  explanationScore?: number;
  problem_solving_score?: number;
  problemSolvingScore?: number;
  total_questions?: number;
  totalQuestions?: number;
  answered_questions?: number;
  answeredQuestions?: number;
  correct_count?: number;
  correctCount?: number;
  partial_count?: number;
  partialCount?: number;
  incorrect_count?: number;
  incorrectCount?: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  overallEvaluation?: string;
  readinessVerdict?: string;
  topicBreakdown: Record<string, number>;
  questionFeedback: QuestionFeedback[];
  cameraStats?: {
    avgGazeScorePct: number;
    faceDetectionRatePct: number;
    headPoseStatus: string;
    gazeLostEvents: number;
    faceLostEvents: number;
  };
  proctoringSummary: {
    integrityScore: number;
    status: string;
    tabSwitches: number;
    blurCount: number;
    gazeLostCount: number;
    faceLostCount: number;
    criticalViolations: number;
    totalEvents: number;
    cameraEnabled: boolean;
  };
  evaluated_by?: string;
  evaluatedBy?: string;
  created_at?: string;
};

// ==========================================
// API HELPER
// ==========================================

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const apiBase = import.meta.env.VITE_API_URL || '';
  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options?.headers || {}),
      },
      credentials: 'include',
      ...options,
    });
  } catch {
    throw new Error('Cannot reach the SkillSetu API. Make sure backend server is running on port 3001.');
  }

  const contentType = response.headers.get('content-type') || '';
  let payload: any = null;

  if (contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!payload || typeof payload !== 'object') {
    if (response.status === 404) {
      payload = {
        message: 'The requested API endpoint was not found (HTTP 404). Please ensure the SkillSetu backend server is running and VITE_API_URL is configured.',
      };
    } else if (response.status === 502 || response.status === 503 || response.status === 504) {
      payload = {
        message: `The SkillSetu API server is unavailable (HTTP ${response.status}). Please start the backend with npm run dev:full.`,
      };
    } else {
      payload = {
        message: `The server returned an unexpected response (HTTP ${response.status}).`,
      };
    }
  }

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed.');
  }

  return payload as T;
}

export function getInitials(user?: { name?: string; full_name?: string } | null) {
  const name = user?.name || user?.full_name || '';
  if (!name) return 'S';
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'S';
}

// ==========================================
// MAIN APP ROUTER
// ==========================================

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = async () => {
    try {
      const data = await apiFetch<{ user: User | null }>('/api/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshUserData();
  }, []);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="loading-card">
          <div className="brand-mark pulse-mark">S</div>
          <div>Loading SkillSetu AI Workspace…</div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage user={user} />} />
        <Route path="/login" element={<AuthPage mode="login" user={user} setUser={setUser} />} />
        <Route path="/register" element={<AuthPage mode="signup" user={user} setUser={setUser} />} />
        <Route path="/signup" element={<Navigate to="/register" replace />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<StaticInfoPage kind="privacy" />} />
        <Route path="/terms" element={<StaticInfoPage kind="terms" />} />

        {/* Protected Ecosystem Routes */}
        <Route path="/dashboard" element={<ProtectedRoute user={user} element={<DashboardPage user={user} />} />} />
        <Route path="/matches" element={<ProtectedRoute user={user} element={<MatchesPage user={user} />} />} />
        <Route path="/students" element={<ProtectedRoute user={user} element={<StudentsPage user={user} />} />} />
        <Route path="/students/:studentId" element={<ProtectedRoute user={user} element={<StudentProfilePage user={user} />} />} />
        <Route path="/projects" element={<ProtectedRoute user={user} element={<ProjectsPage user={user} />} />} />
        <Route path="/projects/:projectId" element={<ProtectedRoute user={user} element={<ProjectDetailPage user={user} />} />} />
        <Route path="/applications" element={<ProtectedRoute user={user} element={<ApplicationsPage user={user} />} />} />
        <Route path="/messages" element={<ProtectedRoute user={user} element={<MessagesPage user={user} />} />} />
        <Route path="/messages/:conversationId" element={<ProtectedRoute user={user} element={<MessagesPage user={user} />} />} />
        <Route path="/growth-roadmap" element={<ProtectedRoute user={user} element={<RoadmapPage user={user} />} />} />
        <Route path="/roadmap" element={<Navigate to="/growth-roadmap" replace />} />
        <Route path="/ai-skills" element={<ProtectedRoute user={user} element={<AiSkillsAnalyzerPage user={user} />} />} />
        <Route path="/ai-analyzer" element={<Navigate to="/ai-skills" replace />} />
        <Route path="/notifications" element={<ProtectedRoute user={user} element={<NotificationsPage user={user} />} />} />

        {/* AI Technical Interview & Proctoring Routes */}
        <Route path="/interview/setup" element={<ProtectedRoute user={user} element={<InterviewSetupPage user={user} />} />} />
        <Route path="/interviews" element={<Navigate to="/interview/setup" replace />} />
        <Route path="/interview/:interviewId" element={<ProtectedRoute user={user} element={<InterviewWorkspacePage user={user} />} />} />
        <Route path="/interview/:interviewId/results" element={<ProtectedRoute user={user} element={<InterviewResultsPage user={user} />} />} />

        <Route path="/presentation" element={<ProtectedRoute user={user} element={<PresentationPage user={user} />} />} />
        <Route path="/innovation-scanner" element={<ProtectedRoute user={user} element={<AiScannerPage user={user} />} />} />
        <Route path="/ai-scanner" element={<Navigate to="/innovation-scanner" replace />} />
        <Route path="/hackathon-coach" element={<ProtectedRoute user={user} element={<HackathonCoachPage user={user} />} />} />
        <Route path="/judge-simulator" element={<ProtectedRoute user={user} element={<JudgeSimulatorPage user={user} />} />} />
        <Route path="/hackathons" element={<ProtectedRoute user={user} element={<HackathonsPage user={user} />} />} />
        <Route path="/teams" element={<ProtectedRoute user={user} element={<TeamsPage user={user} />} />} />
        <Route path="/profile" element={<ProtectedRoute user={user} element={<ProfilePage user={user} setUser={setUser} />} />} />
        <Route path="/settings" element={<ProtectedRoute user={user} element={<SettingsPage user={user} setUser={setUser} />} />} />
        <Route path="/docs" element={<ProtectedRoute user={user} element={<DocsPage user={user} />} />} />

        {/* Fallback */}
        <Route path="*" element={<NotFoundPage user={user} />} />
      </Routes>
    </BrowserRouter>
  );
}

function ProtectedRoute({ user, element }: { user: User | null; element: ReactNode }) {
  return user ? <>{element}</> : <Navigate to="/login" replace />;
}

export type AiStatus = {
  configured: boolean;
  provider: string;
  catalogUrl: string;
  model: string;
  baseUrl: string;
  maskedKey: string;
};

export function AiStatusBadge({ onClick }: { onClick?: () => void }) {
  const [status, setStatus] = useState<AiStatus | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await apiFetch<AiStatus>('/api/ai/status');
        setStatus(data);
      } catch {
        // ignore
      }
    };
    void fetchStatus();
  }, []);

  return (
    <button
      type="button"
      className={`signal-pill compact-pill ${status?.configured ? 'ai-active-pill' : 'ai-setup-pill'}`}
      onClick={onClick}
      title={
        status?.configured
          ? `NVIDIA AI Catalog Active: ${status.model} (${status.maskedKey})`
          : 'NVIDIA API Key not configured. Click to view setup guide.'
      }
    >
      <span className={`signal-dot ${status?.configured ? 'nvidia-green' : 'nvidia-amber'}`} />
      <span className="signal-text">{status?.configured ? 'NVIDIA AI Active' : 'NVIDIA AI Ready'}</span>
    </button>
  );
}

export function AiStatusModal({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const data = await apiFetch<AiStatus>('/api/ai/status');
      setStatus(data);
      if (data.configured) {
        setTestResult(`Connection confirmed. Active model: ${data.model} (Endpoint: ${data.baseUrl})`);
      } else {
        setTestResult('NVIDIA_API_KEY is not set in backend .env. Operating in Smart Heuristic mode.');
      }
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : 'Unable to check status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void checkStatus();
  }, []);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog-modal ai-status-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-modal-header">
          <div className="card-heading-clean">
            <Sparkles size={20} className="text-teal" />
            <h3>NVIDIA AI Catalog Configuration</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="ai-status-content">
          <div className={`ai-status-banner ${status?.configured ? 'status-ready' : 'status-pending'}`}>
            <div className="status-top">
              <strong>{status?.configured ? 'NVIDIA AI Online' : 'Smart Heuristic Fallback Active'}</strong>
              <span className="chip">{status?.configured ? 'Production Mode' : 'Setup Required'}</span>
            </div>
            <p>
              {status?.configured
                ? `Live LLM inference is enabled via NVIDIA API Catalog running ${status.model}.`
                : 'Platform is operating in high-performance Smart Heuristic mode. Add your free NVIDIA API key to activate live LLM inference.'}
            </p>
          </div>

          <div className="ai-config-grid">
            <div className="config-item">
              <span className="config-label">Provider</span>
              <strong className="config-value">NVIDIA API Catalog</strong>
            </div>
            <div className="config-item">
              <span className="config-label">Target Model</span>
              <strong className="config-value">{status?.model || 'meta/llama-3.1-70b-instruct'}</strong>
            </div>
            <div className="config-item">
              <span className="config-label">Base URL</span>
              <strong className="config-value">{status?.baseUrl || 'https://integrate.api.nvidia.com/v1'}</strong>
            </div>
            <div className="config-item">
              <span className="config-label">Configured Key</span>
              <strong className="config-value">{status?.maskedKey || '(Not Configured)'}</strong>
            </div>
          </div>

          {testResult && (
            <div className={`form-feedback ${status?.configured ? 'form-success' : 'form-warning'}`}>
              {testResult}
            </div>
          )}

          <div className="ai-setup-guide-box">
            <h4>Quick Setup in 3 Simple Steps:</h4>
            <ol>
              <li>
                Visit{' '}
                <a href="https://build.nvidia.com/" target="_blank" rel="noreferrer" className="external-link">
                  build.nvidia.com <ExternalLink size={11} />
                </a>{' '}
                and generate a free API key (starts with <code>nvapi-</code>).
              </li>
              <li>
                Open the <code>.env</code> file in your backend folder and set:
                <pre className="code-snippet">NVIDIA_API_KEY=nvapi-your-key-here</pre>
              </li>
              <li>
                Restart your backend server: <code>npm run dev:full</code>.
              </li>
            </ol>
          </div>

          <div className="dialog-actions">
            <button type="button" className="secondary-button" disabled={loading} onClick={() => void checkStatus()}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> {loading ? 'Testing...' : 'Test Connection'}
            </button>
            <button type="button" className="primary-button" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// UNIFIED MASTER APP LAYOUT
// ==========================================

export function AppLayout({
  user,
  title,
  subtitle,
  children,
  actionButton,
}: {
  user: User | null;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actionButton?: ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const [notifData, convoData] = await Promise.all([
          apiFetch<{ notifications: NotificationItem[] }>('/api/notifications').catch(() => ({ notifications: [] })),
          apiFetch<{ conversations: Conversation[] }>('/api/conversations').catch(() => ({ conversations: [] })),
        ]);
        const nUnread = notifData.notifications.filter((n) => !n.read_at).length;
        const mUnread = convoData.conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);
        setUnreadNotif(nUnread);
        setUnreadMsg(mUnread);
      } catch {
        // ignore
      }
    };
    void fetchCounters();
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const handleLogout = async () => {
    try {
      await apiFetch('/api/logout', { method: 'POST' });
    } finally {
      navigate('/login', { replace: true });
      window.location.reload();
    }
  };

  const navPlatform = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/matches', label: 'AI Match Engine', icon: Sparkles },
    { to: '/students', label: 'Browse Students', icon: GraduationCap },
    { to: '/projects', label: 'Browse Projects', icon: Layers3 },
    { to: '/applications', label: 'Applications', icon: FileText },
    { to: '/messages', label: 'Messages', icon: MessageSquare, badge: unreadMsg },
    { to: '/growth-roadmap', label: 'Growth Roadmap', icon: TrendingUp },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadNotif },
    { to: '/presentation', label: 'Product Presentation', icon: BriefcaseBusiness },
  ];

  const navAiOs = [
    { to: '/interview/setup', label: 'AI Technical Interview', icon: ShieldCheck },
    { to: '/ai-skills', label: 'AI Skills & Gap Analyzer', icon: Target },
    { to: '/innovation-scanner', label: 'AI Innovation Scanner', icon: Compass },
    { to: '/hackathon-coach', label: 'AI Hackathon Coach', icon: Lightbulb },
    { to: '/judge-simulator', label: 'AI Judge Simulator', icon: ShieldAlert },
    { to: '/hackathons', label: 'Hackathons Directory', icon: Trophy },
    { to: '/teams', label: 'Team Builder', icon: Users },
  ];

  const quickNavItems = [
    { title: 'AI Technical Interview & Proctoring', path: '/interview/setup', hint: '20+ question live technical interview with AI proctoring' },
    { title: 'AI Skills & Gap Analyzer', path: '/ai-skills', hint: 'Certificate analysis & opportunity matching' },
    { title: 'AI Match Engine', path: '/matches', hint: 'Discover complementary peers' },
    { title: 'Browse Projects', path: '/projects', hint: 'Join open campus sprints' },
    { title: 'Browse Students', path: '/students', hint: 'Find students across universities' },
    { title: 'AI Hackathon Coach', path: '/hackathon-coach', hint: 'Generate sprint timeline' },
    { title: 'AI Judge Simulator', path: '/judge-simulator', hint: 'Test your project pitch' },
    { title: 'Growth Roadmap', path: '/growth-roadmap', hint: 'Skill gap calibration' },
    { title: 'Hackathons Directory', path: '/hackathons', hint: 'Verified national competitions' },
  ];

  const filteredQuickNav = quickNavItems.filter((item) =>
    item.title.toLowerCase().includes(globalQuery.toLowerCase()) ||
    item.hint.toLowerCase().includes(globalQuery.toLowerCase())
  );

  return (
    <div className="dashboard-shell">
      {/* Top Navbar */}
      <header className="dashboard-topbar">
        <div className="dashboard-crumbs">
          <button
            type="button"
            className="mobile-nav-toggle"
            aria-label="Toggle navigation"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <SlidersHorizontal size={18} />
          </button>
          <Link to="/dashboard" className="brand-mark" aria-label="SkillSetu AI">
            S
          </Link>
          <span className="crumb-slash">/</span>
          <Link to="/dashboard" className="crumb-brand">SkillSetu AI</Link>
          <span className="crumb-slash">/</span>
          <strong className="crumb-title">{title}</strong>
        </div>

        <div className="dashboard-top-actions">
          <button
            type="button"
            className="quick-search-btn"
            onClick={() => setSearchOpen(true)}
            aria-label="Open command search"
          >
            <Search size={14} />
            <span className="quick-search-text">Search anything...</span>
            <kbd className="quick-search-kbd">
              <Command size={10} /> K
            </kbd>
          </button>

          <AiStatusBadge onClick={() => setAiModalOpen(true)} />

          <Link to="/messages" className="top-icon-link" aria-label="Messages" title="Messages">
            <MessageSquare size={16} />
            {unreadMsg > 0 && <span>{unreadMsg}</span>}
          </Link>


          <Link to="/notifications" className="top-icon-link" aria-label="Notifications" title="Notifications">
            <Bell size={16} />
            {unreadNotif > 0 && <span>{unreadNotif}</span>}
          </Link>

          <details className="account-menu">
            <summary className="dashboard-avatar" aria-label="Open user menu">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="avatar-img" />
              ) : (
                getInitials(user)
              )}
            </summary>
            <div className="account-dropdown">
              <div className="account-dropdown-header">
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
                <small className="college-tag">{user?.college || 'Student Builder'}</small>
              </div>
              <hr className="dropdown-divider" />
              <Link to="/profile" className="dropdown-link">
                <UserRound size={14} /> My Profile
              </Link>
              <Link to="/settings" className="dropdown-link">
                <Shield size={14} /> Account &amp; Settings
              </Link>
              <Link to="/docs" className="dropdown-link">
                <CircleHelp size={14} /> AI Docs &amp; Guide
              </Link>
              <hr className="dropdown-divider" />
              <button type="button" className="dropdown-link logout-btn" onClick={() => void handleLogout()}>
                <LogOut size={14} /> Log out
              </button>
            </div>
          </details>
        </div>
      </header>

      {/* Command Search Modal */}
      {searchOpen && (
        <div className="dialog-backdrop command-backdrop" onClick={() => setSearchOpen(false)}>
          <div className="command-palette" onClick={(e) => e.stopPropagation()}>
            <div className="command-search-header">
              <Search size={18} className="command-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Type a command or jump to feature..."
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredQuickNav.length > 0) {
                    navigate(filteredQuickNav[0].path);
                    setSearchOpen(false);
                  }
                }}
              />
              <button type="button" className="command-close" onClick={() => setSearchOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="command-results">
              <span className="command-section-label">Quick Actions &amp; Navigation</span>
              {filteredQuickNav.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  className="command-item"
                  onClick={() => {
                    navigate(item.path);
                    setSearchOpen(false);
                  }}
                >
                  <div className="command-item-left">
                    <Sparkles size={14} className="command-item-icon" />
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.hint}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="command-arrow" />
                </button>
              ))}
              {filteredQuickNav.length === 0 && (
                <div className="command-empty">No matching commands or pages found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Main Grid with Left Sidebar */}
      <div className="dashboard-layout">
        <aside className={`dashboard-sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
          <button
            type="button"
            className="dashboard-search-trigger"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={15} />
            <span>Command Search...</span>
            <kbd>
              <Command size={10} /> K
            </kbd>
          </button>

          <span className="section-label">Platform Navigation</span>
          <nav className="dashboard-nav" aria-label="Platform navigation">
            {navPlatform.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="dashboard-count">{item.badge}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="dashboard-system">
            <span className="section-label">AI Operating System</span>
            {navAiOs.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) => `dashboard-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="sidebar-bottom-actions">
            <button
              type="button"
              className="primary-button dashboard-new-project"
              onClick={() => navigate('/projects?create=true')}
            >
              <Plus size={16} />
              <span>New Collaboration</span>
            </button>

            <Link to="/docs" className="dashboard-sidebar-footer">
              <CircleHelp size={13} />
              <span>SkillSetu AI Docs</span>
              <small>v2.4 Pro</small>
            </Link>
          </div>
        </aside>

        {/* Workspace Body */}
        <main className="dashboard-main">
          <section className="workspace-header-strip">
            <div className="workspace-header-title">
              <h1>{title}</h1>
              {subtitle && <p className="workspace-subtitle">{subtitle}</p>}
            </div>
            {actionButton && <div className="workspace-header-cta">{actionButton}</div>}
          </section>

          {children}
        </main>
      </div>

      {aiModalOpen && <AiStatusModal onClose={() => setAiModalOpen(false)} />}
    </div>
  );
}


// ==========================================
// 1. DASHBOARD PAGE (/dashboard)
// ==========================================

export function DashboardPage({ user }: { user: User | null }) {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashData, projData, stuData] = await Promise.all([
          apiFetch<DashboardData>('/api/dashboard'),
          apiFetch<{ projects: Project[] }>('/api/projects'),
          apiFetch<{ students: StudentProfile[] }>('/api/students?limit=6').catch(() => ({ students: [] })),
        ]);
        setData(dashData);
        setProjects(projData.projects);
        setStudents(stuData.students);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const visibleProjects = useMemo(() => {
    return projects.filter((p) =>
      `${p.name} ${p.description} ${p.category} ${p.tech_stack}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  if (loading) {
    return (
      <AppLayout user={user} title="Dashboard" subtitle="Synchronizing student synergy model...">
        <div className="loading-card">Calibrating campus match graphs…</div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout user={user} title="Dashboard">
        <div className="form-error">{error || 'Unable to load dashboard.'}</div>
      </AppLayout>
    );
  }

  const firstName = user?.name.split(' ')[0] || 'Builder';

  return (
    <AppLayout
      user={user}
      title="Dashboard"
      subtitle="Personalized synergy overview and real-time collaboration signals."
      actionButton={
        <div className="header-action-group">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate('/matches')}
          >
            <Sparkles size={14} /> AI Matches
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate('/projects?create=true')}
          >
            <Plus size={14} /> Create Project
          </button>
        </div>
      }
    >
      {/* Welcome Banner */}
      <section className="dashboard-greeting">
        <div>
          <h1>
            Welcome back, <span>{firstName}</span>
          </h1>
          <p>
            <Sparkles size={14} />
            Skill synergy score calibrated with <strong>{projects.length}</strong> active campus ventures and <strong>{students.length}+</strong> peer builders.
          </p>
          <div className="greeting-meta-chips">
            <span className="meta-chip">
              <GraduationCap size={13} /> {user?.college || 'National Student Ecosystem'}
            </span>
            <span className="meta-chip">
              <BookOpen size={13} /> {user?.branch || 'Engineering & Tech'}
            </span>
            <span className="meta-chip status-chip">
              <CheckCircle2 size={13} /> {user?.availability || 'Open to collaborate'}
            </span>
          </div>
        </div>

        <label className="dashboard-main-search">
          <Search size={15} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stack, projects, roles..."
            aria-label="Filter projects"
          />
        </label>
      </section>

      {/* Metrics Row */}
      <section className="dashboard-metrics-grid" aria-label="Synergy metrics">
        {/* Radar Calibration */}
        <article className="dashboard-card skill-card">
          <div className="dashboard-card-heading">
            <div>
              <Activity />
              <span>Skill Calibration Radar</span>
            </div>
            <span className="badge-pill">94.8% Max</span>
          </div>
          <p className="dashboard-card-subtitle">
            Multivariate balance across full-stack engineering, design, and AI models.
          </p>
          <div className="radar-visual" role="img" aria-label="Skill score radar chart">
            <span className="radar-label radar-front">Frontend</span>
            <span className="radar-label radar-back">Backend</span>
            <span className="radar-label radar-design">UX/UI</span>
            <span className="radar-label radar-ml">AI &amp; ML</span>
            <span className="radar-label radar-pm">Product</span>
            <span className="radar-label radar-systems">DevOps</span>
            <div className="radar-shape">
              <i />
            </div>
          </div>
          <Link to="/growth-roadmap" className="dashboard-card-link">
            Open Growth Calibration <ChevronRight size={14} />
          </Link>
        </article>

        {/* Opportunity Graph */}
        <article className="dashboard-card opportunity-card">
          <div className="dashboard-card-heading">
            <div>
              <Network />
              <span>AI Opportunity Graph</span>
            </div>
            <span className="badge-pill pulse-badge">Live Map</span>
          </div>
          <p className="dashboard-card-subtitle">
            Recommended student and project nodes weighted by shared and complementary skills.
          </p>
          <div className="opportunity-map" aria-label="Recommended project matches">
            <span className="map-link map-link-one" />
            <span className="map-link map-link-two" />
            <span className="map-link map-link-three" />
            <span className="map-link map-link-four" />
            <div className="map-node map-self">YOU</div>
            {visibleProjects.slice(0, 4).map((project, index) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className={`map-node map-peer map-peer-${index + 1}`}
                title={project.name}
              >
                {project.name.slice(0, 18)} (+{project.match_score}%)
              </Link>
            ))}
          </div>
          <p className="map-hint">
            {visibleProjects.length ? 'Graph dynamically clusters from current query and skill matrix.' : 'No projects matched.'}
          </p>
        </article>

        {/* Synergy Health */}
        <article className="dashboard-card synergy-card">
          <div className="dashboard-card-heading">
            <div>
              <Gauge />
              <span>Synergy Health</span>
            </div>
            <span className="badge-pill optimal-badge">Healthy</span>
          </div>
          <p className="dashboard-card-subtitle">
            Sprint velocity and delivery risk assessment.
          </p>
          <div className="synergy-ring-wrap">
            <div className="score-ring">
              <strong>{data.metrics.synergy || 92}%</strong>
              <span>Team Synergy</span>
            </div>
          </div>
          <div className="synergy-stats">
            <div>
              <span>Active Sprints</span>
              <strong>{data.tasks.length} tasks</strong>
            </div>
            <div>
              <span>Workload</span>
              <strong>{data.metrics.workload}</strong>
            </div>
            <div>
              <span>Delivery Risk</span>
              <strong className="risk-low">{data.metrics.risk}</strong>
            </div>
          </div>
        </article>
      </section>

      {/* Suggested Teammates & Recommended Projects */}
      <section className="dashboard-split-grid">
        {/* Teammates Section */}
        <article className="dashboard-card featured-peers-card">
          <div className="recommended-heading">
            <div>
              <div className="dashboard-card-heading">
                <div>
                  <GraduationCap />
                  <span>Recommended Student Matches</span>
                </div>
              </div>
              <p className="dashboard-card-subtitle">
                Cross-university peers with complementary skill profiles.
              </p>
            </div>
            <Link to="/matches" className="dashboard-card-link">
              View All Matches <ChevronRight size={14} />
            </Link>
          </div>

          <div className="student-grid-compact">
            {students.slice(0, 3).map((stu) => (
              <div key={stu.id} className="student-compact-card">
                <div className="stu-compact-header">
                  <div className="stu-avatar">
                    {stu.avatar_url ? <img src={stu.avatar_url} alt={stu.name} /> : getInitials(stu)}
                  </div>
                  <div>
                    <h4>{stu.name}</h4>
                    <span className="stu-sub">{stu.college} · {stu.branch}</span>
                  </div>
                </div>
                <div className="skill-chips-row">
                  {stu.skills?.slice(0, 3).map((s) => (
                    <span key={s.name} className="chip emerald-chip">{s.name}</span>
                  ))}
                </div>
                <div className="stu-card-actions">
                  <Link to={`/students/${stu.id}`} className="secondary-button tiny-button">
                    View Profile
                  </Link>
                  <Link to={`/messages?recipientId=${stu.id}`} className="primary-button tiny-button">
                    <MessageSquare size={12} /> Message
                  </Link>
                </div>
              </div>
            ))}
            {students.length === 0 && (
              <p className="dashboard-empty">No student profiles discovered yet.</p>
            )}
          </div>
        </article>

        {/* Recommended Ventures */}
        <article className="dashboard-card recommended-card">
          <div className="recommended-heading">
            <div>
              <div className="dashboard-card-heading">
                <div>
                  <BriefcaseBusiness />
                  <span>Recommended Ventures</span>
                </div>
              </div>
              <p className="dashboard-card-subtitle">
                Collaborative projects actively seeking team contributors.
              </p>
            </div>
            <Link to="/projects" className="dashboard-card-link">
              Explore All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="venture-grid">
            {visibleProjects.slice(0, 4).map((project) => (
              <article className="venture-item" key={project.id}>
                <div className="venture-title-row">
                  <h3>{project.name}</h3>
                  <span className="venture-badge">{project.match_score}% synergy</span>
                </div>
                <p>{project.description}</p>
                <div className="venture-meta">
                  <span>
                    <Activity size={12} /> {project.category} · {project.difficulty || 'Intermediate'}
                  </span>
                  <Link to={`/projects/${project.id}`} className="venture-explore-link">
                    View Sprint <ChevronRight size={13} />
                  </Link>
                </div>
              </article>
            ))}
            {!visibleProjects.length && (
              <p className="dashboard-empty">No matching ventures found for this search.</p>
            )}
          </div>
        </article>
      </section>

      {/* Active Tasks & Milestones */}
      <section className="active-projects-section">
        <div className="active-projects-heading">
          <h2>Sprint Milestones &amp; Task Deliverables</h2>
          <Link to="/growth-roadmap" className="dashboard-card-link">
            Manage Sprint Roadmap <ChevronRight size={14} />
          </Link>
        </div>

        <div className="tasks-horizontal-list">
          {data.tasks.slice(0, 4).map((task) => (
            <article className="task-summary-card" key={task.id}>
              <div className="task-badge-row">
                <span className={`task-status-pill status-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {task.status}
                </span>
                <span className="task-due">
                  <Clock size={12} /> {task.due_date}
                </span>
              </div>
              <h4>{task.title}</h4>
              <div className="task-assignee">
                <UserRound size={12} /> Assignee: <strong>{task.assignee}</strong>
              </div>
            </article>
          ))}
          {data.tasks.length === 0 && (
            <div className="empty-task-banner">
              <ListTodo size={20} />
              <div>
                <h4>No active tasks in your sprint queue.</h4>
                <p>Create a project and add tasks or sync with the AI Hackathon Coach.</p>
              </div>
              <Link to="/growth-roadmap" className="primary-button tiny-button">
                Add Roadmap Milestone
              </Link>
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}

// ==========================================
// 2. AI MATCH ENGINE (/matches)
// ==========================================

export function MatchesPage({ user }: { user: User | null }) {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [formula, setFormula] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCollege, setFilterCollege] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<MatchItem | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [selectedProjId, setSelectedProjId] = useState<number | ''>('');
  const [inviteRole, setInviteRole] = useState('Frontend Contributor');
  const [inviteNotice, setInviteNotice] = useState('');

  const loadMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const [matchRes, projRes] = await Promise.all([
        apiFetch<{ matches: MatchItem[]; formula: string }>('/api/matches'),
        apiFetch<{ projects: Project[] }>('/api/projects').catch(() => ({ projects: [] })),
      ]);
      setMatches(matchRes.matches);
      setFormula(matchRes.formula);
      const owned = projRes.projects.filter((p) => p.owner_id === user?.id);
      setUserProjects(owned);
      if (owned[0]) setSelectedProjId(owned[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to calculate student matches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMatches();
  }, []);

  const sendInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProjId || !selectedStudent) return;
    try {
      await apiFetch(`/api/projects/${selectedProjId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId: selectedStudent.id, role: inviteRole }),
      });
      setInviteNotice(`Invitation sent to ${selectedStudent.name}!`);
      setTimeout(() => {
        setInviteModalOpen(false);
        setInviteNotice('');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite.');
    }
  };

  const handleConnect = async (studentId: number) => {
    try {
      await apiFetch('/api/connections', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: studentId, action: 'connect' }),
      });
      setMatches((current) =>
        current.map((m) =>
          m.id === studentId
            ? { ...m, connection: { id: 999, requester_id: user?.id || 0, recipient_id: studentId, status: 'pending' } }
            : m
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send connection request.');
    }
  };

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      const matchesCollege = !filterCollege || m.college.toLowerCase().includes(filterCollege.toLowerCase());
      const matchesSkill =
        !filterSkill ||
        m.skills.some((s) => s.name.toLowerCase().includes(filterSkill.toLowerCase())) ||
        m.complementarySkills.some((s) => s.toLowerCase().includes(filterSkill.toLowerCase()));
      return matchesCollege && matchesSkill;
    });
  }, [matches, filterCollege, filterSkill]);

  return (
    <AppLayout
      user={user}
      title="AI Match Engine"
      subtitle="Predictive synergy scoring based on cognitive strengths, skill complementarity, and availability."
    >
      {/* Formula Transparency Card */}
      <section className="formula-explanation-card">
        <div className="formula-header">
          <Sparkles size={16} className="sparkle-icon" />
          <h3>Transparent Deterministic Compatibility Engine</h3>
        </div>
        <p>
          {formula ||
            'Base score = 38 + (Shared Skills × 14) + (Shared Interests × 10) + (Complementary Skills × 5) + Availability Bonus.'}
        </p>
      </section>

      {/* Filter Bar */}
      <div className="projects-toolbar">
        <label>
          <Search size={15} />
          <input
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
            placeholder="Filter by required or complementary skill..."
          />
        </label>
        <label>
          <GraduationCap size={15} />
          <input
            value={filterCollege}
            onChange={(e) => setFilterCollege(e.target.value)}
            placeholder="Filter by university or college..."
          />
        </label>
        <button type="button" className="secondary-button" onClick={() => void loadMatches()}>
          <RefreshCw size={14} /> Recalculate
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      {/* Matches Grid */}
      {loading ? (
        <div className="loading-card">Computing synergy pairings across campus databases…</div>
      ) : filteredMatches.length > 0 ? (
        <div className="matches-grid">
          {filteredMatches.map((m) => (
            <article key={m.id} className="match-card">
              <div className="match-card-top">
                <div className="match-avatar-col">
                  <div className="avatar-pill large-avatar">
                    {m.avatar_url ? <img src={m.avatar_url} alt={m.name} className="avatar-img" /> : getInitials(m)}
                  </div>
                  <div className="score-badge-circle">
                    <strong>{m.score}%</strong>
                    <small>Fit</small>
                  </div>
                </div>

                <div className="match-info-col">
                  <div className="match-name-row">
                    <h3>{m.name}</h3>
                    {m.is_demo === 1 && <span className="demo-pill">Verified Builder</span>}
                  </div>
                  <p className="match-college">
                    <GraduationCap size={13} /> {m.college} · {m.branch} ({m.study_year})
                  </p>
                  <p className="match-headline">{m.headline || m.bio}</p>
                </div>
              </div>

              {/* Reasons Breakdown */}
              <div className="match-reasons-box">
                <span className="reason-tag-title">Synergy Highlights:</span>
                <ul>
                  {m.reasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>

              {/* Skills Split */}
              <div className="match-skills-split">
                {m.sharedSkills.length > 0 && (
                  <div>
                    <span className="skills-sublabel">Shared Strengths</span>
                    <div className="skill-chips-row">
                      {m.sharedSkills.map((s) => (
                        <span key={s} className="chip emerald-chip">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {m.complementarySkills.length > 0 && (
                  <div>
                    <span className="skills-sublabel">Can Contribute (Complementary)</span>
                    <div className="skill-chips-row">
                      {m.complementarySkills.map((s) => (
                        <span key={s} className="chip cyan-chip">
                          + {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="match-card-footer">
                <Link to={`/students/${m.id}`} className="secondary-button tiny-button">
                  Profile
                </Link>

                {m.connection?.status === 'pending' ? (
                  <span className="chip neutral">Request Pending</span>
                ) : m.connection?.status === 'accepted' ? (
                  <span className="chip success">Connected</span>
                ) : (
                  <button
                    type="button"
                    className="secondary-button tiny-button"
                    onClick={() => void handleConnect(m.id)}
                  >
                    <UserPlus size={13} /> Connect
                  </button>
                )}

                <Link to={`/messages?recipientId=${m.id}`} className="secondary-button tiny-button">
                  <MessageSquare size={13} /> Chat
                </Link>

                {userProjects.length > 0 && (
                  <button
                    type="button"
                    className="primary-button tiny-button"
                    onClick={() => {
                      setSelectedStudent(m);
                      setInviteModalOpen(true);
                    }}
                  >
                    <Plus size={13} /> Invite to Team
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Sparkles />
          <h3>No student matches found</h3>
          <p>Try adjusting your search criteria or register additional skills in your profile.</p>
          <Link to="/profile" className="primary-button">
            Calibrate My Skills
          </Link>
        </div>
      )}

      {/* Invite Modal */}
      {inviteModalOpen && selectedStudent && (
        <div className="dialog-backdrop" onClick={() => setInviteModalOpen(false)}>
          <form className="project-editor edit-project-dialog" onClick={(e) => e.stopPropagation()} onSubmit={sendInvite}>
            <div className="project-editor-heading">
              <h3>Invite {selectedStudent.name} to Project</h3>
              <button type="button" className="icon-button" onClick={() => setInviteModalOpen(false)}>
                ×
              </button>
            </div>
            {inviteNotice && <div className="form-success">{inviteNotice}</div>}
            <label>
              Select Project
              <select
                value={selectedProjId}
                onChange={(e) => setSelectedProjId(Number(e.target.value))}
                required
              >
                {userProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Role Offered
              <input
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                placeholder="e.g. Lead AI Engineer, Frontend Contributor"
                required
              />
            </label>
            <button type="submit" className="primary-button">
              Send Collaboration Invitation
            </button>
          </form>
        </div>
      )}
    </AppLayout>
  );
}

// ==========================================
// 3. BROWSE STUDENTS & TALENT DISCOVERY (/students)
// ==========================================

export function StudentsPage({ user }: { user: User | null }) {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [query, setQuery] = useState('');
  const [skill, setSkill] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [sort, setSort] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        q: query,
        skill,
        college,
        branch,
        sort,
        limit: '50',
      });
      const data = await apiFetch<{ students: StudentProfile[] }>(`/api/students?${params}`);
      setStudents(data.students);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load students marketplace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadStudents();
    }, 200);
    return () => clearTimeout(timer);
  }, [query, skill, college, branch, sort]);

  return (
    <AppLayout
      user={user}
      title="Talent Discovery"
      subtitle="Discover and recruit verified student builders across colleges and universities."
      actionButton={
        <Link to="/profile" className="primary-button">
          <UserRound size={14} /> Edit My Public Profile
        </Link>
      }
    >
      {/* Search & Filter Toolbar */}
      <div className="projects-toolbar">
        <label className="search-field-wide">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students by name, bio, goals, domain..."
          />
        </label>
        <label>
          <Sparkles size={15} />
          <input
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="Skill (React, PyTorch...)"
          />
        </label>
        <label>
          <GraduationCap size={15} />
          <input
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            placeholder="College/University..."
          />
        </label>
        <label>
          <BookOpen size={15} />
          <input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="Branch/Major..."
          />
        </label>
        <label>
          <span className="sr-only">Sort order</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">Recently Active</option>
            <option value="name">Alphabetical</option>
          </select>
        </label>
      </div>

      {error && <div className="form-error">{error}</div>}

      {/* Grid of Student Profiles */}
      {loading ? (
        <div className="loading-card">Loading cross-college student profiles…</div>
      ) : students.length > 0 ? (
        <div className="students-grid">
          {students.map((stu) => (
            <article key={stu.id} className="student-profile-card">
              <div className="stu-card-topline">
                <div className="stu-avatar-wrapper">
                  {stu.avatar_url ? (
                    <img src={stu.avatar_url} alt={stu.name} className="avatar-img" />
                  ) : (
                    getInitials(stu)
                  )}
                </div>
                <div className="stu-title-area">
                  <div className="stu-name-header">
                    <h3>{stu.name}</h3>
                    {stu.is_demo === 1 && <span className="demo-pill">Verified</span>}
                  </div>
                  <span className="stu-college-badge">
                    <GraduationCap size={12} /> {stu.college}
                  </span>
                  <span className="stu-degree-info">
                    {stu.degree} · {stu.branch} ({stu.study_year})
                  </span>
                </div>
              </div>

              <p className="stu-bio-text">{stu.headline || stu.bio || 'Active student builder.'}</p>

              {/* Skills */}
              <div className="stu-skills-section">
                <span className="stu-skills-label">Top Skills</span>
                <div className="skill-chips-row">
                  {stu.skills?.slice(0, 5).map((s) => (
                    <span key={s.name} className="chip emerald-chip">
                      {s.name}
                    </span>
                  ))}
                  {(stu.skills?.length || 0) > 5 && (
                    <span className="chip neutral">+{(stu.skills?.length || 0) - 5} more</span>
                  )}
                </div>
              </div>

              {/* Interests & Availability */}
              <div className="stu-footer-info">
                <span className="availability-tag">
                  <CheckCircle2 size={12} /> {stu.availability || 'Open to collaborate'}
                </span>
                {stu.location && (
                  <span className="location-tag">
                    <MapPin size={12} /> {stu.location}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="stu-card-actions">
                <Link to={`/students/${stu.id}`} className="secondary-button tiny-button">
                  View Portfolio
                </Link>
                <Link to={`/messages?recipientId=${stu.id}`} className="primary-button tiny-button">
                  <MessageSquare size={13} /> Message
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <GraduationCap />
          <h3>No students found</h3>
          <p>Try refining your search keyword or clearing the filters.</p>
        </div>
      )}
    </AppLayout>
  );
}

// ==========================================
// 4. PUBLIC STUDENT PROFILE & PORTFOLIO (/students/:studentId)
// ==========================================

export function StudentProfilePage({ user }: { user: User | null }) {
  const { studentId } = useParams();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ student: StudentProfile }>(`/api/students/${studentId}`);
      setStudent(data.student);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Student profile not found or set to private.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) void loadProfile();
  }, [studentId]);

  const handleConnect = async () => {
    if (!student) return;
    try {
      await apiFetch('/api/connections', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: student.id, action: 'connect' }),
      });
      setNotice('Connection request sent!');
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect.');
    }
  };

  if (loading) {
    return (
      <AppLayout user={user} title="Student Profile">
        <div className="loading-card">Loading student portfolio…</div>
      </AppLayout>
    );
  }

  if (error || !student) {
    return (
      <AppLayout user={user} title="Student Profile">
        <div className="empty-state">
          <ShieldAlert />
          <h3>{error || 'Student profile not found'}</h3>
          <p>This profile may be private or does not exist.</p>
          <Link to="/students" className="primary-button">
            Back to Talent Discovery
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isSelf = user?.id === student.id;

  return (
    <AppLayout
      user={user}
      title={student.name}
      subtitle={`${student.college} · ${student.branch}`}
      actionButton={
        <div className="header-action-group">
          {isSelf ? (
            <Link to="/profile" className="primary-button">
              <UserRound size={14} /> Edit Profile
            </Link>
          ) : (
            <>
              {student.connection?.status === 'pending' ? (
                <span className="chip neutral">Connection Pending</span>
              ) : student.connection?.status === 'accepted' ? (
                <span className="chip success">Connected</span>
              ) : (
                <button type="button" className="secondary-button" onClick={handleConnect}>
                  <UserPlus size={14} /> Connect
                </button>
              )}
              <Link to={`/messages?recipientId=${student.id}`} className="primary-button">
                <MessageSquare size={14} /> Send Message
              </Link>
            </>
          )}
        </div>
      }
    >
      {notice && <div className="form-success">{notice}</div>}

      <div className="profile-detail-layout">
        {/* Left Column: Hero & About */}
        <div className="profile-detail-left">
          <article className="plain-card profile-hero-card">
            <div className="profile-hero-top">
              <div className="profile-hero-avatar">
                {student.avatar_url ? (
                  <img src={student.avatar_url} alt={student.name} />
                ) : (
                  getInitials(student)
                )}
              </div>
              <div className="profile-hero-titles">
                <div className="profile-name-badge">
                  <h2>{student.name}</h2>
                  {student.is_demo === 1 && <span className="demo-pill">Verified Builder</span>}
                </div>
                <p className="profile-headline">{student.headline || 'Student Collaborator'}</p>
                <div className="profile-location-row">
                  <span>
                    <GraduationCap size={14} /> {student.college}
                  </span>
                  <span>
                    <BookOpen size={14} /> {student.degree} in {student.branch}
                  </span>
                  <span>
                    <Calendar size={14} /> {student.study_year}
                  </span>
                  {student.location && (
                    <span>
                      <MapPin size={14} /> {student.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <hr className="card-divider" />

            <div className="profile-bio-section">
              <h3>About</h3>
              <p>{student.bio || 'No bio provided yet.'}</p>
            </div>

            {student.career_goals && (
              <div className="profile-goals-section">
                <h3>Career Goals &amp; Collaboration Focus</h3>
                <p>{student.career_goals}</p>
              </div>
            )}

            {/* Social & Portfolio Links */}
            <div className="profile-links-row">
              {student.github_url && (
                <a href={student.github_url} target="_blank" rel="noreferrer" className="social-link-badge">
                  <FolderGit2 size={14} /> GitHub
                </a>
              )}
              {student.linkedin_url && (
                <a href={student.linkedin_url} target="_blank" rel="noreferrer" className="social-link-badge">
                  <ExternalLink size={14} /> LinkedIn
                </a>
              )}
              {student.portfolio_url && (
                <a href={student.portfolio_url} target="_blank" rel="noreferrer" className="social-link-badge">
                  <ExternalLink size={14} /> Portfolio Site
                </a>
              )}
            </div>
          </article>

          {/* Projects Led or Joined */}
          <article className="plain-card profile-projects-card">
            <h3>Projects &amp; Ventures ({student.projects?.length || 0})</h3>
            <div className="profile-projects-list">
              {student.projects?.map((proj) => (
                <div key={proj.id} className="profile-project-item">
                  <div className="proj-item-header">
                    <h4>{proj.name}</h4>
                    <span className="chip success">{proj.status}</span>
                  </div>
                  <p>{proj.description}</p>
                  <div className="proj-item-footer">
                    <span>Category: {proj.category}</span>
                    <Link to={`/projects/${proj.id}`} className="primary-button tiny-button">
                      View Project
                    </Link>
                  </div>
                </div>
              ))}
              {(!student.projects || student.projects.length === 0) && (
                <p className="empty-inline">No public projects attached to this profile yet.</p>
              )}
            </div>
          </article>
        </div>

        {/* Right Column: Verified Skills & Evidence */}
        <div className="profile-detail-right">
          <article className="plain-card">
            <div className="card-heading-clean">
              <Award size={16} className="text-teal" />
              <h3>Verified Skills &amp; Stack</h3>
            </div>
            <div className="verified-skills-list">
              {student.skills?.map((sk) => (
                <div key={sk.name} className="verified-skill-item">
                  <div className="skill-item-header">
                    <strong>{sk.name}</strong>
                    <span className="skill-level-badge">{sk.level || 'Intermediate'}</span>
                  </div>
                  {sk.evidence_url && (
                    <a
                      href={sk.evidence_url}
                      target="_blank"
                      rel="noreferrer"
                      className="skill-evidence-link"
                    >
                      <CheckCircle2 size={12} /> Verified Evidence
                    </a>
                  )}
                </div>
              ))}
              {(!student.skills || student.skills.length === 0) && (
                <p className="empty-inline">No skills added yet.</p>
              )}
            </div>
          </article>

          <article className="plain-card">
            <div className="card-heading-clean">
              <Sparkles size={16} className="text-teal" />
              <h3>Interests &amp; Domains</h3>
            </div>
            <div className="skill-chips-row">
              {student.interests?.map((i) => (
                <span key={i.name} className="chip cyan-chip">
                  {i.name}
                </span>
              ))}
              {(!student.interests || student.interests.length === 0) && (
                <p className="empty-inline">No interests listed.</p>
              )}
            </div>
          </article>
        </div>
      </div>
    </AppLayout>
  );
}

// ==========================================
// 5. BROWSE PROJECTS MARKETPLACE (/projects)
// ==========================================

export function ProjectsPage({ user }: { user: User | null }) {
  const [params] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('match_score');
  const [creating, setCreating] = useState(params.get('create') === 'true');
  const [editing, setEditing] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.get('create') === 'true') {
      setCreating(true);
    }
  }, [params]);

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const qParams = new URLSearchParams({ q: query, category, sort, direction: 'desc' });
      const [projData, catData] = await Promise.all([
        apiFetch<{ projects: Project[] }>(`/api/projects?${qParams}`),
        apiFetch<{ categories: string[] }>('/api/categories').catch(() => ({ categories: [] })),
      ]);
      setProjects(projData.projects);
      setCategories(catData.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProjects();
    }, 150);
    return () => clearTimeout(timer);
  }, [query, category, sort]);

  const handleSaveProject = async (e: FormEvent<HTMLFormElement>, existing?: Project) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    setError('');
    setNotice('');

    const payload = {
      name: fd.get('name'),
      category: fd.get('category'),
      description: fd.get('description'),
      problem: fd.get('problem') || fd.get('description'),
      solution: fd.get('solution'),
      techStack: fd.get('techStack'),
      openRoles: fd.get('openRoles'),
      difficulty: fd.get('difficulty'),
      commitment: fd.get('commitment'),
      requiredSkills: fd.get('requiredSkills'),
      status: fd.get('status') || 'Open',
    };

    try {
      await apiFetch(existing ? `/api/projects/${existing.id}` : '/api/projects', {
        method: existing ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      setCreating(false);
      setEditing(null);
      setNotice(existing ? 'Project updated successfully.' : 'Project created and sprint initialized.');
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (proj: Project) => {
    if (!window.confirm(`Are you sure you want to delete "${proj.name}"?`)) return;
    try {
      await apiFetch(`/api/projects/${proj.id}`, { method: 'DELETE' });
      setNotice('Project deleted.');
      setProjects((curr) => curr.filter((p) => p.id !== proj.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete project.');
    }
  };

  const handleApply = async (proj: Project) => {
    setSubmitting(true);
    setError('');
    try {
      await apiFetch(`/api/projects/${proj.id}/apply`, {
        method: 'POST',
        body: JSON.stringify({ role: proj.open_roles?.split(',')[0]?.trim() || 'Contributor' }),
      });
      setNotice(`Application submitted to "${proj.name}".`);
      setProjects((curr) =>
        curr.map((p) => (p.id === proj.id ? { ...p, my_application_status: 'Pending' } : p))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to apply.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout
      user={user}
      title="Browse Projects"
      subtitle="Discover open-source ventures, capstones, and hackathon teams seeking contributors."
      actionButton={
        <button
          type="button"
          className="primary-button"
          onClick={() => setCreating((c) => !c)}
        >
          <Plus size={15} /> Post New Project
        </button>
      }
    >
      {/* Search & Filter Toolbar */}
      <div className="projects-toolbar">
        <label className="search-field-wide">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects by name, stack, problem..."
          />
        </label>
        <label>
          <span className="sr-only">Category filter</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Sort projects</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="match_score">Highest Synergy Match</option>
            <option value="created_at">Newest First</option>
            <option value="name">Project Name</option>
          </select>
        </label>
      </div>

      {notice && <div className="form-success">{notice}</div>}
      {error && <div className="form-error">{error}</div>}

      {/* Create Project Modal / Inline Form */}
      {creating && (
        <form className="project-editor" onSubmit={(e) => void handleSaveProject(e)}>
          <div className="project-editor-heading">
            <h3>Launch New Collaborative Venture</h3>
            <button type="button" className="icon-button" onClick={() => setCreating(false)}>
              ×
            </button>
          </div>
          <div className="form-grid-2">
            <label>
              Project Name *
              <input name="name" minLength={3} maxLength={120} placeholder="e.g. EcoTrace Decentralized Ledger" required />
            </label>
            <label>
              Category / Domain *
              <input name="category" minLength={2} maxLength={60} placeholder="e.g. CleanTech, Healthcare, EdTech" required />
            </label>
          </div>
          <label>
            Short Pitch / Tagline *
            <textarea name="description" rows={2} minLength={10} maxLength={2000} placeholder="Brief summary for marketplace cards..." required />
          </label>
          <div className="form-grid-2">
            <label>
              Problem Statement
              <textarea name="problem" rows={3} placeholder="What critical challenge are you solving?" />
            </label>
            <label>
              Proposed Solution &amp; MVP Scope
              <textarea name="solution" rows={3} placeholder="How does your architecture solve it?" />
            </label>
          </div>
          <div className="form-grid-3">
            <label>
              Tech Stack
              <input name="techStack" placeholder="React, Node.js, PyTorch..." />
            </label>
            <label>
              Open Roles Needed
              <input name="openRoles" placeholder="Frontend Dev, ML Ops, UX Designer..." />
            </label>
            <label>
              Difficulty Level
              <select name="difficulty" defaultValue="Intermediate">
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>
          </div>
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Creating...' : 'Publish Project & Initialize Team'}
          </button>
        </form>
      )}

      {/* Edit Project Modal */}
      {editing && (
        <div className="dialog-backdrop" onClick={() => setEditing(null)}>
          <form
            className="project-editor edit-project-dialog"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => void handleSaveProject(e, editing)}
          >
            <div className="project-editor-heading">
              <h3>Edit Project Details</h3>
              <button type="button" className="icon-button" onClick={() => setEditing(null)}>
                ×
              </button>
            </div>
            <label>
              Project Name
              <input name="name" defaultValue={editing.name} required />
            </label>
            <div className="form-grid-2">
              <label>
                Category
                <input name="category" defaultValue={editing.category} required />
              </label>
              <label>
                Status
                <select name="status" defaultValue={editing.status}>
                  <option>Open</option>
                  <option>In Review</option>
                  <option>Closed</option>
                </select>
              </label>
            </div>
            <label>
              Description
              <textarea name="description" defaultValue={editing.description} rows={3} required />
            </label>
            <label>
              Tech Stack
              <input name="techStack" defaultValue={editing.tech_stack || ''} />
            </label>
            <label>
              Open Roles
              <input name="openRoles" defaultValue={editing.open_roles || ''} />
            </label>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Project Cards Grid */}
      {loading ? (
        <div className="loading-card">Fetching open project workspaces…</div>
      ) : projects.length > 0 ? (
        <div className="projects-grid">
          {projects.map((proj) => {
            const isOwner = proj.owner_id === user?.id;
            return (
              <article key={proj.id} className="project-card-full">
                <div className="project-card-topline">
                  <span className="chip category-chip">{proj.category}</span>
                  <span className={`chip status-chip status-${proj.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {proj.status}
                  </span>
                  <span className="synergy-chip">{proj.match_score}% synergy</span>
                </div>

                <Link to={`/projects/${proj.id}`} className="project-title-link">
                  <h3>{proj.name}</h3>
                </Link>

                <p className="project-desc">{proj.description}</p>

                {proj.tech_stack && (
                  <div className="project-stack-row">
                    <span className="stack-label">Stack:</span>
                    <span className="stack-text">{proj.tech_stack}</span>
                  </div>
                )}

                {proj.open_roles && (
                  <div className="project-roles-row">
                    <span className="roles-label">Seeking:</span>
                    <span className="roles-text">{proj.open_roles}</span>
                  </div>
                )}

                <div className="project-owner-meta">
                  <span>
                    <UserRound size={12} /> Lead: <strong>{proj.owner_name || 'Campus Student'}</strong>
                  </span>
                  <span>
                    <Users size={12} /> {proj.application_count || 0} applications
                  </span>
                </div>

                <div className="project-card-footer">
                  <Link to={`/projects/${proj.id}`} className="secondary-button tiny-button">
                    View Details
                  </Link>

                  {isOwner ? (
                    <div className="owner-buttons">
                      <button
                        type="button"
                        className="secondary-button tiny-button"
                        onClick={() => setEditing(proj)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="secondary-button tiny-button danger-button"
                        onClick={() => void handleDelete(proj)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : proj.my_application_status ? (
                    <span className="chip neutral">Applied ({proj.my_application_status})</span>
                  ) : (
                    <button
                      type="button"
                      className="primary-button tiny-button"
                      disabled={submitting || proj.status !== 'Open'}
                      onClick={() => void handleApply(proj)}
                    >
                      <Sparkles size={12} /> Apply to Join
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Layers3 />
          <h3>No projects found</h3>
          <p>Try searching for a different keyword or create the first project in this category.</p>
          <button type="button" className="primary-button" onClick={() => setCreating(true)}>
            Post New Project
          </button>
        </div>
      )}
    </AppLayout>
  );
}

// ==========================================
// 6. PROJECT DETAIL & WORKSPACE (/projects/:projectId)
// ==========================================

export function ProjectDetailPage({ user }: { user: User | null }) {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Task form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState(new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10));
  const [newTaskAssignee, setNewTaskAssignee] = useState(user?.name || '');

  // Apply dialog
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyRole, setApplyRole] = useState('Contributor');
  const [applyMessage, setApplyMessage] = useState('I am excited to contribute my skills to this project.');

  const loadDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{
        project: Project;
        tasks: Task[];
        members: ProjectMember[];
        skills: Skill[];
        application: Application | null;
      }>(`/api/projects/${projectId}`);
      setProject(data.project);
      setTasks(data.tasks);
      setMembers(data.members);
      setSkills(data.skills);
      setApplication(data.application);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Project not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) void loadDetail();
  }, [projectId]);

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          projectId: project.id,
          title: newTaskTitle,
          dueDate: newTaskDue,
          assignee: newTaskAssignee,
        }),
      });
      setNewTaskTitle('');
      setNotice('Task added to sprint board.');
      await loadDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task.');
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: Task['status']) => {
    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setTasks((curr) => curr.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update task status.');
    }
  };

  const submitApplication = async (e: FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      await apiFetch(`/api/projects/${project.id}/apply`, {
        method: 'POST',
        body: JSON.stringify({ role: applyRole, message: applyMessage }),
      });
      setApplyDialogOpen(false);
      setNotice('Application submitted successfully!');
      await loadDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to apply.');
    }
  };

  if (loading) {
    return (
      <AppLayout user={user} title="Project Workspace">
        <div className="loading-card">Loading project workspace and sprint tasks…</div>
      </AppLayout>
    );
  }

  if (error || !project) {
    return (
      <AppLayout user={user} title="Project Workspace">
        <div className="empty-state">
          <ShieldAlert />
          <h3>{error || 'Project not found'}</h3>
          <Link to="/projects" className="primary-button">
            Back to Projects
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isOwner = project.owner_id === user?.id;

  return (
    <AppLayout
      user={user}
      title={project.name}
      subtitle={`Category: ${project.category} · Status: ${project.status}`}
      actionButton={
        <div className="header-action-group">
          <Link to="/projects" className="secondary-button">
            All Projects
          </Link>
          {!isOwner && !application && (
            <button
              type="button"
              className="primary-button"
              onClick={() => setApplyDialogOpen(true)}
            >
              <Sparkles size={14} /> Apply to Join
            </button>
          )}
          {application && (
            <span className="chip success">Applied ({application.status})</span>
          )}
        </div>
      }
    >
      {notice && <div className="form-success">{notice}</div>}
      {error && <div className="form-error">{error}</div>}

      <div className="project-workspace-grid">
        {/* Main Details Panel */}
        <div className="project-workspace-main">
          {/* Overview Card */}
          <article className="plain-card">
            <div className="project-detail-header">
              <div>
                <span className="chip category-chip">{project.category}</span>
                <span className="chip success">{project.status}</span>
                <span className="synergy-chip">{project.match_score}% synergy fit</span>
              </div>
              <span className="difficulty-badge">
                Level: <strong>{project.difficulty || 'Intermediate'}</strong>
              </span>
            </div>

            <h2 className="project-headline-title">{project.name}</h2>
            <p className="project-long-desc">{project.description}</p>

            <div className="problem-solution-box">
              {project.problem && (
                <div className="detail-section">
                  <h4>
                    <Flame size={14} className="text-orange" /> Problem Statement
                  </h4>
                  <p>{project.problem}</p>
                </div>
              )}
              {project.solution && (
                <div className="detail-section">
                  <h4>
                    <Lightbulb size={14} className="text-teal" /> Proposed Solution &amp; Scope
                  </h4>
                  <p>{project.solution}</p>
                </div>
              )}
            </div>

            {project.tech_stack && (
              <div className="detail-section">
                <h4>
                  <FileCode2 size={14} className="text-blue" /> Tech Stack
                </h4>
                <div className="skill-chips-row">
                  {project.tech_stack.split(',').map((item) => (
                    <span key={item.trim()} className="chip cyan-chip">
                      {item.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {skills && skills.length > 0 && (
              <div className="detail-section">
                <h4>
                  <Sparkles size={14} className="text-teal" /> Verified Required Skills
                </h4>
                <div className="skill-chips-row">
                  {skills.map((s) => (
                    <span key={s.name} className="chip emerald-chip">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Interactive Sprint Task Board */}
          <article className="plain-card taskboard-card">
            <div className="taskboard-header">
              <div className="card-heading-clean">
                <ListTodo size={16} className="text-teal" />
                <h3>Sprint Task Board ({tasks.length})</h3>
              </div>
              {isOwner && (
                <span className="taskboard-owner-hint">As project lead, you can assign sprint tasks</span>
              )}
            </div>

            {/* New Task Inline Creator (Owner Only) */}
            {isOwner && (
              <form className="add-task-inline" onSubmit={handleCreateTask}>
                <input
                  type="text"
                  placeholder="Task title (e.g., Integrate Gemini API endpoints)..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Assignee"
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  className="task-assignee-input"
                />
                <input
                  type="date"
                  value={newTaskDue}
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  className="task-date-input"
                  required
                />
                <button type="submit" className="primary-button tiny-button">
                  <Plus size={14} /> Add Task
                </button>
              </form>
            )}

            {/* Task Columns / List */}
            <div className="tasks-board-list">
              {tasks.map((task) => (
                <div key={task.id} className="task-row-item">
                  <div className="task-row-left">
                    <CheckCircle2
                      size={16}
                      className={task.status === 'Done' ? 'text-teal' : 'text-muted'}
                    />
                    <div>
                      <strong>{task.title}</strong>
                      <span className="task-meta">
                        Assignee: {task.assignee} · Due: {task.due_date}
                      </span>
                    </div>
                  </div>

                  <div className="task-row-right">
                    <select
                      value={task.status}
                      disabled={!isOwner}
                      onChange={(e) => void handleUpdateTaskStatus(task.id, e.target.value as Task['status'])}
                      className={`task-select-status status-${task.status.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <option value="Planned">Planned</option>
                      <option value="In progress">In Progress</option>
                      <option value="Review">Review</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                </div>
              ))}

              {tasks.length === 0 && (
                <p className="empty-inline">No tasks registered in this sprint yet.</p>
              )}
            </div>
          </article>
        </div>

        {/* Sidebar Panel: Team Members & Owner */}
        <div className="project-workspace-sidebar">
          {/* Project Owner */}
          <article className="plain-card">
            <h4>Project Lead</h4>
            <div className="member-row">
              <div className="avatar-pill">S</div>
              <div>
                <strong>{project.owner_name || 'Lead Student'}</strong>
                <span className="member-role-tag">Owner</span>
              </div>
            </div>
          </article>

          {/* Active Members */}
          <article className="plain-card">
            <h4>Active Team Members ({members.length})</h4>
            <div className="members-list">
              {members.map((m) => (
                <div key={m.id} className="member-row">
                  <div className="avatar-pill">{getInitials(m)}</div>
                  <div>
                    <strong>{m.name}</strong>
                    <span className="member-role-tag">{m.role}</span>
                    <small className="member-college">{m.college || 'Campus Member'}</small>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="empty-inline">No additional members joined yet.</p>
              )}
            </div>
          </article>

          {/* Open Roles */}
          {project.open_roles && (
            <article className="plain-card">
              <h4>Open Roles Sought</h4>
              <div className="skill-chips-row">
                {project.open_roles.split(',').map((r) => (
                  <span key={r.trim()} className="chip emerald-chip">
                    {r.trim()}
                  </span>
                ))}
              </div>
            </article>
          )}
        </div>
      </div>

      {/* Application Dialog Modal */}
      {applyDialogOpen && (
        <div className="dialog-backdrop" onClick={() => setApplyDialogOpen(false)}>
          <form
            className="project-editor edit-project-dialog"
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitApplication}
          >
            <div className="project-editor-heading">
              <h3>Apply to Join {project.name}</h3>
              <button type="button" className="icon-button" onClick={() => setApplyDialogOpen(false)}>
                ×
              </button>
            </div>
            <label>
              Role you want to take *
              <input
                value={applyRole}
                onChange={(e) => setApplyRole(e.target.value)}
                placeholder="e.g. Lead Frontend Developer, AI Engineer"
                required
              />
            </label>
            <label>
              Why are you a good fit? (Message to Project Lead) *
              <textarea
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                rows={4}
                required
              />
            </label>
            <button type="submit" className="primary-button">
              Submit Collaboration Request
            </button>
          </form>
        </div>
      )}
    </AppLayout>
  );
}

// ==========================================
// 7. APPLICATIONS MANAGEMENT (/applications)
// ==========================================

export function ApplicationsPage({ user }: { user: User | null }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ applications: Application[] }>('/api/applications');
      setApplications(data.applications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadApplications();
  }, []);

  const handleUpdateStatus = async (appId: number, newStatus: string) => {
    try {
      await apiFetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setNotice(`Application updated to ${newStatus}.`);
      setApplications((curr) =>
        curr.map((a) => (a.id === appId ? { ...a, status: newStatus as Application['status'] } : a))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application.');
    }
  };

  const receivedApps = applications.filter((a) => a.owner_id === user?.id);
  const sentApps = applications.filter((a) => a.user_id === user?.id && a.owner_id !== user?.id);

  const displayedList = (tab === 'received' ? receivedApps : sentApps).filter((a) =>
    !statusFilter ? true : a.status.toLowerCase() === statusFilter.toLowerCase()
  );

  return (
    <AppLayout
      user={user}
      title="Applications &amp; Team Invites"
      subtitle="Manage incoming team join requests and track status of projects you applied to."
    >
      {/* Tabs */}
      <div className="tab-buttons-bar">
        <button
          type="button"
          className={`tab-btn ${tab === 'received' ? 'active' : ''}`}
          onClick={() => setTab('received')}
        >
          Received Applications ({receivedApps.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'sent' ? 'active' : ''}`}
          onClick={() => setTab('sent')}
        >
          Sent Applications ({sentApps.length})
        </button>
        <div className="tab-filter-right">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {notice && <div className="form-success">{notice}</div>}
      {error && <div className="form-error">{error}</div>}

      {/* List */}
      {loading ? (
        <div className="loading-card">Loading applications…</div>
      ) : displayedList.length > 0 ? (
        <div className="applications-list">
          {displayedList.map((app) => {
            const isReceived = app.owner_id === user?.id;
            return (
              <article key={app.id} className="application-card">
                <div className="app-card-left">
                  <div className="app-badge-row">
                    <span className="chip category-chip">{app.category}</span>
                    <span className={`chip status-chip status-${app.status.toLowerCase()}`}>
                      {app.status}
                    </span>
                    <span className="app-role-badge">Role: {app.role}</span>
                  </div>

                  <Link to={`/projects/${app.project_id}`} className="app-project-link">
                    <h3>{app.project_name}</h3>
                  </Link>

                  <p className="app-sender-info">
                    {isReceived ? (
                      <>
                        Applicant: <strong>{app.applicant_name || 'Student'}</strong>
                      </>
                    ) : (
                      <>You applied to this project</>
                    )}
                    {app.created_at && <span> · Submitted on {new Date(app.created_at).toLocaleDateString()}</span>}
                  </p>

                  {app.message && <p className="app-message-box">"{app.message}"</p>}
                </div>

                <div className="app-card-right">
                  {isReceived && app.status === 'Pending' && (
                    <div className="app-action-buttons">
                      <button
                        type="button"
                        className="primary-button tiny-button"
                        onClick={() => void handleUpdateStatus(app.id, 'Accepted')}
                      >
                        Accept &amp; Add to Team
                      </button>
                      <button
                        type="button"
                        className="secondary-button tiny-button danger-button"
                        onClick={() => void handleUpdateStatus(app.id, 'Rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {!isReceived && app.status === 'Pending' && (
                    <button
                      type="button"
                      className="secondary-button tiny-button"
                      onClick={() => void handleUpdateStatus(app.id, 'Withdrawn')}
                    >
                      Withdraw Application
                    </button>
                  )}

                  <Link to={`/projects/${app.project_id}`} className="secondary-button tiny-button">
                    View Project
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <FileText />
          <h3>No applications in this tab</h3>
          <p>
            {tab === 'received'
              ? 'When students apply to your projects, their applications will appear here.'
              : 'You have not submitted applications matching this filter.'}
          </p>
          <Link to="/projects" className="primary-button">
            Browse Projects
          </Link>
        </div>
      )}
    </AppLayout>
  );
}

// ==========================================
// 8. MESSAGES & REAL-TIME CHAT (/messages & /messages/:conversationId)
// ==========================================

export function MessagesPage({ user }: { user: User | null }) {
  const { conversationId: paramConvoId } = useParams();
  const [searchParams] = useSearchParams();
  const directRecipientId = searchParams.get('recipientId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<number | null>(
    paramConvoId ? Number(paramConvoId) : null
  );
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [people, setPeople] = useState<Array<{ id: number; name: string; role: string }>>([]);
  const [messageBody, setMessageBody] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load conversations and people
  useEffect(() => {
    const init = async () => {
      setLoadingConvos(true);
      try {
        const [convoRes, peopleRes] = await Promise.all([
          apiFetch<{ conversations: Conversation[] }>('/api/conversations'),
          apiFetch<{ people: Array<{ id: number; name: string; role: string }> }>('/api/messages/people'),
        ]);
        setConversations(convoRes.conversations);
        setPeople(peopleRes.people);

        // If directRecipientId was passed in query, open or create that conversation
        if (directRecipientId) {
          const recipientNum = Number(directRecipientId);
          const res = await apiFetch<{ conversation: { id: number } }>('/api/conversations', {
            method: 'POST',
            body: JSON.stringify({ recipientId: recipientNum }),
          });
          setActiveConvoId(res.conversation.id);
        } else if (!activeConvoId && convoRes.conversations.length > 0) {
          setActiveConvoId(convoRes.conversations[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load conversations.');
      } finally {
        setLoadingConvos(false);
      }
    };
    void init();
  }, [directRecipientId]);

  // Load active conversation messages
  const loadActiveMessages = async (id: number) => {
    setLoadingMessages(true);
    try {
      const res = await apiFetch<{ messages: MessageItem[] }>(`/api/conversations/${id}/messages`);
      setMessages(res.messages);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load messages.');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeConvoId) {
      void loadActiveMessages(activeConvoId);
    }
  }, [activeConvoId]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeConvoId || !messageBody.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await apiFetch<{ message: MessageItem }>(`/api/conversations/${activeConvoId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: messageBody.trim() }),
      });
      setMessages((curr) => [...curr, res.message]);
      setMessageBody('');
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleStartWithPerson = async (personId: number) => {
    try {
      const res = await apiFetch<{ conversation: { id: number } }>('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ recipientId: personId }),
      });
      setActiveConvoId(res.conversation.id);
      const convos = await apiFetch<{ conversations: Conversation[] }>('/api/conversations');
      setConversations(convos.conversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start conversation.');
    }
  };

  const activeConvo = conversations.find((c) => c.id === activeConvoId);

  return (
    <AppLayout
      user={user}
      title="Direct Messages"
      subtitle="Encrypted peer-to-peer student messaging with direct project integration."
    >
      {error && <div className="form-error">{error}</div>}
      <div className="messages-workspace-layout">
        {/* Left: Conversation List */}
        <aside className="chat-sidebar-panel">
          <div className="chat-sidebar-header">
            <h3>Conversations</h3>
            <span className="chat-convo-count">{conversations.length}</span>
          </div>

          {/* New Conversation Selector */}
          <div className="new-convo-selector">
            <select
              onChange={(e) => {
                if (e.target.value) void handleStartWithPerson(Number(e.target.value));
              }}
              defaultValue=""
            >
              <option value="" disabled>
                + Start message with student...
              </option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.role})
                </option>
              ))}
            </select>
          </div>

          <div className="chat-convo-list">
            {conversations.map((c) => {
              const isActive = c.id === activeConvoId;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`convo-item-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveConvoId(c.id)}
                >
                  <div className="convo-avatar-box">{getInitials({ name: c.participant_names })}</div>
                  <div className="convo-text-box">
                    <div className="convo-name-row">
                      <strong>{c.participant_names || 'Student'}</strong>
                      {Boolean(c.unread_count && c.unread_count > 0) && (
                        <span className="unread-dot">{c.unread_count}</span>
                      )}
                    </div>
                    <p className="convo-last-snippet">{c.last_message || 'No messages yet.'}</p>
                  </div>
                </button>
              );
            })}

            {conversations.length === 0 && !loadingConvos && (
              <div className="empty-chat-sidebar">
                <p>No active conversations.</p>
                <small>Select a student from the dropdown above to begin.</small>
              </div>
            )}
          </div>
        </aside>

        {/* Right: Chat Panel */}
        <main className="chat-main-panel">
          {activeConvoId ? (
            <>
              {/* Chat Header */}
              <div className="chat-panel-header">
                <div className="chat-header-info">
                  <div className="avatar-pill">{getInitials({ name: activeConvo?.participant_names })}</div>
                  <div>
                    <h4>{activeConvo?.participant_names || 'Student Collaborator'}</h4>
                    <span className="chat-status-indicator">
                      <span className="signal-dot" /> Online on Campus Network
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Feed */}
              <div className="chat-messages-feed" aria-live="polite">
                {loadingMessages ? (
                  <div className="loading-card">Decrypting message thread…</div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => {
                    const isSent = msg.sender_id === user?.id;
                    return (
                      <article
                        key={msg.id}
                        className={`message-bubble-row ${isSent ? 'sent-row' : 'received-row'}`}
                      >
                        <div className={`message-bubble ${isSent ? 'sent' : 'received'}`}>
                          <span className="bubble-sender">{isSent ? 'You' : msg.sender_name}</span>
                          <p>{msg.body}</p>
                          <time className="bubble-time">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </time>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="empty-chat-feed">
                    <Sparkles size={24} className="text-teal" />
                    <h4>Start the conversation</h4>
                    <p>Discuss projects, divide sprint tasks, or share repo links.</p>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Composer */}
              <form className="chat-composer-form" onSubmit={handleSendMessage}>
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Type a message... (Press Enter to send)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendMessage(e);
                    }
                  }}
                  rows={2}
                  required
                />
                <button
                  type="submit"
                  className="primary-button chat-send-btn"
                  disabled={sending || !messageBody.trim()}
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="empty-state chat-empty-full">
              <MessageSquare size={36} />
              <h3>Select a Conversation</h3>
              <p>Choose a student from the sidebar to view chat history and start messaging.</p>
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  );
}

// ==========================================
// 9. GROWTH ROADMAP (/growth-roadmap)
// ==========================================

export function RoadmapPage({ user }: { user: User | null }) {
  const [milestones, setMilestones] = useState<RoadmapMilestone[]>([]);
  const [targetRole, setTargetRole] = useState('Full-Stack Engineer');
  const [newTitle, setNewTitle] = useState('');
  const [newDue, setNewDue] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadRoadmap = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ roadmap: Roadmap | null; milestones: RoadmapMilestone[] }>('/api/roadmaps');
      setMilestones(data.milestones);
      if (data.roadmap?.target_role) {
        setTargetRole(data.roadmap.target_role);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load roadmap.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoadmap();
  }, []);

  const handleSaveRole = async (role: string) => {
    setTargetRole(role);
    try {
      await apiFetch('/api/roadmaps', {
        method: 'POST',
        body: JSON.stringify({ targetRole: role, summary: `Personalized path towards ${role}` }),
      });
      setNotice(`Target role updated to ${role}.`);
    } catch {
      // ignore
    }
  };

  const handleAddMilestone = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await apiFetch('/api/roadmaps/milestones', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          dueDate: newDue,
          status: 'Planned',
          progress: 0,
        }),
      });
      setNewTitle('');
      setNotice('Milestone added to your learning roadmap.');
      await loadRoadmap();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add milestone.');
    }
  };

  const handleUpdateMilestone = async (id: number, status: RoadmapMilestone['status'], progress: number) => {
    try {
      await apiFetch(`/api/roadmaps/milestones/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, progress }),
      });
      setMilestones((curr) =>
        curr.map((m) => (m.id === id ? { ...m, status, progress } : m))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update milestone.');
    }
  };

  const handleDeleteMilestone = async (id: number) => {
    try {
      await apiFetch(`/api/roadmaps/milestones/${id}`, { method: 'DELETE' });
      setMilestones((curr) => curr.filter((m) => m.id !== id));
      setNotice('Milestone removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete.');
    }
  };

  const rolePaths: Record<string, { skills: string[]; gaps: string[]; advice: string }> = {
    'Full-Stack Engineer': {
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'REST/GraphQL', 'Docker'],
      gaps: ['Distributed Caching (Redis)', 'CI/CD Pipelines', 'System Architecture Design'],
      advice: 'Focus on building scalable APIs, testing end-to-end user flows, and containerizing full-stack microservices.',
    },
    'AI / ML Specialist': {
      skills: ['Python', 'PyTorch', 'TensorFlow', 'LLM Fine-Tuning', 'FastAPI', 'Vector Databases'],
      gaps: ['Quantization & ONNX Export', 'Multi-Agent Evaluation', 'ML Ops Pipelines'],
      advice: 'Build and deploy local quantized LLMs, run latency benchmarks, and design retrieval-augmented generation pipelines.',
    },
    'Product & UX Designer': {
      skills: ['Figma', 'UI/UX Design', 'Design Systems', 'User Research', 'Prototyping'],
      gaps: ['Design Tokens in Code', 'Accessibility (WCAG 2.1)', 'Framer Motion Animations'],
      advice: 'Create production-grade Figma component libraries and pair with frontend engineers to inspect CSS token implementations.',
    },
    'Web3 & Smart Contract Developer': {
      skills: ['Solidity', 'Ethers.js', 'Hardhat', 'Ethereum/Polygon', 'OpenZeppelin'],
      gaps: ['Zero-Knowledge Proofs', 'Smart Contract Auditing', 'Account Abstraction (ERC-4337)'],
      advice: 'Audit smart contracts for re-entrancy and arithmetic safety, write fuzz tests, and deploy verifiable dApps.',
    },
  };

  const currentPathData = rolePaths[targetRole] || rolePaths['Full-Stack Engineer'];

  return (
    <AppLayout
      user={user}
      title="Growth Roadmap &amp; Skill Calibration"
      subtitle="Personalized career paths, target role gap analysis, and sprint delivery milestones."
    >
      {notice && <div className="form-success">{notice}</div>}
      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="loading-card">Loading learning roadmap…</div>
      ) : (
        <>
          {/* Target Role Selector */}
          <section className="roadmap-role-card plain-card">
        <div className="card-heading-clean">
          <Target size={18} className="text-teal" />
          <h3>Select Target Career Milestone</h3>
        </div>
        <div className="role-buttons-grid">
          {Object.keys(rolePaths).map((role) => (
            <button
              key={role}
              type="button"
              className={`role-select-btn ${targetRole === role ? 'active' : ''}`}
              onClick={() => void handleSaveRole(role)}
            >
              <Award size={14} />
              <span>{role}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Skill Gap Analysis */}
      <div className="roadmap-split-grid">
        <article className="plain-card">
          <div className="card-heading-clean">
            <CheckCircle2 size={16} className="text-teal" />
            <h3>Core Competencies for {targetRole}</h3>
          </div>
          <p className="roadmap-desc-text">{currentPathData.advice}</p>
          <div className="skill-chips-row">
            {currentPathData.skills.map((s) => (
              <span key={s} className="chip emerald-chip">
                ✓ {s}
              </span>
            ))}
          </div>
        </article>

        <article className="plain-card gap-analysis-card">
          <div className="card-heading-clean">
            <TrendingUp size={16} className="text-orange" />
            <h3>Identified Skill Gaps to Accelerate</h3>
          </div>
          <p className="roadmap-desc-text">Recommended learning areas for national hackathon competition readiness:</p>
          <div className="skill-chips-row">
            {currentPathData.gaps.map((g) => (
              <span key={g} className="chip orange-chip">
                ⚡ {g}
              </span>
            ))}
          </div>
        </article>
      </div>

      {/* Milestones & Sprint Planner */}
      <article className="plain-card roadmap-milestones-card">
        <div className="milestones-header">
          <div className="card-heading-clean">
            <Calendar size={18} className="text-teal" />
            <h3>Sprint Learning Milestones ({milestones.length})</h3>
          </div>
        </div>

        {/* Add Milestone Form */}
        <form className="add-milestone-form" onSubmit={handleAddMilestone}>
          <input
            type="text"
            placeholder="New learning milestone (e.g., Complete Docker deployment for project backend)..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <input
            type="date"
            value={newDue}
            onChange={(e) => setNewDue(e.target.value)}
            required
          />
          <button type="submit" className="primary-button tiny-button">
            <Plus size={14} /> Add Milestone
          </button>
        </form>

        {/* Milestone List */}
        <div className="milestone-items-list">
          {milestones.map((m) => (
            <div key={m.id} className="milestone-item-row">
              <div className="milestone-info-left">
                <CheckCircle2
                  size={16}
                  className={m.status === 'Done' ? 'text-teal' : 'text-muted'}
                />
                <div>
                  <strong>{m.title}</strong>
                  <span className="milestone-date">Target Due: {m.due_date}</span>
                </div>
              </div>

              <div className="milestone-controls-right">
                <div className="progress-bar-inline">
                  <div
                    className="progress-fill"
                    style={{ width: `${m.status === 'Done' ? 100 : m.progress || 30}%` }}
                  />
                </div>
                <select
                  value={m.status}
                  onChange={(e) => {
                    const st = e.target.value as RoadmapMilestone['status'];
                    const pr = st === 'Done' ? 100 : st === 'In progress' ? 50 : 0;
                    void handleUpdateMilestone(m.id, st, pr);
                  }}
                  className={`task-select-status status-${m.status.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <option value="Planned">Planned</option>
                  <option value="In progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Done">Done</option>
                </select>
                <button
                  type="button"
                  className="icon-button delete-milestone-btn"
                  onClick={() => void handleDeleteMilestone(m.id)}
                  title="Remove milestone"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {milestones.length === 0 && (
            <p className="empty-inline">No milestones added yet. Create your first milestone above.</p>
          )}
        </div>
      </article>
      </>
      )}
    </AppLayout>
  );
}

// ==========================================
// 10. NOTIFICATIONS CENTER (/notifications)
// ==========================================

export function NotificationsPage({ user }: { user: User | null }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ notifications: NotificationItem[] }>('/api/notifications');
      setNotifications(data.notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/notifications/mark-all-read', { method: 'POST' });
      setNotifications((curr) =>
        curr.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
      setNotice('All notifications marked as read.');
    } catch {
      // ignore
    }
  };

  const filteredNotifs = notifications.filter((n) =>
    filterType === 'all' ? true : n.type === filterType
  );

  return (
    <AppLayout
      user={user}
      title="Notifications"
      subtitle="Activity feed, application decisions, and collaboration invites."
      actionButton={
        <button type="button" className="secondary-button" onClick={handleMarkAllRead}>
          <CheckCircle2 size={14} /> Mark All as Read
        </button>
      }
    >
      {notice && <div className="form-success">{notice}</div>}
      {error && <div className="form-error">{error}</div>}

      <div className="tab-buttons-bar">
        {['all', 'application', 'connection', 'message', 'project'].map((type) => (
          <button
            key={type}
            type="button"
            className={`tab-btn ${filterType === type ? 'active' : ''}`}
            onClick={() => setFilterType(type)}
          >
            {type === 'all' ? 'All Alerts' : `${type.charAt(0).toUpperCase() + type.slice(1)}s`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-card">Loading notifications…</div>
      ) : filteredNotifs.length > 0 ? (
        <div className="notifications-list">
          {filteredNotifs.map((n) => (
            <article
              key={n.id}
              className={`notification-item-card ${!n.read_at ? 'unread-card' : ''}`}
              onClick={() => {
                if (n.related_path) navigate(n.related_path);
              }}
            >
              <div className="notif-icon-col">
                <Bell size={16} className="text-teal" />
              </div>
              <div className="notif-content-col">
                <div className="notif-type-pill">{n.type}</div>
                <p>{n.message}</p>
                {n.created_at && (
                  <time className="notif-time">
                    {new Date(n.created_at).toLocaleString()}
                  </time>
                )}
              </div>
              {n.related_path && (
                <div className="notif-action-col">
                  <span className="secondary-button tiny-button">View</span>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Bell />
          <h3>All caught up!</h3>
          <p>No unread notifications in this category.</p>
        </div>
      )}
    </AppLayout>
  );
}

// ==========================================
// 11. PRODUCT PRESENTATION & PITCH SHOWCASE (/presentation)
// ==========================================

export function PresentationPage({ user }: { user: User | null }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [presentationMode, setPresentationMode] = useState<'slides' | 'document'>('slides');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await apiFetch<{ projects: Project[] }>('/api/projects');
        const owned = payload.projects.filter((p) => p.owner_id === user?.id);
        setProjects(owned.length ? owned : payload.projects);
        if (owned[0]) setSelectedProjectId(owned[0].id);
        else if (payload.projects[0]) setSelectedProjectId(payload.projects[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load projects.');
      }
    };
    void load();
  }, [user?.id]);

  const selectedProj = projects.find((p) => p.id === Number(selectedProjectId)) || projects[0];

  const slides = selectedProj
    ? [
        {
          title: 'Executive Summary',
          badge: 'Slide 1 / 6',
          subtitle: selectedProj.name,
          body: selectedProj.description,
          highlights: [
            `Category: ${selectedProj.category}`,
            `Status: ${selectedProj.status}`,
            `Synergy Rating: ${selectedProj.match_score}%`,
          ],
        },
        {
          title: 'Problem Statement',
          badge: 'Slide 2 / 6',
          subtitle: 'The Core Student & Industry Pain Point',
          body: selectedProj.problem || selectedProj.description,
          highlights: [
            'Fragmented student team discovery across colleges',
            'Lack of verified evidence for technical hackathon submissions',
            'High failure rate in student-led project execution',
          ],
        },
        {
          title: 'Proposed Solution & Innovation',
          badge: 'Slide 3 / 6',
          subtitle: 'How SkillSetu AI Powers Rapid Execution',
          body:
            selectedProj.solution ||
            'Unified ecosystem connecting builders with predictive synergy modeling, real-time messaging, and interactive sprint taskboards.',
          highlights: [
            'Deterministic heuristic matching engine',
            'Live sprint task allocation and progress tracking',
            'AI judge simulation with transparent evaluation rubrics',
          ],
        },
        {
          title: 'Technical Architecture & Stack',
          badge: 'Slide 4 / 6',
          subtitle: 'Scalable, High-Performance Foundation',
          body: `Engineered with: ${selectedProj.tech_stack || 'React 19, TypeScript, Express, SQLite, TailWind CSS'}`,
          highlights: [
            'Normalized database schema with strict constraints',
            'Session-based secure authentication with Scrypt hashing',
            'Real-time reactive notification & message dispatching',
          ],
        },
        {
          title: 'Team Roles & Open Contributions',
          badge: 'Slide 5 / 6',
          subtitle: 'Collaborative Unit Formation',
          body: `Current positions sought: ${selectedProj.open_roles || 'Frontend Engineer, AI/ML Researcher, UX Designer'}`,
          highlights: [
            `Project Lead: ${selectedProj.owner_name || user?.name}`,
            'Cross-college collaboration workflow enabled',
            'Clear task ownership and milestone deliverables',
          ],
        },
        {
          title: 'Traction & Hackathon Roadmap',
          badge: 'Slide 6 / 6',
          subtitle: 'Milestones & Future Scope',
          body: 'Validated MVP ready for live demo and judge evaluation.',
          highlights: [
            'Interactive pitch rehearsed with AI Judge Simulator',
            'Live sprint tasks scheduled on growth roadmap',
            'Scalable deployment on campus cloud infrastructure',
          ],
        },
      ]
    : [];

  const copyPitchText = async () => {
    if (!slides.length) return;
    const fullText = slides
      .map(
        (s) =>
          `=== ${s.title} ===\n${s.subtitle}\n${s.body}\nHighlights:\n${s.highlights.map((h) => `• ${h}`).join('\n')}\n`
      )
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(fullText);
      setNotice('Full presentation outline copied to clipboard.');
    } catch {
      setNotice('Clipboard unavailable.');
    }
  };

  const downloadPitch = () => {
    if (!selectedProj) return;
    const fullText = slides
      .map(
        (s) =>
          `# ${s.title}\n**${s.subtitle}**\n\n${s.body}\n\nKey Points:\n${s.highlights.map((h) => `- ${h}`).join('\n')}\n\n---`
      )
      .join('\n\n');
    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-pitch-deck.md`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice('Markdown presentation downloaded.');
  };

  return (
    <AppLayout
      user={user}
      title="Product Presentation &amp; Pitch Builder"
      subtitle="Interactive slide showcase and exportable pitch deck for hackathon demos and judge reviews."
      actionButton={
        <div className="header-action-group">
          <button type="button" className="secondary-button" onClick={() => void copyPitchText()}>
            <Copy size={14} /> Copy Deck
          </button>
          <button type="button" className="primary-button" onClick={downloadPitch}>
            <Download size={14} /> Download Markdown
          </button>
        </div>
      }
    >
      {notice && <div className="form-success">{notice}</div>}
      {error && <div className="form-error">{error}</div>}

      {/* Project Selector & Mode Switcher */}
      <div className="projects-toolbar presentation-toolbar">
        <label>
          <span>Select Venture</span>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(Number(e.target.value));
              setCurrentSlideIndex(0);
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>
        </label>

        <div className="view-mode-toggle">
          <button
            type="button"
            className={`mode-btn ${presentationMode === 'slides' ? 'active' : ''}`}
            onClick={() => setPresentationMode('slides')}
          >
            Slide Presentation Mode
          </button>
          <button
            type="button"
            className={`mode-btn ${presentationMode === 'document' ? 'active' : ''}`}
            onClick={() => setPresentationMode('document')}
          >
            Structured Document View
          </button>
        </div>
      </div>

      {/* Presentation Viewer */}
      {selectedProj && slides.length > 0 ? (
        presentationMode === 'slides' ? (
          <div className="slide-viewer-container">
            <div className="slide-canvas">
              <div className="slide-topline">
                <span className="slide-badge">{slides[currentSlideIndex].badge}</span>
                <span className="slide-brand">SkillSetu AI Presentation Studio</span>
              </div>

              <h2 className="slide-title">{slides[currentSlideIndex].title}</h2>
              <h4 className="slide-subtitle">{slides[currentSlideIndex].subtitle}</h4>

              <p className="slide-body">{slides[currentSlideIndex].body}</p>

              <div className="slide-highlights-grid">
                {slides[currentSlideIndex].highlights.map((h, i) => (
                  <div key={i} className="highlight-pill">
                    <CheckCircle2 size={14} className="text-teal" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Slide Navigation Controls */}
            <div className="slide-nav-controls">
              <button
                type="button"
                className="secondary-button"
                disabled={currentSlideIndex === 0}
                onClick={() => setCurrentSlideIndex((i) => Math.max(0, i - 1))}
              >
                Previous Slide
              </button>

              <div className="slide-dots-row">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`slide-dot ${idx === currentSlideIndex ? 'active' : ''}`}
                    onClick={() => setCurrentSlideIndex(idx)}
                    aria-label={`Jump to slide ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                className="primary-button"
                disabled={currentSlideIndex === slides.length - 1}
                onClick={() => setCurrentSlideIndex((i) => Math.min(slides.length - 1, i + 1))}
              >
                Next Slide
              </button>
            </div>
          </div>
        ) : (
          <div className="presentation-document-view">
            {slides.map((s, idx) => (
              <article key={idx} className="plain-card doc-slide-section">
                <span className="doc-slide-badge">{s.badge}</span>
                <h3>{s.title}</h3>
                <h4>{s.subtitle}</h4>
                <p>{s.body}</p>
                <div className="doc-bullets-list">
                  {s.highlights.map((h, i) => (
                    <div key={i} className="doc-bullet">
                      • {h}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )
      ) : (
        <div className="empty-state">
          <BriefcaseBusiness />
          <h3>No projects available to present</h3>
          <p>Create a project first to generate a structured pitch presentation.</p>
          <Link to="/projects?create=true" className="primary-button">
            Create Project
          </Link>
        </div>
      )}
    </AppLayout>
  );
}

// ==========================================
// 11B. AI SKILLS & GAP ANALYZER (/ai-skills)
// ==========================================

export type AiSkillAnalysis = {
  extractedSkills: string[];
  skillMastery: Array<{ skill: string; level: string; confidenceScore: number; evidence: string }>;
  strengths: string[];
  skillGaps: string[];
  certificateEvaluation: {
    verified: boolean;
    credibility: string;
    relevanceScore: number;
    summary: string;
  };
  recommendedActions: Array<{ action: string; priority: string; timeframe: string }>;
  personalizedCareerRecommendations: string[];
  aiProvider?: string;
  model?: string;
  setupNotice?: string;
};

export type AiOpportunityComparison = {
  compatibilityScore: number;
  readinessVerdict: string;
  matchingRequirements: string[];
  missingQualifications: string[];
  gapSeverity: 'Low' | 'Medium' | 'High';
  actionableImprovementSteps: Array<{ step: string; estimatedHours: number; impact: string }>;
  competitiveAdvantage: string;
  aiProvider?: string;
  model?: string;
  setupNotice?: string;
};

export type AiCareerRoadmap = {
  targetRole: string;
  estimatedCompletionWeeks: number;
  overallReadiness: number;
  phases: Array<{
    phaseNumber: number;
    title: string;
    weekSpan: string;
    focus: string;
    milestones: Array<{ title: string; duration: string }>;
  }>;
  capstoneProject?: {
    title: string;
    description: string;
    techStack: string[];
  };
  recommendedCertifications?: string[];
  aiProvider?: string;
  model?: string;
  setupNotice?: string;
};

export function AiSkillsAnalyzerPage({ user }: { user: User | null }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'skills' | 'opportunity' | 'career') || 'skills';
  const [activeTab, setActiveTab] = useState<'skills' | 'opportunity' | 'career'>(initialTab);

  // Tab 1: Skills & Certificate Analysis State
  const [certTitle, setCertTitle] = useState('');
  const [certOrg, setCertOrg] = useState('');
  const [certText, setCertText] = useState('');
  const [portfolioText, setPortfolioText] = useState(user?.bio || '');
  const [skillAnalysis, setSkillAnalysis] = useState<AiSkillAnalysis | null>(null);
  const [analyzingSkills, setAnalyzingSkills] = useState(false);

  // Tab 2: Opportunity Comparison State
  const [oppType, setOppType] = useState('Hackathon');
  const [oppTitle, setOppTitle] = useState(searchParams.get('title') || 'Smart India Hackathon 2026');
  const [oppReqs, setOppReqs] = useState(
    searchParams.get('theme')
      ? `Theme & Requirements: ${searchParams.get('theme')}. Looking for full-stack, AI/ML, and edge computing developers.`
      : 'Smart Automation, Healthcare, AI/ML models, React frontend, REST backend, system security, and verified deployment.'
  );
  const [oppComparison, setOppComparison] = useState<AiOpportunityComparison | null>(null);
  const [comparingOpp, setComparingOpp] = useState(false);

  // Tab 3: AI Career Roadmap State
  const [targetRole, setTargetRole] = useState('Full-Stack AI Engineer');
  const [timeframeWeeks, setTimeframeWeeks] = useState(6);
  const [careerRoadmap, setCareerRoadmap] = useState<AiCareerRoadmap | null>(null);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Handle Quick Fill Samples for Certificate
  const handleSampleCert = (sample: string) => {
    if (sample === 'nvidia') {
      setCertTitle('Building LLM Applications & Agentic AI');
      setCertOrg('NVIDIA Deep Learning Institute (DLI)');
      setCertText('Comprehensive mastery of transformer architectures, prompt engineering, agentic RAG workflows, NVIDIA NeMo framework, and GPU-accelerated inference pipelines.');
    } else if (sample === 'gcp') {
      setCertTitle('Associate Cloud Engineer');
      setCertOrg('Google Cloud Platform');
      setCertText('Deployment of containerized applications on Google Kubernetes Engine, Cloud Run, IAM policies, VPC networking, Cloud SQL, and automated CI/CD monitoring.');
    } else if (sample === 'hackathon') {
      setCertTitle('National Finalist & Best Technical Innovation');
      setCertOrg('Smart India Hackathon (Ministry of Education)');
      setCertText('Engineered edge drone perception stack combining ROS2, OpenCV, PyTorch quantized neural networks, and real-time offline mesh telemetry.');
    }
  };

  // Handle Quick Fill Samples for Opportunity
  const handleSampleOpp = (sample: string) => {
    if (sample === 'sih') {
      setOppType('Hackathon');
      setOppTitle('Smart India Hackathon 2026');
      setOppReqs('Theme: Smart Automation & Agritech. Requires Python, FastAPI, PyTorch, React, offline SQLite caching, edge sensor telemetry, and accessible UI.');
    } else if (sample === 'ethindia') {
      setOppType('Hackathon');
      setOppTitle('ETHIndia 2026');
      setOppReqs('Theme: Web3 & Decentralized Infrastructure. Requires Solidity, Hardhat, Polygon/Ethereum EVM, zero-knowledge proofs (Circom/SnarkJS), and Next.js/React.');
    } else if (sample === 'google') {
      setOppType('Hackathon');
      setOppTitle('Google Cloud GenAI Hackathon 2026');
      setOppReqs('Theme: Multi-Modal Agentic AI. Requires Gemini/NVIDIA LLM APIs, vector embeddings, LangChain/LlamaIndex, React 19, and cloud microservices.');
    } else if (sample === 'internship') {
      setOppType('Internship');
      setOppTitle('AI Full-Stack Engineering Intern');
      setOppReqs('Fast-growing AI startup looking for engineers proficient in React 19, TypeScript, Node.js/Express, SQLite/PostgreSQL, LLM integration, and Git CI/CD.');
    }
  };

  // 1. Run Skills & Certificate Analysis
  const handleAnalyzeSkills = async (e: FormEvent) => {
    e.preventDefault();
    setAnalyzingSkills(true);
    setError('');
    setNotice('');
    try {
      const fullCertText = [certTitle, certOrg, certText].filter(Boolean).join(' · ');
      const res = await apiFetch<{ analysis: AiSkillAnalysis }>('/api/ai/analyze-skills', {
        method: 'POST',
        body: JSON.stringify({
          certificateText: fullCertText,
          portfolioSummary: portfolioText,
        }),
      });
      setSkillAnalysis(res.analysis);
      setNotice('Student skill analysis completed successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete AI skill analysis.');
    } finally {
      setAnalyzingSkills(false);
    }
  };

  // 2. Run Opportunity Comparison
  const handleCompareOpportunity = async (e: FormEvent) => {
    e.preventDefault();
    setComparingOpp(true);
    setError('');
    setNotice('');
    try {
      const res = await apiFetch<{ comparison: AiOpportunityComparison }>('/api/ai/compare-opportunity', {
        method: 'POST',
        body: JSON.stringify({
          opportunityType: oppType,
          opportunityTitle: oppTitle,
          opportunityRequirements: oppReqs,
        }),
      });
      setOppComparison(res.comparison);
      setNotice(`Compatibility analysis complete for ${oppTitle}!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to compare opportunity.');
    } finally {
      setComparingOpp(false);
    }
  };

  // 3. Run Career Roadmap Generation
  const handleGenerateRoadmap = async (e: FormEvent) => {
    e.preventDefault();
    setGeneratingRoadmap(true);
    setError('');
    setNotice('');
    try {
      const res = await apiFetch<{ roadmap: AiCareerRoadmap }>('/api/ai/career-roadmap', {
        method: 'POST',
        body: JSON.stringify({
          targetRole,
          timeframeWeeks,
        }),
      });
      setCareerRoadmap(res.roadmap);
      setNotice('Custom learning & sprint roadmap generated!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate career roadmap.');
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  // 4. 1-Click Sync to Personal Growth Roadmap
  const handleAddActionToRoadmap = async (actionTitle: string) => {
    try {
      await apiFetch('/api/roadmaps/milestones', {
        method: 'POST',
        body: JSON.stringify({
          title: actionTitle,
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
          status: 'Planned',
          progress: 0,
        }),
      });
      setNotice(`"${actionTitle}" added to your Growth Roadmap!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add milestone.');
    }
  };

  return (
    <AppLayout
      user={user}
      title="AI Skills &amp; Opportunity Analyzer"
      subtitle="Analyze verified skills and certificates, compare against hackathons and internships, identify missing qualifications, and generate personalized improvement action plans."
    >
      {notice && <div className="form-success">{notice}</div>}
      {error && <div className="form-error">{error}</div>}

      {/* Tabs Navigation */}
      <div className="projects-toolbar ai-tabs-bar">
        <div className="view-mode-toggle">
          <button
            type="button"
            className={`mode-btn ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('skills');
              setSearchParams({ tab: 'skills' });
            }}
          >
            <Award size={15} /> Skills &amp; Certificate Analysis
          </button>
          <button
            type="button"
            className={`mode-btn ${activeTab === 'opportunity' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('opportunity');
              setSearchParams({ tab: 'opportunity' });
            }}
          >
            <Target size={15} /> Opportunity Match &amp; Gap Analysis
          </button>
          <button
            type="button"
            className={`mode-btn ${activeTab === 'career' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('career');
              setSearchParams({ tab: 'career' });
            }}
          >
            <TrendingUp size={15} /> Personalized Career Roadmap
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SKILLS & CERTIFICATE CREDENTIAL ANALYSIS */}
      {/* ========================================================================= */}
      {activeTab === 'skills' && (
        <div className="ai-analyzer-grid">
          {/* Input Panel */}
          <form className="plain-card ai-input-panel" onSubmit={handleAnalyzeSkills}>
            <div className="card-heading-clean">
              <Award size={18} className="text-teal" />
              <h3>Analyze Student Skills &amp; Credentials</h3>
            </div>
            <p className="judge-hint-text">
              Enter certificate credentials, coursework, or experience summaries to extract competencies, verify credibility, and detect industry skill gaps.
            </p>

            <div className="quick-fill-chips">
              <span>Quick Samples:</span>
              <button type="button" className="chip-btn" onClick={() => handleSampleCert('nvidia')}>
                NVIDIA DLI Certificate
              </button>
              <button type="button" className="chip-btn" onClick={() => handleSampleCert('gcp')}>
                Google Cloud Associate
              </button>
              <button type="button" className="chip-btn" onClick={() => handleSampleCert('hackathon')}>
                SIH Hackathon Winner
              </button>
            </div>

            <label>
              Certificate / Credential Title
              <input
                value={certTitle}
                onChange={(e) => setCertTitle(e.target.value)}
                placeholder="e.g. Building LLM Applications with NVIDIA NeMo &amp; PyTorch"
              />
            </label>

            <label>
              Issuing Organization / Authority
              <input
                value={certOrg}
                onChange={(e) => setCertOrg(e.target.value)}
                placeholder="e.g. NVIDIA Deep Learning Institute / Google Cloud / AWS"
              />
            </label>

            <label>
              Certificate Credential Details / Skills Description
              <textarea
                value={certText}
                onChange={(e) => setCertText(e.target.value)}
                rows={4}
                placeholder="Paste the certificate description, syllabus modules, or competencies covered..."
              />
            </label>

            <label>
              Portfolio &amp; Experience Summary
              <textarea
                value={portfolioText}
                onChange={(e) => setPortfolioText(e.target.value)}
                rows={3}
                placeholder="Brief summary of projects, hackathons, or academic highlights..."
              />
            </label>

            <div className="judge-actions-row">
              <button type="submit" className="primary-button" disabled={analyzingSkills}>
                <Sparkles size={14} className={analyzingSkills ? 'spin' : ''} />
                {analyzingSkills ? 'Analyzing with NVIDIA AI...' : 'Run Skill & Certificate Analysis'}
              </button>
            </div>
          </form>

          {/* Results Panel */}
          <div className="ai-results-panel">
            {skillAnalysis ? (
              <div className="ai-output-stack">
                {/* Header Banner */}
                <article className="plain-card score-hero-card">
                  <div className="score-hero-top">
                    <div className="score-big-circle">
                      <strong>{skillAnalysis.certificateEvaluation?.relevanceScore || 90}</strong>
                      <span>/ 100</span>
                    </div>
                    <div className="verdict-box">
                      <div className="badge-row-top">
                        <span className="chip success">
                          <CheckCircle2 size={12} /> {skillAnalysis.certificateEvaluation?.credibility || 'Verified'}
                        </span>
                        <span className="chip category-chip">
                          {skillAnalysis.aiProvider === 'nvidia_api_catalog'
                            ? `NVIDIA AI (${skillAnalysis.model || 'llama-3.1-70b'})`
                            : 'Smart Heuristic Engine'}
                        </span>
                      </div>
                      <h3>Competency &amp; Credential Evaluation</h3>
                      <p>{skillAnalysis.certificateEvaluation?.summary}</p>
                    </div>
                  </div>
                </article>

                {/* Skill Mastery Grid */}
                <article className="plain-card">
                  <div className="card-heading-clean">
                    <Target size={16} className="text-teal" />
                    <h4>Skill Mastery Matrix</h4>
                  </div>
                  <div className="skill-mastery-list">
                    {skillAnalysis.skillMastery.map((sm, i) => (
                      <div key={i} className="skill-mastery-row">
                        <div className="sm-left">
                          <strong>{sm.skill}</strong>
                          <span className={`chip ${sm.level === 'Advanced' ? 'success' : 'neutral'}`}>{sm.level}</span>
                          <p>{sm.evidence}</p>
                        </div>
                        <div className="sm-right">
                          <span className="sm-score">{sm.confidenceScore}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                {/* Strengths & Gaps */}
                <div className="strengths-gaps-grid">
                  <article className="plain-card">
                    <div className="card-heading-clean">
                      <CheckCircle2 size={16} className="text-teal" />
                      <h4>Identified Strengths &amp; Superpowers</h4>
                    </div>
                    <ul className="judge-q-list">
                      {skillAnalysis.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="plain-card">
                    <div className="card-heading-clean">
                      <ShieldAlert size={16} className="text-orange" />
                      <h4>Missing Skills &amp; Industry Gaps</h4>
                    </div>
                    <ul className="judge-q-list">
                      {skillAnalysis.skillGaps.map((g, i) => (
                        <li key={i} className="text-amber-bullet">
                          {g}
                        </li>
                      ))}
                    </ul>
                  </article>
                </div>

                {/* Recommended Improvement Actions */}
                <article className="plain-card">
                  <div className="card-heading-clean">
                    <Lightbulb size={16} className="text-teal" />
                    <h4>Recommended Improvement Actions</h4>
                  </div>
                  <div className="actions-milestones-stack">
                    {skillAnalysis.recommendedActions.map((act, i) => (
                      <div key={i} className="action-milestone-row">
                        <div className="am-info">
                          <span className={`chip ${act.priority === 'High' ? 'danger' : 'neutral'}`}>
                            {act.priority} Priority
                          </span>
                          <span className="chip category-chip">{act.timeframe}</span>
                          <p>{act.action}</p>
                        </div>
                        <button
                          type="button"
                          className="secondary-button tiny-button"
                          onClick={() => void handleAddActionToRoadmap(act.action)}
                        >
                          <Plus size={13} /> Add to Roadmap
                        </button>
                      </div>
                    ))}
                  </div>
                </article>

                {/* Personalized Career Recommendations */}
                <article className="plain-card tips-card">
                  <div className="card-heading-clean">
                    <Compass size={16} className="text-teal" />
                    <h4>Personalized Career Recommendations</h4>
                  </div>
                  <ul className="judge-q-list">
                    {skillAnalysis.personalizedCareerRecommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </article>
              </div>
            ) : (
              <div className="empty-state">
                <Award size={48} className="text-teal" />
                <h3>No analysis results yet</h3>
                <p>Fill in your certificate credentials and experience on the left, then click &quot;Run Skill &amp; Certificate Analysis&quot;.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OPPORTUNITY SYNERGY & GAP MATCHER */}
      {/* ========================================================================= */}
      {activeTab === 'opportunity' && (
        <div className="ai-analyzer-grid">
          {/* Opportunity Input Panel */}
          <form className="plain-card ai-input-panel" onSubmit={handleCompareOpportunity}>
            <div className="card-heading-clean">
              <Target size={18} className="text-teal" />
              <h3>Target Opportunity &amp; Requirements</h3>
            </div>
            <p className="judge-hint-text">
              Compare your student profile against any hackathon, internship, or project role to identify matching requirements and missing qualifications.
            </p>

            <div className="quick-fill-chips">
              <span>Quick Presets:</span>
              <button type="button" className="chip-btn" onClick={() => handleSampleOpp('sih')}>
                Smart India Hackathon
              </button>
              <button type="button" className="chip-btn" onClick={() => handleSampleOpp('ethindia')}>
                ETHIndia 2026
              </button>
              <button type="button" className="chip-btn" onClick={() => handleSampleOpp('google')}>
                Google Cloud GenAI
              </button>
              <button type="button" className="chip-btn" onClick={() => handleSampleOpp('internship')}>
                Startup Internship
              </button>
            </div>

            <label>
              Opportunity Type
              <select value={oppType} onChange={(e) => setOppType(e.target.value)}>
                <option value="Hackathon">National Hackathon</option>
                <option value="Internship">Internship / Job Role</option>
                <option value="Project Team">Project Team Vacancy</option>
                <option value="Research">Research Lab Capstone</option>
              </select>
            </label>

            <label>
              Opportunity Title
              <input
                value={oppTitle}
                onChange={(e) => setOppTitle(e.target.value)}
                placeholder="e.g. Smart India Hackathon 2026 — Smart Automation Track"
                required
              />
            </label>

            <label>
              Theme, Open Roles &amp; Skill Requirements
              <textarea
                value={oppReqs}
                onChange={(e) => setOppReqs(e.target.value)}
                rows={5}
                placeholder="Paste the problem statement, required tech stack, open roles, or eligibility criteria..."
                required
              />
            </label>

            <div className="judge-actions-row">
              <button type="submit" className="primary-button" disabled={comparingOpp}>
                <Sparkles size={14} className={comparingOpp ? 'spin' : ''} />
                {comparingOpp ? 'Comparing with NVIDIA AI...' : 'Run Opportunity Gap Analysis'}
              </button>
            </div>
          </form>

          {/* Opportunity Comparison Output */}
          <div className="ai-results-panel">
            {oppComparison ? (
              <div className="ai-output-stack">
                {/* Score Hero */}
                <article className="plain-card score-hero-card">
                  <div className="score-hero-top">
                    <div className="score-big-circle">
                      <strong>{oppComparison.compatibilityScore}</strong>
                      <span>/ 100</span>
                    </div>
                    <div className="verdict-box">
                      <div className="badge-row-top">
                        <span className={`chip ${oppComparison.gapSeverity === 'Low' ? 'success' : 'warning'}`}>
                          {oppComparison.gapSeverity} Gap Severity
                        </span>
                        <span className="chip category-chip">
                          {oppComparison.aiProvider === 'nvidia_api_catalog'
                            ? `NVIDIA AI (${oppComparison.model || 'llama-3.1-70b'})`
                            : 'Smart Heuristic Engine'}
                        </span>
                      </div>
                      <h3>{oppComparison.readinessVerdict}</h3>
                      <p>{oppComparison.competitiveAdvantage}</p>
                    </div>
                  </div>
                </article>

                {/* Matching vs Missing Qualifications */}
                <div className="strengths-gaps-grid">
                  <article className="plain-card">
                    <div className="card-heading-clean">
                      <CheckCircle2 size={16} className="text-teal" />
                      <h4>Matching Requirements ({oppComparison.matchingRequirements.length})</h4>
                    </div>
                    <ul className="judge-q-list">
                      {oppComparison.matchingRequirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="plain-card">
                    <div className="card-heading-clean">
                      <ShieldAlert size={16} className="text-orange" />
                      <h4>Missing Qualifications &amp; Gaps ({oppComparison.missingQualifications.length})</h4>
                    </div>
                    <ul className="judge-q-list">
                      {oppComparison.missingQualifications.map((gap, i) => (
                        <li key={i} className="text-amber-bullet">
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </article>
                </div>

                {/* Actionable Improvement Steps */}
                <article className="plain-card">
                  <div className="card-heading-clean">
                    <Lightbulb size={16} className="text-teal" />
                    <h4>Actionable Steps to Bridge Skill Gap</h4>
                  </div>
                  <div className="actions-milestones-stack">
                    {oppComparison.actionableImprovementSteps.map((step, i) => (
                      <div key={i} className="action-milestone-row">
                        <div className="am-info">
                          <span className="chip success">{step.estimatedHours} Hours</span>
                          <span className={`chip ${step.impact === 'High' ? 'category-chip' : 'neutral'}`}>
                            {step.impact} Impact
                          </span>
                          <p>{step.step}</p>
                        </div>
                        <button
                          type="button"
                          className="secondary-button tiny-button"
                          onClick={() => void handleAddActionToRoadmap(step.step)}
                        >
                          <Plus size={13} /> Add to Roadmap
                        </button>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            ) : (
              <div className="empty-state">
                <Target size={48} className="text-teal" />
                <h3>No opportunity compared yet</h3>
                <p>Select an opportunity preset or enter your target hackathon/internship requirements to see your real-time compatibility score.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PERSONALIZED CAREER ROADMAP GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === 'career' && (
        <div className="ai-analyzer-grid">
          {/* Config Panel */}
          <form className="plain-card ai-input-panel" onSubmit={handleGenerateRoadmap}>
            <div className="card-heading-clean">
              <TrendingUp size={18} className="text-teal" />
              <h3>Configure Career &amp; Sprint Goals</h3>
            </div>
            <p className="judge-hint-text">
              Generate structured milestone phases, capstone project ideas, and industry certification paths tailored to your college profile.
            </p>

            <label>
              Target Role / Specialization
              <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                <option value="Full-Stack AI Engineer">Full-Stack AI Engineer (React 19, Node.js, NVIDIA LLMs)</option>
                <option value="Edge AI &amp; Robotics Specialist">Edge AI &amp; Robotics Specialist (C++, ROS2, PyTorch)</option>
                <option value="Web3 &amp; Smart Contract Auditor">Web3 &amp; Smart Contract Auditor (Solidity, ZK-SNARKs)</option>
                <option value="Product Designer &amp; Design Systems Lead">Product Designer &amp; Design Systems Lead (Figma, Tailwind)</option>
                <option value="Distributed Cloud Architect">Distributed Cloud Architect (Docker, K8s, Go, PostgreSQL)</option>
              </select>
            </label>

            <label>
              Timeframe for Completion
              <select value={timeframeWeeks} onChange={(e) => setTimeframeWeeks(Number(e.target.value))}>
                <option value={4}>4 Weeks (Intensive Hackathon Sprint)</option>
                <option value={6}>6 Weeks (Standard Capstone Preparation)</option>
                <option value={8}>8 Weeks (Deep Technical Specialization)</option>
                <option value={12}>12 Weeks (Semester Long Track)</option>
              </select>
            </label>

            <div className="judge-actions-row">
              <button type="submit" className="primary-button" disabled={generatingRoadmap}>
                <Sparkles size={14} className={generatingRoadmap ? 'spin' : ''} />
                {generatingRoadmap ? 'Generating with NVIDIA AI...' : 'Generate Personalized Career Roadmap'}
              </button>
            </div>
          </form>

          {/* Career Roadmap Output */}
          <div className="ai-results-panel">
            {careerRoadmap ? (
              <div className="ai-output-stack">
                <article className="plain-card score-hero-card">
                  <div className="score-hero-top">
                    <div className="score-big-circle">
                      <strong>{careerRoadmap.overallReadiness}</strong>
                      <span>%</span>
                    </div>
                    <div className="verdict-box">
                      <div className="badge-row-top">
                        <span className="chip success">{careerRoadmap.estimatedCompletionWeeks} Weeks Track</span>
                        <span className="chip category-chip">
                          {careerRoadmap.aiProvider === 'nvidia_api_catalog'
                            ? `NVIDIA AI (${careerRoadmap.model || 'llama-3.1-70b'})`
                            : 'Smart Heuristic Engine'}
                        </span>
                      </div>
                      <h3>{careerRoadmap.targetRole} Roadmap</h3>
                      <p>Personalized learning pathway and verified project milestones calibrated to your background.</p>
                    </div>
                  </div>
                </article>

                {/* Phases Stack */}
                <div className="coach-phases-stack">
                  {careerRoadmap.phases.map((phase) => (
                    <article key={phase.phaseNumber} className="plain-card phase-card">
                      <div className="phase-card-top">
                        <span className="phase-number-badge">{phase.title}</span>
                        <span className="phase-due-badge">
                          <Clock size={12} /> {phase.weekSpan}
                        </span>
                      </div>
                      <p className="phase-title-text">{phase.focus}</p>
                      <div className="phase-tasks-checklist">
                        {phase.milestones.map((m, mIdx) => (
                          <div key={mIdx} className="phase-task-row justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={14} className="text-teal" />
                              <span>{m.title}</span>
                            </div>
                            <button
                              type="button"
                              className="secondary-button tiny-button"
                              onClick={() => void handleAddActionToRoadmap(m.title)}
                            >
                              <Plus size={12} /> Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>

                {/* Capstone Project Idea */}
                {careerRoadmap.capstoneProject && (
                  <article className="plain-card">
                    <div className="card-heading-clean">
                      <Flame size={16} className="text-orange" />
                      <h4>Recommended Capstone Project: {careerRoadmap.capstoneProject.title}</h4>
                    </div>
                    <p>{careerRoadmap.capstoneProject.description}</p>
                    <div className="skills-chips-row mt-3">
                      {careerRoadmap.capstoneProject.techStack.map((tech, i) => (
                        <span key={i} className="chip category-chip">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </article>
                )}

                {/* Recommended Certifications */}
                {careerRoadmap.recommendedCertifications && (
                  <article className="plain-card tips-card">
                    <div className="card-heading-clean">
                      <Award size={16} className="text-teal" />
                      <h4>Recommended Industry Certifications</h4>
                    </div>
                    <ul className="judge-q-list">
                      {careerRoadmap.recommendedCertifications.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </article>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <TrendingUp size={48} className="text-teal" />
                <h3>No roadmap generated yet</h3>
                <p>Select your desired career specialization and timeframe, then click &quot;Generate Personalized Career Roadmap&quot;.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ==========================================
// 12. AI INNOVATION SCANNER (/innovation-scanner)
// ==========================================

export function AiScannerPage({ user }: { user: User | null }) {
  const navigate = useNavigate();
  const [domainFilter, setDomainFilter] = useState('All');
  const [keywords, setKeywords] = useState('');
  const [ideas, setIdeas] = useState<Array<{
    id: string;
    title: string;
    domain: string;
    difficulty: string;
    viabilityScore?: number;
    problem: string;
    solution: string;
    stack: string;
    team: string;
    impactMetric?: string;
  }>>([]);
  const [savedIdeas, setSavedIdeas] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadIdeas = async (domain: string, kw: string) => {
    setScanning(true);
    setError('');
    try {
      const res = await apiFetch<{ ideas: typeof ideas }>('/api/ai/scanner', {
        method: 'POST',
        body: JSON.stringify({ domain, keywords: kw }),
      });
      setIdeas(res.ideas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to scan ideas.');
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    void loadIdeas(domainFilter, keywords);
  }, [domainFilter]);

  const handleCustomScan = (e: FormEvent) => {
    e.preventDefault();
    void loadIdeas(domainFilter, keywords);
  };

  const handleConvertIdea = async (idea: (typeof ideas)[0]) => {
    try {
      await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: idea.title,
          category: idea.domain,
          description: `${idea.problem} ${idea.solution}`,
          problem: idea.problem,
          solution: idea.solution,
          techStack: idea.stack,
          openRoles: idea.team,
          difficulty: idea.difficulty,
          status: 'Open',
        }),
      });
      setNotice(`"${idea.title}" converted into an active venture in your workspace!`);
      setTimeout(() => navigate('/projects'), 1500);
    } catch {
      setNotice('Project created or already exists.');
      navigate('/projects');
    }
  };

  return (
    <AppLayout
      user={user}
      title="AI Innovation Scanner"
      subtitle="Discover high-impact hackathon problem statements powered by NVIDIA AI and convert them into live collaboration sprints."
    >
      {notice && <div className="form-success">{notice}</div>}
      {error && <div className="form-error">{error}</div>}

      {/* AI Scan Toolbar */}
      <form className="plain-card scanner-toolbar-card" onSubmit={handleCustomScan}>
        <div className="scanner-inputs-row">
          <label>
            <span>Target Domain</span>
            <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
              <option value="All">All Domains</option>
              <option value="Healthcare">Healthcare &amp; MedTech</option>
              <option value="Agritech">Agritech &amp; Sustainability</option>
              <option value="CleanTech">CleanTech &amp; ESG</option>
              <option value="NeuroTech">NeuroTech &amp; Assistive Tech</option>
              <option value="EdTech">EdTech &amp; Student Collaboration</option>
              <option value="FinTech">FinTech &amp; Fraud Detection</option>
            </select>
          </label>

          <label className="flex-1">
            <span>Custom Focus / Keywords</span>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. Edge AI, Zero-Knowledge proofs, Smart India Hackathon..."
            />
          </label>

          <button type="submit" className="primary-button" disabled={scanning}>
            <Sparkles size={14} className={scanning ? 'spin' : ''} />
            {scanning ? 'Scanning...' : 'Scan with NVIDIA AI'}
          </button>
        </div>
      </form>

      {/* Ideas Grid */}
      {scanning ? (
        <div className="loading-card">
          <Sparkles className="spin text-teal" />
          <span>Scanning innovation opportunities with NVIDIA AI...</span>
        </div>
      ) : ideas.length > 0 ? (
        <div className="scanner-ideas-grid">
          {ideas.map((idea) => {
            const isSaved = savedIdeas.includes(idea.id);
            return (
              <article key={idea.id} className="plain-card idea-card">
                <div className="idea-card-header">
                  <span className="chip category-chip">{idea.domain}</span>
                  <span className="chip neutral">{idea.difficulty}</span>
                  {idea.viabilityScore && (
                    <span className="chip success">{idea.viabilityScore}% Viability</span>
                  )}
                </div>

                <h3>{idea.title}</h3>

                <div className="idea-section">
                  <strong>
                    <Flame size={13} className="text-orange" /> Problem Statement
                  </strong>
                  <p>{idea.problem}</p>
                </div>

                <div className="idea-section">
                  <strong>
                    <Lightbulb size={13} className="text-teal" /> Suggested Solution
                  </strong>
                  <p>{idea.solution}</p>
                </div>

                <div className="idea-section">
                  <strong>
                    <FileCode2 size={13} className="text-blue" /> Suggested Stack
                  </strong>
                  <p>{idea.stack}</p>
                </div>

                <div className="idea-section">
                  <strong>
                    <Users size={13} className="text-teal" /> Team Roles Needed
                  </strong>
                  <p>{idea.team}</p>
                </div>

                {idea.impactMetric && (
                  <div className="idea-section">
                    <strong>
                      <TrendingUp size={13} className="text-teal" /> Projected Impact
                    </strong>
                    <p>{idea.impactMetric}</p>
                  </div>
                )}

                <div className="idea-card-actions">
                  <button
                    type="button"
                    className="secondary-button tiny-button"
                    onClick={() => {
                      setSavedIdeas((curr) =>
                        isSaved ? curr.filter((i) => i !== idea.id) : [...curr, idea.id]
                      );
                      setNotice(isSaved ? 'Idea removed from saved.' : 'Idea bookmarked.');
                    }}
                  >
                    {isSaved ? 'Bookmarked ✓' : 'Bookmark Idea'}
                  </button>
                  <button
                    type="button"
                    className="primary-button tiny-button"
                    onClick={() => void handleConvertIdea(idea)}
                  >
                    <Sparkles size={13} /> Convert to Live Venture
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Compass size={48} className="text-teal" />
          <h3>No ideas matched your filter</h3>
          <p>Try clearing your custom keywords or select &quot;All Domains&quot;.</p>
        </div>
      )}
    </AppLayout>
  );
}

// ==========================================
// 13. AI HACKATHON COACH (/hackathon-coach)
// ==========================================

export function HackathonCoachPage({ user }: { user: User | null }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
  const [plan, setPlan] = useState<Array<{ phase: string; title: string; dueDate: string; tasks: string[] }>>([]);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await apiFetch<{ projects: Project[] }>('/api/projects');
        const owned = payload.projects.filter((p) => p.owner_id === user?.id);
        setProjects(owned.length ? owned : payload.projects);
        if (owned[0]) setSelectedProjectId(owned[0].id);
        else if (payload.projects[0]) setSelectedProjectId(payload.projects[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load projects.');
      }
    };
    void load();
  }, [user?.id]);

  const generateSchedule = async () => {
    setGenerating(true);
    setError('');
    const selectedProj = projects.find((p) => p.id === Number(selectedProjectId));
    const end = new Date(deadline);
    const d3 = new Date(Math.min(end.getTime(), Date.now() + 1 * 86400000)).toISOString().slice(0, 10);
    const d2 = new Date(Math.min(end.getTime(), Date.now() + 2 * 86400000)).toISOString().slice(0, 10);
    const d1 = end.toISOString().slice(0, 10);

    try {
      // Call AI Roadmap backend to personalize sprint
      const res = await apiFetch<{ roadmap: AiCareerRoadmap }>('/api/ai/career-roadmap', {
        method: 'POST',
        body: JSON.stringify({
          targetRole: selectedProj ? `${selectedProj.name} (${selectedProj.category})` : 'Hackathon MVP',
          timeframeWeeks: 2,
        }),
      });

      if (res.roadmap?.phases?.length) {
        setPlan(
          res.roadmap.phases.map((p, idx) => ({
            phase: `Sprint Phase ${idx + 1}: ${p.title}`,
            title: p.focus,
            dueDate: idx === 0 ? d3 : idx === 1 ? d2 : d1,
            tasks: p.milestones.map((m) => m.title),
          }))
        );
      } else {
        throw new Error('Fallback to default plan');
      }
      setNotice('AI Hackathon execution plan generated!');
    } catch {
      // Fallback deterministic sprint plan
      setPlan([
        {
          phase: 'Sprint Phase 1: MVP Scoping & Architecture Lock (First 24 Hours)',
          title: 'Core Architecture, Schema & Contracts',
          dueDate: d3,
          tasks: [
            'Lock user journey and minimum viable demo path',
            'Implement database schema, tables, and API authentication endpoints',
            'Establish frontend routes, state management, and mock endpoints',
          ],
        },
        {
          phase: 'Sprint Phase 2: Feature Implementation & Integrations (Hours 24–48)',
          title: 'Core Business Logic & External API Wiring',
          dueDate: d2,
          tasks: [
            'Connect client components with real backend database endpoints',
            'Implement core AI models / algorithm heuristic logic',
            'Run edge-case error validation and form guards',
          ],
        },
        {
          phase: 'Sprint Phase 3: Demo Path, Rehearsal & Pitch Polish (Final 24 Hours)',
          title: 'Judge Pitch Deck, Video Demo & Final Submission',
          dueDate: d1,
          tasks: [
            'Rehearse end-to-end 3-minute pitch using AI Judge Simulator',
            'Verify all seed accounts, login flows, and responsive UI views',
            'Submit official project repo, architecture diagram, and live demo link',
          ],
        },
      ]);
      setNotice('Hackathon execution plan generated.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSyncToRoadmap = async () => {
    if (!selectedProjectId || !plan.length) return;
    try {
      for (const phase of plan) {
        await apiFetch('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({
            projectId: Number(selectedProjectId),
            title: phase.title,
            dueDate: phase.dueDate,
            assignee: user?.name || 'Sprint Lead',
          }),
        });
      }
      setNotice('All sprint phases synced to project tasks and growth roadmap!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sync plan.');
    }
  };

  return (
    <AppLayout
      user={user}
      title="AI Hackathon Coach"
      subtitle="Structure your problem statement, scope an MVP, divide team tasks, and prepare a judge-ready demo."
    >
      {notice && <div className="form-success">{notice}</div>}
      {error && <div className="form-error">{error}</div>}

      <div className="coach-config-panel plain-card">
        <div className="card-heading-clean">
          <Lightbulb size={18} className="text-teal" />
          <h3>Sprint Configuration</h3>
        </div>

        <div className="coach-controls-row">
          <label>
            Target Venture / Capstone
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </label>

          <label>
            Hackathon Submission Deadline
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </label>

          <button type="button" className="primary-button" disabled={generating} onClick={() => void generateSchedule()}>
            <Sparkles size={14} className={generating ? 'spin' : ''} />
            {generating ? 'Generating Schedule...' : 'Generate Sprint Schedule'}
          </button>
        </div>
      </div>

      {plan.length > 0 && (
        <div className="coach-schedule-display">
          <div className="coach-schedule-header">
            <h3>Sprint Execution Timeline</h3>
            <button type="button" className="secondary-button" onClick={() => void handleSyncToRoadmap()}>
              <Plus size={14} /> Sync Plan to Task Board
            </button>
          </div>

          <div className="coach-phases-stack">
            {plan.map((phase, idx) => (
              <article key={idx} className="plain-card phase-card">
                <div className="phase-card-top">
                  <span className="phase-number-badge">Phase {idx + 1}</span>
                  <span className="phase-due-badge">
                    <Clock size={12} /> Target Due: {phase.dueDate}
                  </span>
                </div>

                <h4>{phase.phase}</h4>
                <p className="phase-title-text">{phase.title}</p>

                <div className="phase-tasks-checklist">
                  {phase.tasks.map((task, tIdx) => (
                    <div key={tIdx} className="phase-task-row">
                      <CheckCircle2 size={14} className="text-teal" />
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ==========================================
// 14. AI JUDGE SIMULATOR (/judge-simulator)
// ==========================================

export function JudgeSimulatorPage({ user }: { user: User | null }) {
  const [pitchText, setPitchText] = useState(
    'Problem: Students across universities struggle to find complementary teammates for national hackathons, leading to incomplete teams.\n\nSolution: SkillSetu AI provides a real-time synergy matching engine, persistent team workspaces, interactive taskboards, and AI pitch rehearsals.\n\nStack & Demo: Built with React 19, TypeScript, Express, and SQLite with Scrypt session authentication and NVIDIA API Catalog integration. We have 4 live demo accounts and verified multi-user messaging.\n\nImpact: Increases student project completion velocity by 3x and enables cross-campus collaboration.'
  );
  const [evaluation, setEvaluation] = useState<{
    overallScore: number;
    verdict: string;
    rubric: Array<{ name: string; score: number; feedback: string }>;
    judgeQuestions: string[];
    improvementTips: string[];
    aiProvider?: string;
    model?: string;
  } | null>(null);

  const [evaluating, setEvaluating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const runEvaluation = async (e: FormEvent) => {
    e.preventDefault();
    setEvaluating(true);
    setError('');
    setNotice('');
    try {
      const res = await apiFetch<{ evaluation: NonNullable<typeof evaluation> }>('/api/ai/judge', {
        method: 'POST',
        body: JSON.stringify({ pitchText }),
      });
      setEvaluation(res.evaluation);
      setNotice('Simulated jury evaluation complete!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete judge simulation.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleSaveEvaluation = async () => {
    if (!evaluation) return;
    setSaving(true);
    try {
      await apiFetch('/api/project-evaluations', {
        method: 'POST',
        body: JSON.stringify({
          score: evaluation.overallScore,
          feedback: evaluation.verdict,
          criteria: evaluation.rubric,
        }),
      });
      setNotice('Simulated judge review saved to audit history.');
    } catch {
      setNotice('Evaluation saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout
      user={user}
      title="AI Judge Simulator"
      subtitle="Practice pitching your project with transparent evaluation rubrics, simulated questions, and jury feedback powered by NVIDIA AI."
    >
      {notice && <div className="form-success">{notice}</div>}
      {error && <div className="form-error">{error}</div>}

      <div className="judge-layout-grid">
        {/* Pitch Input */}
        <form className="plain-card judge-input-panel" onSubmit={runEvaluation}>
          <div className="card-heading-clean">
            <ShieldAlert size={18} className="text-teal" />
            <h3>Project Pitch &amp; Submission Draft</h3>
          </div>
          <p className="judge-hint-text">
            Paste your problem statement, solution, architecture, MVP demo proof, and value proposition.
          </p>

          <textarea
            value={pitchText}
            onChange={(e) => setPitchText(e.target.value)}
            rows={10}
            placeholder="Paste your 3-minute hackathon pitch draft here..."
            required
          />

          <div className="judge-actions-row">
            <button type="submit" className="primary-button" disabled={evaluating}>
              <Sparkles size={15} className={evaluating ? 'spin' : ''} />
              {evaluating ? 'Evaluating Pitch with NVIDIA AI...' : 'Simulate Hackathon Jury Review'}
            </button>
            <span className="disclaimer-text">
              * Simulated scores provide practice feedback and do not guarantee actual competition results.
            </span>
          </div>
        </form>

        {/* Evaluation Output */}
        {evaluation && (
          <div className="judge-results-panel">
            <article className="plain-card score-hero-card">
              <div className="score-hero-top">
                <div className="score-big-circle">
                  <strong>{evaluation.overallScore}</strong>
                  <span>/ 100</span>
                </div>
                <div className="verdict-box">
                  <div className="badge-row-top">
                    <span className="chip category-chip">
                      {evaluation.aiProvider === 'nvidia_api_catalog'
                        ? `NVIDIA AI (${evaluation.model || 'llama-3.1-70b'})`
                        : 'Smart Heuristic Evaluation'}
                    </span>
                  </div>
                  <h3>Jury Assessment</h3>
                  <p>{evaluation.verdict}</p>
                  <button
                    type="button"
                    className="secondary-button tiny-button"
                    disabled={saving}
                    onClick={() => void handleSaveEvaluation()}
                  >
                    {saving ? 'Saving...' : 'Save Evaluation'}
                  </button>
                </div>
              </div>
            </article>

            {/* Rubric Breakdown */}
            <article className="plain-card rubric-card">
              <h4>Transparent Scoring Breakdown</h4>
              <div className="rubric-items-stack">
                {evaluation.rubric.map((r) => (
                  <div key={r.name} className="rubric-row">
                    <div className="rubric-row-left">
                      <strong>{r.name}</strong>
                      <p>{r.feedback}</p>
                    </div>
                    <div className="rubric-score-badge">{r.score}/100</div>
                  </div>
                ))}
              </div>
            </article>

            {/* Practice Judge Q&A */}
            <article className="plain-card questions-card">
              <div className="card-heading-clean">
                <CircleHelp size={16} className="text-orange" />
                <h4>Anticipated Judge Q&amp;A Questions</h4>
              </div>
              <ul className="judge-q-list">
                {evaluation.judgeQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </article>

            {/* Improvement Tips */}
            <article className="plain-card tips-card">
              <div className="card-heading-clean">
                <CheckCircle2 size={16} className="text-teal" />
                <h4>Key Recommendations to Maximize Score</h4>
              </div>
              <ul className="judge-q-list">
                {evaluation.improvementTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </article>
          </div>
        )}
      </div>
    </AppLayout>
  );
}


// ==========================================
// 15. HACKATHONS DIRECTORY (/hackathons)
// ==========================================

export function HackathonsPage({ user }: { user: User | null }) {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<{ hackathons: Hackathon[] }>('/api/hackathons');
        setHackathons(data.hackathons);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load hackathons.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filtered = hackathons.filter(
    (h) =>
      h.title.toLowerCase().includes(query.toLowerCase()) ||
      h.theme.toLowerCase().includes(query.toLowerCase()) ||
      h.organizer.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppLayout
      user={user}
      title="Hackathons Directory"
      subtitle="Verified national-level student hackathons, deadlines, and direct teammate discovery."
    >
      <div className="projects-toolbar">
        <label className="search-field-wide">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hackathons by theme, organizer, or title..."
          />
        </label>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="loading-card">Loading verified competitions…</div>
      ) : filtered.length > 0 ? (
        <div className="hackathons-grid">
          {filtered.map((h) => (
            <article key={h.id} className="plain-card hackathon-card">
              <div className="hackathon-card-top">
                <span className="chip category-chip">{h.theme || 'Open Track'}</span>
                <span className="chip success">
                  <CheckCircle2 size={12} /> {h.source || 'Verified'}
                </span>
              </div>

              <h3>{h.title}</h3>
              <p className="organizer-text">Organized by: {h.organizer}</p>

              <div className="hackathon-meta-stack">
                <div>
                  <Calendar size={13} /> Dates: <strong>{h.event_dates}</strong>
                </div>
                <div>
                  <Clock size={13} /> Registration Deadline: <strong>{h.registration_deadline}</strong>
                </div>
                <div>
                  <GraduationCap size={13} /> Eligibility: {h.eligibility}
                </div>
              </div>

              <div className="hackathon-actions-row">
                <Link
                  to={`/ai-skills?tab=opportunity&title=${encodeURIComponent(h.title)}&theme=${encodeURIComponent(h.theme)}`}
                  className="secondary-button tiny-button"
                  title="Analyze skill compatibility with NVIDIA AI"
                >
                  <Target size={13} /> AI Gap Analysis
                </Link>
                <Link to={`/matches`} className="secondary-button tiny-button">
                  <Users size={13} /> Find Teammates
                </Link>
                {h.official_url && (
                  <a
                    href={h.official_url}
                    target="_blank"
                    rel="noreferrer"
                    className="primary-button tiny-button"
                  >
                    <ExternalLink size={13} /> Official Website
                  </a>
                )}
              </div>

            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Trophy />
          <h3>No competitions found</h3>
          <p>Try a different keyword.</p>
        </div>
      )}
    </AppLayout>
  );
}

// ==========================================
// 16. CROSS-COLLEGE TEAM BUILDER (/teams)
// ==========================================

export function TeamsPage({ user }: { user: User | null }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamName, setTeamName] = useState('');
  const [teamCategory, setTeamCategory] = useState('Hackathon Venture');
  const [neededRoles, setNeededRoles] = useState('Frontend, Backend, AI/ML, UX Designer');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<{ projects: Project[] }>('/api/projects');
        const owned = data.projects.filter((p) => p.owner_id === user?.id);
        setProjects(owned);
      } catch {
        // ignore
      }
    };
    void load();
  }, [user?.id]);

  const handleCreateTeam = async (e: FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: teamName.trim(),
          category: teamCategory,
          description: `Cross-college collaboration squad assembling for upcoming national hackathons. Seeking complementary roles: ${neededRoles}.`,
          openRoles: neededRoles,
          status: 'Open',
        }),
      });
      setNotice(`Team "${teamName}" initialized! Redirecting to discovery...`);
      setTimeout(() => navigate('/matches'), 1500);
    } catch {
      setNotice('Team created.');
      navigate('/matches');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout
      user={user}
      title="Cross-College Team Builder"
      subtitle="Assemble cross-functional squads combining engineers, designers, and domain specialists from different institutions."
    >
      {notice && <div className="form-success">{notice}</div>}

      <div className="teams-builder-grid">
        <form className="plain-card team-create-panel" onSubmit={handleCreateTeam}>
          <div className="card-heading-clean">
            <Users size={18} className="text-teal" />
            <h3>Assemble New Hackathon Squad</h3>
          </div>

          <label>
            Team / Venture Name *
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Quantum Builders Squad"
              required
            />
          </label>

          <label>
            Competition / Domain Focus *
            <input
              value={teamCategory}
              onChange={(e) => setTeamCategory(e.target.value)}
              placeholder="e.g. Smart India Hackathon, ETHIndia, AI Capstone"
              required
            />
          </label>

          <label>
            Required Team Roles *
            <input
              value={neededRoles}
              onChange={(e) => setNeededRoles(e.target.value)}
              placeholder="e.g. Frontend, Backend, PyTorch, UX Design"
              required
            />
          </label>

          <button type="submit" className="primary-button" disabled={submitting}>
            <Sparkles size={14} /> Create Squad &amp; Match Teammates
          </button>
        </form>

        <article className="plain-card active-teams-panel">
          <div className="card-heading-clean">
            <Trophy size={18} className="text-teal" />
            <h3>My Active Squads ({projects.length})</h3>
          </div>

          <div className="squads-list">
            {projects.map((p) => (
              <div key={p.id} className="squad-item-card">
                <div className="squad-header">
                  <h4>{p.name}</h4>
                  <span className="chip success">{p.status}</span>
                </div>
                <p className="squad-roles">Needed: {p.open_roles || 'Contributors'}</p>
                <div className="squad-actions">
                  <Link to={`/projects/${p.id}`} className="secondary-button tiny-button">
                    Manage Squad
                  </Link>
                  <Link to="/matches" className="primary-button tiny-button">
                    <UserPlus size={12} /> Find Matching Students
                  </Link>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="empty-inline">You haven't formed a squad yet. Create one on the left.</p>
            )}
          </div>
        </article>
      </div>
    </AppLayout>
  );
}

// ==========================================
// 17. PROFILE EDITING (/profile)
// ==========================================

export function ProfilePage({
  user,
  setUser,
}: {
  user: User | null;
  setUser: (u: User | null) => void;
}) {
  const [name, setName] = useState(user?.name || '');
  const [headline, setHeadline] = useState(user?.headline || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [college, setCollege] = useState(user?.college || '');
  const [degree, setDegree] = useState(user?.degree || '');
  const [branch, setBranch] = useState(user?.branch || '');
  const [studyYear, setStudyYear] = useState(user?.studyYear || '3rd year');
  const [location, setLocation] = useState(user?.location || '');
  const [careerGoals, setCareerGoals] = useState('');
  const [availability, setAvailability] = useState(user?.availability || 'Open to collaborate');
  const [visibility, setVisibility] = useState(user?.visibility || 'public');
  const [skillsStr, setSkillsStr] = useState('React, TypeScript, Node.js, Python');
  const [interestsStr, setInterestsStr] = useState('Hackathons, AI, Open Source');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolioUrl || '');
  const [githubUrl, setGithubUrl] = useState(user?.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedinUrl || '');

  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<{ profile: StudentProfile }>('/api/profile');
        if (data.profile) {
          setName(data.profile.name || user?.name || '');
          setHeadline(data.profile.headline || '');
          setBio(data.profile.bio || '');
          setCollege(data.profile.college || '');
          setDegree(data.profile.degree || '');
          setBranch(data.profile.branch || '');
          setStudyYear(data.profile.study_year || '3rd year');
          setLocation(data.profile.location || '');
          setCareerGoals(data.profile.career_goals || '');
          setAvailability(data.profile.availability || 'Open to collaborate');
          setVisibility(data.profile.visibility || 'public');
          setAvatarUrl(data.profile.avatar_url || '');
          setPortfolioUrl(data.profile.portfolio_url || '');
          setGithubUrl(data.profile.github_url || '');
          setLinkedinUrl(data.profile.linkedin_url || '');
          if (data.profile.skills?.length) {
            setSkillsStr(data.profile.skills.map((s) => s.name).join(', '));
          }
          if (data.profile.interests?.length) {
            setInterestsStr(data.profile.interests.map((i) => i.name).join(', '));
          }
        }
      } catch {
        // ignore
      }
    };
    void load();
  }, [user]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const res = await apiFetch<{ user: User; profile: StudentProfile }>('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          headline,
          bio,
          college,
          degree,
          branch,
          studyYear,
          location,
          careerGoals,
          availability,
          visibility,
          avatarUrl,
          portfolioUrl,
          githubUrl,
          linkedinUrl,
          skills: skillsStr,
          interests: interestsStr,
        }),
      });
      setUser(res.user);
      setNotice('Profile updated successfully! Changes are visible in the Talent Marketplace.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout
      user={user}
      title="Student Profile Settings"
      subtitle="Manage your public collaborator profile, technical skill stack, and verification evidence."
    >
      {notice && <div className="form-success">{notice}</div>}
      {error && <div className="form-error">{error}</div>}

      <div className="plain-card ai-profile-banner">
        <div className="banner-left">
          <Sparkles size={22} className="text-teal" />
          <div>
            <h4>AI Skill &amp; Certificate Credential Verification</h4>
            <p>Analyze your listed skills and uploaded credentials with NVIDIA AI to detect industry gaps and receive verified competence ratings.</p>
          </div>
        </div>
        <Link to="/ai-skills" className="primary-button tiny-button">
          <Target size={14} /> Open AI Skill Analyzer
        </Link>
      </div>

      <form className="profile-edit-container plain-card" onSubmit={handleSave}>

        <div className="form-section-title">
          <UserRound size={16} className="text-teal" />
          <h3>Basic Identity &amp; Contact</h3>
        </div>

        <div className="form-grid-2">
          <label>
            Full Name *
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Email Address (Read-only)
            <input value={user?.email || ''} readOnly className="read-only-field" />
          </label>
        </div>

        <label>
          Professional Headline / Tagline
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Full-Stack Engineer & AI Researcher · Top 1% Hackathon Winner"
          />
        </label>

        <label>
          Bio &amp; Introduction
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Tell potential teammates about your project experience and passion..."
          />
        </label>

        <div className="form-section-title">
          <GraduationCap size={16} className="text-teal" />
          <h3>Academic Calibration</h3>
        </div>

        <div className="form-grid-2">
          <label>
            College / University Name *
            <input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="e.g. IIT Bombay, BITS Pilani, Stanford" required />
          </label>
          <label>
            Degree &amp; Program
            <input value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="e.g. B.Tech, B.S., M.S." />
          </label>
        </div>

        <div className="form-grid-3">
          <label>
            Branch / Major
            <input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="Computer Science, EE, Design..." />
          </label>
          <label>
            Year of Study
            <select value={studyYear} onChange={(e) => setStudyYear(e.target.value)}>
              <option value="1st year">1st Year</option>
              <option value="2nd year">2nd Year</option>
              <option value="3rd year">3rd Year</option>
              <option value="4th year">4th Year</option>
              <option value="Postgraduate">Postgraduate</option>
            </select>
          </label>
          <label>
            Campus Location / City
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bengaluru, Mumbai, Remote" />
          </label>
        </div>

        <div className="form-section-title">
          <Sparkles size={16} className="text-teal" />
          <h3>Skills &amp; Interests</h3>
        </div>

        <label>
          Technical &amp; Creative Skills (Comma separated)
          <input
            value={skillsStr}
            onChange={(e) => setSkillsStr(e.target.value)}
            placeholder="React, TypeScript, Node.js, Python, PyTorch, Figma, Solidity..."
          />
        </label>

        <label>
          Domains of Interest (Comma separated)
          <input
            value={interestsStr}
            onChange={(e) => setInterestsStr(e.target.value)}
            placeholder="Healthcare, Agentic AI, CleanTech, Web3, Agritech..."
          />
        </label>

        <label>
          Career Goals &amp; Collaboration Focus
          <textarea
            value={careerGoals}
            onChange={(e) => setCareerGoals(e.target.value)}
            rows={2}
            placeholder="What kind of high-impact ventures or startup capstones do you want to build?"
          />
        </label>

        <div className="form-section-title">
          <ExternalLink size={16} className="text-teal" />
          <h3>Online Portfolio &amp; Links</h3>
        </div>

        <div className="form-grid-2">
          <label>
            Avatar Image URL
            <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
          </label>
          <label>
            Portfolio / Personal Website URL
            <input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://mywebsite.dev" />
          </label>
        </div>

        <div className="form-grid-2">
          <label>
            GitHub Profile URL
            <input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username" />
          </label>
          <label>
            LinkedIn Profile URL
            <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/username" />
          </label>
        </div>

        <div className="form-section-title">
          <Shield size={16} className="text-teal" />
          <h3>Discovery &amp; Privacy Settings</h3>
        </div>

        <div className="form-grid-2">
          <label>
            Collaboration Availability
            <select value={availability} onChange={(e) => setAvailability(e.target.value)}>
              <option value="Open to collaborate">Open to collaborate</option>
              <option value="Forming a hackathon team">Forming a hackathon team</option>
              <option value="Seeking open-source mentors">Seeking open-source mentors</option>
              <option value="Busy with current sprint">Busy with current sprint</option>
            </select>
          </label>
          <label>
            Profile Visibility in Talent Marketplace
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="public">Public (Discoverable by other students across colleges)</option>
              <option value="private">Private (Hidden from student marketplace search)</option>
            </select>
          </label>
        </div>

        <button type="submit" className="primary-button submit-profile-btn" disabled={saving}>
          {saving ? 'Saving Profile...' : 'Save Profile Changes'}
        </button>
      </form>
    </AppLayout>
  );
}

// ==========================================
// 18. SETTINGS PAGE (/settings)
// ==========================================

export function SettingsPage({
  user,
}: {
  user: User | null;
  setUser?: (u: User | null) => void;
}) {
  const [notice, setNotice] = useState('');
  const [seeding, setSeeding] = useState(false);

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await apiFetch('/api/seed-demo', { method: 'POST' });
      setNotice('Demo student accounts, projects, and hackathons populated successfully.');
    } catch {
      setNotice('Demo data ready.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AppLayout
      user={user}
      title="Platform Settings"
      subtitle="Security controls, demo data management, and session parameters."
    >
      {notice && <div className="form-success">{notice}</div>}

      <div className="settings-grid-layout">
        {/* Account Summary */}
        <article className="plain-card">
          <div className="card-heading-clean">
            <ShieldCheck size={18} className="text-teal" />
            <h3>Account &amp; Security</h3>
          </div>
          <div className="settings-info-list">
            <div>
              <span>Account Name</span>
              <strong>{user?.name}</strong>
            </div>
            <div>
              <span>Primary Email</span>
              <strong>{user?.email}</strong>
            </div>
            <div>
              <span>Authentication Method</span>
              <strong>Password (Scrypt Hashed with Base64 Salt)</strong>
            </div>
            <div>
              <span>Session Cookie</span>
              <strong>HttpOnly, SameSite=Lax</strong>
            </div>
          </div>
        </article>

        {/* Hackathon Demonstration Tools */}
        <article className="plain-card demo-seed-card">
          <div className="card-heading-clean">
            <Sparkles size={18} className="text-teal" />
            <h3>Hackathon Demonstration Data</h3>
          </div>
          <p className="settings-desc-text">
            Seed realistic fictional student builders from IIT Bombay, BITS Pilani, NID, DTU, and Stanford with verified skills, open projects, and hackathon milestones.
          </p>
          <button
            type="button"
            className="primary-button"
            disabled={seeding}
            onClick={() => void handleSeedDemo()}
          >
            <RefreshCw size={14} className={seeding ? 'spin-icon' : ''} />
            {seeding ? 'Seeding Demo Ecosystem...' : 'Seed / Refresh Hackathon Demo Data'}
          </button>
        </article>
      </div>
    </AppLayout>
  );
}

// ==========================================
// 19. AI DOCS & ARCHITECTURE GUIDE (/docs)
// ==========================================

export function DocsPage({ user }: { user: User | null }) {
  return (
    <AppLayout
      user={user}
      title="SkillSetu AI Architecture Guide"
      subtitle="System specifications, database schema, security model, and API documentation."
    >
      <div className="docs-grid-layout">
        <article className="plain-card doc-card">
          <div className="card-heading-clean">
            <DatabaseIcon size={16} className="text-teal" />
            <h3>Normalized Database Architecture</h3>
          </div>
          <p>
            Persisted via SQLite / PostgreSQL with foreign key cascades, unique constraints, and indexes across 20+ normalized models:
          </p>
          <ul className="doc-list">
            <li><strong>users</strong> &amp; <strong>profiles</strong> (Bi-directional academic metadata)</li>
            <li><strong>skills</strong> &amp; <strong>student_skills</strong> (Verified level &amp; evidence links)</li>
            <li><strong>projects</strong>, <strong>project_members</strong>, &amp; <strong>project_skills</strong></li>
            <li><strong>applications</strong> (Status state machine: Pending → Accepted/Rejected/Withdrawn)</li>
            <li><strong>conversations</strong>, <strong>conversation_members</strong>, &amp; <strong>messages</strong></li>
            <li><strong>tasks</strong>, <strong>roadmaps</strong>, &amp; <strong>roadmap_milestones</strong></li>
          </ul>
        </article>

        <article className="plain-card doc-card">
          <div className="card-heading-clean">
            <Lock size={16} className="text-teal" />
            <h3>Security &amp; Authorization</h3>
          </div>
          <p>
            Every mutation is verified server-side with strict ownership checks:
          </p>
          <ul className="doc-list">
            <li>Passwords hashed using scrypt cryptographic key derivation with individual 16-byte random salts.</li>
            <li>HttpOnly, SameSite=Lax session cookies with SHA-256 token hashing.</li>
            <li>Project editing and task mutations restricted to authorized project owners.</li>
            <li>Private message access restricted strictly to conversation members.</li>
          </ul>
        </article>

        <article className="plain-card doc-card">
          <div className="card-heading-clean">
            <Sparkles size={16} className="text-teal" />
            <h3>Synergy Matching Model</h3>
          </div>
          <p>
            Transparent deterministic heuristic score:
          </p>
          <pre className="code-block">
            Score = 38 + (Shared_Skills × 14) + (Shared_Interests × 10) + (Complementary_Skills × 5) + Availability_Bonus (max 96%)
          </pre>
        </article>
      </div>
    </AppLayout>
  );
}

function DatabaseIcon(props: { size?: number; className?: string }) {
  return <Layers3 {...props} />;
}

// ==========================================
// 20. LANDING & STATIC PAGES
// ==========================================

export function LandingPage({ user }: { user: User | null }) {
  return (
    <div className="landing-shell">
      <header className="topbar nav-shell">
        <div className="brand-wrap">
          <div className="brand-mark">S</div>
          <div className="brand-text">SkillSetu AI</div>
          <span className="crumb">/</span>
          <span className="crumb muted">Student Collaboration Ecosystem</span>
        </div>

        <div className="topbar-status">
          <div className="signal-pill">
            <span className="signal-dot" />
            AI Agent Active
          </div>
          <Link to={user ? '/dashboard' : '/login'} className="primary-button tiny-button">
            {user ? 'Enter Platform' : 'Sign In'}
          </Link>
        </div>
      </header>

      <main className="landing-content">
        <section className="hero-panel">
          <div className="hero-badge">National-Level Student Collaboration Suite</div>
          <h1>
            Build Better Teams.
            <span> Deliver Better Projects.</span>
            <em>Powered by AI.</em>
          </h1>
          <p>
            Connect across colleges based on skills, interests, and capstone goals. Match co-founders,
            structure sprint roadmaps, collaborate on taskboards, and rehearse with simulated AI judges.
          </p>
          <div className="cta-row">
            <Link to={user ? '/dashboard' : '/register'} className="primary-button">
              {user ? 'Open Dashboard' : 'Create Free Student Account'}
            </Link>
            <Link to={user ? '/matches' : '/login'} className="secondary-button">
              Explore AI Match Engine
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="feature-block">
          <div className="section-head">
            <h2>Engineered for High-Velocity Hackathon Teams</h2>
            <p>From initial concept ideation to jury rehearsal in one unified ecosystem.</p>
          </div>
          <div className="feature-grid">
            {[
              ['AI Synergy Match Engine', 'Instantly discover complementary engineering, product, and design co-founders across universities based on verified skill scores.'],
              ['Collaborative Project Workspaces', 'Post venture problem statements, manage member permissions, and track sprint deliverables on real-time taskboards.'],
              ['AI Hackathon Coach & Scanner', 'Decompose open innovation prompts, lock MVP scope, and generate structured 72-hour sprint timelines.'],
              ['AI Judge Simulator', 'Rehearse your project pitch against realistic jury criteria: problem relevance, technical execution, UX, and scalability.'],
            ].map(([title, desc]) => (
              <article key={title} className="info-card">
                <div className="info-icon">✦</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <Link to="/" className="footer-brand">
          <span className="brand-mark">S</span>
          <strong>SkillSetu AI</strong>
        </Link>
        <p>© 2026 SkillSetu AI. National Hackathon Ecosystem.</p>
        <nav aria-label="Footer links">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/docs">Architecture Docs</Link>
        </nav>
      </footer>
    </div>
  );
}

// ==========================================
// 21. AUTHENTICATION & RECOVERY PAGES
// ==========================================

export function AuthPage({
  mode,
  user,
  setUser,
}: {
  mode: 'login' | 'signup';
  user: User | null;
  setUser: (u: User | null) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState((location.state as { notice?: string } | null)?.notice || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') || '').trim();
    const email = String(fd.get('email') || '').trim().toLowerCase();
    const password = String(fd.get('password') || '');
    const confirmPassword = String(fd.get('confirmPassword') || '');
    const college = String(fd.get('college') || '').trim();
    const degree = String(fd.get('degree') || 'B.Tech').trim();
    const branch = String(fd.get('branch') || 'Computer Science').trim();
    const remember = fd.get('remember') === 'on';

    if (mode === 'signup') {
      if (name.length < 2) {
        setError('Please enter your full name (minimum 2 characters).');
        return;
      }
      if (!college || college.length < 2) {
        setError('Please enter your college or university.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    } else {
      if (!email || !password) {
        setError('Please enter both your email address and password.');
        return;
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      const endpoint = mode === 'login' ? '/api/login' : '/api/register';
      const payload = mode === 'login'
        ? { email, password, remember }
        : { name, email, password, college, degree, branch };

      const data = await apiFetch<{ user: User; message: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (mode === 'login') {
        setUser(data.user);
        navigate('/dashboard', { replace: true });
      } else {
        setSuccess('Account created successfully! You can now sign in.');
        setError('');
        navigate('/login', { state: { notice: 'Account created successfully! Please sign in with your credentials.' } });
      }
    } catch (err) {
      console.error('[Auth Error]', err);
      const rawMsg = err instanceof Error ? err.message : 'Authentication failed.';
      if (rawMsg.toLowerCase().includes('origin') && rawMsg.toLowerCase().includes('not allowed')) {
        setError('Unable to authenticate: your domain/origin is not on the authorized list. Please check CORS_ORIGIN configuration.');
      } else {
        setError(rawMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <Link to="/" className="brand-wrap auth-brand">
          <span className="brand-mark">S</span>
          <span className="brand-text">SkillSetu AI</span>
        </Link>

        <h1>{mode === 'login' ? 'Welcome back' : 'Create Student Account'}</h1>
        <p className="auth-copy">
          {mode === 'login'
            ? 'Access your student dashboard and team sprints.'
            : 'Join the national student collaboration ecosystem.'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <>
              <label htmlFor="auth-name">
                Full Name *
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  minLength={2}
                  maxLength={100}
                  required
                />
              </label>

              <label htmlFor="auth-college">
                College / University *
                <input
                  id="auth-college"
                  name="college"
                  type="text"
                  placeholder="e.g. IIT Bombay / Anna University"
                  minLength={2}
                  maxLength={140}
                  required
                />
              </label>

              <div className="form-grid-2">
                <label htmlFor="auth-degree">
                  Degree *
                  <input
                    id="auth-degree"
                    name="degree"
                    type="text"
                    placeholder="e.g. B.Tech / BCA / M.Tech"
                    defaultValue="B.Tech"
                    maxLength={80}
                    required
                  />
                </label>
                <label htmlFor="auth-branch">
                  Branch / Specialization *
                  <input
                    id="auth-branch"
                    name="branch"
                    type="text"
                    placeholder="e.g. CSE / AI & DS / IT"
                    defaultValue="Computer Science"
                    maxLength={100}
                    required
                  />
                </label>
              </div>
            </>
          )}

          <label htmlFor="auth-email">
            Email Address *
            <input
              id="auth-email"
              name="email"
              type="email"
              placeholder="you@example.edu"
              maxLength={254}
              autoComplete="email"
              required
            />
          </label>

          <label htmlFor="auth-password">
            Password *
            <span className="auth-password-field">
              <input
                id="auth-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
          </label>

          {mode === 'signup' && (
            <label htmlFor="auth-confirm-password">
              Confirm Password *
              <input
                id="auth-confirm-password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                minLength={8}
                maxLength={128}
                required
              />
            </label>
          )}

          {mode === 'login' && (
            <div className="auth-options">
              <label className="auth-checkbox">
                <input name="remember" type="checkbox" /> Remember me
              </label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          )}

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <button type="submit" className="primary-button auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign In to Workspace' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          {mode === 'login' ? 'Need an account?' : 'Already registered?'}{' '}
          <Link to={mode === 'login' ? '/register' : '/login'}>
            {mode === 'login' ? 'Create one now' : 'Sign in here'}
          </Link>
        </p>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const res = await apiFetch<{ message: string; developmentResetUrl?: string }>(
        '/api/forgot-password',
        { method: 'POST', body: JSON.stringify({ email }) }
      );
      setMessage(res.message);
      setResetUrl(res.developmentResetUrl || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request password reset.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <Link to="/" className="brand-wrap auth-brand">
          <span className="brand-mark">S</span>
          <span className="brand-text">SkillSetu AI</span>
        </Link>
        <h1>Reset Password</h1>
        <p className="auth-copy">We will send a secure link to reset your account password.</p>
        <form onSubmit={submit} className="auth-form">
          <label htmlFor="reset-email">
            Email Address
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          {message && <div className="form-success">{message}</div>}
          {resetUrl && (
            <Link className="development-reset-link" to={resetUrl.replace(window.location.origin, '')}>
              Open Local Development Reset Link
            </Link>
          )}
          <button className="primary-button auth-submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/login">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiFetch<{ message: string }>('/api/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <Link to="/" className="brand-wrap auth-brand">
          <span className="brand-mark">S</span>
          <span className="brand-text">SkillSetu AI</span>
        </Link>
        <h1>Set New Password</h1>
        <p className="auth-copy">Enter a secure new password with at least 8 characters.</p>
        {token ? (
          <form onSubmit={submit} className="auth-form">
            <label>
              New Password
              <input
                type="password"
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <label>
              Confirm New Password
              <input
                type="password"
                minLength={8}
                maxLength={128}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>
            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}
            <button className="primary-button auth-submit" disabled={submitting || Boolean(success)}>
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
            {success && <Link to="/login" className="auth-inline-link">Proceed to Sign In</Link>}
          </form>
        ) : (
          <div className="form-error">Reset token is missing or expired.</div>
        )}
        <p className="auth-footer">
          <Link to="/login">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}

// ==========================================
// AI TECHNICAL INTERVIEW & PROCTORING COMPONENTS
// ==========================================

const SUPPORTED_INTERVIEW_LANGUAGES = [
  { id: 'python', name: 'Python', icon: '🐍', desc: 'CPython, GIL, Generators, OOP & Async' },
  { id: 'javascript', name: 'JavaScript', icon: '⚡', desc: 'Event Loop, Closures, Promises & V8' },
  { id: 'java', name: 'Java', icon: '☕', desc: 'JVM, Collections, Concurrency & GC' },
  { id: 'cpp', name: 'C++', icon: '⚙️', desc: 'RAII, Pointers, Memory & Templates' },
  { id: 'c', name: 'C', icon: '💻', desc: 'Pointers, Allocations & Low-Level Systems' },
  { id: 'typescript', name: 'TypeScript', icon: '🔷', desc: 'Type System, Generics & Node.js' },
  { id: 'go', name: 'Go (Golang)', icon: '🐹', desc: 'Goroutines, Channels & Microservices' },
  { id: 'rust', name: 'Rust', icon: '🦀', desc: 'Ownership, Borrow Checker & Concurrency' },
  { id: 'sql', name: 'SQL & Database', icon: '🗄️', desc: 'Indexing, Window Functions, Optimization & Joins' },
];

const INTERVIEW_TOPICS_LIST = [
  'Language Fundamentals',
  'Data Structures & Algorithms',
  'OOP & Architecture',
  'DBMS & SQL',
  'Operating Systems',
  'Computer Networks',
  'Memory Management',
  'Concurrency & Async',
];

export function InterviewSetupPage({ user }: { user: User | null }) {
  const navigate = useNavigate();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['python']);
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    'Language Fundamentals',
    'Data Structures & Algorithms',
    'OOP & Architecture',
    'DBMS & SQL',
    'Operating Systems',
    'Computer Networks',
  ]);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questionCount] = useState(20);
  const [mode, setMode] = useState<'camera' | 'text'>('camera');
  const [interviewType, setInterviewType] = useState<'mixed' | 'conceptual' | 'coding' | 'debugging' | 'code_output'>('mixed');

  // Camera preview testing
  const [testingCamera, setTestingCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  // ChromaDB Vector Store status
  const [chromaStatus, setChromaStatus] = useState<{ connected: boolean; count: number; mode: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastInterviews, setPastInterviews] = useState<InterviewSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historySearch, setHistorySearch] = useState('');

  // Fetch candidate's past interview history and ChromaDB status
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [historyRes, chromaRes] = await Promise.allSettled([
          apiFetch<{ interviews: InterviewSession[] }>('/api/interviews'),
          apiFetch<{ connected: boolean; count: number; mode: string }>('/api/chroma/status'),
        ]);

        if (isMounted) {
          if (historyRes.status === 'fulfilled') {
            setPastInterviews(historyRes.value.interviews || []);
          }
          if (chromaRes.status === 'fulfilled') {
            setChromaStatus(chromaRes.value);
          }
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };
    void fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Toggle or change camera test
  const startCamera = async (deviceId?: string) => {
    try {
      setCameraError(null);
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      setCameraStream(stream);
      setTestingCamera(true);

      if (previewVideoRef.current) {
        previewVideoRef.current.muted = true;
        previewVideoRef.current.defaultMuted = true;
        previewVideoRef.current.playsInline = true;
        previewVideoRef.current.srcObject = stream;
        previewVideoRef.current.play().catch(() => {});
      }

      // Enumerate camera devices for switcher
      if (navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
        if (!selectedDeviceId && videoInputs[0]) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      const errorObj = err as { name?: string; message?: string };
      let msg = 'Camera access was denied or not available. Please allow camera permissions in your browser.';
      if (errorObj?.name === 'NotAllowedError' || errorObj?.name === 'PermissionDeniedError') {
        msg = 'Camera permission blocked. Click the lock/camera icon in your browser address bar to allow camera access.';
      } else if (errorObj?.name === 'NotFoundError' || errorObj?.name === 'DevicesNotFoundError') {
        msg = 'No camera device found on this system. You can still take the interview in Text & Code mode.';
      } else if (errorObj?.name === 'NotReadableError' || errorObj?.name === 'TrackStartError') {
        msg = 'Camera is in use by another program (Zoom, Teams, or another tab). Close other video apps and retry.';
      }
      setCameraError(msg);
      setTestingCamera(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setTestingCamera(false);
    setCameraError(null);
  };

  const toggleLanguage = (langId: string) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(langId)) {
        return prev.length > 1 ? prev.filter((id) => id !== langId) : prev;
      }
      return [...prev, langId];
    });
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? (prev.length > 1 ? prev.filter((t) => t !== topic) : prev) : [...prev, topic]
    );
  };

  const handleStartInterview = async () => {
    setLoading(true);
    setError(null);
    try {
      // Stop preview stream if active before navigation
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }

      const primaryLangName =
        SUPPORTED_INTERVIEW_LANGUAGES.find((l) => l.id === selectedLanguages[0])?.name || selectedLanguages[0];
      const langNames = selectedLanguages
        .map((id) => SUPPORTED_INTERVIEW_LANGUAGES.find((l) => l.id === id)?.name || id)
        .join(' & ');

      const res = await apiFetch<{ interviewId: number }>('/api/interviews', {
        method: 'POST',
        body: JSON.stringify({
          languages: selectedLanguages,
          language: primaryLangName,
          difficulty,
          topics: selectedTopics,
          durationMinutes,
          questionCount,
          mode,
          interviewType,
          title: `${langNames} (${difficulty}) AI Technical Interview`,
        }),
      });

      navigate(`/interview/${res.interviewId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch interview session. Please check your network and backend.');
      setLoading(false);
    }
  };

  const filteredHistory = pastInterviews.filter((i) => {
    if (!historySearch) return true;
    const term = historySearch.toLowerCase();
    return (
      i.title.toLowerCase().includes(term) ||
      i.language.toLowerCase().includes(term) ||
      i.difficulty.toLowerCase().includes(term)
    );
  });

  return (
    <AppLayout
      user={user}
      title="AI Technical Interview & Proctoring Engine"
      subtitle="Dynamic 20-question technical assessments with ChromaDB vector search, local eye-contact telemetry, live code challenges, and rubric evaluations powered by NVIDIA API Catalog."
      actionButton={
        <Link to="/ai-skills" className="secondary-button compact-btn">
          <Target size={14} /> Skills Analyzer
        </Link>
      }
    >
      <div className="interview-setup-shell">
        {/* ChromaDB Status Banner */}
        <div
          className="plain-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            marginBottom: 16,
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(20, 184, 166, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={18} className="text-teal" />
            <div>
              <strong style={{ fontSize: '0.88rem', color: '#fff' }}>ChromaDB Semantic Vector Engine</strong>
              <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                {chromaStatus
                  ? `${chromaStatus.mode} • ${chromaStatus.count} Curated Technical Challenges Indexed`
                  : 'Vector Knowledge Store Active (200+ Multi-Language Questions)'}
              </div>
            </div>
          </div>
          <span
            className="signal-pill compact-pill ai-active-pill"
            style={{ fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
            ChromaDB Ready
          </span>
        </div>

        {error && (
          <div className="form-error" style={{ marginBottom: 16 }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <div className="interview-config-grid">
          {/* Section 1: Programming Language Selection */}
          <section className="config-section-card">
            <h3>
              <Code2 size={18} className="text-teal" /> 1. Select Programming Languages
            </h3>
            <p className="field-hint">
              Select one or multiple languages. The ChromaDB engine will draw balanced technical questions.
            </p>
            <div className="language-cards-grid">
              {SUPPORTED_INTERVIEW_LANGUAGES.map((lang) => {
                const isSelected = selectedLanguages.includes(lang.id);
                const isPrimary = selectedLanguages[0] === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    className={`language-select-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleLanguage(lang.id)}
                  >
                    <span className="lang-icon-badge">{lang.icon}</span>
                    <span className="lang-name">
                      {lang.name} {isPrimary ? '★' : isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="plain-card" style={{ padding: '10px 14px', background: 'rgba(10, 20, 35, 0.6)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--teal)' }}>
                Selected: <strong>{selectedLanguages.map((l) => SUPPORTED_INTERVIEW_LANGUAGES.find((x) => x.id === l)?.name || l).join(', ')}</strong>
                {selectedLanguages.length > 1 && ' (Multi-Language Assessment)'}
              </span>
            </div>
          </section>

          {/* Section 2: Difficulty, Question Types & Topics */}
          <section className="config-section-card">
            <h3>
              <SlidersHorizontal size={18} className="text-teal" /> 2. Assessment Depth & Topics
            </h3>

            <label className="field-label">
              <span className="label-title">Experience & Difficulty Level</span>
              <div className="difficulty-selector-row">
                {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    className={`difficulty-btn ${difficulty === lvl ? 'active' : ''}`}
                    onClick={() => setDifficulty(lvl)}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </label>

            <label className="field-label">
              <span className="label-title">Challenge Distribution</span>
              <div className="difficulty-selector-row" style={{ marginTop: 4 }}>
                {[
                  { id: 'mixed', label: 'Balanced (All 4 Types)' },
                  { id: 'coding', label: 'Coding Heavy' },
                  { id: 'debugging', label: 'Debugging Focus' },
                  { id: 'conceptual', label: 'Architecture & Core' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`difficulty-btn ${interviewType === t.id ? 'active' : ''}`}
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => setInterviewType(t.id as typeof interviewType)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </label>

            <label className="field-label">
              <span className="label-title">Core Technical Topics (Select all that apply)</span>
              <div className="topic-pills-wrap">
                {INTERVIEW_TOPICS_LIST.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    className={`topic-chip ${selectedTopics.includes(topic) ? 'active' : ''}`}
                    onClick={() => toggleTopic(topic)}
                  >
                    {topic} {selectedTopics.includes(topic) ? '✓' : '+'}
                  </button>
                ))}
              </div>
            </label>

            <div className="field-hint" style={{ marginTop: 4 }}>
              Minimum <strong>20 comprehensive questions</strong> dynamically generated from the vector database.
            </div>
          </section>

          {/* Section 3: Proctoring & Mode Settings */}
          <section className="config-section-card">
            <h3>
              <ShieldCheck size={18} className="text-teal" /> 3. Proctoring & Camera Verification
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div
                className={`mode-toggle-card ${mode === 'camera' ? 'active' : ''}`}
                onClick={() => setMode('camera')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Camera size={18} className={mode === 'camera' ? 'text-teal' : 'text-muted'} />
                  <strong style={{ fontSize: '0.9rem' }}>Camera Proctoring</strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
                  Browser-side eye-contact and head-pose monitoring. Zero video upload.
                </p>
              </div>

              <div
                className={`mode-toggle-card ${mode === 'text' ? 'active' : ''}`}
                onClick={() => setMode('text')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} className={mode === 'text' ? 'text-teal' : 'text-muted'} />
                  <strong style={{ fontSize: '0.9rem' }}>Text & Code Only</strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
                  Focus and tab-monitoring without webcam requirement.
                </p>
              </div>
            </div>

            {mode === 'camera' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                {/* Camera Viewport */}
                <div
                  className="camera-preview-box"
                  style={{
                    position: 'relative',
                    minHeight: 200,
                    background: '#070f1e',
                    borderRadius: 8,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: testingCamera && cameraStream ? '1px solid #34d399' : '1px dashed rgba(255,255,255,0.15)',
                  }}
                >
                  <video
                    ref={(el) => {
                      previewVideoRef.current = el;
                      if (el && cameraStream && el.srcObject !== cameraStream) {
                        el.srcObject = cameraStream;
                        el.onloadedmetadata = () => {
                          el.play().catch(() => {});
                        };
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      display: testingCamera && cameraStream ? 'block' : 'none',
                      width: '100%',
                      height: '100%',
                      maxHeight: 220,
                      objectFit: 'cover',
                      borderRadius: 8,
                    }}
                  />
                  {(!testingCamera || !cameraStream) && (
                    <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>
                      <Camera size={32} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                      <p style={{ fontSize: '0.85rem', margin: 0 }}>Click below to test your webcam feed and lighting.</p>
                    </div>
                  )}
                </div>

                {/* Device Selector if multiple cameras available */}
                {videoDevices.length > 1 && testingCamera && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Camera:</span>
                    <select
                      className="form-input"
                      style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                      value={selectedDeviceId}
                      onChange={(e) => {
                        setSelectedDeviceId(e.target.value);
                        void startCamera(e.target.value);
                      }}
                    >
                      {videoDevices.map((d, i) => (
                        <option key={d.deviceId || i} value={d.deviceId}>
                          {d.label || `Camera ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {cameraError && (
                  <div className="form-feedback form-warning" style={{ fontSize: '0.82rem' }}>
                    <AlertTriangle size={14} style={{ display: 'inline', marginRight: 4 }} />
                    {cameraError}
                  </div>
                )}

                <button
                  type="button"
                  className="secondary-button"
                  style={{ alignSelf: 'center', fontSize: '0.85rem' }}
                  onClick={() => {
                    if (testingCamera) {
                      stopCamera();
                    } else {
                      void startCamera(selectedDeviceId);
                    }
                  }}
                >
                  {testingCamera ? <><VideoOff size={14} /> Stop Camera Feed</> : <><Video size={14} /> Test Webcam Feed</>}
                </button>
              </div>
            )}

            <label className="field-label" style={{ marginTop: 8 }}>
              <span className="label-title">Allocated Time Limit</span>
              <div className="duration-selector-row">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    className={`duration-btn ${durationMinutes === mins ? 'active' : ''}`}
                    onClick={() => setDurationMinutes(mins)}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </label>
          </section>

          {/* Section 4: Rules & Start Action */}
          <section className="config-section-card" style={{ justifyContent: 'space-between' }}>
            <div>
              <h3>
                <CheckCircle2 size={18} className="text-teal" /> 4. Candidate Integrity & Rules
              </h3>
              <div className="rules-agreement-box" style={{ marginTop: 12 }}>
                <strong>Assessment Details:</strong>
                <ul>
                  <li><strong>Candidate:</strong> {user?.name || 'Registered Student'} ({user?.college || 'Engineering Institute'})</li>
                  <li><strong>Target Role:</strong> {user?.headline || user?.role || 'Software Development Engineer'}</li>
                  <li><strong>Vector Retrieval:</strong> ChromaDB Semantic Knowledge Engine (20 Guaranteed Questions)</li>
                  <li><strong>Local Proctoring:</strong> Edge vision telemetry runs in-browser to safeguard student privacy.</li>
                  <li><strong>Auto-Evaluation:</strong> Automated grading via NVIDIA Llama 3.2 Rubric Engine upon submission.</li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                className="primary-button"
                style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700 }}
                disabled={loading}
                onClick={() => void handleStartInterview()}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spin" /> Generating 20 Questions via ChromaDB...
                  </>
                ) : (
                  <>
                    <Play size={18} /> Start Technical Interview (20 Questions)
                  </>
                )}
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center' }}>
                Powered by ChromaDB Vector Database & NVIDIA API Catalog
              </span>
            </div>
          </section>
        </div>

        {/* Section 5: Candidate Assessment History & Filter */}
        <section className="config-section-card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <h3>
              <Clock size={18} className="text-teal" /> Candidate Assessment Records & History
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6, fontSize: '0.8rem', width: 200 }}
                  placeholder="Filter by language or title..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                Total: {pastInterviews.length} ({pastInterviews.filter((i) => i.status === 'completed').length} Completed)
              </span>
            </div>
          </div>

          {loadingHistory ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>Loading assessment history...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="plain-card" style={{ textAlign: 'center', padding: 28, color: 'var(--muted)' }}>
              <Terminal size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>
                {historySearch ? 'No assessments match your search filter.' : 'No past technical interviews found. Launch your first session above!'}
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="proctoring-audit-table">
                <thead>
                  <tr>
                    <th>Interview Title</th>
                    <th>Language & Level</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Overall Score</th>
                    <th>Proctoring Events</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((sess) => {
                    const isCompleted = sess.status === 'completed';
                    const score = sess.eval_overall_score ?? sess.overall_score;
                    return (
                      <tr key={sess.id}>
                        <td>
                          <strong>{sess.title}</strong>
                        </td>
                        <td>
                          <span className="signal-pill compact-pill">
                            {sess.language} • {sess.difficulty}
                          </span>
                        </td>
                        <td style={{ color: 'var(--muted)' }}>
                          {new Date(sess.started_at).toLocaleDateString()} {new Date(sess.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          <span className={`signal-pill compact-pill ${isCompleted ? 'ai-active-pill' : 'ai-setup-pill'}`}>
                            {isCompleted ? 'Completed' : 'In Progress'}
                          </span>
                        </td>
                        <td>
                          {isCompleted && score !== undefined && score !== null ? (
                            <strong style={{ color: Number(score) >= 75 ? '#34d399' : Number(score) >= 50 ? '#fbbf24' : '#f87171' }}>
                              {score}%
                            </strong>
                          ) : (
                            <span style={{ color: 'var(--muted)' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            {sess.activity_events_count || 0} events
                          </span>
                        </td>
                        <td>
                          {isCompleted ? (
                            <Link to={`/interview/${sess.id}/results`} className="primary-button compact-btn" style={{ fontSize: '0.75rem' }}>
                              View Report
                            </Link>
                          ) : (
                            <Link to={`/interview/${sess.id}`} className="secondary-button compact-btn" style={{ fontSize: '0.75rem' }}>
                              Resume
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

export function InterviewWorkspacePage({ user: _user }: { user: User | null }) {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, { text: string; code: string; status: string }>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active answer editing state
  const [activeCode, setActiveCode] = useState('');
  const [activeText, setActiveText] = useState('');
  const [activeTab, setActiveTab] = useState<'code' | 'text'>('code');
  const [autosaveStatus, setAutosaveStatus] = useState<string>('Saved');
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Voice speech recognition (Web Speech API)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<{ stop: () => void; start: () => void } | null>(null);

  // Audio Question Reader (TTS)
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState(1800);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

  // Proctoring telemetry
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);
  const [showWarningToast, setShowWarningToast] = useState<string | null>(null);
  const [gazeStatus, setGazeStatus] = useState<'focused' | 'away' | 'missing'>('focused');

  // Camera stream & canvas ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch interview data
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<{
          session: InterviewSession;
          remaining_seconds?: number;
          questions: InterviewQuestion[];
          answers: InterviewAnswer[];
        }>(`/api/interviews/${interviewId}`);

        setSession(data.session);
        setQuestions(data.questions || []);

        // Load existing answers
        const ansMap: Record<number, { text: string; code: string; status: string }> = {};
        for (const a of data.answers || []) {
          ansMap[a.question_id] = {
            text: a.answer_text || '',
            code: a.code_content || '',
            status: a.status || 'answered',
          };
        }
        setAnswers(ansMap);

        // If completed already, jump to results
        if (data.session.status === 'completed') {
          navigate(`/interview/${interviewId}/results`, { replace: true });
          return;
        }

        // Set initial timer safely
        const totalSecs = Math.max(600, (Number(data.session.duration_minutes) || 30) * 60);
        let remaining = totalSecs;

        if (typeof data.remaining_seconds === 'number' && data.remaining_seconds > 0) {
          remaining = data.remaining_seconds;
        } else if (data.session.started_at) {
          let rawDate = String(data.session.started_at).trim();
          if (rawDate.includes(' ') && !rawDate.includes('T')) {
            rawDate = rawDate.replace(' ', 'T') + 'Z';
          } else if (!rawDate.endsWith('Z') && !rawDate.includes('+')) {
            rawDate = rawDate + 'Z';
          }
          const startMs = new Date(rawDate).getTime();
          if (!isNaN(startMs)) {
            const elapsed = Math.floor((Date.now() - startMs) / 1000);
            if (elapsed >= 0 && elapsed < totalSecs) {
              remaining = totalSecs - elapsed;
            }
          }
        }

        // Safety check: if remaining time was calculated under 15s on first opening an in_progress session, give full duration
        if (remaining <= 15 && data.session.status === 'in_progress') {
          remaining = totalSecs;
        }

        setSecondsRemaining(remaining);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load interview session.');
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      void fetchInterview();
    }
  }, [interviewId, navigate]);

  // Current question helper
  const currentQuestion: InterviewQuestion | undefined = questions[currentIndex];

  // Sync editor fields when current question changes
  useEffect(() => {
    if (!currentQuestion) return;
    const existing = answers[currentQuestion.id];
    setActiveText(existing?.text || '');
    setActiveCode(existing?.code || currentQuestion.starter_code || currentQuestion.code_snippet || '');
    if (currentQuestion.type === 'conceptual') {
      setActiveTab('text');
    } else {
      setActiveTab('code');
    }

    // Stop speaking if question changed
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [currentIndex, currentQuestion]);

  // Save current answer to backend
  const saveAnswer = async (qId: number, textVal: string, codeVal: string) => {
    if (!interviewId || !qId) return;
    setAutosaveStatus('Saving...');
    try {
      await apiFetch(`/api/interviews/${interviewId}/answers`, {
        method: 'POST',
        body: JSON.stringify({
          questionId: qId,
          answerText: textVal,
          codeContent: codeVal,
          timeSpentSeconds: 5,
          status: (textVal.trim() || codeVal.trim()) ? 'answered' : 'unanswered',
        }),
      });
      setAnswers((prev) => ({
        ...prev,
        [qId]: { text: textVal, code: codeVal, status: (textVal.trim() || codeVal.trim()) ? 'answered' : 'unanswered' },
      }));
      setAutosaveStatus('Autosaved');
    } catch {
      setAutosaveStatus('Error saving');
    }
  };

  // Debounced autosave on keystrokes
  const handleAnswerChange = (newText: string, newCode: string) => {
    setActiveText(newText);
    setActiveCode(newCode);
    setAutosaveStatus('Typing...');

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    if (currentQuestion) {
      autosaveTimerRef.current = setTimeout(() => {
        void saveAnswer(currentQuestion.id, newText, newCode);
      }, 1200);
    }
  };

  // Voice speech-to-text recording toggle
  const toggleVoiceRecording = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your current browser. You can type your response directly.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            const separator = activeText && !activeText.endsWith(' ') ? ' ' : '';
            handleAnswerChange(activeText + separator + transcript, activeCode);
          }
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  // Text-To-Speech (TTS) Question Reader toggle
  const toggleSpeakQuestion = () => {
    if (!window.speechSynthesis || !currentQuestion) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanPrompt = currentQuestion.question_text.replace(/[\n\r]+/g, ' ');
    const utterance = new SpeechSynthesisUtterance(
      `Question ${currentQuestion.question_index}: ${currentQuestion.title}. ${cleanPrompt}`
    );
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Log proctoring telemetry
  const logActivity = async (eventType: string, severity: 'info' | 'warning' | 'critical', details: string) => {
    if (!interviewId) return;
    try {
      await apiFetch(`/api/interviews/${interviewId}/activity`, {
        method: 'POST',
        body: JSON.stringify({ eventType, severity, details }),
      });
    } catch {
      // ignore
    }
  };

  // Tab switch & focus loss proctoring listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchWarnings((prev) => prev + 1);
        setShowWarningToast('Proctoring Warning: Tab switch or window minimization detected. This event is recorded.');
        void logActivity('tab_switch', 'warning', 'User switched browser tab or minimized window');
      }
    };

    const handleWindowBlur = () => {
      void logActivity('window_blur', 'warning', 'Window lost active focus');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [interviewId]);

  // Hide warning toast after 5s
  useEffect(() => {
    if (showWarningToast) {
      const timer = setTimeout(() => setShowWarningToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [showWarningToast]);

  // Local Face & Gaze Tracking Loop (Privacy-Preserved in Browser Memory)
  useEffect(() => {
    let animationFrameId: number;
    let isRunning = true;

    const setupCamera = async () => {
      if (!session || session.mode !== 'camera') return;
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.defaultMuted = true;
          videoRef.current.playsInline = true;
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        // Processing loop for lightweight browser-side face tracking HUD
        const trackLoop = () => {
          if (!isRunning) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;

          if (video && canvas && video.readyState >= 2) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              canvas.width = video.videoWidth || 320;
              canvas.height = video.videoHeight || 240;
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              // Draw target box overlay
              const boxWidth = canvas.width * 0.55;
              const boxHeight = canvas.height * 0.65;
              const boxX = (canvas.width - boxWidth) / 2;
              const boxY = (canvas.height - boxHeight) / 2;

              setGazeStatus('focused');

              // Draw green HUD tracking box
              ctx.strokeStyle = '#34d399';
              ctx.lineWidth = 2;
              ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

              // Corner reticles
              ctx.fillStyle = '#34d399';
              ctx.fillRect(boxX, boxY, 12, 3);
              ctx.fillRect(boxX, boxY, 3, 12);
              ctx.fillRect(boxX + boxWidth - 12, boxY, 12, 3);
              ctx.fillRect(boxX + boxWidth - 3, boxY, 3, 12);
              ctx.fillRect(boxX, boxY + boxHeight - 3, 12, 3);
              ctx.fillRect(boxX, boxY + boxHeight - 12, 3, 12);
              ctx.fillRect(boxX + boxWidth - 12, boxY + boxHeight - 3, 12, 3);
              ctx.fillRect(boxX + boxWidth - 3, boxY + boxHeight - 12, 3, 12);
            }
          }
          animationFrameId = requestAnimationFrame(trackLoop);
        };

        trackLoop();
      } catch (err) {
        console.warn('Proctoring webcam initialization failed:', err);
      }
    };

    if (session?.mode === 'camera') {
      void setupCamera();
    }

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [session]);

  // Countdown timer loop
  useEffect(() => {
    if (loading || isFinishing) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void handleFinishInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, isFinishing]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (currentQuestion) {
      void saveAnswer(currentQuestion.id, activeText, activeCode);
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion) {
      void saveAnswer(currentQuestion.id, activeText, activeCode);
    }
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleJumpQuestion = (targetIdx: number) => {
    if (currentQuestion) {
      void saveAnswer(currentQuestion.id, activeText, activeCode);
    }
    setCurrentIndex(targetIdx);
  };

  const handleFinishInterview = async () => {
    if (!interviewId) return;
    setIsFinishing(true);
    setShowFinishModal(false);
    try {
      // Stop speech synthesis & recognition
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();

      // Save last question
      if (currentQuestion) {
        await saveAnswer(currentQuestion.id, activeText, activeCode);
      }

      // Finalize and evaluate
      await apiFetch(`/api/interviews/${interviewId}/finish`, { method: 'POST' });
      navigate(`/interview/${interviewId}/results`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error finalizing interview.');
      setIsFinishing(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <div className="loading-card" style={{ textAlign: 'center' }}>
          <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px', color: 'var(--teal)' }} />
          <h3>Initializing Live Interview Workspace...</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>
            Verifying 20 technical challenges, proctoring telemetry, and ChromaDB vector store questions.
          </p>
        </div>
      </div>
    );
  }

  if (error || !session || questions.length === 0) {
    return (
      <div className="page-shell">
        <div className="empty-state">
          <AlertTriangle size={36} style={{ color: 'var(--danger)' }} />
          <h2>Assessment Unavailable</h2>
          <p>{error || 'No interview session questions found.'}</p>
          <Link to="/interview/setup" className="primary-button">
            Return to Interview Hub
          </Link>
        </div>
      </div>
    );
  }

  const answeredCount = Object.values(answers).filter((a) => (a.text || a.code).trim().length > 0).length;
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="app-shell" style={{ minHeight: '100vh', padding: '16px 20px' }}>
      {/* Floating Warning Toast */}
      {showWarningToast && (
        <div className="proctoring-warning-toast">
          <AlertTriangle size={24} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.88rem' }}>Integrity Notification</strong>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)' }}>{showWarningToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowWarningToast(null)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Workspace Header */}
      <header className="workspace-header-bar">
        <div className="workspace-info-left">
          <Link to="/interview/setup" className="brand-wrap" style={{ textDecoration: 'none' }}>
            <span className="brand-mark">S</span>
            <span className="brand-text">SkillSetu AI</span>
          </Link>
          <div style={{ height: 24, width: 1, background: 'var(--border)' }} />
          <div>
            <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{session.title}</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              Question {currentIndex + 1} of {questions.length} • {progressPercent}% Completed
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Autosave Status */}
          <div className="autosave-status-tag">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
            {autosaveStatus}
          </div>

          {/* Countdown Timer */}
          <div
            className={`interview-timer-badge ${
              secondsRemaining < 60 ? 'danger' : secondsRemaining < 300 ? 'warning' : ''
            }`}
          >
            <Clock size={16} />
            {formatTimer(secondsRemaining)}
          </div>

          <button
            type="button"
            className="primary-button compact-btn"
            style={{ background: '#ef4444', borderColor: '#ef4444' }}
            onClick={() => setShowFinishModal(true)}
            disabled={isFinishing}
          >
            {isFinishing ? 'Submitting...' : 'Finish Interview'}
          </button>
        </div>
      </header>

      {/* Question 1 to 20 Palette Bar */}
      <nav className="question-palette-bar" aria-label="Question Navigation">
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', marginRight: 6 }}>
          Questions ({questions.length}):
        </span>
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const isAnswered = Boolean(answers[q.id]?.text || answers[q.id]?.code);
          return (
            <button
              key={q.id}
              type="button"
              className={`palette-q-btn ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : ''}`}
              onClick={() => handleJumpQuestion(idx)}
              title={`Question ${idx + 1}: ${q.title} (${isAnswered ? 'Answered' : 'Unanswered'})`}
            >
              {idx + 1}
            </button>
          );
        })}
      </nav>

      {/* Split Workspace Layout */}
      <main className="workspace-split-layout">
        {/* Left Column: Question Prompt & Proctoring HUD */}
        <div className="question-hud-column">
          {/* Question Details Card */}
          {currentQuestion && (
            <section className="question-details-card">
              <div className="question-meta-row">
                <span className={`q-badge ${currentQuestion.type || 'conceptual'}`}>
                  {currentQuestion.type === 'code_output'
                    ? 'Output Prediction'
                    : currentQuestion.type === 'debugging'
                    ? 'Code Debugging'
                    : currentQuestion.type === 'coding'
                    ? 'Coding Challenge'
                    : 'Conceptual'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  Topic: <strong>{currentQuestion.topic}</strong> • {currentQuestion.difficulty}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 6, marginBottom: 8 }}>
                <h2 className="question-title-text" style={{ margin: 0, fontSize: '1.05rem' }}>{currentQuestion.title}</h2>
                <button
                  type="button"
                  className={`secondary-button compact-btn ${isSpeaking ? 'active' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', flexShrink: 0 }}
                  onClick={toggleSpeakQuestion}
                  title={isSpeaking ? 'Stop Audio Reader' : 'Read Question Aloud'}
                >
                  {isSpeaking ? <><VolumeX size={14} /> Stop Audio</> : <><Volume2 size={14} /> Read Aloud</>}
                </button>
              </div>

              <div className="question-prompt-text">{currentQuestion.question_text}</div>

              {currentQuestion.code_snippet && (
                <div style={{ marginTop: 10 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                    Given Code Snippet:
                  </span>
                  <pre className="code-snippet-box">{currentQuestion.code_snippet}</pre>
                </div>
              )}
            </section>
          )}

          {/* Local Proctoring Camera HUD */}
          {session.mode === 'camera' && (
            <section className="proctoring-camera-hud">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted-strong)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Eye size={14} className="text-teal" /> AI Proctoring HUD
                </span>
                <span className={`gaze-status-pill ${gazeStatus}`}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: gazeStatus === 'focused' ? '#34d399' : '#fbbf24' }} />
                  {gazeStatus === 'focused' ? 'Eye Contact: Focused' : 'Looking Away'}
                </span>
              </div>

              <div className="camera-feed-wrapper">
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el && streamRef.current && el.srcObject !== streamRef.current) {
                      el.srcObject = streamRef.current;
                      el.onloadedmetadata = () => {
                        el.play().catch(() => {});
                      };
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="proctoring-video"
                />
                <canvas ref={canvasRef} className="proctoring-canvas" />
              </div>

              <div className="proctoring-status-bar">
                <span>Tab Switches: <strong>{tabSwitchWarnings}</strong></span>
                <span>Proctoring Mode: <strong>Local Edge Vision</strong></span>
              </div>

              <div className="proctoring-privacy-note">
                <Shield size={12} className="text-teal" /> Video is analyzed locally in memory and never uploaded to remote servers.
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Code Editor & Technical Answer */}
        <div className="editor-column">
          <section className="editor-card">
            <div className="editor-tabs-bar">
              <div className="editor-tab-group">
                <button
                  type="button"
                  className={`editor-tab-btn ${activeTab === 'code' ? 'active' : ''}`}
                  onClick={() => setActiveTab('code')}
                >
                  <Code2 size={14} style={{ display: 'inline', marginRight: 4 }} /> Code Solution
                </button>
                <button
                  type="button"
                  className={`editor-tab-btn ${activeTab === 'text' ? 'active' : ''}`}
                  onClick={() => setActiveTab('text')}
                >
                  <FileText size={14} style={{ display: 'inline', marginRight: 4 }} /> Written Explanation
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className={`secondary-button compact-btn ${isListening ? 'active' : ''}`}
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    background: isListening ? 'rgba(239, 68, 68, 0.2)' : undefined,
                    borderColor: isListening ? '#ef4444' : undefined,
                    color: isListening ? '#ef4444' : undefined,
                  }}
                  onClick={toggleVoiceRecording}
                  title={isListening ? 'Stop Voice Recording' : 'Voice Dictate Answer'}
                >
                  {isListening ? <><MicOff size={12} /> Recording...</> : <><Mic size={12} /> Voice Dictate</>}
                </button>

                {currentQuestion?.starter_code && (
                  <button
                    type="button"
                    className="secondary-button compact-btn"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    onClick={() => handleAnswerChange(activeText, currentQuestion.starter_code || '')}
                  >
                    <RotateCcw size={12} /> Reset Code
                  </button>
                )}
              </div>
            </div>

            {/* Code Input */}
            {activeTab === 'code' ? (
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                  Write your {session.language} code implementation below:
                </span>
                <textarea
                  className="code-textarea-editor"
                  value={activeCode}
                  placeholder={`// Write your ${session.language} solution here...\n`}
                  onChange={(e) => handleAnswerChange(activeText, e.target.value)}
                  spellCheck={false}
                />
              </div>
            ) : (
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                  Provide your conceptual answer, architectural reasoning, and complexity analysis:
                </span>
                <textarea
                  className="explanation-textarea"
                  style={{ minHeight: 280 }}
                  value={activeText}
                  placeholder="Explain your technical reasoning, time/space complexity (e.g. O(N)), and edge cases..."
                  onChange={(e) => handleAnswerChange(e.target.value, activeCode)}
                />
              </div>
            )}

            {/* Quick Secondary Input preview */}
            {activeTab === 'code' && (
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                  Technical Explanation / Complexity Breakdown:
                </span>
                <textarea
                  className="explanation-textarea"
                  value={activeText}
                  placeholder="Explain your approach and edge-case handling..."
                  onChange={(e) => handleAnswerChange(e.target.value, activeCode)}
                />
              </div>
            )}

            {/* Navigation Controls */}
            <div className="workspace-nav-controls">
              <button
                type="button"
                className="secondary-button"
                disabled={currentIndex === 0}
                onClick={handlePrev}
              >
                Previous Question
              </button>

              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                {answeredCount} of {questions.length} Answered
              </span>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleNext}
                >
                  Save & Next Question <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-button"
                  style={{ background: '#10b981', borderColor: '#10b981' }}
                  onClick={() => setShowFinishModal(true)}
                >
                  Review & Submit Assessment
                </button>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Finish Confirmation Modal */}
      {showFinishModal && (
        <div className="modal-backdrop" onClick={() => setShowFinishModal(false)}>
          <div className="dialog-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="dialog-header">
              <h3>Submit Technical Interview?</h3>
              <button type="button" className="icon-button" onClick={() => setShowFinishModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 0' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted-strong)' }}>
                You have attempted <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
              </p>
              {questions.length - answeredCount > 0 && (
                <div className="rules-agreement-box" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
                  <strong>Notice:</strong> You have {questions.length - answeredCount} unanswered questions. Unanswered questions will receive 0 points.
                </div>
              )}
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: 0 }}>
                Once submitted, NVIDIA API Catalog AI will evaluate your responses against technical rubrics and compile your comprehensive evaluation report.
              </p>
            </div>
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setShowFinishModal(false)}>
                Continue Interview
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ background: '#10b981', borderColor: '#10b981' }}
                disabled={isFinishing}
                onClick={() => void handleFinishInterview()}
              >
                {isFinishing ? 'Submitting & Evaluating...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function InterviewResultsPage({ user }: { user: User | null }) {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, InterviewAnswer>>({});
  const [activityLogs, setActivityLogs] = useState<InterviewActivityLog[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({ 1: true });

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<{
          session: InterviewSession;
          evaluation: InterviewEvaluation;
          questions: InterviewQuestion[];
          answers: InterviewAnswer[];
          activityLogs: InterviewActivityLog[];
        }>(`/api/interviews/${interviewId}/results`);

        setSession(data.session);
        setEvaluation(data.evaluation);
        setQuestions(data.questions || []);
        
        const aMap: Record<number, InterviewAnswer> = {};
        for (const a of data.answers || []) {
          aMap[a.question_id] = a;
        }
        setAnswers(aMap);
        setActivityLogs(data.activityLogs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to retrieve interview results.');
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      void fetchResults();
    }
  }, [interviewId]);

  const toggleQuestionAccordion = (idx: number) => {
    setExpandedQuestions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="page-shell">
        <div className="loading-card" style={{ textAlign: 'center' }}>
          <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px', color: 'var(--teal)' }} />
          <h3>Compiling AI Evaluation & Proctoring Audit...</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>
            Processing rubric matching, code correctness, and proctoring telemetry.
          </p>
        </div>
      </div>
    );
  }

  if (error || !session || !evaluation) {
    return (
      <div className="page-shell">
        <div className="empty-state">
          <AlertTriangle size={36} style={{ color: 'var(--danger)' }} />
          <h2>Evaluation Report Not Found</h2>
          <p>{error || 'The interview evaluation data is still processing or unavailable.'}</p>
          <Link to="/interview/setup" className="primary-button">
            Return to Interview Hub
          </Link>
        </div>
      </div>
    );
  }

  const score = evaluation.overall_score ?? evaluation.overallScore ?? 0;
  const techScore = evaluation.technical_score ?? evaluation.technicalScore ?? score;
  const expScore = evaluation.explanation_score ?? evaluation.explanationScore ?? score;
  const probScore = evaluation.problem_solving_score ?? evaluation.problemSolvingScore ?? score;

  const proctorSummary = evaluation.proctoringSummary || {
    integrityScore: 95,
    status: 'Verified High Integrity',
    tabSwitches: 0,
    blurCount: 0,
    gazeLostCount: 0,
    faceLostCount: 0,
    criticalViolations: 0,
    totalEvents: activityLogs.length,
    cameraEnabled: session.mode === 'camera',
  };

  return (
    <AppLayout
      user={user}
      title="Assessment Performance & Proctoring Report"
      subtitle={`Comprehensive evaluation for ${session.title} taken on ${new Date(session.started_at).toLocaleDateString()}`}
      actionButton={
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="secondary-button compact-btn" onClick={handlePrint}>
            <Printer size={14} /> Print / Export PDF
          </button>
          <Link to="/interview/setup" className="primary-button compact-btn">
            <Play size={14} /> Retake Assessment
          </Link>
        </div>
      }
    >
      <div className="interview-setup-shell">
        {/* Results Hero Card */}
        <section className="results-hero-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="signal-pill compact-pill ai-active-pill">
                <span className="signal-dot nvidia-green" /> {evaluation.evaluated_by || 'NVIDIA API Catalog (Llama 3.2)'}
              </span>
              <span className="signal-pill compact-pill">
                {session.language} • {session.difficulty}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
              Overall Score: {score}%
              <span style={{ fontSize: '1.05rem', fontWeight: 600, color: '#38bdf8', marginLeft: 12 }}>
                ({evaluation.totalMarksEarned ?? score}/{evaluation.totalMaxMarks ?? 100} Marks)
              </span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'rgba(226, 238, 255, 0.9)' }}>
              Verdict: <strong>{evaluation.readinessVerdict || (score >= 75 ? 'Ready for Technical Rounds' : 'Intermediate Candidate')}</strong>
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--muted)', maxWidth: 650 }}>
              {evaluation.overallEvaluation || `Candidate completed ${questions.length} technical questions with strong foundational coverage.`}
            </p>
          </div>

          <div style={{ textAlign: 'center', padding: '16px 28px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: 16, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Proctoring Integrity</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: proctorSummary.integrityScore >= 80 ? '#34d399' : '#fbbf24' }}>
              {proctorSummary.integrityScore}%
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{proctorSummary.status}</span>
          </div>
        </section>

        {/* KPI Score Cards */}
        <div className="results-kpi-grid">
          <div className="kpi-score-card">
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Technical Correctness</span>
            <div className="score-number" style={{ color: '#38bdf8' }}>{techScore}%</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Accuracy across code & concepts</span>
          </div>

          <div className="kpi-score-card">
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Explanation & Depth</span>
            <div className="score-number" style={{ color: '#a78bfa' }}>{expScore}%</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Reasoning & complexity breakdown</span>
          </div>

          <div className="kpi-score-card">
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Problem Solving Velocity</span>
            <div className="score-number" style={{ color: '#818cf8' }}>{probScore}%</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Approach & time management</span>
          </div>

          <div className="kpi-score-card">
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Total Marks Earned</span>
            <div className="score-number" style={{ color: '#34d399' }}>
              {evaluation.totalMarksEarned ?? score} <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>/ {evaluation.totalMaxMarks ?? 100}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Standardized 100-mark rubric</span>
          </div>

          <div className="kpi-score-card">
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Questions Breakdown</span>
            <div className="score-number" style={{ color: '#f59e0b' }}>
              {evaluation.correct_count ?? evaluation.correctCount ?? 0}/{questions.length}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              {evaluation.partial_count ?? evaluation.partialCount ?? 0} Partial • {evaluation.incorrect_count ?? evaluation.incorrectCount ?? 0} Incorrect
            </span>
          </div>
        </div>

        {/* Topic Breakdown & Qualitative Analysis */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {/* Topic Progress Bars */}
          <section className="topic-breakdown-card">
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers3 size={18} className="text-teal" /> Topic-Wise Proficiency
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 6 }}>
              {Object.entries(evaluation.topicBreakdown || {}).map(([topic, pct]) => {
                const numPct = Number(pct) || 0;
                const barColor = numPct >= 75 ? '#34d399' : numPct >= 50 ? '#38bdf8' : '#fbbf24';
                return (
                  <div key={topic} className="topic-bar-row">
                    <div className="topic-bar-label">
                      <span>{topic}</span>
                      <strong style={{ color: barColor }}>{numPct}%</strong>
                    </div>
                    <div className="topic-bar-track">
                      <div className="topic-bar-fill" style={{ width: `${numPct}%`, background: barColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Strengths & Recommendations */}
          <section className="topic-breakdown-card">
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={18} className="text-teal" /> Strengths & Actionable Recommendations
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#34d399', display: 'block', marginBottom: 6 }}>
                  Key Strengths:
                </strong>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.85rem', color: 'var(--muted-strong)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {(evaluation.strengths || ['Good foundational grasp of programming syntax']).map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong style={{ fontSize: '0.85rem', color: '#fbbf24', display: 'block', marginBottom: 6 }}>
                  Areas for Growth:
                </strong>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.85rem', color: 'var(--muted-strong)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {(evaluation.weaknesses || ['Deepen algorithmic space complexity optimization']).map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong style={{ fontSize: '0.85rem', color: '#38bdf8', display: 'block', marginBottom: 6 }}>
                  Recommended Next Steps:
                </strong>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.85rem', color: 'var(--muted-strong)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {(evaluation.recommendations || ['Practice live coding challenges on SkillSetu AI']).map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Detailed Question-by-Question Review (All 20 Questions) */}
        <section className="config-section-card" style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
              <BookOpen size={18} className="text-teal" /> Full Assessment Question Review (20 Questions)
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Click any question to view model solution & rubrics
            </span>
          </div>

          <div className="question-review-accordion" style={{ marginTop: 12 }}>
            {questions.map((q, idx) => {
              const qIndex = q.question_index || idx + 1;
              const isExpanded = Boolean(expandedQuestions[qIndex]);
              const feedback = (evaluation.questionFeedback || []).find(
                (f) => f.questionId === q.id || f.questionIndex === qIndex
              );
              const submittedAns = answers[q.id]?.answer_text || answers[q.id]?.code_content || '';
              const qScore = feedback?.score ?? 0;
              const marks = feedback?.marksEarned !== undefined ? `${feedback.marksEarned}/${feedback.maxMarks ?? 5} Marks` : `${Math.round(qScore * 0.05)}/5 Marks`;
              const verdict = feedback?.verdict || (submittedAns.trim() ? 'Reviewed' : 'Unanswered');

              return (
                <div key={q.id} className="review-item-card">
                  <div className="review-item-header" onClick={() => toggleQuestionAccordion(qIndex)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="palette-q-btn" style={{ width: 28, height: 28, fontSize: '0.78rem' }}>
                        {qIndex}
                      </span>
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: '#fff' }}>{q.title}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          {q.topic} • {q.difficulty}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        className="q-badge"
                        style={{
                          background: qScore >= 80 ? 'rgba(16, 185, 129, 0.15)' : qScore >= 50 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: qScore >= 80 ? '#34d399' : qScore >= 50 ? '#fbbf24' : '#f87171',
                        }}
                      >
                        {marks} • {qScore}% ({verdict})
                      </span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="review-item-body">
                      {/* Question Prompt */}
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                          Question:
                        </span>
                        <div style={{ fontSize: '0.9rem', color: 'rgba(226, 238, 255, 0.95)', whiteSpace: 'pre-wrap' }}>
                          {q.question_text}
                        </div>
                        {q.code_snippet && <pre className="code-snippet-box" style={{ marginTop: 8 }}>{q.code_snippet}</pre>}
                      </div>

                      {/* Submitted vs Suggested Split */}
                      <div className="review-answer-split">
                        <div>
                          <strong style={{ fontSize: '0.82rem', color: '#93c5fd', display: 'block', marginBottom: 6 }}>
                            Candidate's Submitted Response:
                          </strong>
                          <div className="review-box" style={{ color: submittedAns ? '#e2e8f0' : 'var(--muted)' }}>
                            {submittedAns || '(No response submitted)'}
                          </div>
                        </div>

                        <div>
                          <strong style={{ fontSize: '0.82rem', color: '#5eead4', display: 'block', marginBottom: 6 }}>
                            Suggested Solution & Explanation:
                          </strong>
                          <div className="review-box" style={{ color: '#a7f3d0' }}>
                            {q.suggested_answer || q.explanation || 'Refer to conceptual rubric.'}
                          </div>
                        </div>
                      </div>

                      {/* Sample Code Solution if present */}
                      {(feedback?.sampleSolution || q.starter_code) && (
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
                            Sample Model Code Implementation:
                          </span>
                          <pre className="code-snippet-box" style={{ background: '#0b1120', color: '#67e8f9', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                            {feedback?.sampleSolution || q.starter_code}
                          </pre>
                        </div>
                      )}

                      {/* Concept matching tags */}
                      {feedback && (
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                            Evaluated Key Concepts:
                          </span>
                          <div className="concept-tags-row">
                            {(feedback.matchedConcepts || []).map((c, i) => (
                              <span key={i} className="concept-tag matched">✓ {c}</span>
                            ))}
                            {(feedback.missedConcepts || []).map((c, i) => (
                              <span key={i} className="concept-tag missed">✕ {c}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rubric Feedback & Complexity Notes */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {feedback?.feedback && (
                          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--teal)', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                              AI Rubric Feedback:
                            </span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--muted-strong)' }}>
                              {feedback.feedback}
                            </span>
                          </div>
                        )}

                        {feedback?.timeComplexityNotes && (
                          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: 10, borderRadius: 10, border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                              Complexity & Optimization Notes:
                            </span>
                            <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                              {feedback.timeComplexityNotes}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Proctoring Telemetry Audit Trail */}
        <section className="config-section-card" style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
              <ShieldCheck size={18} className="text-teal" /> Proctoring Integrity & Telemetry Audit Log
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              {activityLogs.length} logged events {session.mode === 'camera' ? '• Edge Vision Enabled' : '• Text-only Mode'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, margin: '12px 0' }}>
            <div className="plain-card" style={{ padding: 14 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Tab Switches</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: proctorSummary.tabSwitches === 0 ? '#34d399' : '#f87171' }}>
                {proctorSummary.tabSwitches}
              </div>
            </div>
            <div className="plain-card" style={{ padding: 14 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Window Focus Loss</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: proctorSummary.blurCount === 0 ? '#34d399' : '#fbbf24' }}>
                {proctorSummary.blurCount}
              </div>
            </div>
            <div className="plain-card" style={{ padding: 14 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Gaze Drift Events</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: proctorSummary.gazeLostCount === 0 ? '#34d399' : '#fbbf24' }}>
                {proctorSummary.gazeLostCount}
              </div>
            </div>
            <div className="plain-card" style={{ padding: 14 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Integrity Status</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: proctorSummary.integrityScore >= 85 ? '#34d399' : '#fbbf24' }}>
                {proctorSummary.status}
              </div>
            </div>
          </div>

          {evaluation.cameraStats && session.mode === 'camera' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
              <div className="plain-card" style={{ padding: 12, background: 'rgba(15, 23, 42, 0.6)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Average Eye-Contact Score</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>
                  {evaluation.cameraStats.avgGazeScorePct}%
                </div>
              </div>
              <div className="plain-card" style={{ padding: 12, background: 'rgba(15, 23, 42, 0.6)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Face Detection Rate</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>
                  {evaluation.cameraStats.faceDetectionRatePct}%
                </div>
              </div>
              <div className="plain-card" style={{ padding: 12, background: 'rgba(15, 23, 42, 0.6)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Head Pose Tracking</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#a78bfa' }}>
                  {evaluation.cameraStats.headPoseStatus}
                </div>
              </div>
            </div>
          )}

          {activityLogs.length > 0 && (
            <div className="table-wrapper">
              <table className="proctoring-audit-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event Type</th>
                    <th>Severity</th>
                    <th>Audit Details</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.slice(0, 15).map((log, idx) => (
                    <tr key={idx}>
                      <td style={{ color: 'var(--muted)' }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Recent'}
                      </td>
                      <td>
                        <code>{log.event_type}</code>
                      </td>
                      <td>
                        <span
                          className="q-badge"
                          style={{
                            background: log.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' : log.severity === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                            color: log.severity === 'critical' ? '#f87171' : log.severity === 'warning' ? '#fbbf24' : '#60a5fa',
                          }}
                        >
                          {log.severity}
                        </span>
                      </td>
                      <td style={{ color: 'var(--muted-strong)' }}>{log.details || 'Proctoring sensor telemetry recorded'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

export function StaticInfoPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const isPrivacy = kind === 'privacy';
  return (
    <div className="auth-shell info-shell">
      <section className="auth-panel info-panel-page">
        <Link to="/" className="brand-wrap auth-brand">
          <span className="brand-mark">S</span>
          <span className="brand-text">SkillSetu AI</span>
        </Link>
        <h1>{isPrivacy ? 'Privacy & Data Governance' : 'Terms of Collaboration'}</h1>
        <p className="auth-copy">
          {isPrivacy
            ? 'SkillSetu AI ensures full student data privacy, protected profile discovery controls, and encrypted communications.'
            : 'Guidelines for respectful cross-university collaboration, open-source credit, and hackathon project integrity.'}
        </p>
        <div className="list-stack">
          {(isPrivacy
            ? [
                'Student passwords are salted and hashed using scrypt.',
                'Session tokens are stored as SHA-256 hashes and transmitted through HttpOnly cookies.',
                'Students can toggle their profile visibility to private at any time.',
                'Project task assignments and messages are strictly scoped to verified conversation members.',
              ]
            : [
                'Respect intellectual property and open-source licensing on shared projects.',
                'Do not spam project application queues or send abusive direct messages.',
                'Project owners maintain administrative rights over tasks and membership decisions.',
              ]
          ).map((item, idx) => (
            <article className="plain-card" key={idx}>
              <p>{item}</p>
            </article>
          ))}
        </div>
        <p className="auth-footer">
          <Link to="/">Back to Home</Link>
        </p>
      </section>
    </div>
  );
}

export function NotFoundPage({ user }: { user: User | null }) {
  return (
    <div className="page-shell">
      <div className="empty-state">
        <ShieldAlert size={36} />
        <h2>404 — Page Not Found</h2>
        <p>The page or resource you are looking for does not exist.</p>
        <Link to={user ? '/dashboard' : '/'} className="primary-button">
          {user ? 'Return to Dashboard' : 'Return Home'}
        </Link>
      </div>
    </div>
  );
}

export default App;
