import rawData from './repos-data.json';

export interface Repo {
  repo: string;
  score: number;
  tier: 'S' | 'A' | 'B' | 'C' | 'D' | 'E';
  category: string;
  rationale: string;
  cost_usd: number;
  duration_ms: number;
  size: number;
  org: string;
}

export const TIER_LABELS: Record<string, string> = {
  S: 'Crown Jewels',
  A: 'Customer Data',
  B: 'Core Infra',
  C: 'Internal Tools',
  D: 'Build & Docs',
  E: 'Low Risk',
};

export const TIER_BANDS: Record<string, string> = {
  S: '95-100',
  A: '85-94',
  B: '70-84',
  C: '50-69',
  D: '25-49',
  E: '1-24',
};

export const TIER_COLORS: Record<string, string> = {
  S: '#ff2d55',
  A: '#ff6b35',
  B: '#f7b731',
  C: '#26de81',
  D: '#45aaf2',
  E: '#a29bfe',
};

export const TIER_DESC: Record<string, string> = {
  S: 'Authentication, secrets, access control - bypassing these enables complete customer data compromise.',
  A: 'Billing, support tickets, audit logs, package registries, supply-chain control - direct customer data.',
  B: 'Network, DNS, Kubernetes, hosted compute, log pipelines - major infrastructure.',
  C: 'Internal tooling, Copilot subsystems, chatops, feature flags - real but indirect exposure.',
  D: 'Build tools, dashboards, internal docs, employee tools - low sensitivity.',
  E: 'Marketing, fonts, demos, scratch repos, deprecated - negligible risk.',
};

export const ALL_REPOS: Repo[] = rawData as Repo[];

export const STATS = {
  total: ALL_REPOS.length,
  byTier: Object.fromEntries(
    ['S', 'A', 'B', 'C', 'D', 'E'].map((t) => [
      t,
      ALL_REPOS.filter((r) => r.tier === t).length,
    ]),
  ) as Record<string, number>,
  avgScore: +(
    ALL_REPOS.reduce((s, r) => s + r.score, 0) / ALL_REPOS.length
  ).toFixed(1),
  topCategories: (() => {
    const m = new Map<string, number>();
    for (const r of ALL_REPOS) m.set(r.category, (m.get(r.category) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  })(),
  orgs: (() => {
    const m = new Map<string, number>();
    for (const r of ALL_REPOS) {
      const k = r.org || 'github';
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  })(),
  scoreDistribution: (() => {
    const buckets: number[] = new Array(10).fill(0);
    for (const r of ALL_REPOS) buckets[Math.min(9, Math.floor(r.score / 10))]++;
    return buckets;
  })(),
};
