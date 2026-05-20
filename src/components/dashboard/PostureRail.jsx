import { useMemo } from 'react';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  pending:  '#8A9BB5',
  round1:   '#2E86AB',
  round2:   '#D68910',
  review:   '#7B2D8B',
  complete: '#27AE60',
};

const STATUS_LABELS = {
  pending:  'Pending',
  round1:   'Round 1',
  round2:   'Round 2',
  review:   'Review',
  complete: 'Complete',
};

function startOfISOWeek(d) {
  const date = new Date(d);
  const day = date.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function PostureCard({ criticalCount, sessions }) {
  const statusOrder = ['pending', 'round1', 'round2', 'review', 'complete'];
  const counts = statusOrder.reduce((acc, k) => {
    acc[k] = sessions.filter(s => (s.status || 'pending') === k).length;
    return acc;
  }, {});
  const total = sessions.length || 1;

  return (
    <div
      className="rounded-2xl p-6 flex flex-col justify-between"
      style={{ background: 'linear-gradient(135deg, #D68910 0%, #C0392B 100%)', minHeight: 160 }}
    >
      <div>
        <p className="text-xs font-bold tracking-widest font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>
          CRITICAL RISKS
        </p>
        <p className="text-6xl font-black tabular-nums leading-none mt-1" style={{ color: '#fff' }}>
          {criticalCount}
        </p>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
          active in-flight sessions
        </p>
      </div>
      {/* Status bar */}
      <div className="mt-4">
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          {statusOrder.map(k => {
            const pct = (counts[k] / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={k}
                style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[k], opacity: 0.9 }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1.5">
          {statusOrder.map(k => counts[k] > 0 && (
            <span key={k} className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {STATUS_LABELS[k]} {counts[k]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrendCard({ sessions }) {
  const weeks = useMemo(() => {
    const now = Date.now();
    const buckets = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfISOWeek(now - i * 7 * 86400000).getTime();
      const weekEnd = weekStart + 7 * 86400000;
      buckets.push({
        label: i === 0 ? 'Now' : `-${i}w`,
        count: sessions.filter(s => {
          const t = new Date(s.created_at || 0).getTime();
          return t >= weekStart && t < weekEnd;
        }).length,
      });
    }
    return buckets;
  }, [sessions]);

  const maxCount = Math.max(...weeks.map(w => w.count), 1);
  const runningCount = sessions.filter(s => s.status === 'round1' || s.status === 'round2').length;
  const completedCount = sessions.filter(s => s.status === 'complete').length;

  const H = 48;
  const W = 280;
  const points = weeks.map((w, i) => {
    const x = (i / (weeks.length - 1)) * W;
    const y = H - (w.count / maxCount) * H;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${H} ${points} ${W},${H}`;

  return (
    <div
      className="rounded-2xl p-6 flex flex-col justify-between"
      style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', minHeight: 160 }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>
          SESSION PIPELINE
        </p>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'rgba(240,165,0,0.12)', color: 'var(--wr-amber)', border: '1px solid rgba(240,165,0,0.25)' }}
        >
          {sessions.length} total
        </span>
      </div>

      {/* SVG area chart */}
      <div className="flex-1">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 52 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F0A500" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#F0A500" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill="url(#trendFill)" />
          <polyline points={points} fill="none" stroke="#F0A500" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full pulse-dot" style={{ backgroundColor: '#F0A500', display: 'inline-block' }} />
          <span className="text-xs font-mono" style={{ color: 'var(--wr-text-secondary)' }}>
            {runningCount} running
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#27AE60', display: 'inline-block' }} />
          <span className="text-xs font-mono" style={{ color: 'var(--wr-text-secondary)' }}>
            {completedCount} complete
          </span>
        </div>
      </div>
    </div>
  );
}

function DonutCard({ sessions }) {
  const statusOrder = ['pending', 'round1', 'round2', 'review', 'complete'];
  const counts = statusOrder.reduce((acc, k) => {
    acc[k] = sessions.filter(s => (s.status || 'pending') === k).length;
    return acc;
  }, {});
  const total = sessions.length || 1;

  const CX = 52, CY = 52, R = 38, INNER = 24;
  let angle = -Math.PI / 2;
  const slices = statusOrder
    .filter(k => counts[k] > 0)
    .map(k => {
      const frac = counts[k] / total;
      const sweep = frac * 2 * Math.PI;
      const x1 = CX + R * Math.cos(angle);
      const y1 = CY + R * Math.sin(angle);
      angle += sweep;
      const x2 = CX + R * Math.cos(angle);
      const y2 = CY + R * Math.sin(angle);
      const large = sweep > Math.PI ? 1 : 0;
      return { k, path: `M${CX},${CY} L${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`, count: counts[k] };
    });

  return (
    <div
      className="rounded-2xl p-6"
      style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', minHeight: 160 }}
    >
      <p className="text-xs font-bold tracking-widest font-mono mb-3" style={{ color: 'var(--wr-text-muted)' }}>
        STATUS BREAKDOWN
      </p>
      <div className="flex items-center gap-5">
        {/* Donut */}
        <svg viewBox="0 0 104 104" style={{ width: 90, height: 90, flexShrink: 0 }}>
          {slices.map(s => (
            <path key={s.k} d={s.path} fill={STATUS_COLORS[s.k]} stroke="var(--wr-bg-card)" strokeWidth="2" />
          ))}
          <circle cx={CX} cy={CY} r={INNER} fill="var(--wr-bg-card)" />
          <text x={CX} y={CY + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="hsl(215 16% 93%)" fontFamily="JetBrains Mono, monospace">
            {sessions.length}
          </text>
        </svg>

        {/* Legend */}
        <div className="space-y-1.5 flex-1">
          {statusOrder.filter(k => counts[k] > 0).map(k => (
            <div key={k} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[k], display: 'inline-block' }} />
                <span className="text-xs" style={{ color: 'var(--wr-text-secondary)' }}>{STATUS_LABELS[k]}</span>
              </div>
              <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--wr-text-muted)' }}>{counts[k]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PostureRail({ sessions = [], kpis = {} }) {
  const criticalCount = kpis.critical?.value ?? 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
      <PostureCard criticalCount={criticalCount} sessions={sessions} />
      <TrendCard sessions={sessions} />
      <DonutCard sessions={sessions} />
    </div>
  );
}
