import { useEffect, useState } from 'react';
import type { STATS } from '../data/repos';

const TIER_COLORS: Record<string, string> = {
  S: '#ff2d55', A: '#ff6b35', B: '#f7b731', C: '#26de81', D: '#45aaf2', E: '#a29bfe',
};

function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return val;
}

export default function HeroStats({ stats }: { stats: typeof STATS }) {
  const total = useCountUp(stats.total);
  const avg = useCountUp(Math.round(stats.avgScore));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {/* Big stat */}
      <div className="col-span-2 sm:col-span-2 rounded-xl p-5" style={{ background: '#111318', border: '1px solid #21262d' }}>
        <div className="text-4xl font-black mb-1" style={{ color: '#ff2d55', fontVariantNumeric: 'tabular-nums' }}>
          {total.toLocaleString()}
        </div>
        <div className="text-sm" style={{ color: '#8b949e' }}>Total repos scored</div>
      </div>
      <div className="rounded-xl p-5" style={{ background: '#111318', border: '1px solid #21262d' }}>
        <div className="text-4xl font-black mb-1" style={{ color: '#f7b731', fontVariantNumeric: 'tabular-nums' }}>
          {avg}
        </div>
        <div className="text-sm" style={{ color: '#8b949e' }}>Avg severity</div>
      </div>

      {/* Per-tier */}
      {(['S', 'A', 'B', 'C', 'D', 'E'] as const).map(tier => {
        const count = stats.byTier[tier] ?? 0;
        const pct = ((count / stats.total) * 100).toFixed(0);
        return (
          <a
            key={tier}
            href={`/explorer?tier=${tier}`}
            className="rounded-xl p-4 flex flex-col no-underline transition-transform hover:scale-105"
            style={{ background: '#111318', border: `1px solid ${TIER_COLORS[tier]}44` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl font-black" style={{ color: TIER_COLORS[tier] }}>{tier}</span>
              <span className="text-xs" style={{ color: TIER_COLORS[tier], opacity: 0.7 }}>{pct}%</span>
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: '#e6edf3', fontVariantNumeric: 'tabular-nums' }}>
              {count}
            </div>
            <div className="h-1 rounded-full mt-auto" style={{ background: '#21262d' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: TIER_COLORS[tier] }} />
            </div>
          </a>
        );
      })}
    </div>
  );
}
