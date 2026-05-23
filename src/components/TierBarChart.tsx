import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import type { STATS } from '../data/repos';

const TIER_COLORS: Record<string, string> = {
  S: '#ff2d55', A: '#ff6b35', B: '#f7b731', C: '#26de81', D: '#45aaf2', E: '#a29bfe',
};
const TIER_LABELS: Record<string, string> = {
  S: 'Crown Jewels', A: 'Customer Data', B: 'Core Infra',
  C: 'Internal Tools', D: 'Build & Docs', E: 'Low Risk',
};

export default function TierBarChart({ stats }: { stats: typeof STATS }) {
  const data = ['S', 'A', 'B', 'C', 'D', 'E'].map(t => ({
    tier: t,
    count: stats.byTier[t] ?? 0,
    label: TIER_LABELS[t],
    color: TIER_COLORS[t],
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barCategoryGap="28%">
        <XAxis dataKey="tier" axisLine={false} tickLine={false} tick={{ fill: '#8b949e', fontSize: 13, fontWeight: 700 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8b949e', fontSize: 11 }} />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={{ background: '#161a22', border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3' }}
          formatter={(v: number, _: string, props: { payload?: { label: string } }) => [v, props.payload?.label ?? '']}
          labelFormatter={() => ''}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map(d => <Cell key={d.tier} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
