// Goal paths: ordered lesson lists built from curriculum modules at build time.
// `start` says which module a visitor at each level should begin with (the picker links there).
import { tracks, lessons, type Lesson } from './data';

type Def = {
  id: string; title: string; short: string; who: string; goal: string; blurb: string;
  modules: string[]; start?: { intermediate?: string; advanced?: string };
};

const DEFS: Def[] = [
  {
    id: 'ai-at-work', title: 'Use AI at Work', short: 'AI at work', who: 'Working professionals', goal: 'Use AI at work',
    blurb: 'No code. Understand AI, use the best assistants well, write prompts that work and save hours every week safely.',
    modules: ['t00-m01-what-ai-is', 't00-m02-how-llms-work', 't00-m03-trust-safety', 't00-m05-everyday-safety', 't01-m01-chat-assistants',
      't01-m02-research-knowledge', 't01-m03-office-productivity', 't02-m01-prompt-basics', 't02-m03-prompts-for-work',
      't16-m04-marketing-content', 't16-m05-finance-accounting', 't16-m06-hr-operations', 't13-m06-ai-for-your-job', 't07-m01-automation-basics'],
    start: { intermediate: 't01-m01-chat-assistants', advanced: 't02-m03-prompts-for-work' },
  },
  {
    id: 'students', title: 'AI for Students', short: 'Students', who: 'Students', goal: 'Study smarter and get ready for AI careers',
    blurb: 'Free tools first. Learn how AI works, study with it honestly, research with real citations and see which AI jobs fit you.',
    modules: ['t00-m01-what-ai-is', 't00-m02-how-llms-work', 't00-m03-trust-safety', 't00-m05-everyday-safety', 't16-m01-students',
      't01-m01-chat-assistants', 't01-m02-research-knowledge', 't02-m01-prompt-basics', 't13-m01-roles', 't13-m02-learning-credentials'],
    start: { intermediate: 't16-m01-students', advanced: 't01-m02-research-knowledge' },
  },
  {
    id: 'teachers', title: 'AI for Teachers', short: 'Teachers', who: 'Teachers', goal: 'Use AI in the classroom',
    blurb: 'Plan lessons, give faster feedback and set AI rules students will follow, with free tools and honest limits.',
    modules: ['t00-m01-what-ai-is', 't00-m03-trust-safety', 't00-m05-everyday-safety', 't16-m02-teachers', 't01-m01-chat-assistants',
      't01-m02-research-knowledge', 't02-m01-prompt-basics'],
    start: { intermediate: 't16-m02-teachers', advanced: 't16-m02-teachers' },
  },
  {
    id: 'business-owner', title: 'Grow a Business With AI', short: 'Business owners', who: 'Small business owners', goal: 'Grow a business',
    blurb: 'Answer customers faster, make product content, plan marketing and automate orders, without hiring a developer.',
    modules: ['t00-m01-what-ai-is', 't00-m05-everyday-safety', 't16-m03-small-business', 't16-m04-marketing-content', 't01-m01-chat-assistants',
      't01-m04-image-tools', 't02-m03-prompts-for-work', 't07-m01-automation-basics', 't07-m02-n8n-ai-agents', 't07-m04-work-automations'],
    start: { intermediate: 't16-m04-marketing-content', advanced: 't07-m01-automation-basics' },
  },
  {
    id: 'leaders', title: 'AI Strategy for Leaders', short: 'Leaders', who: 'Managers and leaders', goal: 'Lead AI adoption',
    blurb: 'Non-coder friendly. Know what AI can do, pick use cases, decide build or buy, roll out safely and measure the impact.',
    modules: ['t00-m01-what-ai-is', 't00-m02-how-llms-work', 't00-m03-trust-safety', 't00-m04-ai-at-work', 't16-m07-leaders',
      't15-m06-ai-governance', 't13-m06-ai-for-your-job'],
    start: { intermediate: 't00-m04-ai-at-work', advanced: 't16-m07-leaders' },
  },
  {
    id: 'ai-job', title: 'Get an AI Engineering Job', short: 'AI job', who: 'Career switchers and graduates', goal: 'Get an AI job',
    blurb: 'Python, LLM APIs, RAG and agents, then tests, a portfolio and interview prep. The shortest honest route to an AI engineer role.',
    modules: ['t13-m01-roles', 't03-m01-setup', 't03-m03-python-basics', 't03-m04-data-apis', 't04-m01-how-ai-apps-work', 't04-m04-core-api-skills',
      't05-m01-rag-concepts', 't05-m02-ingestion-chunking', 't05-m03-embeddings', 't06-m01-agent-foundations', 't06-m02-agent-from-scratch',
      't09-m02-testing-evals', 't04-m06-ship-ai-app', 't13-m03-portfolio', 't13-m04-interviews'],
    start: { intermediate: 't04-m01-how-ai-apps-work', advanced: 't06-m02-agent-from-scratch' },
  },
  {
    id: 'build-agents', title: 'Build AI Agents and Apps', short: 'Agents & apps', who: 'Developers', goal: 'Build agents and apps',
    blurb: 'From your first API call to agents with tools, MCP and multi-agent teams, then a real app with login, streaming and deploy.',
    modules: ['t01-m07-coding-assistants', 't03-m01-setup', 't04-m01-how-ai-apps-work', 't04-m04-core-api-skills', 't04-m06-ship-ai-app', 't05-m01-rag-concepts',
      't05-m05-retrieval', 't06-m01-agent-foundations', 't06-m02-agent-from-scratch', 't06-m03-tools-reasoning', 't06-m07-mcp',
      't06-m08-multi-agent', 't06-m09-hitl-guardrails', 't09-m02-testing-evals', 't09-m06-deployment'],
    start: { intermediate: 't04-m04-core-api-skills', advanced: 't06-m03-tools-reasoning' },
  },
  {
    id: 'data-ai', title: 'Data and SQL With AI', short: 'Data & SQL', who: 'Analysts', goal: 'Analyse data with AI',
    blurb: 'Spreadsheets, pandas and SQL with an AI assistant, then a chat-with-your-database agent and dashboards.',
    modules: ['t01-m03-office-productivity', 't03-m02-notebooks-colab', 't03-m03-python-basics', 't03-m04-data-apis', 't03-m05-data-sql-ai'],
    start: { intermediate: 't03-m04-data-apis', advanced: 't03-m05-data-sql-ai' },
  },
  {
    id: 'train-models', title: 'Train and Fine-Tune Models', short: 'Train models', who: 'ML-curious developers', goal: 'Train models',
    blurb: 'The maths intuition, neural networks and transformers, then datasets, LoRA fine-tuning, preference tuning and shipping your model.',
    modules: ['t11-m01-maths-intuition', 't11-m03-neural-networks', 't11-m04-transformers', 't10-m01-how-training-works', 't10-m02-training-data',
      't10-m03-fine-tuning', 't10-m04-preference-tuning', 't10-m05-training-tools', 't10-m06-eval-compress-ship'],
    start: { intermediate: 't10-m01-how-training-works', advanced: 't10-m03-fine-tuning' },
  },
];

const mods = new Map(tracks.flatMap((t) => t.modules.map((m) => [m.id, { ...m, track: t }] as const)));
const byId = new Map(lessons.map((l) => [l.id, l]));

export type PathStep = { id: string; title: string; trackN: number; track: string; lessons: Lesson[] };
export type GoalPath = Def & { steps: PathStep[]; lessons: Lesson[]; minutes: number; live: number; startStep: Record<string, string> };

export const paths: GoalPath[] = DEFS.map((d) => {
  const steps = d.modules.map((id) => {
    const m = mods.get(id);
    if (!m) throw new Error(`path ${d.id}: module ${id} not in curriculum`);
    return { id, title: m.title, trackN: m.track.n, track: m.track.title, lessons: m.lessons.map((l) => byId.get(l.id)!) };
  });
  const ls = steps.flatMap((s) => s.lessons);
  return {
    ...d, steps, lessons: ls, minutes: ls.reduce((a, l) => a + (l.minutes || 0), 0), live: ls.filter((l) => l.live).length,
    startStep: { beginner: d.modules[0], intermediate: d.start?.intermediate || d.modules[0], advanced: d.start?.advanced || d.start?.intermediate || d.modules[0] },
  };
});
export const pathById = new Map(paths.map((p) => [p.id, p]));
export const pathsFor = (lessonId: string) =>
  paths.map((p) => ({ p, i: p.lessons.findIndex((l) => l.id === lessonId) })).filter((x) => x.i >= 0);

// Start-here picker: (who, goal) -> path id. Level only moves the starting step.
export const WHO = [['student', 'Student'], ['professional', 'Working professional'], ['developer', 'Developer'], ['business', 'Business owner'], ['leader', 'Leader or manager']] as const;
export const GOALS = [['work', 'Use AI at work'], ['job', 'Get an AI job'], ['build', 'Build agents and apps'], ['train', 'Train models'], ['business', 'Grow a business']] as const;
export function pick(who: string, goal: string): string {
  if (goal === 'job') return 'ai-job';
  if (goal === 'build') return 'build-agents';
  if (goal === 'train') return 'train-models';
  if (goal === 'business') return who === 'leader' ? 'leaders' : 'business-owner';
  // goal === 'work'
  return { student: 'students', developer: 'build-agents', business: 'business-owner', leader: 'leaders' }[who] || 'ai-at-work';
}
export const pickTable = Object.fromEntries(WHO.flatMap(([w]) => GOALS.map(([g]) => [`${w}|${g}`, pick(w, g)])));

// "More professions": one t16 module per profession (added 2026-10-31, produced last). Listed on /paths/professions/.
const PROFESSION_MODS: [string, string, string][] = [
  ['t16-m08-engineers', 'Engineers', 'Civil, mechanical and electrical'], ['t16-m09-it-pros', 'IT professionals', 'Non-AI developers and admins'],
  ['t16-m10-doctors', 'Doctors', 'Admin, learning and patient education'], ['t16-m11-nurses', 'Nurses and healthcare staff', 'Training, rosters and communication'],
  ['t16-m12-pharmacists', 'Pharmacists', 'Stock, expiry and counselling notes'], ['t16-m13-lawyers', 'Lawyers', 'Research aid, never legal advice'],
  ['t16-m14-ca-tax', 'CAs and tax professionals', 'GST, income tax and client queries'], ['t16-m15-architects', 'Architects', 'Concepts, briefs and presentations'],
  ['t16-m16-interior', 'Interior designers', 'Mood boards, materials and quotes'], ['t16-m17-real-estate', 'Real estate agents', 'Listings, leads and follow-ups'],
  ['t16-m18-sales', 'Sales professionals', 'Prospect research and pitches'], ['t16-m19-support', 'Customer support teams', 'Replies, tagging and help articles'],
  ['t16-m20-journalists', 'Journalists and writers', 'Research, transcripts and fact-checks'], ['t16-m21-designers', 'Graphic and UI designers', 'Ideas, layouts and brand kits'],
  ['t16-m22-creators', 'Content creators and YouTubers', 'Scripts, thumbnails and calendars'], ['t16-m23-freelancers', 'Freelancers', 'Proposals, invoices and onboarding'],
  ['t16-m24-shopkeepers', 'Shop and retail owners', 'Offers, stock and WhatsApp'], ['t16-m25-manufacturing', 'Manufacturing and factory managers', 'SOPs, downtime and shift reports'],
  ['t16-m26-hospitality', 'Restaurant and hospitality owners', 'Menus, reviews and rosters'], ['t16-m27-farmers', 'Farmers and agri-business', 'Records, mandi prices and schemes'],
  ['t16-m28-govt-exams', 'Government exam aspirants', 'Study maps, notes and mock tests'],
];
export const SENSITIVE_PROFESSIONS = new Set(['t16-m10-doctors', 't16-m11-nurses', 't16-m12-pharmacists', 't16-m13-lawyers', 't16-m14-ca-tax']);
export const professions = PROFESSION_MODS.map(([id, name, focus]) => {
  const m = mods.get(id);
  if (!m) throw new Error(`profession module ${id} not in curriculum`);
  return { id, name, focus, title: m.title, lessons: m.lessons.map((l) => byId.get(l.id)!) };
});
