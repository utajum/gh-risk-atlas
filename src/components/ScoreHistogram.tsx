import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { STATS } from '../data/repos';

const gradient = [
  '#a29bfe','#a29bfe','#a29bfe',
  '#45aaf2','#45aaf2',
  '#26de81','#26de81',
  '#f7b731',
  '#ff6b35',
  '#ff2d55',
];

export default function ScoreHistogram({ stats }: { stats: typeof STATS }) {
  const labels = ['0-9','10-19','20-29','30-39','40-49','50-59','60-69','70-79','80-89','90-100'];
  const data = stats.scoreDistribution.map((count, i) => ({
    label: labels[i],
    count,
    color: gradient[i],
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barCategoryGap="20%">
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#8b949e', fontSize: 10 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8b949e', fontSize: 11 }} />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={{ background: '#161a22', border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3' }}
          formatter={(v: number) => [v, 'repos']}
          labelFormatter={(l: string) => `Score: ${l}`}
        />
        <ReferenceLine x="50-59" stroke="#30363d" strokeDasharray="4 2" label={{ value: 'mid', fill: '#484f58', fontSize: 10 }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map(d => <Cell key={d.label} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
