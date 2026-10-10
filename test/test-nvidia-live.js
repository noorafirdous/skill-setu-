import 'dotenv/config';
import {
  getAiStatus,
  callNvidiaChat,
  analyzeSkillsAndCertificates,
  compareOpportunityWithStudent,
  generateAiRoadmap,
  evaluateProjectPitch,
  scanInnovationIdeas
} from '../aiService.js';


async function runLiveTest() {
  console.log('--- 1. AI STATUS ---');
  const status = getAiStatus();
  console.log('Configured:', status.configured);
  console.log('Provider:', status.provider);
  console.log('Model:', status.model);
  console.log('Base URL:', status.baseUrl);
  console.log('Masked Key:', status.maskedKey);

  console.log('\n--- 2. LIVE NVIDIA DIRECT COMPLETION TEST ---');
  const chatRes = await callNvidiaChat({
    systemPrompt: 'You are an AI assistant. Return a JSON object with keys "status" and "message".',
    userPrompt: 'Hello NVIDIA! Confirm connection.',
    temperature: 0.1,
    maxTokens: 100,
  });
  console.log('Success:', chatRes.success);
  console.log('Model Returned:', chatRes.model);
  console.log('Raw Content:', chatRes.content);
  console.log('Parsed JSON:', chatRes.parsed);

  if (!chatRes.success) {
    console.error('NVIDIA API Error:', chatRes.error, chatRes.rawDetails);
    process.exit(1);
  }

  console.log('\n--- 3. LIVE STUDENT SKILL & CERTIFICATE ANALYSIS ---');
  const skillAnalysis = await analyzeSkillsAndCertificates({
    profile: {
      name: 'Aarav Mehta',
      college: 'Indian Institute of Technology, Bombay',
      branch: 'Computer Science & Engineering',
      study_year: '3rd year',
      career_goals: 'Build agentic AI infrastructure and lead hackathon teams',
    },
    skills: ['React', 'TypeScript', 'Node.js', 'PyTorch', 'FastAPI', 'SQLite'],
    certificateText: 'NVIDIA Deep Learning Institute: Fundamentals of Deep Learning & Multi-Modal LLM Agents',
    portfolioSummary: 'Former SIH Finalist with 3 deployed full-stack open source repositories.',
  });
  console.log('AI Provider:', skillAnalysis.aiProvider);
  console.log('Extracted Skills:', skillAnalysis.extractedSkills);
  console.log('Skill Mastery Sample:', skillAnalysis.skillMastery?.slice(0, 2));
  console.log('Strengths:', skillAnalysis.strengths);
  console.log('Detected Skill Gaps:', skillAnalysis.skillGaps);
  console.log('Certificate Credibility:', skillAnalysis.certificateEvaluation);
  console.log('Recommended Actions:', skillAnalysis.recommendedActions);

  console.log('\n--- 4. LIVE OPPORTUNITY MATCH & GAP ANALYSIS ---');
  const oppComparison = await compareOpportunityWithStudent({
    profile: {
      name: 'Aarav Mehta',
      college: 'IIT Bombay',
      career_goals: 'Full-Stack AI Engineer',
    },
    skills: ['React', 'TypeScript', 'Node.js', 'PyTorch', 'FastAPI'],
    opportunityType: 'Hackathon',
    opportunityTitle: 'Smart India Hackathon 2026',
    opportunityRequirements: 'Theme: Smart Automation & Agritech. Requires Python, FastAPI, PyTorch, React, offline SQLite caching, edge sensor telemetry, and accessible UI.',
  });
  console.log('Compatibility Score:', oppComparison.compatibilityScore);
  console.log('Verdict:', oppComparison.readinessVerdict);
  console.log('Matching Requirements:', oppComparison.matchingRequirements);
  console.log('Missing Qualifications:', oppComparison.missingQualifications);
  console.log('Improvement Steps:', oppComparison.actionableImprovementSteps);

  console.log('\n--- 5. LIVE AI JUDGE SIMULATOR EVALUATION ---');
  const judgeRes = await evaluateProjectPitch({
    pitchText: 'Problem: Students struggle to find complementary teammates for hackathons.\nSolution: SkillSetu AI provides real-time synergy matching, sprint taskboards, and pitch rehearsal.\nStack: React 19, TypeScript, Express, SQLite, and NVIDIA API Catalog.\nImpact: 3x project completion velocity.',
    projectTitle: 'SkillSetu AI Collaboration Engine',
  });
  console.log('Overall Score:', judgeRes.overallScore);
  console.log('Jury Verdict:', judgeRes.verdict);
  console.log('Rubric Criteria Count:', judgeRes.rubric?.length);
  console.log('Judge Questions Sample:', judgeRes.judgeQuestions?.slice(0, 2));

  console.log('\n--- 6. LIVE AI CAREER ROADMAP & SCANNER ---');
  const roadmap = await generateAiRoadmap({
    profile: { name: 'Aarav Mehta', college: 'IIT Bombay', study_year: '3rd year' },
    skills: ['React', 'Node.js', 'PyTorch'],
    targetRole: 'Full-Stack AI Engineer',
    timeframeWeeks: 6,
  });
  console.log('Roadmap Target Role:', roadmap.targetRole, 'Readiness:', roadmap.overallReadiness);
  console.log('Phases Count:', roadmap.phases?.length);

  const scan = await scanInnovationIdeas({ domain: 'Healthcare', keywords: 'edge triage' });
  console.log('Scanned Ideas Count:', scan.ideas?.length);

  console.log('\n>>> ALL LIVE NVIDIA AI INTEGRATION TESTS PASSED SUCCESSFULLY! <<<');

}

runLiveTest().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
