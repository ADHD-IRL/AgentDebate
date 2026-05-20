import { Link } from 'react-router-dom';
import StatusPill from './StatusPill';

const SEV_COLOR = {
  CRITICAL: '#C0392B',
  HIGH:     '#D68910',
  MEDIUM:   '#2E86AB',
  LOW:      '#27AE60',
};

function fmtDTG(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const hh  = String(d.getUTCHours()).padStart(2, '0');
  const mm  = String(d.getUTCMinutes()).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const mon = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  return `${day} ${mon} / ${hh}:${mm}`;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function dayDelta(date) {
  const now = new Date();
  return Math.round((startOfDay(date) - startOfDay(now)) / 86400000);
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).toUpperCase().replace(',', ' ·');
}

function EventRow({ event }) {
  const isPast     = event.status === 'complete';
  const sevColor   = SEV_COLOR[event.severity] || 'var(--wr-text-muted)';

  return (
    <Link
      to={`/sessions/${event.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[rgba(138,155,181,0.06)] border-b last:border-b-0"
      style={{ borderColor: 'var(--wr-border)', opacity: isPast ? 0.78 : 1, textDecoration: 'none' }}
    >
      {/* Left severity bar */}
      <div
        className="w-1 h-9 rounded-full flex-shrink-0"
        style={{ backgroundColor: sevColor }}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold truncate"
            style={{ color: 'var(--wr-text-primary)' }}
          >
            {event.title}
          </span>
          {event.critical > 0 && (
            <span
              className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: `${SEV_COLOR.CRITICAL}18`, color: SEV_COLOR.CRITICAL, border: `1px solid ${SEV_COLOR.CRITICAL}40` }}
            >
              {event.critical}C
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] font-mono" style={{ color: 'var(--wr-text-muted)' }}>
            {fmtDTG(event.date)}
          </span>
          {event.scenario && (
            <>
              <span style={{ color: 'var(--wr-border-strong)' }}>·</span>
              <span className="text-[11px] truncate" style={{ color: 'var(--wr-text-muted)' }}>{event.scenario}</span>
            </>
          )}
          {event.owner && (
            <>
              <span style={{ color: 'var(--wr-border-strong)' }}>·</span>
              <span className="text-[11px] font-mono truncate" style={{ color: 'var(--wr-text-muted)' }}>{event.owner}</span>
            </>
          )}
        </div>
      </div>

      {/* Right: findings count + status badge */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {event.findings > 0 && (
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold font-mono tabular-nums" style={{ color: 'var(--wr-text-primary)' }}>{event.findings}</span>
            <span className="text-[10px]" style={{ color: 'var(--wr-text-muted)' }}>findings</span>
          </div>
        )}
        <StatusPill status={event.status} live={event.live} />
      </div>
    </Link>
  );
}

function DayGroup({ label, sub, events }) {
  if (!events.length) return null;
  return (
    <div
      className="rounded-2xl overflow-hidden mb-3"
      style={{ border: '1px solid var(--wr-border)' }}
    >
      {/* Group header */}
      <div
        className="flex items-baseline justify-between px-4 py-2.5"
        style={{ backgroundColor: 'rgba(138,155,181,0.04)', borderBottom: '1px solid var(--wr-border)' }}
      >
        <div className="flex items-baseline gap-2.5">
          <span className="text-[11px] font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-secondary)' }}>
            {label}
          </span>
          {sub && (
            <span className="text-[10px] font-mono" style={{ color: 'var(--wr-text-muted)' }}>{sub}</span>
          )}
        </div>
        <span className="text-[10px] font-mono tracking-wider" style={{ color: 'var(--wr-text-muted)' }}>
          {events.length} EVENT{events.length !== 1 ? 'S' : ''}
        </span>
      </div>

      <div style={{ backgroundColor: 'var(--wr-bg-card)' }}>
        {events.map(e => <EventRow key={e.id} event={e} />)}
      </div>
    </div>
  );
}

export default function EventsList({ events = [], filterLabel = 'total' }) {
  const today    = events.filter(e => dayDelta(new Date(e.date)) === 0).sort((a, b) => new Date(a.date) - new Date(b.date));
  const upcoming = events.filter(e => dayDelta(new Date(e.date)) > 0).sort((a, b) => new Date(a.date) - new Date(b.date));
  const recent   = events.filter(e => dayDelta(new Date(e.date)) < 0).sort((a, b) => new Date(b.date) - new Date(a.date));

  const isEmpty = !today.length && !upcoming.length && !recent.length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span className="text-[10px] font-bold tracking-widest font-mono" style={{ color: 'var(--wr-amber)' }}>EVENTS</span>
          <span className="text-sm font-semibold ml-2" style={{ color: 'var(--wr-text-primary)' }}>
            {events.length} {filterLabel}
          </span>
        </div>
        <Link
          to="/sessions"
          className="text-[10px] font-bold tracking-widest font-mono"
          style={{ color: 'var(--wr-amber)', textDecoration: 'none' }}
        >
          ALL SESSIONS →
        </Link>
      </div>

      {isEmpty ? (
        <div
          className="rounded-2xl py-16 text-center"
          style={{ border: '1px solid var(--wr-border)', backgroundColor: 'var(--wr-bg-card)' }}
        >
          <span className="text-[11px] font-mono tracking-widest" style={{ color: 'var(--wr-text-muted)' }}>
            NO EVENTS MATCH THIS FILTER
          </span>
        </div>
      ) : (
        <>
          <DayGroup label="TODAY"    sub={todayLabel()}  events={today}    />
          <DayGroup label="UPCOMING" sub="NEXT 7 DAYS"   events={upcoming} />
          <DayGroup label="RECENT"   sub="LAST 14 DAYS"  events={recent}   />
        </>
      )}
    </div>
  );
}
