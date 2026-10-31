import { tracks } from './data';

// Each roadmap step is one syllabus module; counts come from the curriculum at build time.
const STAGES = [
  {
    id: 'beginner', title: 'Beginner', goal: 'Use AI tools well and understand how they work. No code.',
    modules: ['t00-m01-what-ai-is', 't00-m02-how-llms-work', 't00-m03-trust-safety', 't00-m04-ai-at-work', 't01-m01-chat-assistants',
      't01-m02-research-knowledge', 't01-m03-office-productivity', 't02-m01-prompt-basics', 't02-m03-prompts-for-work', 't13-m06-ai-for-your-job'],
  },
  {
    id: 'builder', title: 'Builder', goal: 'Build agents, RAG chatbots and automations in Python.',
    modules: ['t03-m01-setup', 't03-m03-python-basics', 't03-m04-data-apis', 't04-m01-how-ai-apps-work', 't04-m03-open-local-models',
      't04-m04-core-api-skills', 't05-m01-rag-concepts', 't05-m02-ingestion-chunking', 't05-m04-vector-databases', 't06-m01-agent-foundations',
      't06-m02-agent-from-scratch', 't06-m07-mcp', 't07-m01-automation-basics', 't07-m02-n8n-ai-agents'],
  },
  {
    id: 'pro', title: 'Pro', goal: 'Ship AI that real users rely on: tested, observed, secure and affordable.',
    modules: ['t05-m08-rag-evaluation', 't05-m09-rag-production', 't06-m06-langgraph-deep-dive', 't06-m08-multi-agent', 't06-m09-hitl-guardrails',
      't09-m02-testing-evals', 't09-m03-observability', 't09-m04-cost-performance', 't09-m05-security', 't09-m06-deployment',
      't08-m02-voice-build', 't10-m03-fine-tuning', 't13-m03-portfolio'],
  },
];

const mods = new Map(tracks.flatMap((t) => t.modules.map((m) => [m.id, { ...m, track: t }] as const)));

export const roadmaps = STAGES.map((s) => ({
  ...s,
  steps: s.modules.map((id) => {
    const m = mods.get(id);
    if (!m) throw new Error(`roadmap module ${id} not in curriculum`);
    return { id, title: m.title, track: m.track.title, trackId: m.track.id, trackN: m.track.n, lessons: m.lessons };
  }),
}));
