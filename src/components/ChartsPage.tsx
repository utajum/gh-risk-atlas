import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  BarChart, Bar, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  Treemap, Legend, CartesianGrid,
} from 'recharts';
import type { Repo } from '../data/repos';
import type { STATS } from '../data/repos';

const TIER_COLORS: Record<string, string> = {
  S: '#ff2d55', A: '#ff6b35', B: '#f7b731', C: '#26de81', D: '#45aaf2', E: '#a29bfe',
};
const TIER_LABELS: Record<string, string> = {
  S: 'Crown Jewels', A: 'Customer Data', B: 'Core Infra',
  C: 'Internal Tools', D: 'Build & Docs', E: 'Low Risk',
};

const card = {
  background: '#111318',
  border: '1px solid #21262d',
  borderRadius: 12,
  padding: 20,
};

function TT({ contentStyle = {}, ...rest }: Parameters<typeof Tooltip>[0]) {
  return <Tooltip {...rest} contentStyle={{ background: '#161a22', border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3', ...contentStyle }} />;
}

/* ── Scatter: log(size) vs score, coloured by tier ── */
function ScatterPlot({ repos }: { repos: Repo[] }) {
  // sample to 1000 to keep rendering fast
  const sample = repos.filter((_, i) => i % Math.ceil(repos.length / 1000) === 0);
  const data = sample.map(r => ({
    x: r.size > 0 ? Math.log10(r.size + 1) : 0,
    y: r.score,
    tier: r.tier,
    repo: r.repo,
    size: r.size,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
        <XAxis
          dataKey="x" type="number" name="log₁₀(size)"
          tick={{ fill: '#8b949e', fontSize: 10 }}
          tickFormatter={v => `${Math.pow(10, v | 0).toLocaleString().slice(0,4)}`}
          label={{ value: 'Archive size (log scale)', position: 'insideBottom', offset: -10, fill: '#8b949e', fontSize: 11 }}
        />
        <YAxis
          dataKey="y" type="number" name="score"
          domain={[0, 100]}
          tick={{ fill: '#8b949e', fontSize: 10 }}
          label={{ value: 'Severity %', angle: -90, position: 'insideLeft', fill: '#8b949e', fontSize: 11 }}
        />
        <TT
          cursor={{ strokeDasharray: '3 3' }}
          formatter={(_v: unknown, name: string, p: { payload?: { repo: string; y: number; tier: string } }) => {
            const payload = p.payload;
            if (!payload) return ['-', name];
            return name === 'y'
              ? [`${payload.y}%`, `${payload.repo} (${payload.tier})`]
              : [_v as string, name];
          }}
        />
        {(['S','A','B','C','D','E'] as const).map(tier => (
          <Scatter key={tier} name={tier} data={data.filter(d => d.tier === tier)} fill={TIER_COLORS[tier]} opacity={0.7} r={3} />
        ))}
        <Legend
          formatter={(val: string) => <span style={{ color: TIER_COLORS[val] }}>{val}</span>}
          wrapperStyle={{ color: '#8b949e', fontSize: 12 }}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/* ── Category top-20 horizontal bar ── */
function CategoryBar({ repos }: { repos: Repo[] }) {
  const m = new Map<string, number>();
  for (const r of repos) m.set(r.category, (m.get(r.category) ?? 0) + 1);
  const data = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([cat, count]) => ({ cat, count }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 120 }}>
        <XAxis type="number" tick={{ fill: '#8b949e', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="cat" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} width={115} />
        <TT formatter={(v: number) => [v, 'repos']} labelFormatter={(l: string) => `Category: ${l}`} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#45aaf2" />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Tier pie ── */
function TierPie({ stats }: { stats: typeof STATS }) {
  const data = ['S','A','B','C','D','E'].map(t => ({
    name: `${t}: ${TIER_LABELS[t]}`,
    value: stats.byTier[t] ?? 0,
    tier: t,
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={100} innerRadius={50}
          label={({ tier, percent }: { tier: string; percent: number }) => `${tier} ${(percent * 100).toFixed(0)}%`}
          labelLine={{ stroke: '#30363d' }}
        >
          {data.map(d => <Cell key={d.tier} fill={TIER_COLORS[d.tier]} />)}
        </Pie>
        <TT formatter={(v: number, _: string, p: { payload?: { name: string } }) => [v, p.payload?.name ?? '']} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ── Radar: avg score per org/source ── */
function OrgRadar({ stats }: { stats: typeof STATS }) {
  const data = stats.orgs.slice(0, 6).map(([org, count]) => ({
    org: org || 'github',
    count,
  }));
  const max = Math.max(...data.map(d => d.count));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius={90}>
        <PolarGrid stroke="#21262d" />
        <PolarAngleAxis dataKey="org" tick={{ fill: '#8b949e', fontSize: 11 }} />
        <Radar name="repos" dataKey="count" stroke="#ff2d55" fill="#ff2d55" fillOpacity={0.25} />
        <TT formatter={(v: number) => [v, 'repos']} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* ── Treemap of categories coloured by avg score ── */
function CategoryTreemap({ repos }: { repos: Repo[] }) {
  const m = new Map<string, { total: number; count: number }>();
  for (const r of repos) {
    const e = m.get(r.category) ?? { total: 0, count: 0 };
    e.total += r.score; e.count++;
    m.set(r.category, e);
  }
  const data = [...m.entries()]
    .filter(([, v]) => v.count >= 5)
    .map(([cat, { total, count }]) => ({
      name: cat,
      size: count,
      avg: Math.round(total / count),
    }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 40);

  const getColor = (avg: number) => {
    if (avg >= 90) return '#ff2d55';
    if (avg >= 80) return '#ff6b35';
    if (avg >= 70) return '#f7b731';
    if (avg >= 50) return '#26de81';
    if (avg >= 25) return '#45aaf2';
    return '#a29bfe';
  };

  const CustomContent = (props: { x?: number; y?: number; width?: number; height?: number; name?: string; avg?: number }) => {
    const { x = 0, y = 0, width = 0, height = 0, name, avg = 0 } = props;
    if (width < 40 || height < 30) return null;
    return (
      <g>
        <rect x={x+1} y={y+1} width={width-2} height={height-2} fill={getColor(avg)} opacity={0.7} rx={4} />
        <text x={x + width/2} y={y + height/2 - 5} textAnchor="middle" fill="white" fontSize={Math.min(11, width/6)} fontWeight={600}>
          {name && name.length > 14 ? name.slice(0, 12) + '…' : name}
        </text>
        <text x={x + width/2} y={y + height/2 + 9} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={10}>
          {avg}%
        </text>
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={380}>
      <Treemap
        data={data}
        dataKey="size"
        aspectRatio={4/3}
        stroke="#0a0b0e"
        content={<CustomContent />}
      >
        <TT formatter={(v: number, _: string, p: { payload?: { name: string; avg: number } }) => [
          `${v} repos · avg ${p.payload?.avg}%`, p.payload?.name ?? ''
        ]} />
      </Treemap>
    </ResponsiveContainer>
  );
}

/* ── Score percentile line ── */
function PercentileLine({ repos }: { repos: Repo[] }) {
  const sorted = [...repos].sort((a, b) => a.score - b.score);
  const step = Math.ceil(sorted.length / 100);
  const data = Array.from({ length: 100 }, (_, i) => {
    const idx = Math.min(i * step, sorted.length - 1);
    return { percentile: i + 1, score: sorted[idx].score };
  });

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barCategoryGap={0}>
        <XAxis dataKey="percentile" tick={{ fill: '#8b949e', fontSize: 9 }} tickCount={11}
          label={{ value: 'Percentile', position: 'insideBottom', offset: -8, fill: '#8b949e', fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fill: '#8b949e', fontSize: 10 }}
          label={{ value: 'Score', angle: -90, position: 'insideLeft', fill: '#8b949e', fontSize: 11 }} />
        <TT formatter={(v: number) => [`${v}%`, 'score']} labelFormatter={(l: number) => `${l}th percentile`} />
        <Bar dataKey="score" radius={0}>
          {data.map(d => <Cell key={d.percentile} fill={
            d.score >= 90 ? '#ff2d55' : d.score >= 80 ? '#ff6b35' :
            d.score >= 70 ? '#f7b731' : d.score >= 50 ? '#26de81' :
            d.score >= 25 ? '#45aaf2' : '#a29bfe'
          } />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Main ── */
export default function ChartsPage({ repos, stats }: { repos: Repo[]; stats: typeof STATS }) {
  return (
    <div className="space-y-8">

      {/* Row 1: scatter + pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div style={{ ...card, gridColumn: 'span 2' }}>
          <h3 className="font-semibold mb-1" style={{ color: '#e6edf3' }}>Archive size vs Severity</h3>
          <p className="text-xs mb-4" style={{ color: '#8b949e' }}>
            Sampled 1,000 repos · each dot is one repository · log scale X axis
          </p>
          <ScatterPlot repos={repos} />
        </div>
        <div style={card}>
          <h3 className="font-semibold mb-4" style={{ color: '#e6edf3' }}>Tier distribution</h3>
          <TierPie stats={stats} />
        </div>
      </div>

      {/* Row 2: percentile curve */}
      <div style={card}>
        <h3 className="font-semibold mb-1" style={{ color: '#e6edf3' }}>Score percentile curve</h3>
        <p className="text-xs mb-4" style={{ color: '#8b949e' }}>
          ~80% of repos score below 60 · the S-tier spike is visible at the far right
        </p>
        <PercentileLine repos={repos} />
      </div>

      {/* Row 3: category treemap + category bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div style={card}>
          <h3 className="font-semibold mb-1" style={{ color: '#e6edf3' }}>Category treemap</h3>
          <p className="text-xs mb-4" style={{ color: '#8b949e' }}>
            Box size = repo count · colour = average score (red = high risk)
          </p>
          <CategoryTreemap repos={repos} />
        </div>
        <div style={card}>
          <h3 className="font-semibold mb-4" style={{ color: '#e6edf3' }}>Top 20 categories by volume</h3>
          <CategoryBar repos={repos} />
        </div>
      </div>

      {/* Row 4: org radar + top-10 stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div style={card}>
          <h3 className="font-semibold mb-4" style={{ color: '#e6edf3' }}>Repos by org</h3>
          <OrgRadar stats={stats} />
        </div>
        <div style={{ ...card, gridColumn: 'span 2' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#e6edf3' }}>Tier summary</h3>
          <div className="space-y-3">
            {(['S','A','B','C','D','E'] as const).map(t => {
              const count = stats.byTier[t] ?? 0;
              const pct = ((count / stats.total) * 100).toFixed(1);
              const tierRepos = repos.filter(r => r.tier === t);
              const avg = tierRepos.length > 0
                ? Math.round(tierRepos.reduce((s, r) => s + r.score, 0) / tierRepos.length)
                : 0;
              const maxSize = tierRepos.reduce((m, r) => Math.max(m, r.size), 0);
              const sizeFmt = maxSize > 1e9 ? `${(maxSize/1e9).toFixed(1)} GB`
                : maxSize > 1e6 ? `${(maxSize/1e6).toFixed(0)} MB`
                : maxSize > 1e3 ? `${(maxSize/1e3).toFixed(0)} KB` : `${maxSize} B`;
              return (
                <div key={t} className="flex items-center gap-4">
                  <span className="w-7 h-7 rounded flex items-center justify-center text-sm font-black shrink-0"
                    style={{ background: `${TIER_COLORS[t]}22`, color: TIER_COLORS[t] }}>{t}</span>
                  <div className="flex-1">
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#21262d' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: TIER_COLORS[t] }} />
                    </div>
                  </div>
                  <span className="w-10 text-right font-mono text-sm font-bold" style={{ color: TIER_COLORS[t] }}>{count}</span>
                  <span className="w-12 text-right text-xs" style={{ color: '#8b949e' }}>{pct}%</span>
                  <span className="w-16 text-right text-xs" style={{ color: '#484f58' }}>avg {avg}%</span>
                  <span className="w-20 text-right text-xs hidden lg:block" style={{ color: '#484f58' }}>max {sizeFmt}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
