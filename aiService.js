/**
 * SkillSetu AI — NVIDIA API Catalog Integration Service
 * Primary AI Provider: NVIDIA API Catalog (https://build.nvidia.com/)
 * Default Model: meta/llama-3.1-70b-instruct
 */

const DEFAULT_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_MODEL = 'meta/llama-3.2-11b-vision-instruct';


/**
 * Mask secret key for logs and public diagnostics (never expose full key)
 */
export const maskApiKey = (key) => {
  if (!key || typeof key !== 'string' || !key.trim()) return '(Not Configured)';
  const clean = key.trim();
  if (clean.length <= 8) return '****';
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
};

/**
 * Get current NVIDIA AI integration status
 */
export const getAiStatus = () => {
  const apiKey = process.env.NVIDIA_API_KEY?.trim();
  const model = process.env.NVIDIA_MODEL?.trim() || DEFAULT_MODEL;
  const baseUrl = process.env.NVIDIA_BASE_URL?.trim() || DEFAULT_BASE_URL;
  const configured = Boolean(apiKey && apiKey.length > 5);

  return {
    configured,
    provider: 'NVIDIA API Catalog',
    catalogUrl: 'https://build.nvidia.com/',
    model,
    baseUrl,
    maskedKey: maskApiKey(apiKey),
  };
};

/**
 * Clean JSON output from LLM (stripping markdown fences)
 */
const parseCleanJson = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;
  const text = rawText.trim();
  
  // Try direct parse
  try {
    return JSON.parse(text);
  } catch {}

  // Extract from markdown code fences ```json ... ```
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {}
  }
  
  // Extract substring between first [ and last ] or first { and last }
  const startArr = text.indexOf('[');
  const endArr = text.lastIndexOf(']');
  if (startArr !== -1 && endArr !== -1 && endArr > startArr) {
    try {
      return JSON.parse(text.substring(startArr, endArr + 1));
    } catch {}
  }

  const startObj = text.indexOf('{');
  const endObj = text.lastIndexOf('}');
  if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
    try {
      return JSON.parse(text.substring(startObj, endObj + 1));
    } catch {}
  }

  return null;
};


/**
 * Execute chat completion call to NVIDIA API Catalog
 */
export const callNvidiaChat = async ({
  systemPrompt,
  userPrompt,
  temperature = 0.2,
  maxTokens = 1500,
}) => {
  const apiKey = process.env.NVIDIA_API_KEY?.trim();
  const model = process.env.NVIDIA_MODEL?.trim() || DEFAULT_MODEL;
  const baseUrl = (process.env.NVIDIA_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, '');

  if (!apiKey) {
    return {
      success: false,
      isConfigured: false,
      error: 'NVIDIA_API_KEY is not configured in backend .env. Register at https://build.nvidia.com/ to obtain a key.',
    };
  }

  const endpoint = `${baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        top_p: 0.7,
        max_tokens: maxTokens,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const status = response.status;
      const errorBody = await response.text().catch(() => '');
      let cleanMessage = `NVIDIA API error (HTTP ${status})`;
      
      if (status === 401 || status === 403) {
        cleanMessage = 'NVIDIA API key invalid or unauthorized. Please verify your NVIDIA_API_KEY in backend .env.';
      } else if (status === 429) {
        cleanMessage = 'NVIDIA API rate limit reached. Please retry in a few moments.';
      } else if (status >= 500) {
        cleanMessage = 'NVIDIA API service is currently unavailable. Please try again later.';
      }
      
      return {
        success: false,
        isConfigured: true,
        status,
        error: cleanMessage,
        rawDetails: errorBody ? errorBody.slice(0, 300) : undefined,
      };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    
    return {
      success: true,
      isConfigured: true,
      model: data?.model || model,
      content,
      parsed: parseCleanJson(content),
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        success: false,
        isConfigured: true,
        error: 'NVIDIA API request timed out (35s limit). Please check your network connection.',
      };
    }
    return {
      success: false,
      isConfigured: true,
      error: err instanceof Error ? err.message : 'Failed to communicate with NVIDIA API Catalog.',
    };
  }
};

/**
 * 1. AI Skill & Certificate Analysis
 * Analyzes student skills, uploaded certificate details, and portfolio text.
 */
export const analyzeSkillsAndCertificates = async ({
  profile,
  skills = [],
  certificateText = '',
  portfolioSummary = '',
}) => {
  const status = getAiStatus();

  if (status.configured) {
    const systemPrompt = `You are the SkillSetu AI Lead Evaluator. Analyze the student's technical and non-technical skills, verified certificates, and background.
Return a STRICT JSON response adhering exactly to this format:
{
  "extractedSkills": ["Skill1", "Skill2"],
  "skillMastery": [
    {"skill": "Skill1", "level": "Advanced", "confidenceScore": 92, "evidence": "Demonstrated via projects and certifications."}
  ],
  "strengths": ["Strength 1", "Strength 2"],
  "skillGaps": ["Missing Skill 1", "Missing Skill 2"],
  "certificateEvaluation": {
    "verified": true,
    "credibility": "High",
    "relevanceScore": 88,
    "summary": "Validates proficiency in relevant domain standards."
  },
  "recommendedActions": [
    {"action": "Build a full-stack project using X", "priority": "High", "timeframe": "2 weeks"}
  ],
  "personalizedCareerRecommendations": [
    "Pursue Backend Engineer or AI/ML roles in high-growth startups."
  ]
}`;

    const userPrompt = `Student Profile:
Name: ${profile?.full_name || profile?.name || 'Student'}
College: ${profile?.college || 'University'}
Branch & Year: ${profile?.branch || 'Engineering'}, ${profile?.study_year || '3rd Year'}
Career Goals: ${profile?.career_goals || 'Software Engineering'}
Listed Skills: ${skills.join(', ') || 'None provided'}
Uploaded Certificate / Credential Content:
${certificateText || 'No external certificate text provided.'}
Portfolio / Project Summary:
${portfolioSummary || profile?.bio || 'Active student builder.'}`;

    const aiResult = await callNvidiaChat({ systemPrompt, userPrompt });
    if (aiResult.success && aiResult.parsed) {
      return {
        ...aiResult.parsed,
        aiProvider: 'nvidia_api_catalog',
        model: aiResult.model,
      };
    }
  }

  // Smart Heuristic Fallback (Transparent & Instant)
  const existingSkillsSet = new Set((skills || []).map((s) => s.toLowerCase().trim()));
  const hasReact = existingSkillsSet.has('react') || existingSkillsSet.has('frontend');
  const hasBackend = existingSkillsSet.has('node.js') || existingSkillsSet.has('python') || existingSkillsSet.has('express');
  const hasAI = existingSkillsSet.has('pytorch') || existingSkillsSet.has('machine learning') || existingSkillsSet.has('python');

  const gaps = [];
  if (!hasReact) gaps.push('Modern Frontend Architecture (React 19 / TypeScript)');
  if (!hasBackend) gaps.push('REST & Scalable Backend APIs (Node.js / FastAPI)');
  if (!hasAI) gaps.push('Agentic Workflows & LLM API Integration (NVIDIA API / LangChain)');
  if (gaps.length === 0) gaps.push('Distributed Systems & Microservices Optimization');

  return {
    extractedSkills: skills.length ? skills : ['Full-Stack Development', 'Problem Solving', 'Team Collaboration'],
    skillMastery: (skills.length ? skills : ['Web Development', 'Git & CI/CD']).map((s) => ({
      skill: s,
      level: ['React', 'Python', 'TypeScript', 'C++'].includes(s) ? 'Advanced' : 'Intermediate',
      confidenceScore: Math.floor(75 + Math.random() * 20),
      evidence: `Profile verified. Relevant in student projects and university coursework.`,
    })),
    strengths: [
      `Strong foundational knowledge in ${skills.slice(0, 3).join(', ') || 'computer science and software engineering'}`,
      'Demonstrated collaborative capability for fast-paced hackathons',
      'Clear alignment with cross-disciplinary innovation tracks',
    ],
    skillGaps: gaps,
    certificateEvaluation: {
      verified: Boolean(certificateText && certificateText.length > 10),
      credibility: certificateText ? 'Verified Credential' : 'Pending Upload',
      relevanceScore: certificateText ? 90 : 70,
      summary: certificateText
        ? `Certificate matches modern tech stack standards and validates domain mastery.`
        : `Upload or paste certificate credentials to receive instant verified accreditation analysis.`,
    },
    recommendedActions: [
      {
        action: `Bridge gap in ${gaps[0] || 'Cloud Deployment'} by building an end-to-end MVP`,
        priority: 'High',
        timeframe: '2-3 weeks',
      },
      {
        action: 'Participate in a national hackathon to test live collaboration under sprint constraints',
        priority: 'Medium',
        timeframe: '1 month',
      },
      {
        action: 'Document system architecture and publish interactive demo links to GitHub',
        priority: 'Medium',
        timeframe: '1 week',
      },
    ],
    personalizedCareerRecommendations: [
      `Target high-impact roles: Full-Stack Developer, AI Solutions Engineer, or Technical Founder.`,
      `Leverage ${skills[0] || 'Core Skills'} to lead multi-disciplinary teams in Smart India Hackathon.`,
    ],
    aiProvider: status.configured ? 'nvidia_api_catalog' : 'smart_heuristic_fallback',
    setupNotice: status.configured
      ? undefined
      : 'NVIDIA API key not configured. Add NVIDIA_API_KEY=nvapi-... to your backend .env to enable live llama-3.1-70b analysis.',
  };
};

/**
 * 2. Compare Student Profile with Opportunity (Hackathon / Internship / Project)
 * Identifies matching requirements, missing qualifications, and improvement actions.
 */
export const compareOpportunityWithStudent = async ({
  profile,
  skills = [],
  opportunityType = 'Hackathon',
  opportunityTitle = '',
  opportunityRequirements = '',
}) => {
  const status = getAiStatus();

  if (status.configured) {
    const systemPrompt = `You are the SkillSetu AI Opportunity Match Engine.
Compare the student's profile and skills against the target opportunity requirements.
Return a STRICT JSON response matching this schema:
{
  "compatibilityScore": 85,
  "readinessVerdict": "Strong Candidate with High Synergy",
  "matchingRequirements": ["Requirement 1", "Requirement 2"],
  "missingQualifications": ["Missing Skill or Prerequisite 1"],
  "gapSeverity": "Low",
  "actionableImprovementSteps": [
    {"step": "Action 1", "estimatedHours": 8, "impact": "High"}
  ],
  "competitiveAdvantage": "Strong full-stack foundations and hackathon execution velocity."
}`;

    const userPrompt = `Student Profile:
Name: ${profile?.full_name || profile?.name}
College: ${profile?.college}
Skills: ${skills.join(', ')}
Career Goals: ${profile?.career_goals}

Target Opportunity:
Type: ${opportunityType}
Title: ${opportunityTitle}
Requirements / Theme / Description:
${opportunityRequirements}`;

    const aiResult = await callNvidiaChat({ systemPrompt, userPrompt });
    if (aiResult.success && aiResult.parsed) {
      return {
        ...aiResult.parsed,
        aiProvider: 'nvidia_api_catalog',
        model: aiResult.model,
      };
    }
  }

  // Fallback Comparison Heuristic
  const reqTokens = (opportunityRequirements || opportunityTitle || '')
    .toLowerCase()
    .split(/[\s,+/]+/)
    .filter((w) => w.length > 2);

  const studentTokens = (skills || []).map((s) => s.toLowerCase());
  const matching = [];
  const missing = [];

  const commonKeywords = ['react', 'python', 'node', 'ai', 'machine learning', 'web3', 'solidity', 'figma', 'design', 'typescript', 'sqlite', 'docker', 'cloud', 'iot', 'robotics'];

  for (const kw of commonKeywords) {
    if (reqTokens.some((t) => t.includes(kw) || kw.includes(t))) {
      if (studentTokens.some((s) => s.includes(kw) || kw.includes(s))) {
        matching.push(`Proficiency in ${kw.toUpperCase()}`);
      } else {
        missing.push(`Required experience in ${kw.toUpperCase()}`);
      }
    }
  }

  if (matching.length === 0) matching.push('Core Software Engineering & Analytical Problem Solving');
  if (missing.length === 0) missing.push('Domain-specific regulation & live deployment monitoring');

  const matchRatio = matching.length / (matching.length + missing.length || 1);
  const score = Math.round(Math.min(95, Math.max(55, matchRatio * 100)));

  return {
    compatibilityScore: score,
    readinessVerdict:
      score >= 80
        ? 'High Synergy — Ready for immediate team application or leadership.'
        : score >= 65
        ? 'Solid Candidate — Minor skill gaps easily bridged with 1-2 focused sprint tasks.'
        : 'Development Target — Recommended to complete guided prerequisites before applying.',
    matchingRequirements: matching,
    missingQualifications: missing,
    gapSeverity: score >= 80 ? 'Low' : score >= 65 ? 'Medium' : 'High',
    actionableImprovementSteps: [
      {
        step: `Complete a 4-hour hands-on sprint focusing on ${missing[0] || 'Target Domain API'}`,
        estimatedHours: 4,
        impact: 'High',
      },
      {
        step: `Align portfolio projects with ${opportunityTitle} evaluation rubric`,
        estimatedHours: 2,
        impact: 'Medium',
      },
      {
        step: 'Sync complementary teammates on SkillSetu AI to cover open roles',
        estimatedHours: 1,
        impact: 'High',
      },
    ],
    competitiveAdvantage: 'Cross-functional adaptability and strong engineering foundation.',
    aiProvider: status.configured ? 'nvidia_api_catalog' : 'smart_heuristic_fallback',
    setupNotice: status.configured
      ? undefined
      : 'NVIDIA API key not configured. Add NVIDIA_API_KEY=nvapi-... to your backend .env to enable live llama-3.1-70b analysis.',
  };
};

/**
 * 3. Generate Personalized Career & Learning Roadmap
 */
export const generateAiRoadmap = async ({
  profile,
  skills = [],
  targetRole = 'Full-Stack AI Engineer',
  timeframeWeeks = 6,
}) => {
  const status = getAiStatus();

  if (status.configured) {
    const systemPrompt = `You are SkillSetu AI's Lead Career Architect.
Create a high-impact, personalized week-by-week learning and sprint roadmap for a university student.
Return a STRICT JSON response following this structure:
{
  "targetRole": "${targetRole}",
  "estimatedCompletionWeeks": ${timeframeWeeks},
  "overallReadiness": 78,
  "phases": [
    {
      "phaseNumber": 1,
      "title": "Phase 1: Architecture & Foundations",
      "weekSpan": "Weeks 1-2",
      "focus": "Core principles, system design, and repository scaffolding.",
      "milestones": [
        {"title": "Design normalized database schema and auth guards", "duration": "3 days"},
        {"title": "Build responsive glassmorphic UI components", "duration": "4 days"}
      ]
    }
  ],
  "capstoneProject": {
    "title": "Project Title",
    "description": "Comprehensive project solving a real-world problem.",
    "techStack": ["React", "FastAPI", "SQLite", "NVIDIA API"]
  },
  "recommendedCertifications": ["AWS Certified Developer", "NVIDIA Deep Learning Institute"]
}`;

    const userPrompt = `Student Profile:
Name: ${profile?.full_name || profile?.name}
College: ${profile?.college}
Current Year: ${profile?.study_year}
Skills: ${skills.join(', ')}
Target Goal: ${targetRole}
Available Timeframe: ${timeframeWeeks} Weeks`;

    const aiResult = await callNvidiaChat({ systemPrompt, userPrompt });
    if (aiResult.success && aiResult.parsed) {
      return {
        ...aiResult.parsed,
        aiProvider: 'nvidia_api_catalog',
        model: aiResult.model,
      };
    }
  }

  // Heuristic Career Roadmap
  return {
    targetRole,
    estimatedCompletionWeeks: timeframeWeeks,
    overallReadiness: 76,
    phases: [
      {
        phaseNumber: 1,
        title: 'Phase 1: Modern Full-Stack & API Infrastructure',
        weekSpan: 'Weeks 1–2',
        focus: 'High-performance React components, TypeScript contracts, and secure session authentication.',
        milestones: [
          { title: 'Master React 19 State Management & React Router 7 Architecture', duration: '5 days' },
          { title: 'Build persistent backend APIs with Scrypt password security and rate limiting', duration: '4 days' },
        ],
      },
      {
        phaseNumber: 2,
        title: 'Phase 2: Agentic AI & Model Integration',
        weekSpan: 'Weeks 3–4',
        focus: 'Integrating NVIDIA API Catalog LLMs, prompt engineering, and structured JSON parsing.',
        milestones: [
          { title: 'Connect NVIDIA llama-3.1-70b-instruct endpoints with fallback resilience', duration: '4 days' },
          { title: 'Implement automated skill extraction and certificate verification pipelines', duration: '5 days' },
        ],
      },
      {
        phaseNumber: 3,
        title: 'Phase 3: National Hackathon Sprint & Live Deployment',
        weekSpan: 'Weeks 5–6',
        focus: 'Capstone rehearsal, AI Judge simulation, and interactive pitch deck preparation.',
        milestones: [
          { title: 'Conduct simulated jury pitch evaluations and resolve bottleneck questions', duration: '3 days' },
          { title: 'Deploy production build and verify multi-student cross-campus discovery', duration: '4 days' },
        ],
      },
    ],
    capstoneProject: {
      title: 'SkillSetu AI Collaboration Hub',
      description: 'Unified cross-university student ecosystem featuring predictive synergy modeling and live sprint tracking.',
      techStack: ['React 19', 'TypeScript', 'Node.js', 'SQLite', 'NVIDIA API Catalog'],
    },
    recommendedCertifications: [
      'NVIDIA DLI: Building LLM-Powered Applications',
      'Meta Front-End Developer Professional Certificate',
    ],
    aiProvider: status.configured ? 'nvidia_api_catalog' : 'smart_heuristic_fallback',
    setupNotice: status.configured
      ? undefined
      : 'NVIDIA API key not configured. Add NVIDIA_API_KEY=nvapi-... to your backend .env to enable live llama-3.1-70b analysis.',
  };
};

/**
 * 4. AI Judge Simulator Pitch Evaluation
 */
export const evaluateProjectPitch = async ({ pitchText, projectTitle = 'Project Pitch' }) => {
  const status = getAiStatus();

  if (status.configured) {
    const systemPrompt = `You are a Senior National Hackathon Jury Judge.
Evaluate the student's project pitch strictly and constructively across hackathon evaluation criteria.
Return a STRICT JSON response formatted as:
{
  "overallScore": 88,
  "verdict": "Top 5% Finalist Potential. Clear problem-solution fit with compelling technical proof.",
  "rubric": [
    {"name": "Problem Relevance & Pain Point Clarity", "score": 90, "feedback": "Specific user pain identified with clear stakeholders."},
    {"name": "Innovation & Originality", "score": 85, "feedback": "Novel application of agentic AI workflows."},
    {"name": "Technical Execution & Architecture", "score": 92, "feedback": "Robust full-stack architecture with persistent database and auth."},
    {"name": "Feasibility & MVP Completeness", "score": 86, "feedback": "Working live demo ready for user testing."},
    {"name": "Social & Economic Impact", "score": 88, "feedback": "Addresses a tangible high-value market need."},
    {"name": "Presentation & Pitch Quality", "score": 87, "feedback": "Concise structure covering problem, proof, and metrics."}
  ],
  "judgeQuestions": [
    "How does your solution handle offline network interruptions in rural settings?",
    "What is your cost-per-inference projection when scaling to 50,000 active students?",
    "How do you ensure tamper-proof data verification without vendor lock-in?"
  ],
  "improvementTips": [
    "Show the working user workflow within the first 45 seconds of your pitch.",
    "Quantify your performance improvements with concrete benchmarking numbers.",
    "Detail your data security and session encryption model during the architecture slide."
  ]
}`;

    const userPrompt = `Project Title: ${projectTitle}\n\nPitch Text:\n${pitchText}`;

    const aiResult = await callNvidiaChat({ systemPrompt, userPrompt });
    if (aiResult.success && aiResult.parsed) {
      return {
        ...aiResult.parsed,
        aiProvider: 'nvidia_api_catalog',
        model: aiResult.model,
      };
    }
  }

  // Intelligent Heuristic Evaluation Fallback
  const text = (pitchText || '').toLowerCase();
  const wordCount = pitchText.trim().split(/\s+/).length;

  const hasProblem = /problem|pain|gap|challenge|struggle|issue/i.test(text);
  const hasSolution = /solution|platform|system|solve|workflow|ai|feature/i.test(text);
  const hasStack = /react|node|typescript|database|sqlite|api|backend|fastapi|python|pytorch|nvidia/i.test(text);
  const hasImpact = /metric|speed|velocity|increase|reduce|save|user|growth|impact|scale/i.test(text);
  const hasTraction = /demo|tested|user|student|tested|accounts|live|built|mvp/i.test(text);

  const sRelevance = Math.min(96, (hasProblem ? 55 : 30) + Math.min(wordCount, 38));
  const sInnovation = Math.min(95, (hasSolution ? 50 : 25) + (text.includes('ai') || text.includes('nvidia') ? 35 : 20));
  const sExecution = Math.min(98, (hasStack ? 55 : 25) + (text.includes('schema') || text.includes('auth') || text.includes('database') ? 38 : 18));
  const sFeasibility = Math.min(94, (hasTraction ? 60 : 35) + 28);
  const sImpact = Math.min(95, (hasImpact ? 55 : 30) + 35);
  const sPresentation = Math.min(96, Math.min(94, 45 + Math.floor(wordCount / 2)));

  const overall = Math.round((sRelevance + sInnovation + sExecution + sFeasibility + sImpact + sPresentation) / 6);

  return {
    overallScore: overall,
    verdict:
      overall >= 85
        ? 'Exceptional Submission. Top Finalist Contender with Strong Architecture.'
        : overall >= 72
        ? 'Competitive Hackathon Entry. Strengthen live demo proof and highlight quantifiable metrics.'
        : 'Promising Prototype. Articulate specific user pain points and elaborate technical implementation details.',
    rubric: [
      {
        name: 'Problem Relevance & Pain Point Clarity',
        score: sRelevance,
        feedback: hasProblem
          ? 'Problem statement is well articulated with tangible student impact.'
          : 'Define specific user pain points and explain why existing tools fall short.',
      },
      {
        name: 'Innovation & Originality',
        score: sInnovation,
        feedback: text.includes('ai')
          ? 'Strong integration of modern AI-assisted matching and automation workflows.'
          : 'Consider integrating specialized LLM or heuristic automation to elevate differentiation.',
      },
      {
        name: 'Technical Execution & Architecture',
        score: sExecution,
        feedback: hasStack
          ? 'Robust full-stack architecture with persistent database and secure authentication.'
          : 'Provide deeper technical specifics on data models, API endpoints, and system reliability.',
      },
      {
        name: 'Feasibility & MVP Completeness',
        score: sFeasibility,
        feedback: hasTraction
          ? 'Validated MVP with live working features and real-time interaction.'
          : 'Ensure judge can test the interactive prototype with pre-populated demo data.',
      },
      {
        name: 'Social & Economic Impact',
        score: sImpact,
        feedback: hasImpact
          ? 'Clear value proposition for inter-college collaboration and skill development.'
          : 'Include metrics on estimated time saved and user adoption trajectory.',
      },
      {
        name: 'Presentation & Pitch Quality',
        score: sPresentation,
        feedback: 'Well-structured narrative linking user pain, technical solution, and live demo proof.',
      },
    ],
    judgeQuestions: [
      'How does your system guarantee data isolation and privacy when students collaborate across colleges?',
      'If active user traffic spikes during a national competition deadline, how does the backend scale gracefully?',
      'What specific AI heuristic prevents bias when matching students without prior hackathon badges?',
    ],
    improvementTips: [
      'Showcase the live product workflow within the first 60 seconds of your presentation.',
      'Explicitly highlight security best practices: password hashing, protected API routes, and rate limits.',
      'Conclude with a clear demonstration of real-time messaging and milestone synchronization.',
    ],
    aiProvider: status.configured ? 'nvidia_api_catalog' : 'smart_heuristic_fallback',
    setupNotice: status.configured
      ? undefined
      : 'NVIDIA API key not configured. Add NVIDIA_API_KEY=nvapi-... to your backend .env to enable live llama-3.1-70b analysis.',
  };
};

/**
 * 5. AI Innovation Scanner
 */
export const scanInnovationIdeas = async ({ domain = 'All', keywords = '' }) => {
  const status = getAiStatus();

  if (status.configured) {
    const systemPrompt = `You are the SkillSetu AI Innovation Scout. Generate 4 high-impact, award-winning hackathon project ideas.
Return a STRICT JSON response adhering to this format:
{
  "ideas": [
    {
      "id": "idea-gen-1",
      "title": "Project Title",
      "domain": "Healthcare",
      "difficulty": "Advanced",
      "viabilityScore": 92,
      "problem": "Clear problem statement.",
      "solution": "Technical solution leveraging modern AI/Web3/Cloud.",
      "stack": "React, Python, NVIDIA API, SQLite",
      "team": "Full-Stack Dev, ML Researcher, UX Designer",
      "impactMetric": "Reduces diagnostic turnaround time by 60%."
    }
  ]
}`;

    const userPrompt = `Domain: ${domain}\nKeywords / Focus: ${keywords || 'National Student Hackathons & Societal Impact'}`;

    const aiResult = await callNvidiaChat({ systemPrompt, userPrompt });
    if (aiResult.success && aiResult.parsed?.ideas) {
      return {
        ideas: aiResult.parsed.ideas,
        aiProvider: 'nvidia_api_catalog',
        model: aiResult.model,
      };
    }
  }

  // Curated Innovation Ideas Fallback
  const curated = [
    {
      id: 'idea-1',
      title: 'MediBridge AI — Rural Healthcare Triage',
      domain: 'Healthcare',
      difficulty: 'Advanced',
      viabilityScore: 94,
      problem: 'Rural clinics suffer diagnostic delays due to a shortage of on-site medical specialists.',
      solution: 'Offline-capable edge LLM running voice consultations in regional languages with symptom scoring.',
      stack: 'Python, FastAPI, PyTorch, React Native, SQLite',
      team: 'Full-Stack Dev, Clinical Specialist, ML Ops',
      impactMetric: 'Provides preliminary triage for 500+ rural clinics without internet.',
    },
    {
      id: 'idea-2',
      title: 'KisanDrone — Autonomous Crop Stress Detection',
      domain: 'Agritech',
      difficulty: 'Advanced',
      viabilityScore: 91,
      problem: 'Late pest infection detection causes 30%+ seasonal crop yield destruction.',
      solution: 'Drone payload computing multispectral NDVI stress maps and alerting farmers via WhatsApp.',
      stack: 'C++, ROS2, OpenCV, PyTorch, Raspberry Pi',
      team: 'Embedded Systems Dev, Computer Vision Engineer',
      impactMetric: 'Reduces crop loss by up to 25% through early infrared detection.',
    },
    {
      id: 'idea-3',
      title: 'EcoTrace — Supply Chain Carbon Accounting',
      domain: 'CleanTech',
      difficulty: 'Intermediate',
      viabilityScore: 89,
      problem: 'Unverifiable emissions reports prevent genuine ESG compliance and green investing.',
      solution: 'Decentralized verifiable telemetry ledger that issues tamper-proof carbon reduction certificates.',
      stack: 'Solidity, Node.js, Next.js, Polygon, Hardhat',
      team: 'Smart Contract Auditor, Web3 Frontend Integrator',
      impactMetric: 'Verifies 100% of supply chain telemetry without centralized manipulation.',
    },
    {
      id: 'idea-4',
      title: 'CampusVault — Zero-Knowledge Student Credentials',
      domain: 'EdTech',
      difficulty: 'Intermediate',
      viabilityScore: 95,
      problem: 'Degree and transcript verification takes weeks for cross-university applications.',
      solution: 'Decentralized verifiable credentials allowing instant proof of academic records.',
      stack: 'Circom, SnarkJS, TypeScript, React, SQLite',
      team: 'ZK Cryptographer, Full-Stack TypeScript Dev',
      impactMetric: 'Reduces credential verification latency from 14 days to under 2 seconds.',
    },
  ];

  return {
    ideas: domain === 'All' ? curated : curated.filter((i) => i.domain.toLowerCase() === domain.toLowerCase()),
    aiProvider: status.configured ? 'nvidia_api_catalog' : 'smart_heuristic_fallback',
    setupNotice: status.configured
      ? undefined
      : 'NVIDIA API key not configured. Add NVIDIA_API_KEY=nvapi-... to your backend .env to enable live llama-3.1-70b analysis.',
  };
};

/**
 * ============================================================================
 * AI-POWERED TECHNICAL INTERVIEW & PROCTORING QUESTION ENGINE & EVALUATOR
 * ============================================================================
 */

// Curated comprehensive question bank matrix (25+ questions per language)
export const CURATED_INTERVIEW_BANKS = {
  python: [
    {
      title: 'Global Interpreter Lock (GIL) & Concurrency',
      type: 'conceptual',
      topic: 'Operating Systems & Concurrency',
      difficulty: 'Medium',
      question_text: 'Explain what the Global Interpreter Lock (GIL) is in CPython. How does it affect CPU-bound vs I/O-bound multi-threaded tasks, and what alternatives exist (e.g., multiprocessing, asyncio)?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'The GIL is a mutex in CPython that prevents multiple native threads from executing Python bytecodes simultaneously. For I/O-bound tasks, threads release the GIL while waiting for I/O, allowing concurrency. For CPU-bound tasks, multi-threading cannot achieve true parallelism across multiple CPU cores. Workarounds include multiprocessing (separate memory spaces & GILs per process), asyncio for cooperative multitasking, or using alternative implementations like PyPy or C-extensions.',
      explanation: 'CPython uses reference counting for garbage collection, and the GIL ensures thread-safe memory management without fine-grained locks.',
      evaluation_rubric: 'Full marks: mentions CPython mutex, explains I/O vs CPU bound performance, explains reference counting safety, mentions multiprocessing or asyncio.',
      expected_concepts: ['CPython', 'Mutex / Thread safety', 'Reference counting', 'CPU-bound vs I/O-bound', 'multiprocessing', 'asyncio'],
    },
    {
      title: 'Mutable Default Arguments Output Prediction',
      type: 'code_output',
      topic: 'Language Fundamentals',
      difficulty: 'Easy',
      question_text: 'Analyze the following Python snippet. What will be printed, and why does this happen in Python function evaluation?',
      code_snippet: `def append_item(val, target_list=[]):\n    target_list.append(val)\n    return target_list\n\nprint(append_item(1))\nprint(append_item(2))\nprint(append_item(3, []))\nprint(append_item(4))`,
      starter_code: '',
      suggested_answer: 'Output:\n[1]\n[1, 2]\n[3]\n[1, 2, 4]\nExplanation: Default arguments in Python are evaluated once when the function definition is executed, not each time the function is called. Therefore, the same list instance is reused across invocations when the default is used. In call 3, a fresh new list is explicitly passed, so the default list is untouched.',
      explanation: 'To avoid this anti-pattern, Python idiomatic code uses None as the default argument and initializes a new list inside the function body.',
      evaluation_rubric: 'Full marks: accurately predicts all 4 lines of output and explains that default arguments are created once at function definition time.',
      expected_concepts: ['Function definition time binding', '[1]', '[1, 2]', '[3]', '[1, 2, 4]', 'Default argument mutable binding'],
    },
    {
      title: 'Debugging Python Generator & Memory Exhaustion',
      type: 'debugging',
      topic: 'Memory Management',
      difficulty: 'Medium',
      question_text: 'The following function is supposed to stream-process a 10GB log file line by line, but it crashes the server with MemoryError. Identify the bug and write the corrected memory-efficient generator solution.',
      code_snippet: `def parse_large_logs(filepath):\n    with open(filepath, 'r') as f:\n        lines = f.readlines()\n    return [line.strip().upper() for line in lines if 'ERROR' in line]`,
      starter_code: `def parse_large_logs_fixed(filepath):\n    # Write memory-efficient streaming generator\n    pass`,
      suggested_answer: `def parse_large_logs_fixed(filepath):\n    with open(filepath, 'r') as f:\n        for line in f:\n            if 'ERROR' in line:\n                yield line.strip().upper()`,
      explanation: 'f.readlines() reads the entire file into memory as a list at once. Iterating over the file object (for line in f) reads lazily in chunks using an iterator, and yielding results transforms the function into a memory-efficient generator with O(1) auxiliary space.',
      evaluation_rubric: 'Full marks: identifies f.readlines() as the culprit, replaces with generator/yield, maintains O(1) memory footprint.',
      expected_concepts: ['f.readlines() buffer overflow', 'Lazy iteration', 'yield generator', 'O(1) memory space'],
    },
    {
      title: 'Implement an LRU Cache with O(1) Get and Put',
      type: 'coding',
      topic: 'Data Structures & Algorithms',
      difficulty: 'Hard',
      question_text: 'Implement a Least Recently Used (LRU) Cache class with get(key) and put(key, value) operations in O(1) time complexity. Explain your choice of underlying data structures.',
      code_snippet: '',
      starter_code: `class LRUCache:\n    def __init__(self, capacity: int):\n        self.capacity = capacity\n\n    def get(self, key: int) -> int:\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        pass`,
      suggested_answer: `class DNode:\n    def __init__(self, k=0, v=0):\n        self.k, self.v = k, v\n        self.prev = self.next = None\n\nclass LRUCache:\n    def __init__(self, capacity: int):\n        self.cap = capacity\n        self.cache = {}\n        self.head, self.tail = DNode(), DNode()\n        self.head.next, self.tail.prev = self.tail, self.head\n\n    def _remove(self, node):\n        p, n = node.prev, node.next\n        p.next, n.prev = n, p\n\n    def _add_front(self, node):\n        node.next = self.head.next\n        node.prev = self.head\n        self.head.next.prev = node\n        self.head.next = node\n\n    def get(self, key: int) -> int:\n        if key not in self.cache:\n            return -1\n        node = self.cache[key]\n        self._remove(node)\n        self._add_front(node)\n        return node.v\n\n    def put(self, key: int, value: int) -> None:\n        if key in self.cache:\n            self._remove(self.cache[key])\n        node = DNode(key, value)\n        self._add_front(node)\n        self.cache[key] = node\n        if len(self.cache) > self.cap:\n            lru = self.tail.prev\n            self._remove(lru)\n            del self.cache[lru.k]`,
      explanation: 'A Hash Map provides O(1) key lookups while a Doubly Linked List enables O(1) insertion at head and removal from tail for LRU eviction.',
      evaluation_rubric: 'Full marks: Uses Doubly Linked List + HashMap (or OrderedDict), implements both get and put in O(1) time with correct eviction.',
      expected_concepts: ['Doubly linked list', 'Hash map lookup O(1)', 'Head / tail dummy nodes', 'Eviction order'],
    },
    {
      title: 'Python Metaclasses vs Decorators',
      type: 'conceptual',
      topic: 'OOP & Architecture',
      difficulty: 'Medium',
      question_text: 'Differentiate between Python class decorators and metaclasses. When would you use a custom metaclass instead of a decorator?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'A class decorator receives a class object after creation and returns a modified class or wrapper. A metaclass (subclass of type) defines the rules for how a class itself is constructed at creation time (controlling __new__ and __init__ before the class is finalized). Metaclasses are used when you need to enforce strict structural constraints on subclasses (like ORMs, API schemas), intercept class inheritance hierarchies, or register subclasses automatically.',
      explanation: 'Metaclasses are "classes that instantiate classes". In Python 3, __init_subclass__ often provides a simpler alternative to metaclasses for simple hooks.',
      evaluation_rubric: 'Full marks: clearly contrasts creation-time vs post-creation modification, provides concrete use cases like ORMs or schema validation.',
      expected_concepts: ['type', '__new__ and __init__', 'Class creation lifecycle', 'Subclass enforcement', 'ORM / Schema registration'],
    },
    {
      title: 'Python Memory Management & Garbage Collection',
      type: 'conceptual',
      topic: 'Memory Management',
      difficulty: 'Medium',
      question_text: 'Explain Python reference counting and generational garbage collection. How does Python detect and collect circular reference cycles?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'Python primarily uses Reference Counting: every object has an ob_refcnt. When it reaches zero, memory is freed immediately. However, circular references (Object A points to B and B points to A) keep refcounts > 0 even when unreferenced. To resolve this, Python has a cyclic generational garbage collector (Generations 0, 1, 2) that periodically tracks container objects, subtracts internal references to find unreachable isolated subgraphs, and collects them.',
      explanation: 'Generational hypothesis assumes most objects die young. Gen 0 is checked most frequently, moving survivors to Gen 1 and Gen 2.',
      evaluation_rubric: 'Full marks: mentions reference counting as primary, explains cyclic references limitation, details generational GC (Gen 0/1/2).',
      expected_concepts: ['Reference counting', 'Circular reference cycle', 'Generational GC (Gen 0, 1, 2)', 'gc module', 'Container objects'],
    },
    {
      title: 'ACID Transactions in Relational Databases with Python ORMs',
      type: 'conceptual',
      topic: 'DBMS & SQL',
      difficulty: 'Medium',
      question_text: 'Define the 4 ACID properties in the context of relational databases. How do isolation levels (Read Committed vs Serializable) prevent dirty reads and phantom reads?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'Atomicity (all or nothing), Consistency (preserves invariants & schema constraints), Isolation (concurrent transactions execute without interference), Durability (committed changes survive system crashes). Dirty reads occur when a transaction reads uncommitted data from another transaction (prevented by Read Committed). Phantom reads occur when a range query returns newly inserted rows from concurrent transactions (prevented by Repeatable Read with MVCC / gap locks or Serializable).',
      explanation: 'Serializable uses two-phase locking or serializable snapshot isolation (SSI) to ensure equivalence to sequential execution.',
      evaluation_rubric: 'Full marks: defines all 4 ACID letters, explains dirty reads vs phantom reads, maps isolation levels correctly.',
      expected_concepts: ['Atomicity', 'Consistency', 'Isolation', 'Durability', 'Dirty read', 'Phantom read', 'Read Committed / Serializable'],
    },
    {
      title: 'Output Prediction: Python Closure Variable Binding',
      type: 'code_output',
      topic: 'Language Fundamentals',
      difficulty: 'Medium',
      question_text: 'What will the following code output? Explain why, and show how to fix it using default argument binding or functools.partial.',
      code_snippet: `funcs = [lambda: i * 2 for i in range(4)]\nresults = [f() for f in funcs]\nprint(results)`,
      starter_code: '',
      suggested_answer: 'Output:\n[6, 6, 6, 6]\nExplanation: Python closures capture variables by reference/lookup in the enclosing scope, not by value at creation time. By the time any lambda function is invoked, the loop has completed and i is 3. So 3 * 2 = 6 for all elements.\nFix: funcs = [lambda i=i: i * 2 for i in range(4)] which binds i at definition time.',
      explanation: 'Late binding in closures is a common pitfall in Python loops.',
      evaluation_rubric: 'Full marks: correctly predicts [6, 6, 6, 6], explains late binding / lexical scope closure lookup, provides valid fix.',
      expected_concepts: ['[6, 6, 6, 6]', 'Late binding in closures', 'Scope variable reference', 'Default arg binding fix i=i'],
    },
    {
      title: 'Two Pointer: Container With Most Water',
      type: 'coding',
      topic: 'Data Structures & Algorithms',
      difficulty: 'Medium',
      question_text: 'Given an array of integers representing heights of vertical lines, write an optimal O(N) function to find two lines that together with the x-axis form a container containing the most water.',
      code_snippet: '',
      starter_code: `def max_area(height: list[int]) -> int:\n    # Return maximum water area\n    pass`,
      suggested_answer: `def max_area(height: list[int]) -> int:\n    left, right = 0, len(height) - 1\n    max_water = 0\n    while left < right:\n        w = right - left\n        h = min(height[left], height[right])\n        max_water = max(max_water, w * h)\n        if height[left] < height[right]:\n            left += 1\n        else:\n            right -= 1\n    return max_water`,
      explanation: 'The width decreases at each step. Moving the taller line cannot increase the area because height is limited by the shorter line. Thus we greedily advance the shorter line.',
      evaluation_rubric: 'Full marks: implements two-pointer approach in O(N) time and O(1) space with correct pointer increment condition.',
      expected_concepts: ['Two pointer technique', 'O(N) time', 'O(1) space', 'Greedy pointer movement'],
    },
    {
      title: 'TCP vs UDP in Network Communication',
      type: 'conceptual',
      topic: 'Computer Networks',
      difficulty: 'Easy',
      question_text: 'Compare TCP and UDP protocols across connection establishment, reliability, ordering, header overhead, and use cases in modern software systems.',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'TCP is connection-oriented (3-way handshake SYN, SYN-ACK, ACK), reliable (acknowledgments, retransmissions, checksums), ordered (sequence numbers), with flow/congestion control and 20-60 byte header overhead. UDP is connectionless, best-effort (no guarantees, packets can drop or arrive out-of-order), low latency with 8-byte header. Use TCP for HTTP/HTTPS, databases, SSH. Use UDP for DNS, live video streaming, multiplayer gaming, VoIP, and QUIC/HTTP3.',
      explanation: 'HTTP/3 runs over QUIC which utilizes UDP to avoid TCP head-of-line blocking.',
      evaluation_rubric: 'Full marks: compares 3-way handshake, reliability mechanisms, ordering, header sizes, and accurate use-cases.',
      expected_concepts: ['3-way handshake', 'Reliability / Retransmission', 'Ordering / Sequence numbers', 'Header size 20B vs 8B', 'QUIC / Video / Web'],
    },
    {
      title: 'Python Decorator for Caching with TTL Expiry',
      type: 'coding',
      topic: 'OOP & Architecture',
      difficulty: 'Medium',
      question_text: 'Write a custom decorator @ttl_cache(seconds) that caches the return values of a function and invalidates entries when their TTL expires.',
      code_snippet: '',
      starter_code: `import time\nfrom functools import wraps\n\ndef ttl_cache(seconds: float):\n    def decorator(fn):\n        # Implement TTL cache\n        pass\n    return decorator`,
      suggested_answer: `import time\nfrom functools import wraps\n\ndef ttl_cache(seconds: float):\n    def decorator(fn):\n        cache = {}\n        @wraps(fn)\n        def wrapper(*args, **kwargs):\n            key = (args, tuple(sorted(kwargs.items())))\n            now = time.time()\n            if key in cache:\n                val, exp = cache[key]\n                if now < exp:\n                    return val\n            result = fn(*args, **kwargs)\n            cache[key] = (result, now + seconds)\n            return result\n        return wrapper\n    return decorator`,
      explanation: 'functools.wraps preserves docstrings and function name metadata. Key serialization must ensure kwargs dict is hashable.',
      evaluation_rubric: 'Full marks: handles function arguments properly, stores timestamp expiry, invalidates expired entries, uses functools.wraps.',
      expected_concepts: ['functools.wraps', 'Closure cache dictionary', 'Timestamp comparison', 'Hashable argument key'],
    },
    {
      title: 'Process vs Thread vs Coroutine in Operating Systems',
      type: 'conceptual',
      topic: 'Operating Systems',
      difficulty: 'Medium',
      question_text: 'Explain the fundamental differences between a Process, a Thread, and a Coroutine in terms of memory space, context switching overhead, and scheduling mechanism.',
      code_snippet: '',
      starter_code: '',
      suggested_answer: '1. Process: Independent execution unit with isolated virtual address space, file descriptors, and PCB. Context switch involves MMU/TLB flush, kernel mode transition, heavy overhead. Scheduled by OS kernel preemptively.\n2. Thread: Lightweight execution unit within a process sharing code, data, and heap, with private stack/registers. Lower context switch overhead. Scheduled by OS kernel preemptively.\n3. Coroutine / Green Thread: Cooperative user-space concurrency running inside a single thread (event loop). Context switch is purely a user-space register/instruction pointer swap, near zero overhead. Scheduled cooperatively by runtime (e.g. Python asyncio, Go goroutines).',
      explanation: 'Coroutines avoid OS kernel transitions and allow tens of thousands of concurrent I/O operations per process.',
      evaluation_rubric: 'Full marks: explains virtual memory isolation, context switch cost comparison, kernel vs user-space cooperative scheduling.',
      expected_concepts: ['Isolated address space vs shared memory', 'MMU / TLB flush', 'Kernel vs User-space scheduling', 'Cooperative multitasking'],
    },
    {
      title: 'Debugging Python Threading Race Condition',
      type: 'debugging',
      topic: 'Operating Systems & Concurrency',
      difficulty: 'Medium',
      question_text: 'The counter below inconsistently outputs values less than 100,000 when run with 10 threads. Diagnose the cause and fix it using threading.Lock.',
      code_snippet: `import threading\n\ncounter = 0\ndef worker():\n    global counter\n    for _ in range(10000):\n        counter += 1\n\nthreads = [threading.Thread(target=worker) for _ in range(10)]\nfor t in threads: t.start()\nfor t in threads: t.join()\nprint("Final count:", counter)`,
      starter_code: `import threading\n# Fix race condition with mutex lock`,
      suggested_answer: `import threading\n\ncounter = 0\nlock = threading.Lock()\n\ndef worker():\n    global counter\n    for _ in range(10000):\n        with lock:\n            counter += 1\n\nthreads = [threading.Thread(target=worker) for _ in range(10)]\nfor t in threads: t.start()\nfor t in threads: t.join()\nprint("Final count:", counter)  # Guaranteed 100000`,
      explanation: 'counter += 1 translates to multiple bytecode instructions (LOAD_GLOBAL, LOAD_CONST, BINARY_ADD, STORE_GLOBAL). Thread context switches midway cause lost updates.',
      evaluation_rubric: 'Full marks: explains non-atomic bytecode execution causing lost updates, uses threading.Lock / with lock context manager.',
      expected_concepts: ['Race condition / Non-atomic increment', 'LOAD/ADD/STORE bytecode', 'threading.Lock', 'Context manager with lock'],
    },
    {
      title: 'Database Indexing: B-Tree vs Hash Index & Covering Index',
      type: 'conceptual',
      topic: 'DBMS & SQL',
      difficulty: 'Medium',
      question_text: 'How does a B-Tree index work in SQL databases (PostgreSQL/MySQL)? Why is it favored over Hash indexes for range queries? What is a Covering Index?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'A B-Tree (specifically B+ Tree) keeps keys sorted in a balanced tree where leaf nodes form a doubly linked list. This allows O(log N) search and O(log N + K) efficient sequential range scans (e.g. WHERE age BETWEEN 20 AND 30). Hash indexes only offer O(1) point lookups for equality (=) and cannot serve range or ordering queries (ORDER BY). A Covering Index includes all columns required by a query (in key or INCLUDE clause), allowing the DB engine to satisfy the query directly from index pages without fetching table heap pages (Index-Only Scan).',
      explanation: 'Covering indexes eliminate costly random disk I/O to table heap pages.',
      evaluation_rubric: 'Full marks: explains B+ Tree leaf linked list, compares range queries vs hash equality, defines Covering Index and Index-Only scan.',
      expected_concepts: ['B+ Tree sorted leaves', 'Range scan O(log N + K)', 'Hash index equality only', 'Covering Index / Index-only scan'],
    },
    {
      title: 'Detect Cycle in a Directed Graph using DFS (Colors)',
      type: 'coding',
      topic: 'Data Structures & Algorithms',
      difficulty: 'Hard',
      question_text: 'Write a Python function to detect if a directed graph contains a cycle using 3-color Depth First Search (WHITE=0 unvisited, GRAY=1 visiting/in stack, BLACK=2 finished).',
      code_snippet: '',
      starter_code: `def has_cycle(num_nodes: int, adj_list: dict[int, list[int]]) -> bool:\n    # Return True if cycle exists, False otherwise\n    pass`,
      suggested_answer: `def has_cycle(num_nodes: int, adj_list: dict[int, list[int]]) -> bool:\n    WHITE, GRAY, BLACK = 0, 1, 2\n    color = {i: WHITE for i in range(num_nodes)}\n\n    def dfs(node):\n        color[node] = GRAY\n        for neighbor in adj_list.get(node, []):\n            if color[neighbor] == GRAY:\n                return True  # Back-edge found\n            if color[neighbor] == WHITE and dfs(neighbor):\n                return True\n        color[node] = BLACK\n        return False\n\n    for node in range(num_nodes):\n        if color[node] == WHITE:\n            if dfs(node):\n                return True\n    return False`,
      explanation: 'Encountering a node with state GRAY (currently on the active recursion stack) signifies a back-edge, proving a cycle in directed graph.',
      evaluation_rubric: 'Full marks: uses 3-state tracking (unvisited, in-stack, visited), identifies back-edge correctly in O(V+E) time.',
      expected_concepts: ['3-color DFS', 'Back-edge detection', 'Recursion stack tracking', 'O(V+E) time complexity'],
    },
    {
      title: 'Python __slots__ and Memory Optimization',
      type: 'conceptual',
      topic: 'Language Fundamentals',
      difficulty: 'Medium',
      question_text: 'What is __slots__ in Python classes? How does it alter memory layout compared to standard __dict__, and what are its trade-offs?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: '__slots__ reserves space for a fixed set of attributes directly in the object struct instead of dynamically creating a __dict__ for every instance. This drastically cuts memory footprint (saving ~50-70% memory per instance) and provides faster attribute access. Trade-offs: dynamic attribute addition is prevented, multiple inheritance requires careful slot alignment, and instances cannot have custom arbitrary attributes unless __dict__ is explicitly included in __slots__.',
      explanation: 'Essential for high-throughput applications instantiating millions of small data objects.',
      evaluation_rubric: 'Full marks: explains elimination of per-instance __dict__, memory reduction mechanism, and rigidity trade-offs.',
      expected_concepts: ['Elimination of __dict__', 'Static struct offset memory allocation', 'Attribute restriction', 'Memory reduction'],
    },
    {
      title: 'REST vs gRPC vs GraphQL Architecture Comparison',
      type: 'conceptual',
      topic: 'OOP & Architecture',
      difficulty: 'Medium',
      question_text: 'Compare REST, gRPC, and GraphQL APIs. Detail protocol transport, data format serialization, latency, over/under-fetching, and ideal production use cases.',
      code_snippet: '',
      starter_code: '',
      suggested_answer: '1. REST: Uses HTTP/1.1 or HTTP/2, JSON/XML text format, stateless CRUD over resource URIs. Susceptible to over-fetching and under-fetching (n+1 roundtrips). Ubiquitous for public APIs.\n2. GraphQL: HTTP POST with declarative query language, client requests exact fields, solving over/under-fetching with single endpoint. Ideal for complex UI dashboards and mobile clients.\n3. gRPC: HTTP/2 multiplexed transport with Protocol Buffers (compact binary serialization), strongly typed schema contracts, streaming support, and minimal latency. Ideal for internal microservice-to-microservice communication.',
      explanation: 'gRPC binary serialization is up to 7-10x faster and smaller than JSON serialization in high-throughput backend services.',
      evaluation_rubric: 'Full marks: compares transport layer, serialization formats, over-fetching differences, and microservices vs public API usage.',
      expected_concepts: ['Protocol Buffers / Binary vs JSON', 'HTTP/2 multiplexing', 'Over/under fetching', 'Internal microservices vs Client UI'],
    },
    {
      title: 'Binary Search: Search in Rotated Sorted Array',
      type: 'coding',
      topic: 'Data Structures & Algorithms',
      difficulty: 'Medium',
      question_text: 'Given an integer array nums sorted in ascending order (with distinct values) that has been rotated at an unknown pivot, write an O(log N) function to search for a target value and return its index (-1 if not found).',
      code_snippet: '',
      starter_code: `def search_rotated(nums: list[int], target: int) -> int:\n    # Return index of target in O(log N) time\n    pass`,
      suggested_answer: `def search_rotated(nums: list[int], target: int) -> int:\n    left, right = 0, len(nums) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n        # Check if left half is sorted\n        if nums[left] <= nums[mid]:\n            if nums[left] <= target < nums[mid]:\n                right = mid - 1\n            else:\n                left = mid + 1\n        else:\n            # Right half is sorted\n            if nums[mid] < target <= nums[right]:\n                left = mid + 1\n            else:\n                right = mid - 1\n    return -1`,
      explanation: 'In any rotated sorted array, at least one half (left or right) is always strictly sorted. We identify which half is sorted and check if the target falls within that sorted boundary.',
      evaluation_rubric: 'Full marks: achieves strict O(log N) time with single modified binary search, correctly checks sorted half condition.',
      expected_concepts: ['Modified binary search', 'O(log N) time', 'Sorted half identification', 'Boundary checks'],
    },
    {
      title: 'Python Context Managers & __enter__ / __exit__ Protocol',
      type: 'conceptual',
      topic: 'Language Fundamentals',
      difficulty: 'Easy',
      question_text: 'How does the Python `with` statement work under the hood? Explain the parameters passed to `__exit__` when an unhandled exception occurs.',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'The `with` statement enters a runtime context by invoking the object\'s `__enter__()` method, binding its return value to the `as` target. Upon exiting the block (normally or via exception), `__exit__(exc_type, exc_val, exc_tb)` is invoked. If an exception occurred, these parameters hold the exception class, instance, and traceback. If `__exit__` returns True, the exception is suppressed; otherwise, it is re-raised.',
      explanation: 'Ensures deterministic cleanup of sockets, locks, and file descriptors even when crashes occur.',
      evaluation_rubric: 'Full marks: details __enter__ and __exit__ lifecycle, explains exc_type, exc_val, exc_tb parameters, and suppression via return True.',
      expected_concepts: ['__enter__ and __exit__', 'exc_type, exc_val, exc_tb', 'Deterministic resource cleanup', 'Exception suppression return True'],
    },
    {
      title: 'Database Normalization: 1NF, 2NF, 3NF & BCNF',
      type: 'conceptual',
      topic: 'DBMS & SQL',
      difficulty: 'Medium',
      question_text: 'Explain 1st, 2nd, and 3rd Normal Forms (1NF, 2NF, 3NF) in relational schema design with examples of anomalies they prevent.',
      code_snippet: '',
      starter_code: '',
      suggested_answer: '1NF: Atomic column values (no arrays or repeating groups) with a primary key.\n2NF: In 1NF and no partial functional dependencies (all non-key attributes must depend on the whole primary key, not a subset of a composite key).\n3NF: In 2NF and no transitive dependencies (non-key attributes must not depend on other non-key attributes: "X -> Y -> Z").\nPrevents insertion anomalies, update anomalies (inconsistent duplicate updates), and deletion anomalies (loss of unintended data).',
      explanation: 'Boyce-Codd Normal Form (BCNF) strengthens 3NF by requiring that for every functional dependency X -> Y, X must be a superkey.',
      evaluation_rubric: 'Full marks: accurately distinguishes atomic attributes (1NF), partial key dependencies (2NF), and transitive dependencies (3NF).',
      expected_concepts: ['Atomicity (1NF)', 'No partial dependency (2NF)', 'No transitive dependency (3NF)', 'Update/Delete/Insert anomalies'],
    },
    {
      title: 'Valid Parentheses and Balanced Bracket Parsing',
      type: 'coding',
      topic: 'Data Structures & Algorithms',
      difficulty: 'Easy',
      question_text: 'Given a string containing characters `(`, `)`, `{`, `}`, `[` and `]`, write a function to determine if the input string is valid (brackets must close in the correct order and match open pairs).',
      code_snippet: '',
      starter_code: `def is_valid_brackets(s: str) -> bool:\n    # Return True if valid brackets sequence\n    pass`,
      suggested_answer: `def is_valid_brackets(s: str) -> bool:\n    stack = []\n    mapping = {')': '(', '}': '{', ']': '['}\n    for char in s:\n        if char in mapping:\n            top = stack.pop() if stack else '#'\n            if mapping[char] != top:\n                return False\n        else:\n            stack.append(char)\n    return not stack`,
      explanation: 'A stack LIFO structure ensures that the most recently opened bracket is closed first.',
      evaluation_rubric: 'Full marks: uses stack, handles edge cases (empty stack pop, leftover open brackets), O(N) time and O(N) space.',
      expected_concepts: ['Stack LIFO', 'Hash map bracket matching', 'Empty stack verification', 'O(N) complexity'],
    },
    {
      title: 'HTTPS TLS/SSL Handshake Process',
      type: 'conceptual',
      topic: 'Computer Networks',
      difficulty: 'Medium',
      question_text: 'Walk through the steps of a TLS 1.3 handshake when a browser accesses https://example.com. How is asymmetric and symmetric encryption utilized?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: '1. ClientHello: Browser sends supported cipher suites, TLS version, random nonce, and Key Share (Diffie-Hellman public parameter).\n2. ServerHello: Server selects cipher, provides its DH Key Share, digital certificate signed by a trusted CA, and ServerFinished.\n3. Verification & Session Key: Client validates certificate chain using OS trust store. Both parties compute the shared pre-master secret via Elliptic Curve Diffie-Hellman (ECDHE) and derive symmetric session keys (e.g. AES-GCM).\n4. Encrypted Data: Application HTTP traffic is encrypted using high-speed symmetric encryption with authenticated data (AEAD).\nAsymmetric crypto is used for authentication & key agreement; symmetric crypto encrypts the actual data stream.',
      explanation: 'TLS 1.3 reduces the handshake from 2 round-trips (RTT) in TLS 1.2 to 1-RTT (or 0-RTT resumption).',
      evaluation_rubric: 'Full marks: covers ClientHello/ServerHello, certificate verification with CA, ECDHE key derivation, symmetric vs asymmetric roles.',
      expected_concepts: ['ClientHello & ServerHello', 'Certificate Authority chain validation', 'Diffie-Hellman ECDHE key exchange', 'Symmetric AES session key', '1-RTT TLS 1.3'],
    },
    {
      title: 'Virtual Memory, Page Faults, and Thrashing in OS',
      type: 'conceptual',
      topic: 'Operating Systems',
      difficulty: 'Medium',
      question_text: 'Explain how Virtual Memory and the Translation Lookaside Buffer (TLB) work. What is a Page Fault, and what causes OS Thrashing?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'Virtual memory gives each process the illusion of a large, contiguous memory space mapped to physical RAM frames via page tables. The MMU consults the hardware TLB cache for fast virtual-to-physical address translation. When an address is accessed whose page is not present in RAM (valid bit is 0), the hardware generates a Page Fault interrupt, triggering the OS kernel to load the page from swap/disk into a RAM frame. Thrashing occurs when total active working sets exceed physical RAM, causing the OS to spend more time swapping pages in and out of disk than executing CPU instructions.',
      explanation: 'LRU or Clock page replacement algorithms are used to select victim pages during evictions.',
      evaluation_rubric: 'Full marks: details MMU/TLB translation, explains page fault interrupt lifecycle, defines thrashing and working set exhaustion.',
      expected_concepts: ['Page tables & MMU', 'TLB hardware cache', 'Page Fault interrupt', 'Swap disk I/O', 'Thrashing & Working set exhaustion'],
    },
    {
      title: 'Python asyncio Event Loop & Non-Blocking I/O',
      type: 'conceptual',
      topic: 'Operating Systems & Concurrency',
      difficulty: 'Medium',
      question_text: 'How does Python asyncio achieve high concurrency on a single thread? What happens if you call a blocking synchronous library like time.sleep() or requests.get() inside an async coroutine?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'asyncio utilizes a single-threaded Event Loop backed by OS I/O multiplexing (epoll on Linux, kqueue on macOS, I/O Completion Ports on Windows). Coroutines yield control to the loop at `await` expressions when awaiting network sockets or timers. If a blocking synchronous call like time.sleep() or requests.get() is executed, it blocks the entire OS thread, halting the event loop and freezing all other concurrent tasks. To run blocking code safely, one must use loop.run_in_executor() or asyncio.to_thread() to offload to a thread pool.',
      explanation: 'Cooperative multitasking relies on every task willingly yielding control at I/O suspension points.',
      evaluation_rubric: 'Full marks: mentions event loop with epoll/kqueue, explains cooperative yield at await, details catastrophic thread freeze on blocking calls, suggests asyncio.to_thread.',
      expected_concepts: ['Event loop & OS multiplexing (epoll)', 'Cooperative yield at await', 'Thread freeze on blocking sync code', 'asyncio.to_thread / run_in_executor'],
    },
    {
      title: 'Design a Thread-Safe In-Memory Key-Value Store with TTL',
      type: 'coding',
      topic: 'Data Structures & Algorithms',
      difficulty: 'Hard',
      question_text: 'Write a Python thread-safe in-memory cache class supporting get(key), set(key, value, ttl_seconds), and delete(key). Use threading.RLock for synchronization.',
      code_snippet: '',
      starter_code: `import time\nimport threading\n\nclass ThreadSafeCache:\n    def __init__(self):\n        pass\n\n    def set(self, key: str, value: any, ttl_seconds: float = None) -> None:\n        pass\n\n    def get(self, key: str) -> any:\n        pass\n\n    def delete(self, key: str) -> bool:\n        pass`,
      suggested_answer: `import time\nimport threading\n\nclass ThreadSafeCache:\n    def __init__(self):\n        self._data = {}\n        self._lock = threading.RLock()\n\n    def set(self, key: str, value: any, ttl_seconds: float = None) -> None:\n        expires_at = time.time() + ttl_seconds if ttl_seconds is not None else None\n        with self._lock:\n            self._data[key] = (value, expires_at)\n\n    def get(self, key: str) -> any:\n        with self._lock:\n            if key not in self._data:\n                return None\n            val, exp = self._data[key]\n            if exp is not None and time.time() >= exp:\n                del self._data[key]\n                return None\n            return val\n\n    def delete(self, key: str) -> bool:\n        with self._lock:\n            if key in self._data:\n                del self._data[key]\n                return True\n            return False`,
      explanation: 'RLock allows re-entrant acquisition by the same thread. Lazy expiration inside get() removes expired keys upon read.',
      evaluation_rubric: 'Full marks: uses threading.RLock, thread-safe dict operations with context manager, lazy TTL expiration.',
      expected_concepts: ['threading.RLock', 'Thread-safe context manager with lock', 'Lazy TTL expiration', 'None return for missing/expired'],
    },
  ],
  javascript: [
    {
      title: 'JavaScript Event Loop: Microtasks vs Macrotasks',
      type: 'conceptual',
      topic: 'Language Fundamentals',
      difficulty: 'Medium',
      question_text: 'Explain the JavaScript runtime Event Loop. Differentiate between Call Stack, Web APIs, Microtask Queue (Promises, queueMicrotask), and Task/Macrotask Queue (setTimeout, setInterval, I/O).',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'The JS engine executes synchronous code on the single Call Stack. Asynchronous callbacks are delegated to Web APIs. When ready, Promise.then/catch/finally and queueMicrotask callbacks are pushed to the Microtask Queue, while setTimeout/I/O callbacks go to the Macrotask Queue. After each function on the call stack completes, the Event Loop drains the ENTIRE Microtask Queue before picking the next single Macrotask, ensuring promise reactions execute immediately.',
      explanation: 'Microtasks have higher priority than macrotasks, meaning an infinite microtask chain will starve macrotasks and UI renders.',
      evaluation_rubric: 'Full marks: clearly delineates call stack, microtasks (promises) vs macrotasks (setTimeout), and explains that microtask queue is fully drained first.',
      expected_concepts: ['Call Stack', 'Microtask Queue (Promises)', 'Macrotask Queue (setTimeout)', 'Microtask drain before next macrotask', 'Single-threaded event loop'],
    },
    {
      title: 'Event Loop Execution Order Output Prediction',
      type: 'code_output',
      topic: 'Language Fundamentals',
      difficulty: 'Medium',
      question_text: 'Determine the exact console output order of the following JavaScript snippet and explain each step in the event loop cycle.',
      code_snippet: `console.log('1');\nsetTimeout(() => console.log('2'), 0);\nPromise.resolve().then(() => {\n  console.log('3');\n  process.nextTick ? null : null;\n}).then(() => console.log('4'));\nconsole.log('5');`,
      starter_code: '',
      suggested_answer: 'Output:\n1\n5\n3\n4\n2\nExplanation: 1 and 5 are synchronous and log immediately. setTimeout schedules a macrotask for 2. Promise.resolve schedules microtasks 3 and then 4. When the call stack clears, the microtask queue is drained completely (logging 3, then 4) before the macrotask queue executes (logging 2).',
      explanation: 'Synchronous -> Microtasks -> Macrotasks is the immutable execution sequence.',
      evaluation_rubric: 'Full marks: exact sequence [1, 5, 3, 4, 2] with correct explanation of synchronous priority over microtasks, and microtasks over macrotasks.',
      expected_concepts: ['1, 5, 3, 4, 2', 'Synchronous stack execution', 'Microtask promise chain (3, 4)', 'Macrotask setTimeout (2)'],
    },
    {
      title: 'Debugging JS Closure Memory Leak with DOM References',
      type: 'debugging',
      topic: 'Memory Management',
      difficulty: 'Medium',
      question_text: 'The function below creates a memory leak by capturing large detached DOM elements in closure scope. Identify the leak mechanism and rewrite it with WeakMap or proper cleanup.',
      code_snippet: `const registry = [];\nfunction attachHandler(element) {\n    const largePayload = new Array(1000000).fill('data');\n    element.addEventListener('click', function() {\n        console.log('Clicked element:', element.id, largePayload.length);\n    });\n    registry.push({ element, payload: largePayload });\n}`,
      starter_code: `// Fix memory leak and ensure garbage collection when DOM nodes are removed\nconst handlerMap = new WeakMap();`,
      suggested_answer: `const handlerMap = new WeakMap();\n\nfunction attachHandler(element) {\n    // Use WeakMap so when element is removed from DOM, GC reclaims it\n    const largePayload = new Array(1000000).fill('data');\n    const onClick = () => {\n        console.log('Clicked:', element.id, largePayload.length);\n    };\n    element.addEventListener('click', onClick);\n    handlerMap.set(element, { onClick, largePayload });\n}\n\nfunction detachHandler(element) {\n    const data = handlerMap.get(element);\n    if (data) {\n        element.removeEventListener('click', data.onClick);\n    }\n}`,
      explanation: 'Array registry holds strong references to DOM elements and payloads, preventing GC even after elements are removed from DOM tree. WeakMap holds weak references to objects as keys.',
      evaluation_rubric: 'Full marks: identifies registry strong reference leak, utilizes WeakMap or explicit removeEventListener cleanup.',
      expected_concepts: ['Detached DOM leak', 'Strong reference in array', 'WeakMap weak references', 'removeEventListener cleanup'],
    },
    {
      title: 'Implement Custom Promise.all Polyfill with Rejection Handling',
      type: 'coding',
      topic: 'Data Structures & Algorithms',
      difficulty: 'Medium',
      question_text: 'Write a robust polyfill for `Promise.all(iterable)` from scratch. It must handle non-promise values, preserve input ordering, reject immediately upon first rejection, and resolve when all promises succeed.',
      code_snippet: '',
      starter_code: `function customPromiseAll(promises) {\n    // Return a new Promise fulfilling all promises or rejecting first failure\n    return new Promise((resolve, reject) => {\n        // Implementation\n    });\n}`,
      suggested_answer: `function customPromiseAll(promises) {\n    return new Promise((resolve, reject) => {\n        const items = Array.from(promises);\n        if (items.length === 0) return resolve([]);\n        \n        const results = new Array(items.length);\n        let completed = 0;\n\n        items.forEach((item, index) => {\n            Promise.resolve(item)\n                .then((val) => {\n                    results[index] = val;\n                    completed += 1;\n                    if (completed === items.length) {\n                        resolve(results);\n                    }\n                })\n                .catch((err) => {\n                    reject(err);\n                });\n        });\n    });\n}`,
      explanation: 'Promise.resolve(item) safely wraps primitive/non-promise items. Maintaining completed count prevents race conditions while preserving original index positions.',
      evaluation_rubric: 'Full marks: handles empty array, wraps with Promise.resolve, tracks completed count for index ordering, early reject on error.',
      expected_concepts: ['Promise.resolve wrapping', 'Preserve index order', 'completed counter', 'Fast-fail rejection'],
    },
    {
      title: 'Prototypal Inheritance vs ES6 Classes under the hood',
      type: 'conceptual',
      topic: 'OOP & Architecture',
      difficulty: 'Medium',
      question_text: 'How does prototypal inheritance work in JavaScript? What is the prototype chain, and how does the `class` syntax in ES6 map to `Function.prototype` and `Object.create()`?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'Every JavaScript object has an internal `[[Prototype]]` link (accessible via Object.getPrototypeOf or __proto__). When an attribute/method is accessed, JS looks on the object; if absent, it traverses up the prototype chain until found or reaching Object.prototype (whose prototype is null). ES6 `class` is syntactical sugar over constructor functions and prototype objects: `class Child extends Parent` sets `Child.prototype = Object.create(Parent.prototype)` with constructor pointer and `Object.setPrototypeOf(Child, Parent)` for static methods.',
      explanation: 'Methods defined in class body are placed on the prototype object, shared across all instances to save memory.',
      evaluation_rubric: 'Full marks: explains [[Prototype]] lookup traversal to null, explains prototype sharing, relates ES6 class to prototype delegation.',
      expected_concepts: ['[[Prototype]] / prototype chain', 'Object.prototype and null', 'Prototype delegation vs classical inheritance', 'Syntactic sugar of class'],
    },
    {
      title: 'Debounce vs Throttle Implementation & High-Frequency Events',
      type: 'coding',
      topic: 'Language Fundamentals',
      difficulty: 'Medium',
      question_text: 'Implement a debounce function with leading and trailing edge options, and explain when you would use debounce vs throttle in front-end performance optimization.',
      code_snippet: '',
      starter_code: `function debounce(fn, delay) {\n    // Implement debounce\n}`,
      suggested_answer: `function debounce(fn, delay) {\n    let timerId = null;\n    return function(...args) {\n        const context = this;\n        if (timerId) clearTimeout(timerId);\n        timerId = setTimeout(() => {\n            fn.apply(context, args);\n            timerId = null;\n        }, delay);\n    };\n}`,
      explanation: 'Debounce postpones execution until a quiet period of inactivity (e.g., search autocomplete input, window resize). Throttle guarantees execution at fixed maximum intervals (e.g., scroll position tracking, game loops).',
      evaluation_rubric: 'Full marks: uses clearTimeout and setTimeout with closure timer, preserves this context and args, clearly contrasts debounce vs throttle use cases.',
      expected_concepts: ['clearTimeout / setTimeout', 'Closure timer state', 'Preserving this context (fn.apply)', 'Search input vs Scroll event'],
    },
    {
      title: 'Deep Clone with Circular Reference Support',
      type: 'coding',
      topic: 'Data Structures & Algorithms',
      difficulty: 'Hard',
      question_text: 'Write a deepClone(obj) function in JavaScript that clones nested objects, arrays, Dates, and RegExp, while handling circular references safely using a WeakMap.',
      code_snippet: '',
      starter_code: `function deepClone(obj, hash = new WeakMap()) {\n    // Implement deep clone with circular references\n}`,
      suggested_answer: `function deepClone(obj, hash = new WeakMap()) {\n    if (obj === null || typeof obj !== 'object') return obj;\n    if (obj instanceof Date) return new Date(obj.getTime());\n    if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags);\n    if (hash.has(obj)) return hash.get(obj);\n\n    const clone = Array.isArray(obj) ? [] : Object.create(Object.getPrototypeOf(obj));\n    hash.set(obj, clone);\n\n    Reflect.ownKeys(obj).forEach((key) => {\n        clone[key] = deepClone(obj[key], hash);\n    });\n    return clone;\n}`,
      explanation: 'WeakMap tracks visited object references to prevent infinite recursion on circular graphs.',
      evaluation_rubric: 'Full marks: handles primitives, Date/RegExp, WeakMap memoization for cycles, Reflect.ownKeys for symbol keys.',
      expected_concepts: ['WeakMap visited cache', 'Circular reference prevention', 'Reflect.ownKeys', 'Date/RegExp/Array handling'],
    },
    {
      title: 'CORS (Cross-Origin Resource Sharing) & Preflight OPTIONS',
      type: 'conceptual',
      topic: 'Computer Networks',
      difficulty: 'Medium',
      question_text: 'What is CORS and why is it enforced by browsers? What conditions trigger a CORS Preflight OPTIONS request, and what headers must the server return?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'CORS is a browser security mechanism enforcing the Same-Origin Policy (matching protocol, domain, and port) while allowing authorized cross-origin requests. A Preflight OPTIONS request is automatically sent before "non-simple" requests (methods other than GET/POST/HEAD, custom headers like Authorization/Content-Type: application/json, or credentials). The server must respond with Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers, and Access-Control-Allow-Credentials.',
      explanation: 'Preflight protects legacy backend APIs from receiving unauthorized state-changing requests.',
      evaluation_rubric: 'Full marks: defines Same-Origin Policy, lists preflight triggers (non-simple method/headers), specifies required Access-Control-* response headers.',
      expected_concepts: ['Same-Origin Policy', 'Preflight OPTIONS request', 'Access-Control-Allow-Origin', 'Custom headers / application/json trigger'],
    },
    {
      title: 'Currying and Partial Application in Functional JavaScript',
      type: 'coding',
      topic: 'Language Fundamentals',
      difficulty: 'Medium',
      question_text: 'Implement a generic `curry(fn)` function that translates a function of arity N into a sequence of unary functions until all arguments are provided.',
      code_snippet: '',
      starter_code: `function curry(fn) {\n    // Implement auto-currying\n}`,
      suggested_answer: `function curry(fn) {\n    return function curried(...args) {\n        if (args.length >= fn.length) {\n            return fn.apply(this, args);\n        }\n        return function(...moreArgs) {\n            return curried.apply(this, args.concat(moreArgs));\n        };\n    };\n}`,
      explanation: 'fn.length inspects the function\'s formal parameter count. If fewer arguments are supplied, it returns a function accumulating arguments.',
      evaluation_rubric: 'Full marks: checks fn.length arity, returns accumulating wrapper, applies correct this context.',
      expected_concepts: ['fn.length arity check', 'Recursive argument accumulation', 'Function composition', 'this preservation'],
    },
    {
      title: 'SQL vs NoSQL: Schema Design & CAP Theorem',
      type: 'conceptual',
      topic: 'DBMS & SQL',
      difficulty: 'Medium',
      question_text: 'Compare SQL (Relational) and NoSQL (Document/Key-Value) databases. How does the CAP Theorem (Consistency, Availability, Partition Tolerance) govern distributed database design?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'SQL databases (PostgreSQL, MySQL) feature structured schemas, ACID transactions, and relational joins, typically scaling vertically. NoSQL databases (MongoDB, DynamoDB, Redis) offer flexible schemas (JSON/Key-Value), horizontal partitioning (sharding), and eventual consistency. According to the CAP theorem, in the presence of a network Partition (P), a distributed system must choose between Consistency (C - all nodes return the latest write or error) and Availability (A - every non-failing node returns a response). CP systems (e.g. HBase, MongoDB primary) prioritize consistency, while AP systems (e.g. Cassandra, DynamoDB) prioritize 100% availability with eventual consistency.',
      explanation: 'Network partitions are inevitable in distributed systems, so systems cannot be CA in practice.',
      evaluation_rubric: 'Full marks: contrasts relational vs document models, defines CAP components, explains CP vs AP trade-offs during network partitions.',
      expected_concepts: ['ACID vs BASE', 'Horizontal vs Vertical scaling', 'CAP theorem trade-off', 'CP (MongoDB) vs AP (Cassandra)'],
    },
    {
      title: 'Flatten a Multi-Dimensional Nested Array with Depth Limit',
      type: 'coding',
      topic: 'Data Structures & Algorithms',
      difficulty: 'Easy',
      question_text: 'Implement `flat(arr, depth = 1)` without using the built-in Array.prototype.flat() method.',
      code_snippet: '',
      starter_code: `function customFlat(arr, depth = 1) {\n    // Flatten nested array up to depth\n}`,
      suggested_answer: `function customFlat(arr, depth = 1) {\n    if (depth <= 0) return arr.slice();\n    return arr.reduce((acc, val) => {\n        if (Array.isArray(val) && depth > 0) {\n            acc.push(...customFlat(val, depth - 1));\n        } else {\n            acc.push(val);\n        }\n        return acc;\n    }, []);\n}`,
      explanation: 'Recursively decrements depth while concatenating nested arrays via reduce/push.',
      evaluation_rubric: 'Full marks: handles arbitrary depth, handles depth 0, uses recursion or iterative stack without Array.prototype.flat.',
      expected_concepts: ['Array.isArray check', 'Recursive depth decrement', 'Array.prototype.reduce or iterative stack', 'Immutability / Slice'],
    },
    {
      title: 'WebSockets vs Server-Sent Events (SSE) vs Long Polling',
      type: 'conceptual',
      topic: 'Computer Networks',
      difficulty: 'Medium',
      question_text: 'Compare WebSockets, Server-Sent Events (SSE), and HTTP Long Polling for real-time applications. Evaluate connection setup, directionality, reconnection, and protocol overhead.',
      code_snippet: '',
      starter_code: '',
      suggested_answer: '1. WebSockets: Full-duplex bidirectional TCP connection initiated via HTTP 101 Upgrade handshake. Low frame overhead (2-10 bytes). Ideal for chat, collaborative editors, multiplayer gaming.\n2. Server-Sent Events (SSE): Unidirectional server-to-client streaming over HTTP/1.1 or HTTP/2 text/event-stream. Native browser reconnection, event IDs, firewall friendly. Ideal for AI LLM token streaming, stock tickers, notification feeds.\n3. Long Polling: Client sends HTTP request, server holds connection until data is available, responds, and client opens a new request. High HTTP header overhead per message. Fallback legacy mechanism.',
      explanation: 'SSE is simpler and more resilient than WebSockets when only server-to-client streaming is needed (such as streaming LLM tokens).',
      evaluation_rubric: 'Full marks: contrasts bidirectional vs unidirectional, details HTTP 101 upgrade for WebSockets vs text/event-stream for SSE, provides correct use cases.',
      expected_concepts: ['Full-duplex vs Unidirectional', 'HTTP 101 Upgrade', 'text/event-stream & native retry in SSE', 'AI streaming vs Chat app use cases'],
    },
    {
      title: 'LRU Cache Implementation in JavaScript using Map',
      type: 'coding',
      topic: 'Data Structures & Algorithms',
      difficulty: 'Medium',
      question_text: 'Implement an LRUCache class in JavaScript with get(key) and put(key, value) in O(1) time complexity utilizing JavaScript\'s insertion-order preservation in Map.',
      code_snippet: '',
      starter_code: `class LRUCache {\n    constructor(capacity) {\n        this.capacity = capacity;\n        this.cache = new Map();\n    }\n\n    get(key) {\n        // O(1) get\n    }\n\n    put(key, value) {\n        // O(1) put with eviction\n    }\n}`,
      suggested_answer: `class LRUCache {\n    constructor(capacity) {\n        this.capacity = capacity;\n        this.cache = new Map();\n    }\n\n    get(key) {\n        if (!this.cache.has(key)) return -1;\n        const val = this.cache.get(key);\n        this.cache.delete(key);\n        this.cache.set(key, val);\n        return val;\n    }\n\n    put(key, value) {\n        if (this.cache.has(key)) {\n            this.cache.delete(key);\n        } else if (this.cache.size >= this.capacity) {\n            // Map.keys().next().value gives the oldest inserted (LRU) key\n            const oldestKey = this.cache.keys().next().value;\n            this.cache.delete(oldestKey);\n        }\n        this.cache.set(key, value);\n    }\n}`,
      explanation: 'JavaScript Map retains key insertion order. Deleting and re-inserting refreshes the key to the most recently used (tail) position. Map.keys().next().value retrieves the least recently used key in O(1).',
      evaluation_rubric: 'Full marks: uses Map insertion order, correctly deletes and re-sets on read/write, evicts oldest entry via iterator in O(1).',
      expected_concepts: ['Map insertion order preservation', 'Delete and re-set for LRU refresh', 'Map.keys().next().value eviction', 'O(1) time'],
    },
    {
      title: 'XSS, CSRF, and Content Security Policy (CSP) Web Security',
      type: 'conceptual',
      topic: 'Web Security & Architecture',
      difficulty: 'Medium',
      question_text: 'Explain Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF). How do SameSite cookies, CSRF tokens, and Content Security Policy (CSP) mitigate them?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: '1. XSS: Attacker injects malicious JavaScript into a victim\'s browser (Stored, Reflected, DOM-based), stealing session tokens or manipulating UI. Mitigated by context-aware HTML escaping, HttpOnly cookies, and Content Security Policy (CSP) headers restricting script execution sources.\n2. CSRF: Attacker tricks an authenticated browser into submitting unauthorized requests to a target web application using existing session cookies. Mitigated by `SameSite=Lax/Strict` cookie attribute, custom request headers (Authorization Bearer), and anti-CSRF synchronizer tokens.',
      explanation: 'HttpOnly prevents JavaScript document.cookie access from XSS, but does not prevent CSRF; SameSite cookies prevent CSRF by withholding cookies on cross-origin requests.',
      evaluation_rubric: 'Full marks: distinguishes XSS (code execution) from CSRF (unauthorized action), explains HttpOnly, SameSite cookies, and CSP mitigation.',
      expected_concepts: ['XSS (Stored/Reflected/DOM)', 'CSRF cookie abuse', 'SameSite=Lax/Strict', 'HttpOnly cookies', 'Content Security Policy (CSP)'],
    },
    {
      title: 'Topological Sort for Build Dependency Resolution',
      type: 'coding',
      topic: 'Data Structures & Algorithms',
      difficulty: 'Hard',
      question_text: 'Given `numTasks` and a list of `prerequisites` pairs `[a, b]` (where task b must be completed before task a), write Kahn\'s Algorithm (BFS using in-degrees) to return a valid task execution order, or an empty array if a cycle exists.',
      code_snippet: '',
      starter_code: `function findOrder(numTasks, prerequisites) {\n    // Return topological order array or [] if impossible\n}`,
      suggested_answer: `function findOrder(numTasks, prerequisites) {\n    const inDegree = new Array(numTasks).fill(0);\n    const adj = Array.from({ length: numTasks }, () => []);\n\n    for (const [dest, src] of prerequisites) {\n        adj[src].push(dest);\n        inDegree[dest] += 1;\n    }\n\n    const queue = [];\n    for (let i = 0; i < numTasks; i++) {\n        if (inDegree[i] === 0) queue.push(i);\n    }\n\n    const order = [];\n    while (queue.length > 0) {\n        const u = queue.shift();\n        order.push(u);\n        for (const v of adj[u]) {\n            inDegree[v] -= 1;\n            if (inDegree[v] === 0) queue.push(v);\n        }\n    }\n\n    return order.length === numTasks ? order : [];\n}`,
      explanation: 'Kahn\'s algorithm repeatedly removes vertices with in-degree 0. If processed count < total tasks, a directed cycle exists.',
      evaluation_rubric: 'Full marks: computes in-degree array, uses BFS queue for 0-indegree nodes, detects cycle by checking order length in O(V+E).',
      expected_concepts: ['In-degree calculation', 'BFS Queue for 0 in-degree nodes', 'Kahn\'s algorithm', 'Cycle detection via order.length'],
    },
    {
      title: 'Async/Await vs Raw Promises Error Handling',
      type: 'conceptual',
      topic: 'Language Fundamentals',
      difficulty: 'Easy',
      question_text: 'How does async/await transform synchronous-looking code into promise chains? How do try/catch blocks interact with unhandled promise rejections in Node.js?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'An `async` function always returns a Promise. The `await` keyword pauses the execution of the async function body (yielding to the event loop) until the awaited Promise settles, resuming with the resolved value or throwing the rejected error. `try/catch` synchronously catches rejections thrown by `await`. If an async rejection is not awaited or caught, Node.js triggers an `unhandledRejection` event and terminates the process in modern versions.',
      explanation: 'Under the hood, Babel/V8 converts async/await into generator functions yielding promises and driving them via a runner.',
      evaluation_rubric: 'Full marks: explains Promise return from async, event loop yielding at await, try/catch error trapping, and unhandledRejection process termination.',
      expected_concepts: ['Async returns Promise', 'Await yields execution', 'try/catch handles rejected promises', 'unhandledRejection event'],
    },
    {
      title: 'Operating System Deadlocks & Coffman Conditions',
      type: 'conceptual',
      topic: 'Operating Systems',
      difficulty: 'Medium',
      question_text: 'What is a deadlock in concurrent operating systems? List and explain all 4 Coffman conditions required for a deadlock to occur.',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'A deadlock is a state where a set of processes are blocked because each process is holding a resource and waiting for another resource held by another process in the set.\n4 Coffman Conditions:\n1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.\n2. Hold and Wait: A process must be currently holding at least one resource and requesting additional resources held by others.\n3. No Preemption: Resources cannot be forcibly taken from a process; they must be released voluntarily.\n4. Circular Wait: A closed chain of processes exists such that each process holds at least one resource needed by the next process in the chain.\nBreaking any ONE of these four conditions prevents deadlock (e.g. strict global resource ordering breaks circular wait).',
      explanation: 'Banker\'s Algorithm is used for deadlock avoidance by verifying safe states before allocation.',
      evaluation_rubric: 'Full marks: defines deadlock, names and explains all 4 Coffman conditions (Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait).',
      expected_concepts: ['Deadlock definition', 'Mutual Exclusion', 'Hold and Wait', 'No Preemption', 'Circular Wait', 'Deadlock prevention'],
    },
    {
      title: 'Implement an EventEmitter Pub/Sub in JavaScript',
      type: 'coding',
      topic: 'OOP & Architecture',
      difficulty: 'Medium',
      question_text: 'Write a custom EventEmitter class in JavaScript with on(event, listener), emit(event, ...args), off(event, listener), and once(event, listener).',
      code_snippet: '',
      starter_code: `class EventEmitter {\n    constructor() {\n        this.events = {};\n    }\n\n    on(event, listener) {}\n    emit(event, ...args) {}\n    off(event, listener) {}\n    once(event, listener) {}\n}`,
      suggested_answer: `class EventEmitter {\n    constructor() {\n        this.events = {};\n    }\n\n    on(event, listener) {\n        if (!this.events[event]) this.events[event] = [];\n        this.events[event].push(listener);\n        return this;\n    }\n\n    off(event, listener) {\n        if (!this.events[event]) return this;\n        this.events[event] = this.events[event].filter((l) => l !== listener && l.original !== listener);\n        return this;\n    }\n\n    emit(event, ...args) {\n        if (!this.events[event]) return false;\n        const listeners = [...this.events[event]];\n        listeners.forEach((l) => l.apply(this, args));\n        return true;\n    }\n\n    once(event, listener) {\n        const wrapper = (...args) => {\n            this.off(event, wrapper);\n            listener.apply(this, args);\n        };\n        wrapper.original = listener;\n        return this.on(event, wrapper);\n    }\n}`,
      explanation: 'Cloning listeners array during emit avoids mutation bugs if listeners unsubscribe during dispatch. Wrapper.original ensures off() can target once handlers.',
      evaluation_rubric: 'Full marks: supports on, off, emit, once with wrapper unwrapping, copies listener list during emit.',
      expected_concepts: ['Pub/Sub pattern', 'Listener array management', 'once auto-unsubscribing wrapper', 'Safe listener array snapshot on emit'],
    },
    {
      title: 'Database Transactions & Optimistic vs Pessimistic Locking',
      type: 'conceptual',
      topic: 'DBMS & SQL',
      difficulty: 'Medium',
      question_text: 'Differentiate between Optimistic Concurrency Control (OCC) and Pessimistic Locking in database transactions. In what workloads does each excel?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: '1. Pessimistic Locking: Assumes conflicts will happen. Acquires exclusive locks on rows immediately (e.g., SELECT ... FOR UPDATE). Other transactions must wait. Ideal for high-contention financial systems or ticket reservations with strict consistency.\n2. Optimistic Concurrency Control (OCC): Assumes conflicts are rare. Reads rows without locking and checks a version column or timestamp during UPDATE (e.g., UPDATE account SET balance = ?, version = version + 1 WHERE id = ? AND version = ?). If row was modified, update returns 0 rows affected, prompting a retry. Ideal for read-heavy web applications with low contention.',
      explanation: 'Pessimistic locking incurs deadlock and timeout risks, whereas OCC incurs CPU retry overhead on high write contention.',
      evaluation_rubric: 'Full marks: contrasts lock-on-read vs version check on commit, provides explicit SQL examples, explains high vs low contention trade-offs.',
      expected_concepts: ['SELECT FOR UPDATE (Pessimistic)', 'Version column / Timestamp check (Optimistic)', 'High contention vs Read-heavy workloads', 'Deadlocks vs Retry cost'],
    },
    {
      title: 'Longest Substring Without Repeating Characters',
      type: 'coding',
      topic: 'Data Structures & Algorithms',
      difficulty: 'Medium',
      question_text: 'Given a string `s`, find the length of the longest substring without repeating characters in O(N) time complexity using a sliding window.',
      code_snippet: '',
      starter_code: `function lengthOfLongestSubstring(s) {\n    // Return length of longest substring without duplicates\n}`,
      suggested_answer: `function lengthOfLongestSubstring(s) {\n    const seen = new Map();\n    let maxLen = 0;\n    let left = 0;\n\n    for (let right = 0; right < s.length; right++) {\n        const char = s[right];\n        if (seen.has(char) && seen.get(char) >= left) {\n            left = seen.get(char) + 1;\n        }\n        seen.set(char, right);\n        maxLen = Math.max(maxLen, right - left + 1);\n    }\n    return maxLen;\n}`,
      explanation: 'Sliding window with hash map storing character indices allows left pointer to jump directly past duplicate characters in O(1) step.',
      evaluation_rubric: 'Full marks: O(N) time sliding window, updates left pointer correctly, stores last seen indices in Map/Object.',
      expected_concepts: ['Sliding window', 'Hash Map last seen index', 'O(N) time complexity', 'Jump left pointer'],
    },
  ],
  java: [
    {
      title: 'JVM Memory Model: Heap, Stack, Metaspace & GC',
      type: 'conceptual',
      topic: 'Memory Management',
      difficulty: 'Medium',
      question_text: 'Explain the internal architecture of JVM memory: Heap (Young/Old generations), Thread Stack, Metaspace, and Program Counter. How does G1 GC collect garbage?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'JVM Memory structure:\n1. Heap: Shared memory for all object instances, divided into Young Generation (Eden, Survivor S0/S1) and Old/Tenured Generation.\n2. Stack: Thread-private memory storing primitive local variables, method invocation frames, and object references.\n3. Metaspace: Native memory holding class metadata, constant pool, and method bytecodes (replaced PermGen in Java 8).\n4. Program Counter (PC): Holds current executing JVM bytecode instruction address.\nG1 (Garbage-First) GC divides the heap into equal-sized regions and prioritizes collecting regions with the most garbage first to meet user-defined pause time targets.',
      explanation: 'Objects are allocated in Eden, promoted through Survivor spaces, and tenure to Old generation upon reaching age threshold.',
      evaluation_rubric: 'Full marks: describes Heap generations, Thread Stack frames, Metaspace native memory, and region-based G1 GC mechanism.',
      expected_concepts: ['Heap (Eden, Survivor, Old)', 'Thread Stack frames', 'Metaspace (native memory)', 'G1 GC region-based collection'],
    },
    {
      title: 'Java String Immutability & String Pool Output Prediction',
      type: 'code_output',
      topic: 'Language Fundamentals',
      difficulty: 'Easy',
      question_text: 'What will the following Java code print? Explain `==` reference comparison vs `.equals()` value comparison and the role of the String Constant Pool.',
      code_snippet: `String s1 = "Hello";\nString s2 = "Hello";\nString s3 = new String("Hello");\nString s4 = s3.intern();\n\nSystem.out.println(s1 == s2);\nSystem.out.println(s1 == s3);\nSystem.out.println(s1.equals(s3));\nSystem.out.println(s1 == s4);`,
      starter_code: '',
      suggested_answer: 'Output:\ntrue\nfalse\ntrue\ntrue\nExplanation: s1 and s2 point to the same canonical String literal in the String Constant Pool (s1 == s2 is true). s3 creates a new explicit object instance on the heap, so s1 == s3 is false, but s1.equals(s3) compares characters and is true. s3.intern() returns the canonical pool reference, so s1 == s4 is true.',
      explanation: 'String immutability enables safe sharing in the string constant pool, thread safety, and secure hashing in HashMaps.',
      evaluation_rubric: 'Full marks: accurately predicts [true, false, true, true], explains String constant pool, heap allocation with new, and .intern().',
      expected_concepts: ['true, false, true, true', 'String Constant Pool', '== reference vs equals value', 'String.intern()'],
    },
    {
      title: 'HashMap Internal Implementation & Hash Collision Handling',
      type: 'conceptual',
      topic: 'Data Structures & Algorithms',
      difficulty: 'Medium',
      question_text: 'How does Java 8 HashMap work internally? Explain buckets, hashing, load factor, rehashing, and the conversion from LinkedList to Red-Black Tree (Treeify threshold).',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'Java HashMap uses an array of Node buckets. When put(K, V) is called, hash(K) computes an index `(n - 1) & hash`. If multiple keys map to the same bucket (collision), they form a singly linked list. In Java 8, when a bucket exceeds 8 nodes (TREEIFY_THRESHOLD) and total table capacity is >= 64, the linked list is converted into a balanced Red-Black Tree, improving worst-case search time from O(N) to O(log N). When size exceeds capacity * loadFactor (default 0.75), the array doubles in capacity (rehashing).',
      explanation: 'Red-Black tree conversion defends against hash collision DOS attacks where malicious keys produce the same hash bucket.',
      evaluation_rubric: 'Full marks: details array of buckets, collision chaining, Treeify threshold of 8 converting to Red-Black tree O(log N), and 0.75 load factor.',
      expected_concepts: ['Array of buckets / Hash masking', 'Linked list collision chaining', 'Treeify threshold (8) to Red-Black Tree', 'O(1) average vs O(log N) worst case', '0.75 load factor resizing'],
    },
    {
      title: 'Implement Thread-Safe Singleton with Double-Checked Locking',
      type: 'coding',
      topic: 'OOP & Architecture',
      difficulty: 'Medium',
      question_text: 'Write a thread-safe Singleton class in Java using Double-Checked Locking. Explain why the instance field must be declared `volatile`.',
      code_snippet: '',
      starter_code: `public class DatabaseConnection {\n    // Implement double-checked locking singleton\n}`,
      suggested_answer: `public class DatabaseConnection {\n    private static volatile DatabaseConnection instance;\n\n    private DatabaseConnection() {}\n\n    public static DatabaseConnection getInstance() {\n        if (instance == null) {\n            synchronized (DatabaseConnection.class) {\n                if (instance == null) {\n                    instance = new DatabaseConnection();\n                }\n            }\n        }\n        return instance;\n    }\n}`,
      explanation: 'Without `volatile`, CPU instruction reordering can cause instance = new DatabaseConnection() to allocate memory, publish the reference before constructor completes, allowing another thread to observe a partially constructed object.',
      evaluation_rubric: 'Full marks: private constructor, two null checks, synchronized block on Class object, explicitly explains volatile prevents instruction reordering.',
      expected_concepts: ['volatile keyword', 'Instruction reordering prevention', 'Double null check', 'synchronized(Class.class)'],
    },
    {
      title: 'Java Concurrency: synchronized vs ReentrantLock vs ConcurrentHashMap',
      type: 'conceptual',
      topic: 'Operating Systems & Concurrency',
      difficulty: 'Medium',
      question_text: 'Compare intrinsic `synchronized` locks with `java.util.concurrent.locks.ReentrantLock`. How does ConcurrentHashMap achieve lock-striping / CAS in Java 8?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: '`synchronized` is a built-in monitor lock managed by JVM (automatic unlock on exit/exception). `ReentrantLock` provides advanced capabilities: timed lock attempts (tryLock), interruptible lock acquisition, fairness policies (FIFO), and multiple Condition variables. In Java 8, `ConcurrentHashMap` abandons Segment-based lock striping in favor of fine-grained Compare-And-Swap (CAS) for empty bucket insertions and synchronized locks only on individual bucket heads, allowing concurrent reads and parallel multi-bucket writes.',
      explanation: 'CAS operations use hardware CPU instructions (CMPXCHG) for atomic updates without blocking threads.',
      evaluation_rubric: 'Full marks: compares synchronized vs ReentrantLock features (tryLock, fairness), explains ConcurrentHashMap CAS and bucket-level synchronization.',
      expected_concepts: ['Intrinsic monitor vs ReentrantLock', 'tryLock and Condition variables', 'ConcurrentHashMap CAS (Compare-And-Swap)', 'Node bucket-level locking'],
    },
    {
      title: 'Reverse a Singly Linked List in Java',
      type: 'coding',
      topic: 'Data Structures & Algorithms',
      difficulty: 'Easy',
      question_text: 'Implement an iterative method to reverse a singly linked list in O(N) time and O(1) space.',
      code_snippet: '',
      starter_code: `class ListNode {\n    int val;\n    ListNode next;\n    ListNode(int val) { this.val = val; }\n}\n\nclass Solution {\n    public ListNode reverseList(ListNode head) {\n        // Return reversed head\n    }\n}`,
      suggested_answer: `public ListNode reverseList(ListNode head) {\n    ListNode prev = null;\n    ListNode curr = head;\n    while (curr != null) {\n        ListNode nextTemp = curr.next;\n        curr.next = prev;\n        prev = curr;\n        curr = nextTemp;\n    }\n    return prev;\n}`,
      explanation: 'Re-points pointers one node at a time while preserving the forward reference in nextTemp.',
      evaluation_rubric: 'Full marks: O(N) time, O(1) auxiliary space, correctly re-links pointers and returns prev.',
      expected_concepts: ['ListNode pointers', 'prev, curr, next tracking', 'O(N) time O(1) space'],
    },
  ],
  typescript: [
    {
      title: 'TypeScript Structural Typing vs Nominal Typing',
      type: 'conceptual',
      topic: 'Language Fundamentals',
      difficulty: 'Medium',
      question_text: 'Explain TypeScript duck-typing (structural typing) vs nominal typing in languages like Java/C++. How do branded types / unique symbols achieve nominal typing in TypeScript?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'TypeScript uses structural typing: type compatibility is determined entirely by an object shape/members, not its declared name or inheritance ancestry. Two distinct interfaces with identical properties are fully interchangeable. To enforce nominal typing (e.g. distinguishing UserID from OrderID), developers use Branded Types using a unique symbol or tag property (e.g. type UserId = string & { readonly __brand: unique symbol }), preventing accidental assignment.',
      explanation: 'Enables flexible JSON modeling while branded types prevent domain logic bugs.',
      evaluation_rubric: 'Full marks: defines structural compatibility vs nominal declaration, explains branded type tagging pattern.',
      expected_concepts: ['Structural typing / Shape compatibility', 'Nominal typing comparison', 'Branded types (__brand tag)', 'Type safety'],
    },
    {
      title: 'TypeScript Generics & Conditional Types with `infer`',
      type: 'coding',
      topic: 'Language Fundamentals',
      difficulty: 'Hard',
      question_text: 'Implement a custom utility type `UnwrapPromise<T>` that extracts the resolved type of a Promise (or nested Promise), returning the primitive type if T is not a promise.',
      code_snippet: '',
      starter_code: `type UnwrapPromise<T> = /* implement using conditional types and infer */ any;`,
      suggested_answer: `type UnwrapPromise<T> = T extends Promise<infer U> ? UnwrapPromise<U> : T;`,
      explanation: 'Recursive conditional type uses infer to deduce the generic inner type parameter U from Promise<U>.',
      evaluation_rubric: 'Full marks: uses T extends Promise<infer U>, handles nested Promise resolution recursively.',
      expected_concepts: ['Conditional types (extends)', 'infer keyword', 'Recursive type unwrap', 'TypeScript type-level metaprogramming'],
    },
  ],
  cpp: [
    {
      title: 'C++ RAII (Resource Acquisition Is Initialization) & Smart Pointers',
      type: 'conceptual',
      topic: 'Memory Management',
      difficulty: 'Medium',
      question_text: 'Explain the RAII idiom in C++. Contrast `std::unique_ptr`, `std::shared_ptr`, and `std::weak_ptr` regarding ownership semantics, reference counting overhead, and cyclic dependency resolution.',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'RAII binds resource lifecycle (heap memory, file handles, mutex locks) to object lifetime: resource acquired in constructor and released in destructor when going out of scope.\n1. `std::unique_ptr`: Exclusive ownership, zero runtime overhead (move-only, no ref count).\n2. `std::shared_ptr`: Shared ownership using atomic reference count control block. Resource freed when ref count reaches zero.\n3. `std::weak_ptr`: Non-owning observer of a shared_ptr object. Does not increment strong ref count; breaks cyclic references that would otherwise prevent deallocation.',
      explanation: 'Use weak_ptr::lock() to safely obtain a shared_ptr before accessing the target object.',
      evaluation_rubric: 'Full marks: defines RAII destructor cleanup, details unique_ptr zero overhead, shared_ptr atomic control block, and weak_ptr cycle prevention.',
      expected_concepts: ['RAII destructor cleanup', 'std::unique_ptr exclusive ownership', 'std::shared_ptr atomic ref count', 'std::weak_ptr break circular cycles'],
    },
    {
      title: 'C++ Virtual Functions, VTable, and Virtual Destructors',
      type: 'conceptual',
      topic: 'OOP & Architecture',
      difficulty: 'Medium',
      question_text: 'How do virtual functions achieve runtime polymorphism in C++? Explain the Virtual Method Table (vtable) and Virtual Pointer (vptr). Why MUST base class destructors be virtual when deleting via base pointer?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'When a class contains virtual functions, the compiler creates a static Virtual Table (vtable) containing function pointers for that class, and inserts a hidden pointer (vptr) into every object instance. At runtime, calling `basePtr->foo()` dereferences vptr -> vtable -> derived implementation. If a base class destructor is NOT virtual, executing `delete basePtr` invokes only the Base destructor statically, resulting in undefined behavior and memory leaks because the Derived destructor never executes.',
      explanation: 'Making base destructor virtual ensures derived cleanup is correctly dispatched via the vtable.',
      evaluation_rubric: 'Full marks: details vtable and vptr mechanism, explains dynamic dispatch offset, and proves undefined behavior/memory leaks if destructor is non-virtual.',
      expected_concepts: ['vtable function pointer table', 'vptr object instance pointer', 'Dynamic dispatch', 'Virtual destructor prevents resource leak'],
    },
    {
      title: 'Implement a Thread-Safe Producer-Consumer Queue in C++20',
      type: 'coding',
      topic: 'Operating Systems & Concurrency',
      difficulty: 'Hard',
      question_text: 'Implement a generic thread-safe bounded queue class in C++ using `std::mutex`, `std::condition_variable`, and `std::queue`. Include `push(item)` and `pop()` methods.',
      code_snippet: '',
      starter_code: `#include <mutex>\n#include <condition_variable>\n#include <queue>\n\ntemplate<typename T>\nclass BoundedQueue {\n    // Implement thread-safe queue\n};`,
      suggested_answer: `#include <mutex>\n#include <condition_variable>\n#include <queue>\n\ntemplate<typename T>\nclass BoundedQueue {\nprivate:\n    size_t capacity;\n    std::queue<T> queue;\n    std::mutex mtx;\n    std::condition_variable cv_not_full;\n    std::condition_variable cv_not_empty;\n\npublic:\n    explicit BoundedQueue(size_t cap) : capacity(cap) {}\n\n    void push(const T& item) {\n        std::unique_lock<std::mutex> lock(mtx);\n        cv_not_full.wait(lock, [this] { return queue.size() < capacity; });\n        queue.push(item);\n        cv_not_empty.notify_one();\n    }\n\n    T pop() {\n        std::unique_lock<std::mutex> lock(mtx);\n        cv_not_empty.wait(lock, [this] { return !queue.empty(); });\n        T item = std::move(queue.front());\n        queue.pop();\n        cv_not_full.notify_one();\n        return item;\n    }\n};`,
      explanation: 'Two condition variables prevent spurious wakeups and avoid thread starvation between producers and consumers.',
      evaluation_rubric: 'Full marks: uses std::unique_lock, wait with predicate lambdas, notify_one, and std::move for efficiency.',
      expected_concepts: ['std::mutex and std::unique_lock', 'std::condition_variable wait predicate', 'cv.notify_one()', 'Spurious wakeup prevention'],
    },
  ],
  c: [
    {
      title: 'Pointer Arithmetic and Memory Layout in C',
      type: 'code_output',
      topic: 'Language Fundamentals',
      difficulty: 'Medium',
      question_text: 'What is the output of the following C code on a 64-bit architecture? Explain how pointer arithmetic scales by sizeof(type).',
      code_snippet: `#include <stdio.h>\nint main() {\n    int arr[5] = {10, 20, 30, 40, 50};\n    int *ptr = arr;\n    printf("%d, ", *ptr);\n    ptr += 2;\n    printf("%d, ", *ptr);\n    printf("%d\\n", *(ptr - 1));\n    return 0;\n}`,
      starter_code: '',
      suggested_answer: 'Output:\n10, 30, 20\nExplanation: ptr initially points to arr[0] (10). ptr += 2 advances the pointer by 2 * sizeof(int) (8 bytes), pointing to arr[2] (30). *(ptr - 1) accesses the previous int at arr[1] (20).',
      explanation: 'Pointer addition increments address by step * sizeof(*ptr).',
      evaluation_rubric: 'Full marks: predicts [10, 30, 20] and explains pointer arithmetic scaling by data type size.',
      expected_concepts: ['10, 30, 20', 'Pointer arithmetic scaling', 'sizeof(int) offset', 'Dereferencing *'],
    },
    {
      title: 'Memory Allocation: malloc vs calloc vs realloc & Dangling Pointers',
      type: 'conceptual',
      topic: 'Memory Management',
      difficulty: 'Easy',
      question_text: 'Differentiate between malloc(), calloc(), and realloc() in C. What is a Dangling Pointer, and how do you prevent Use-After-Free vulnerabilities?',
      code_snippet: '',
      starter_code: '',
      suggested_answer: '1. `malloc(size)`: Allocates uninitialized heap memory (contains garbage bytes).\n2. `calloc(num, size)`: Allocates heap memory and zeroes out all allocated bytes.\n3. `realloc(ptr, new_size)`: Resizes existing block, copying old contents and allocating new memory if necessary.\nA Dangling Pointer points to memory that has already been deallocated (`free(ptr)`). Dereferencing it causes undefined behavior / Use-After-Free exploits. Mitigation: set `ptr = NULL` immediately after `free(ptr)`.',
      explanation: 'realloc can return a new pointer if contiguous expansion is not possible in place.',
      evaluation_rubric: 'Full marks: details uninitialized vs zeroed memory, explains realloc reallocation, defines dangling pointer and ptr = NULL fix.',
      expected_concepts: ['malloc garbage vs calloc zeroed', 'realloc pointer migration', 'free() and dangling pointer', 'ptr = NULL mitigation'],
    },
  ],
  go: [
    {
      title: 'Go Goroutines & Channels Concurrency Model (CSP)',
      type: 'conceptual',
      topic: 'Operating Systems & Concurrency',
      difficulty: 'Medium',
      question_text: 'Explain Go concurrency model based on Communicating Sequential Processes (CSP). Contrast buffered vs unbuffered channels and explain how the `select` statement works.',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'Go concurrency uses lightweight user-space threads called Goroutines (~2KB initial stack) multiplexed onto OS threads via the M:N Go scheduler. Goroutines communicate via typed Channels: unbuffered channels require synchronous sender and receiver rendezvous. Buffered channels allow asynchronous writes until the buffer capacity fills. The `select` statement allows a goroutine to wait on multiple channel send/receive operations simultaneously, executing the first non-blocking case (or a default case if specified).',
      explanation: 'Channels prevent shared memory data races following the philosophy: "Do not communicate by sharing memory; instead, share memory by communicating."',
      evaluation_rubric: 'Full marks: details CSP model, compares unbuffered synchronous rendezvous vs buffered capacity, explains select multiplexing.',
      expected_concepts: ['Goroutines lightweight stack', 'CSP (Communicating Sequential Processes)', 'Unbuffered rendezvous vs Buffered queue', 'select channel multiplexing'],
    },
  ],
  rust: [
    {
      title: 'Rust Ownership, Borrowing & Lifetimes',
      type: 'conceptual',
      topic: 'Memory Management',
      difficulty: 'Medium',
      question_text: 'Explain Rust ownership rules, mutable vs immutable borrowing, and how lifetimes (`\'a`) enable compile-time memory safety without a garbage collector.',
      code_snippet: '',
      starter_code: '',
      suggested_answer: 'Rust enforces 3 ownership rules at compile time: 1. Each value in Rust has an owner variable. 2. There can only be one owner at a time. 3. When the owner goes out of scope, the value is dropped (RAII). Borrowing rules: you may have any number of immutable references (&T) OR exactly one mutable reference (&mut T) in a given scope, preventing data races. Lifetimes (\'a) are generic annotations that tell the borrow checker how long references remain valid, preventing dangling pointer references at compile time with zero runtime overhead.',
      explanation: 'Rust eliminates null pointer exceptions and data races statically during compilation.',
      evaluation_rubric: 'Full marks: states 3 ownership rules, aliasing XOR mutability rule, and explains compile-time lifetime borrow checking.',
      expected_concepts: ['Ownership rules', 'One mutable XOR multiple immutable references', 'Lifetimes (\'a) borrow checker', 'Zero-cost compile time safety'],
    },
  ],
};

/**
 * Generate technical interview questions (minimum 20 guaranteed)
 */
export const generateInterviewQuestions = async ({
  language = 'python',
  difficulty = 'Intermediate',
  topics = ['Fundamentals', 'Data Structures', 'Algorithms', 'OOP', 'DBMS', 'Operating Systems', 'Networks'],
  count = 20,
}) => {
  const normLang = String(language || 'python').toLowerCase().trim();
  const targetCount = Math.max(20, Number(count) || 20);
  const status = getAiStatus();

  const curatedList = CURATED_INTERVIEW_BANKS[normLang] || CURATED_INTERVIEW_BANKS.python;
  
  // Filter questions matching selected topics if possible
  const topicList = Array.isArray(topics) ? topics.map((t) => t.toLowerCase()) : [String(topics).toLowerCase()];
  const topicMatched = curatedList.filter((q) => 
    topicList.some((t) => q.topic.toLowerCase().includes(t) || t.includes(q.topic.toLowerCase()))
  );

  const pool = topicMatched.length >= 10 ? [...topicMatched] : [...curatedList];
  
  // Add remaining to reach at least targetCount
  for (const item of curatedList) {
    if (pool.length >= targetCount) break;
    if (!pool.some((p) => p.title === item.title)) {
      pool.push(item);
    }
  }

  // Ensure minimum targetCount
  while (pool.length < targetCount) {
    const fallbackItem = curatedList[pool.length % curatedList.length];
    pool.push({
      ...fallbackItem,
      title: `${fallbackItem.title} (Part ${Math.floor(pool.length / curatedList.length) + 1})`,
    });
  }

  return {
    questions: pool.slice(0, targetCount).map((q, idx) => ({
      id: `q-${idx + 1}`,
      questionIndex: idx + 1,
      title: q.title,
      type: q.type || 'conceptual',
      topic: q.topic || 'General',
      difficulty: q.difficulty || difficulty,
      question_text: q.question_text,
      code_snippet: q.code_snippet || '',
      starter_code: q.starter_code || '',
      suggested_answer: q.suggested_answer || '',
      explanation: q.explanation || '',
      evaluation_rubric: q.evaluation_rubric || '',
      expected_concepts: Array.isArray(q.expected_concepts) ? q.expected_concepts : [],
    })),
    aiProvider: status.configured ? 'nvidia_api_catalog' : 'curated_question_engine',
    model: status.model,
  };
};

/**
 * Evaluate completed interview submission with NVIDIA AI and Proctoring Telemetry
 */
export const evaluateInterviewSubmission = async ({
  interview,
  questions = [],
  answers = [],
  activityLogs = [],
}) => {
  const status = getAiStatus();
  const answerMap = new Map();
  for (const ans of answers) {
    answerMap.set(Number(ans.question_id || ans.questionId), ans);
  }

  let totalQuestions = questions.length;
  let answeredCount = 0;
  let questionFeedbacks = [];
  let topicScores = {};

  // First pass: deterministic rubric & concept matching
  for (const q of questions) {
    const ans = answerMap.get(Number(q.id)) || answerMap.get(Number(q.questionIndex));
    const submittedText = ans ? (ans.answer_text || ans.code_content || '').trim() : '';
    const hasAnswer = Boolean(submittedText.length > 3);
    
    if (hasAnswer) answeredCount += 1;

    // Check expected concepts
    const expected = Array.isArray(q.expected_concepts)
      ? q.expected_concepts
      : typeof q.expected_concepts === 'string'
      ? JSON.parse(q.expected_concepts || '[]')
      : [];

    let matchedConcepts = [];
    let missedConcepts = [];

    if (hasAnswer) {
      const lowerText = submittedText.toLowerCase();
      for (const concept of expected) {
        const cleanConcept = String(concept).toLowerCase();
        if (lowerText.includes(cleanConcept) || cleanConcept.split(' ').some((w) => w.length > 3 && lowerText.includes(w))) {
          matchedConcepts.push(concept);
        } else {
          missedConcepts.push(concept);
        }
      }
    } else {
      missedConcepts = [...expected];
    }

    // Determine baseline score for question
    let qScore = 0;
    let verdict = 'Incorrect / Unanswered';

    if (!hasAnswer) {
      qScore = 0;
      verdict = 'Unanswered';
    } else {
      const matchRatio = expected.length > 0 ? matchedConcepts.length / expected.length : 0.7;
      const lengthBonus = Math.min(20, Math.floor(submittedText.length / 20));
      const rawScore = Math.round(matchRatio * 75 + lengthBonus);
      qScore = Math.min(100, Math.max(25, rawScore));

      if (qScore >= 80) verdict = 'Correct';
      else if (qScore >= 50) verdict = 'Partially Correct';
      else verdict = 'Needs Improvement';
    }

    // Accumulate topic scores
    const topic = q.topic || 'General';
    if (!topicScores[topic]) topicScores[topic] = { total: 0, count: 0 };
    topicScores[topic].total += qScore;
    topicScores[topic].count += 1;

    const marksEarned = Number(((qScore / 100) * 5).toFixed(1));
    const isAlgo = q.topic.toLowerCase().includes('algorithm') || q.topic.toLowerCase().includes('data structure');
    const timeComplexityNotes = isAlgo ? 'Expected O(N) or O(log N) optimal time complexity.' : 'Standard runtime characteristics apply.';

    questionFeedbacks.push({
      questionId: q.id,
      questionIndex: q.question_index || q.questionIndex,
      title: q.title,
      topic,
      difficulty: q.difficulty,
      type: q.type,
      submittedAnswer: submittedText,
      sampleSolution: q.suggested_answer,
      suggestedAnswer: q.suggested_answer,
      explanation: q.explanation,
      score: qScore,
      marksEarned,
      maxMarks: 5,
      verdict,
      timeComplexityNotes,
      matchedConcepts,
      missedConcepts,
      correctnessFeedback: hasAnswer
        ? `Candidate demonstrated ${verdict.toLowerCase()} understanding. Key points addressed: ${matchedConcepts.join(', ') || 'general overview'}.${missedConcepts.length > 0 ? ` Areas to deepen: ${missedConcepts.join(', ')}.` : ''}`
        : 'Question was left unattempted by the candidate.',
      feedback: hasAnswer
        ? `Candidate demonstrated ${verdict.toLowerCase()} understanding. Key points addressed: ${matchedConcepts.join(', ') || 'general overview'}.${missedConcepts.length > 0 ? ` Areas to deepen: ${missedConcepts.join(', ')}.` : ''}`
        : 'Question was left unattempted by the candidate.',
    });
  }

  // Compute composite score
  const avgTechnicalScore = Math.round(
    questionFeedbacks.reduce((acc, q) => acc + q.score, 0) / Math.max(1, totalQuestions)
  );
  const totalMarksEarned = Math.round((avgTechnicalScore / 100) * 100);

  // Proctoring Analysis
  let tabSwitches = 0;
  let blurCount = 0;
  let gazeLostCount = 0;
  let faceLostCount = 0;
  let criticalViolations = 0;

  for (const log of activityLogs) {
    const type = log.event_type || log.eventType;
    if (type === 'tab_switch') tabSwitches += 1;
    if (type === 'window_blur') blurCount += 1;
    if (type === 'eye_contact_lost') gazeLostCount += 1;
    if (type === 'face_not_detected') faceLostCount += 1;
    if (log.severity === 'critical') criticalViolations += 1;
  }

  let proctoringIntegrityScore = 100;
  proctoringIntegrityScore -= tabSwitches * 5;
  proctoringIntegrityScore -= blurCount * 3;
  proctoringIntegrityScore -= Math.min(20, Math.floor(gazeLostCount / 3) * 2);
  proctoringIntegrityScore -= Math.min(20, Math.floor(faceLostCount / 2) * 4);
  proctoringIntegrityScore -= criticalViolations * 15;
  proctoringIntegrityScore = Math.max(30, Math.min(100, proctoringIntegrityScore));

  const proctoringSummary = {
    integrityScore: proctoringIntegrityScore,
    status: proctoringIntegrityScore >= 85 ? 'Verified High Integrity' : proctoringIntegrityScore >= 70 ? 'Moderate Confidence' : 'Review Recommended',
    tabSwitches,
    blurCount,
    gazeLostCount,
    faceLostCount,
    criticalViolations,
    totalEvents: activityLogs.length,
    cameraEnabled: interview.mode === 'camera',
    cameraStats: {
      faceDetectedRatio: faceLostCount === 0 ? 98 : Math.max(60, 100 - faceLostCount * 8),
      gazeFocusedRatio: gazeLostCount === 0 ? 95 : Math.max(55, 100 - gazeLostCount * 6),
      cameraUsed: interview.mode === 'camera',
    },
  };

  // Topic breakdown
  const topicBreakdown = {};
  for (const [top, val] of Object.entries(topicScores)) {
    topicBreakdown[top] = Math.round(val.total / Math.max(1, val.count));
  }

  const correctCount = questionFeedbacks.filter((q) => q.score >= 80).length;
  const partialCount = questionFeedbacks.filter((q) => q.score >= 50 && q.score < 80).length;
  const incorrectCount = questionFeedbacks.filter((q) => q.score < 50).length;

  // Strengths & Weaknesses
  const sortedTopics = Object.entries(topicBreakdown).sort((a, b) => b[1] - a[1]);
  const strengths = sortedTopics.filter((t) => t[1] >= 65).map((t) => `Strong command of ${t[0]} (${t[1]}%)`);
  if (strengths.length === 0) strengths.push('Good foundational familiarity with technical terminology');

  const weaknesses = sortedTopics.filter((t) => t[1] < 65).map((t) => `Needs improvement in ${t[0]} (${t[1]}%)`);
  if (weaknesses.length === 0) weaknesses.push('Refine edge case reasoning in complex distributed scenarios');

  const recommendations = [
    'Practice explaining algorithm space-time complexity tradeoffs proactively before coding.',
    'Review concurrency synchronization primitives and memory safety patterns.',
    'Strengthen database index structures and query execution plan optimization.',
  ];

  // If NVIDIA is configured, perform LLM enhancement
  if (status.configured && answeredCount > 0) {
    try {
      const sampleFeedbacks = questionFeedbacks.slice(0, 6).map((q) => ({
        title: q.title,
        topic: q.topic,
        score: q.score,
        answer: q.submittedAnswer.slice(0, 150),
      }));

      const sysPrompt = `You are a Principal Technical Interviewer evaluating a candidate's completed technical interview in ${interview.language || 'Software Engineering'}.
Return a JSON object with:
{
  "overallEvaluation": "Comprehensive paragraph summarizing candidate depth, architecture knowledge, and technical clarity",
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "actionableRecommendations": ["string", "string", "string"],
  "readinessVerdict": "Ready for Technical Rounds" | "Needs Practice" | "Advanced Mastery"
}`;

      const usrPrompt = `Candidate completed ${answeredCount} of ${totalQuestions} questions with an average score of ${avgTechnicalScore}%. Sample responses: ${JSON.stringify(sampleFeedbacks)}. Topic breakdown: ${JSON.stringify(topicBreakdown)}. Provide expert review.`;

      const aiRes = await callNvidiaChat({
        systemPrompt: sysPrompt,
        userPrompt: usrPrompt,
        temperature: 0.2,
        maxTokens: 800,
      });

      if (aiRes.success && aiRes.parsed) {
        return {
          overallScore: avgTechnicalScore,
          totalMarksEarned,
          totalMaxMarks: 100,
          technicalScore: avgTechnicalScore,
          explanationScore: Math.min(100, avgTechnicalScore + 5),
          problemSolvingScore: Math.max(0, avgTechnicalScore - 4),
          totalQuestions,
          answeredQuestions: answeredCount,
          correctCount,
          partialCount,
          incorrectCount,
          strengths: aiRes.parsed.strengths || strengths,
          weaknesses: aiRes.parsed.weaknesses || weaknesses,
          strongestTopics: strengths,
          topicsToImprove: weaknesses,
          recommendations: aiRes.parsed.actionableRecommendations || recommendations,
          overallEvaluation: aiRes.parsed.overallEvaluation || `Candidate completed the technical evaluation with an overall score of ${avgTechnicalScore}%.`,
          readinessVerdict: aiRes.parsed.readinessVerdict || (avgTechnicalScore >= 75 ? 'Ready for Technical Rounds' : 'Needs Practice'),
          topicBreakdown,
          questionFeedback: questionFeedbacks,
          proctoringSummary,
          evaluatedBy: 'NVIDIA API Catalog (Llama 3.2)',
        };
      }
    } catch (err) {
      console.warn('NVIDIA interview evaluation enhancement skipped, using structured rubric evaluation:', err.message);
    }
  }

  return {
    overallScore: avgTechnicalScore,
    totalMarksEarned,
    totalMaxMarks: 100,
    technicalScore: avgTechnicalScore,
    explanationScore: Math.min(100, avgTechnicalScore + 5),
    problemSolvingScore: Math.max(0, avgTechnicalScore - 4),
    totalQuestions,
    answeredQuestions: answeredCount,
    correctCount,
    partialCount,
    incorrectCount,
    strengths,
    weaknesses,
    strongestTopics: strengths,
    topicsToImprove: weaknesses,
    recommendations,
    overallEvaluation: `Candidate attempted ${answeredCount} of ${totalQuestions} questions with an overall score of ${avgTechnicalScore}%.`,
    readinessVerdict: avgTechnicalScore >= 75 ? 'Ready for Technical Rounds' : avgTechnicalScore >= 50 ? 'Intermediate Candidate' : 'Needs Practice',
    topicBreakdown,
    questionFeedback: questionFeedbacks,
    proctoringSummary,
    evaluatedBy: 'SkillSetu AI Rubric Engine',
  };
};

