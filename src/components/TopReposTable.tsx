import type { Repo } from '../data/repos';

const TIER_COLORS: Record<string, string> = {
  S: '#ff2d55', A: '#ff6b35', B: '#f7b731', C: '#26de81', D: '#45aaf2', E: '#a29bfe',
};

function ScoreBar({ score, tier }: { score: number; tier: string }) {
  return (
    <div className="flex items-center gap-3 min-w-[140px]">
      <div className="flex-1 h-2 rounded-full" style={{ background: '#21262d' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, background: TIER_COLORS[tier] }}
        />
      </div>
      <span className="font-mono text-sm font-bold w-8 text-right" style={{ color: TIER_COLORS[tier] }}>
        {score}
      </span>
    </div>
  );
}

export default function TopReposTable({ repos }: { repos: Repo[] }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #21262d' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: '#111318', borderBottom: '1px solid #21262d' }}>
            <th className="px-4 py-3 text-left font-semibold w-8" style={{ color: '#8b949e' }}>#</th>
            <th className="px-4 py-3 text-left font-semibold" style={{ color: '#8b949e' }}>Repository</th>
            <th className="px-4 py-3 text-left font-semibold" style={{ color: '#8b949e' }}>Tier</th>
            <th className="px-4 py-3 text-left font-semibold" style={{ color: '#8b949e' }}>Category</th>
            <th className="px-4 py-3 text-left font-semibold min-w-[180px]" style={{ color: '#8b949e' }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {repos.map((r, i) => (
            <tr
              key={r.repo}
              className="transition-colors hover:bg-white/[0.02]"
              style={{ borderBottom: '1px solid #21262d' }}
            >
              <td className="px-4 py-3 font-mono" style={{ color: '#484f58' }}>{i + 1}</td>
              <td className="px-4 py-3">
                <span className="font-mono font-semibold" style={{ color: '#e6edf3' }}>{r.repo}</span>
              </td>
              <td className="px-4 py-3">
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-black"
                  style={{ background: `${TIER_COLORS[r.tier]}22`, color: TIER_COLORS[r.tier] }}
                >
                  {r.tier}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-0.5 rounded text-xs" style={{ background: '#21262d', color: '#8b949e' }}>
                  {r.category}
                </span>
              </td>
              <td className="px-4 py-3">
                <ScoreBar score={r.score} tier={r.tier} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
