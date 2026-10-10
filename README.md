# SkillSetu AI — Production-Ready Student Collaboration Ecosystem

SkillSetu AI is a student collaboration platform designed for national-level hackathons, capstones, and inter-university research. It connects students across colleges based on verified technical/creative skills, complementary interests, open project opportunities, and predictive synergy calibration.

---

## 🌟 Key Architecture & Differentiators

1. **Deterministic AI Match Engine (`/matches`)**:
   - Transparent, deterministic compatibility scoring formula with complete breakdown:
   $$\text{Score} = 38 + (\text{Shared Skills} \times 14) + (\text{Shared Interests} \times 10) + (\text{Complementary Skills} \times 5) + \text{Availability Bonus}$$
   - Identifies missing skills that complementary peers can contribute to form well-rounded squads.

2. **Talent Discovery & Public Portfolios (`/students` & `/students/:studentId`)**:
   - Cross-university student discovery with filters for College, Degree, Branch, Year, and Verified Skills.
   - Public student profiles showcasing verified skills with evidence links, GitHub repos, LinkedIn, and portfolios.
   - Peer-to-peer connection workflow (Connect $\rightarrow$ Pending $\rightarrow$ Accept/Reject/Cancel).

3. **Collaborative Project Marketplace & Workspaces (`/projects` & `/projects/:projectId`)**:
   - Full problem statements, proposed solutions, tech stacks, open roles, and commitment levels.
   - Interactive sprint task board (Planned $\rightarrow$ In Progress $\rightarrow$ Review $\rightarrow$ Done).
   - Member role management and 1-click application/invite workflows.

4. **Applications & Status Management (`/applications`)**:
   - Clean separation of **Received Applications** (for project leads) and **Sent Applications** (submitted by the student).
   - Status updates with automated member onboarding upon acceptance.

5. **Encrypted Direct Messaging (`/messages` & `/messages/:conversationId`)**:
   - Searchable conversation threads, unread counters, timestamps, and real-time dispatching.
   - Direct integration to initiate chats from student profiles or project cards.

6. **Growth Roadmap & Skill Gap Calibration (`/growth-roadmap`)**:
   - Target career tracks (Full-Stack Engineer, AI/ML Specialist, Product Designer, Web3 Developer).
   - Automated skill gap analysis with interactive sprint milestone tracking.

7. **Product Presentation & Pitch Studio (`/presentation`)**:
   - Switchable **Slide Presentation Mode** (interactive carousel deck) and **Structured Document View**.
   - 1-Click Copy and Markdown export for hackathon submission portals.

8. **AI Innovation Scanner (`/innovation-scanner`)**:
   - Curated domain problem statements across HealthTech, Agritech, CleanTech, EdTech, and FinTech.
   - 1-Click conversion of ideas directly into live project workspaces.

9. **AI Hackathon Coach (`/hackathon-coach`)**:
   - Decomposes problem statements into 72-hour sprint timelines (Architecture $\rightarrow$ Implementation $\rightarrow$ Pitch Rehearsal).
   - Direct sync of sprint milestones to project taskboards.

10. **AI Judge Simulator (`/judge-simulator`)**:
    - Transparent 8-criteria jury evaluation rubric with pitch scoring, score breakdown, and practice Q&A questions.

11. **Verified Hackathons Directory (`/hackathons`) & Team Builder (`/teams`)**:
    - Directory of national-level competitions with verified registration links and teammate finder shortcuts.

---

## 🛠️ Complete Route Architecture

| Route | Page / Component | Purpose |
|---|---|---|
| `/` | `LandingPage` | Public presentation hero, feature breakdown, and navigation |
| `/login` | `AuthPage (login)` | Secure session authentication with Scrypt password verification |
| `/register` | `AuthPage (signup)` | Multi-field registration (Name, College, Degree, Branch, Year, Skills) |
| `/forgot-password` | `ForgotPasswordPage` | Expiring password reset token generation |
| `/reset-password` | `ResetPasswordPage` | Single-use password update handler |
| `/dashboard` | `DashboardPage` | Personalized overview, skill radar, opportunity graph, and sprint metrics |
| `/matches` | `MatchesPage` | Skill-based student recommendation engine with transparent formulas |
| `/students` | `StudentsPage` | Public talent discovery marketplace with multi-faceted filtering |
| `/students/:studentId` | `StudentProfilePage` | Detailed portfolio, verified achievements, and connection actions |
| `/projects` | `ProjectsPage` | Open collaborative project marketplace and creation modal |
| `/projects/:projectId` | `ProjectDetailPage` | Detailed workspace with problem/solution, members, and sprint taskboard |
| `/applications` | `ApplicationsPage` | Received vs Sent application tracking and status decision engine |
| `/messages` | `MessagesPage` | Peer-to-peer messaging panel with conversation selector |
| `/messages/:conversationId` | `MessagesPage` | Direct conversation view |
| `/growth-roadmap` | `RoadmapPage` | Career role calibrator, skill gap analysis, and milestone tracker |
| `/notifications` | `NotificationsPage` | Activity notifications with category filters and unread badges |
| `/presentation` | `PresentationPage` | Interactive pitch deck showcase and markdown presentation builder |
| `/innovation-scanner` | `AiScannerPage` | Problem discovery workspace with 1-click project conversion |
| `/hackathon-coach` | `HackathonCoachPage` | Hackathon sprint planner and task decomposition tool |
| `/judge-simulator` | `JudgeSimulatorPage` | Practice pitch evaluation against 8 standard jury criteria |
| `/hackathons` | `HackathonsPage` | National hackathon competition directory and teammate matching |
| `/teams` | `TeamsPage` | Cross-college team creation and role recruitment |
| `/profile` | `ProfilePage` | Full profile editor with privacy toggles and portfolio links |
| `/settings` | `SettingsPage` | Account parameters, security info, and 1-click demo data reset/seed |
| `/docs` | `DocsPage` | System architecture, schema documentation, and security specs |
| `/privacy` & `/terms` | `StaticInfoPage` | Data governance and collaboration integrity guidelines |

---

## 🔒 Security & Data Model

- **Password Cryptography**: Salted, multi-iteration key derivation via Node.js `scrypt`.
- **Session Architecture**: Cryptographically random 32-byte session tokens stored as SHA-256 hashes in SQLite. Session cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- **Relational Integrity**: 20+ normalized relational tables (`users`, `profiles`, `skills`, `student_skills`, `projects`, `project_members`, `applications`, `conversations`, `messages`, `tasks`, `notifications`, `roadmaps`, `hackathons`, etc.) with strict foreign key cascades and unique constraints.
- **Access Control**: Server-side authorization checks ensure students can only modify their own profiles, projects, tasks, and messages.

---

## 🚀 Getting Started

### 1. Installation
```powershell
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```

#### Configuring NVIDIA API Catalog (Primary AI Provider):
1. Create a free account at [https://build.nvidia.com/](https://build.nvidia.com/).
2. Navigate to your API keys page and generate an API key (starts with `nvapi-`).
3. Add the following keys to your local `.env` (or `backend/.env`):
```env
NVIDIA_API_KEY=nvapi-your-actual-api-key-here
NVIDIA_MODEL=meta/llama-3.1-70b-instruct
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
```
*Note: If `NVIDIA_API_KEY` is not provided, SkillSetu AI automatically operates in resilient Smart Heuristic mode with zero crashes, providing transparent feedback to both judges and developers.*

### 3. Run Development Environment (Frontend + Backend)
```powershell
npm run dev:full
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

### 4. Running Automated Tests & Production Build
```powershell
npm test          # Run full backend API, AI endpoints & auth integration test suite
npm run build     # Run TypeScript typecheck and Vite production build
npm run lint      # Run Oxlint validation
```

---

## 🤖 Integrated NVIDIA AI Features

1. **AI Skills & Certificate Analyzer (`/ai-skills` / Tab 1)**:
   - Analyzes student profile, verified skills, and uploaded certificate/portfolio text.
   - Computes Skill Mastery Matrix with confidence ratings, identified superpowers, and critical industry skill gaps.
   - 1-Click "Add Recommended Action to Growth Roadmap".

2. **Opportunity Synergy & Gap Matcher (`/ai-skills` / Tab 2 & `/hackathons`)**:
   - Compares student profiles against hackathons (e.g. Smart India Hackathon, ETHIndia), internships, and project roles.
   - Calculates 0-100 Compatibility Score, matching requirements vs missing qualifications, and estimated study/sprint hours to bridge gaps.

3. **Personalized Career Roadmap (`/ai-skills` / Tab 3)**:
   - Generates bespoke milestone roadmaps, capstone project architectures, and industry certification recommendations tailored to the student's background.

4. **AI Innovation Scanner (`/innovation-scanner`)**:
   - Custom problem statement generator using NVIDIA AI with viability scoring, tech stacks, and team role blueprints.

5. **AI Hackathon Coach (`/hackathon-coach`)**:
   - Generates sprint timelines tailored to deadlines and syncs tasks directly to workspace boards.

6. **AI Judge Simulator (`/judge-simulator`)**:
   - Evaluates pitches against national hackathon jury rubrics with anticipated judge defense questions and improvement tips.

---

## 👥 Demo Accounts (Pre-Seeded)

The system automatically initializes verified demo student accounts across universities for seamless hackathon demonstration:

- **Priya Sharma** (`priya.sharma@example.edu` / `DemoStudent123!`) — IIT Bombay (B.Tech CSE) · Full-Stack & AI
- **Aravind Kumar** (`aravind.k@example.edu` / `DemoStudent123!`) — BITS Pilani (EEE) · Embedded & Edge AI
- **Ananya Patel** (`ananya.patel@example.edu` / `DemoStudent123!`) — NID (Interaction Design) · Product & UX
- **Rohit Menon** (`rohit.menon@example.edu` / `DemoStudent123!`) — DTU (Software Eng.) · Cloud & Web3

*Note: Demo data can be reset or re-seeded at any time from the `/settings` page.*

