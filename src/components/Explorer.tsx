import { useState, useMemo, useEffect, useCallback } from 'react';
import Fuse from 'fuse.js';
import type { Repo } from '../data/repos';

const TIER_COLORS: Record<string, string> = {
  S: '#ff2d55',
  A: '#ff6b35',
  B: '#f7b731',
  C: '#26de81',
  D: '#45aaf2',
  E: '#a29bfe',
};
const TIER_LABELS: Record<string, string> = {
  S: 'Crown Jewels',
  A: 'Customer Data',
  B: 'Core Infra',
  C: 'Internal Tools',
  D: 'Build & Docs',
  E: 'Low Risk',
};

function ScoreBar({ score, tier }: { score: number; tier: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1.5 rounded-full"
        style={{ background: '#21262d' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, background: TIER_COLORS[tier] }}
        />
      </div>
      <span
        className="font-mono text-xs font-bold w-6 text-right"
        style={{ color: TIER_COLORS[tier] }}>
        {score}
      </span>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const color = TIER_COLORS[tier];
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-black"
      style={{ background: `${color}22`, color }}>
      {tier}
    </span>
  );
}

function sizeLabel(size: number | null | undefined) {
  if (!size || size <= 0) return '-';
  if (size > 1e9) return `${(size / 1e9).toFixed(1)} GB`;
  if (size > 1e6) return `${(size / 1e6).toFixed(1)} MB`;
  if (size > 1e3) return `${(size / 1e3).toFixed(1)} KB`;
  return `${size} B`;
}

// ── Card (grid view) ──────────────────────────────────────────────────────────

function RepoCard({ repo, rank }: { repo: Repo; rank: number }) {
  const color = TIER_COLORS[repo.tier];
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: '#111318', border: `1px solid ${color}33` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="font-mono text-xs shrink-0"
            style={{ color: '#484f58' }}>
            #{rank}
          </span>
          <TierBadge tier={repo.tier} />
          <span
            className="font-mono text-sm font-semibold truncate"
            style={{ color: '#e6edf3' }}
            title={repo.repo}>
            {repo.repo}
          </span>
        </div>
        <span
          className="font-mono text-base font-black shrink-0"
          style={{ color }}>
          {repo.score}%
        </span>
      </div>

      <ScoreBar score={repo.score} tier={repo.tier} />

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{ background: '#21262d', color: '#8b949e' }}>
          {repo.category}
        </span>
        {repo.org && (
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ background: '#161a22', color: '#484f58' }}>
            {repo.org}
          </span>
        )}
        <span className="text-xs ml-auto" style={{ color: '#484f58' }}>
          {sizeLabel(repo.size)}
        </span>
      </div>

      <p
        className="text-xs leading-relaxed pt-2"
        style={{ borderTop: '1px solid #21262d', color: '#8b949e' }}>
        <span className="font-semibold" style={{ color: '#e6edf3' }}>
          Why:{' '}
        </span>
        {repo.rationale}
      </p>
    </div>
  );
}

// ── Table (list view) ────────────────────────────────────────────────────────

type ColKey =
  | 'rank'
  | 'repo'
  | 'score'
  | 'tier'
  | 'category'
  | 'org'
  | 'size'
  | 'rationale';

const COLUMNS: {
  key: ColKey;
  label: string;
  sortable: boolean;
  width?: string;
}[] = [
  { key: 'rank', label: '#', sortable: false, width: '3rem' },
  { key: 'score', label: 'Score', sortable: true, width: '7rem' },
  { key: 'tier', label: 'Tier', sortable: true, width: '5rem' },
  { key: 'repo', label: 'Repository', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'org', label: 'Org', sortable: true, width: '7rem' },
  { key: 'size', label: 'Size', sortable: true, width: '7rem' },
  { key: 'rationale', label: 'Why', sortable: false },
];

function SortIcon({ dir }: { dir: 'asc' | 'desc' | null }) {
  if (!dir) return <span style={{ color: '#30363d', fontSize: 10 }}>⇅</span>;
  return (
    <span style={{ color: '#ff2d55', fontSize: 10 }}>
      {dir === 'asc' ? '↑' : '↓'}
    </span>
  );
}

function TableView({
  repos,
  offset,
  tableSort,
  setTableSort,
  tableAsc,
  setTableAsc,
}: {
  repos: Repo[];
  offset: number;
  tableSort: ColKey;
  setTableSort: (k: ColKey) => void;
  tableAsc: boolean;
  setTableAsc: (v: boolean) => void;
}) {
  const handleHeader = (col: ColKey) => {
    if (!COLUMNS.find((c) => c.key === col)?.sortable) return;
    if (tableSort === col) setTableAsc(!tableAsc);
    else {
      setTableSort(col);
      setTableAsc(col !== 'score');
    }
  };

  return (
    <div
      className="rounded-xl overflow-auto"
      style={{ border: '1px solid #21262d' }}>
      <table
        className="w-full text-xs"
        style={{ borderCollapse: 'collapse', minWidth: 900 }}>
        <thead>
          <tr
            style={{
              background: '#0d1117',
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => handleHeader(col.key)}
                style={{
                  padding: '10px 12px',
                  textAlign: 'left',
                  color: '#8b949e',
                  fontWeight: 600,
                  borderBottom: '1px solid #21262d',
                  width: col.width,
                  cursor: col.sortable ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}
                className={col.sortable ? 'hover:text-white' : ''}>
                <span className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <SortIcon
                      dir={
                        tableSort === col.key
                          ? tableAsc
                            ? 'asc'
                            : 'desc'
                          : null
                      }
                    />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {repos.map((r, i) => {
            const color = TIER_COLORS[r.tier];
            return (
              <tr
                key={r.repo}
                style={{ borderBottom: '1px solid #21262d' }}
                className="transition-colors hover:bg-white/[0.02]">
                <td
                  style={{
                    padding: '8px 12px',
                    color: '#484f58',
                    fontFamily: 'monospace',
                  }}>
                  {offset + i + 1}
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <div
                    className="flex items-center gap-2"
                    style={{ minWidth: 90 }}>
                    <div
                      style={{
                        flex: 1,
                        height: 4,
                        background: '#21262d',
                        borderRadius: 2,
                      }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${r.score}%`,
                          background: color,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        color,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        width: 24,
                        textAlign: 'right',
                      }}>
                      {r.score}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      background: `${color}22`,
                      color,
                      fontWeight: 900,
                      fontSize: 11,
                    }}>
                    {r.tier}
                  </span>
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <span
                    style={{
                      color: '#e6edf3',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                    }}>
                    {r.repo}
                  </span>
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <span
                    style={{
                      background: '#21262d',
                      color: '#8b949e',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}>
                    {r.category}
                  </span>
                </td>
                <td style={{ padding: '8px 12px', color: '#484f58' }}>
                  {r.org || '-'}
                </td>
                <td
                  style={{
                    padding: '8px 12px',
                    color: '#484f58',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                  }}>
                  {sizeLabel(r.size)}
                </td>
                <td
                  style={{
                    padding: '8px 12px',
                    color: '#8b949e',
                    maxWidth: 420,
                  }}>
                  {r.rationale}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Controls bar (shared) ────────────────────────────────────────────────────

type SortKey = 'score' | 'repo' | 'size';

interface Filters {
  query: string;
  tier: string;
  category: string;
  minScore: number;
}

function ControlsBar({
  filters,
  setFilters,
  sort,
  setSort,
  asc,
  setAsc,
  total,
  filtered,
  repos,
  view,
  setView,
}: {
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  asc: boolean;
  setAsc: (v: boolean) => void;
  total: number;
  filtered: number;
  repos: Repo[];
  view: 'grid' | 'table';
  setView: (v: 'grid' | 'table') => void;
}) {
  const byTier: Record<string, number> = {};
  for (const r of repos) byTier[r.tier] = (byTier[r.tier] ?? 0) + 1;

  const categories = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of repos) m.set(r.category, (m.get(r.category) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }, [repos]);

  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{ background: '#111318', border: '1px solid #21262d' }}>
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: '#484f58' }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search name, category, rationale…"
            value={filters.query}
            onChange={(e) => setFilters({ query: e.target.value })}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
            style={{
              background: '#0a0b0e',
              border: '1px solid #30363d',
              color: '#e6edf3',
            }}
          />
        </div>

        {/* Tier */}
        <select
          value={filters.tier}
          onChange={(e) => setFilters({ tier: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            background: '#0a0b0e',
            border: '1px solid #30363d',
            color: filters.tier ? TIER_COLORS[filters.tier] : '#8b949e',
          }}>
          <option value="">All tiers</option>
          {['S', 'A', 'B', 'C', 'D', 'E'].map((t) => (
            <option key={t} value={t}>
              {t} - {TIER_LABELS[t]} ({byTier[t] ?? 0})
            </option>
          ))}
        </select>

        {/* Category */}
        <select
          value={filters.category}
          onChange={(e) => setFilters({ category: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            background: '#0a0b0e',
            border: '1px solid #30363d',
            color: '#8b949e',
          }}>
          <option value="">All categories</option>
          {categories.slice(0, 60).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Min score slider - fixed total width so layout never shifts */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: 240,
            flexShrink: 0,
          }}>
          <span
            className="font-mono text-xs whitespace-nowrap"
            style={{
              color: '#8b949e',
              width: 44,
              textAlign: 'right',
              flexShrink: 0,
            }}>
            ≥
            <span style={{ color: '#e6edf3', fontWeight: 700 }}>
              {filters.minScore}
            </span>
            %
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={filters.minScore}
            onChange={(e) => setFilters({ minScore: +e.target.value })}
            style={{
              flex: 1,
              ['--pct' as string]: `${filters.minScore}%`,
            }}
          />
          {/* always-visible X - dimmed when at 0, active when > 0 */}
          <button
            onClick={() => setFilters({ minScore: 0 })}
            title="Reset score filter"
            style={{
              width: 18,
              height: 18,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: filters.minScore > 0 ? 'pointer' : 'default',
              color: filters.minScore > 0 ? '#8b949e' : '#2d3139',
              fontSize: 12,
              padding: 0,
              transition: 'color 0.15s',
              borderRadius: 3,
            }}>
            ✕
          </button>
        </div>

        {/* Sort (only relevant for grid; table has own column headers) */}
        {view === 'grid' && (
          <>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{
                background: '#0a0b0e',
                border: '1px solid #30363d',
                color: '#8b949e',
              }}>
              <option value="score">Score</option>
              <option value="repo">Name A-Z</option>
              <option value="size">Size</option>
            </select>
            <button
              onClick={() => setAsc(!asc)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{
                background: '#0a0b0e',
                border: '1px solid #30363d',
                color: '#8b949e',
                cursor: 'pointer',
              }}>
              {asc ? '↑ Asc' : '↓ Desc'}
            </button>
          </>
        )}

        {/* View toggle */}
        <div
          className="ml-auto flex rounded-lg overflow-hidden"
          style={{ border: '1px solid #30363d' }}>
          {(['grid', 'table'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-2 text-sm transition-colors"
              style={{
                background: view === v ? '#ff2d55' : '#0a0b0e',
                color: view === v ? 'white' : '#8b949e',
                border: 'none',
                cursor: 'pointer',
                fontWeight: view === v ? 600 : 400,
              }}>
              {v === 'grid' ? '▦ Grid' : '☰ Table'}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <div
        className="flex items-center justify-between mt-3 text-xs"
        style={{ color: '#8b949e' }}>
        <span>
          <strong style={{ color: '#e6edf3' }}>
            {filtered.toLocaleString()}
          </strong>{' '}
          repos
          {filtered !== total && ` (of ${total.toLocaleString()})`}
        </span>
      </div>
    </div>
  );
}

// ── Paginator ────────────────────────────────────────────────────────────────

function Paginator({
  page,
  pageCount,
  setPage,
}: {
  page: number;
  pageCount: number;
  setPage: (p: number) => void;
}) {
  if (pageCount <= 1) return null;
  const pages: number[] = [];
  if (pageCount <= 9) {
    for (let i = 0; i < pageCount; i++) pages.push(i);
  } else {
    pages.push(0);
    if (page > 3) pages.push(-1); // ellipsis
    for (
      let i = Math.max(1, page - 2);
      i <= Math.min(pageCount - 2, page + 2);
      i++
    )
      pages.push(i);
    if (page < pageCount - 4) pages.push(-2); // ellipsis
    pages.push(pageCount - 1);
  }

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap mt-6">
      <button
        disabled={page === 0}
        onClick={() => setPage(page - 1)}
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          background: '#161a22',
          border: '1px solid #30363d',
          color: '#e6edf3',
          cursor: page === 0 ? 'not-allowed' : 'pointer',
          opacity: page === 0 ? 0.4 : 1,
        }}>
        ← Prev
      </button>
      {pages.map((p, idx) =>
        p < 0 ? (
          <span
            key={`e${idx}`}
            style={{ color: '#484f58', padding: '6px 4px' }}>
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => setPage(p)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: p === page ? '#ff2d55' : '#161a22',
              border: '1px solid #30363d',
              color: p === page ? 'white' : '#8b949e',
              cursor: 'pointer',
              fontWeight: p === page ? 700 : 400,
            }}>
            {p + 1}
          </button>
        ),
      )}
      <button
        disabled={page >= pageCount - 1}
        onClick={() => setPage(page + 1)}
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          background: '#161a22',
          border: '1px solid #30363d',
          color: '#e6edf3',
          cursor: page >= pageCount - 1 ? 'not-allowed' : 'pointer',
          opacity: page >= pageCount - 1 ? 0.4 : 1,
        }}>
        Next -
      </button>
    </div>
  );
}

// ── Main Explorer ────────────────────────────────────────────────────────────

export default function Explorer({
  repos,
  stats,
}: {
  repos: Repo[];
  stats: { total: number; byTier: Record<string, number> };
}) {
  const [filters, _setFilters] = useState<Filters>({
    query: '',
    tier: '',
    category: '',
    minScore: 0,
  });
  const [sort, setSort] = useState<SortKey>('score');
  const [asc, setAsc] = useState(false);
  const [view, setView] = useState<'grid' | 'table'>('table');
  const [page, setPage] = useState(0);

  // Per-view page counts
  const GRID_PER = 60;
  const TABLE_PER = 100;
  const PER_PAGE = view === 'table' ? TABLE_PER : GRID_PER;

  // Table-only sort state (separate from grid sort)
  const [tableSort, setTableSort] = useState<ColKey>('score');
  const [tableAsc, setTableAsc] = useState(false);

  const setFilters = useCallback((patch: Partial<Filters>) => {
    _setFilters((prev) => ({ ...prev, ...patch }));
    setPage(0);
  }, []);

  // Read ?tier= from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = new URLSearchParams(window.location.search).get('tier');
    if (t) _setFilters((prev) => ({ ...prev, tier: t }));
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(repos, {
        keys: ['repo', 'category', 'rationale'],
        threshold: 0.35,
      }),
    [repos],
  );

  // Filter
  const filtered = useMemo(() => {
    let r: Repo[];
    if (filters.query.length > 1) {
      r = fuse.search(filters.query).map((x) => x.item);
    } else {
      r = [...repos];
    }
    if (filters.tier) r = r.filter((x) => x.tier === filters.tier);
    if (filters.category) r = r.filter((x) => x.category === filters.category);
    if (filters.minScore > 0) r = r.filter((x) => x.score >= filters.minScore);
    return r;
  }, [filters, repos, fuse]);

  // Sort for grid view
  const gridSorted = useMemo(() => {
    const r = [...filtered];
    r.sort((a, b) => {
      const cmp =
        sort === 'score'
          ? b.score - a.score
          : sort === 'size'
            ? b.size - a.size
            : a.repo.localeCompare(b.repo);
      return asc ? -cmp : cmp;
    });
    return r;
  }, [filtered, sort, asc]);

  // Sort for table view (independent column-header sort)
  const tableSorted = useMemo(() => {
    const r = [...filtered];
    r.sort((a, b) => {
      let cmp = 0;
      switch (tableSort) {
        case 'score':
          cmp = b.score - a.score;
          break;
        case 'tier':
          cmp = a.tier.localeCompare(b.tier);
          break;
        case 'repo':
          cmp = a.repo.localeCompare(b.repo);
          break;
        case 'category':
          cmp = a.category.localeCompare(b.category);
          break;
        case 'org':
          cmp = (a.org || '').localeCompare(b.org || '');
          break;
        case 'size':
          cmp = b.size - a.size;
          break;
        default:
          cmp = b.score - a.score;
      }
      return tableAsc ? -cmp : cmp;
    });
    return r;
  }, [filtered, tableSort, tableAsc]);

  const activeSorted = view === 'table' ? tableSorted : gridSorted;
  const pageCount = Math.ceil(activeSorted.length / PER_PAGE);
  const safePageCount = pageCount > 0 ? pageCount : 1;
  const safePage = Math.min(page, safePageCount - 1);
  const visible = activeSorted.slice(
    safePage * PER_PAGE,
    (safePage + 1) * PER_PAGE,
  );

  return (
    <div>
      <ControlsBar
        filters={filters}
        setFilters={setFilters}
        sort={sort}
        setSort={setSort}
        asc={asc}
        setAsc={setAsc}
        total={repos.length}
        filtered={filtered.length}
        repos={repos}
        view={view}
        setView={(v) => {
          setView(v);
          setPage(0);
        }}
      />

      {visible.length === 0 ? (
        <div className="text-center py-24" style={{ color: '#8b949e' }}>
          No results.{' '}
          <button
            onClick={() =>
              setFilters({ query: '', tier: '', category: '', minScore: 0 })
            }
            style={{
              color: '#ff2d55',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}>
            Reset filters
          </button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-2">
          {visible.map((r, i) => (
            <RepoCard
              key={r.repo}
              repo={r}
              rank={safePage * PER_PAGE + i + 1}
            />
          ))}
        </div>
      ) : (
        <TableView
          repos={visible}
          offset={safePage * PER_PAGE}
          tableSort={tableSort}
          setTableSort={(k) => {
            setTableSort(k);
            setPage(0);
          }}
          tableAsc={tableAsc}
          setTableAsc={setTableAsc}
        />
      )}

      <Paginator page={safePage} pageCount={safePageCount} setPage={setPage} />
    </div>
  );
}
