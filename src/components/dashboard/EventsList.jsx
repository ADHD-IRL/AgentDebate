import { Link } from 'react-router-dom';
import StatusPill from './StatusPill';

const SEV_COLOR = {
  CRITICAL: '#C0392B',
  HIGH:     '#D68910',
  MEDIUM:   '#2E86AB',
  LOW:      '#27AE60',
};

const ROW_GRID = '96px 1fr 130px 110px 130px 18px';

function fmtDTG(iso) {
  if (!iso) return { date: '—', time: '——:——' };
  const d = new Date(iso);
  const hh  = String(d.getUTCHours()).padStart(2, '0');
  const mm  = String(d.getUTCMinutes()).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const mon = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  return { date: `${day} ${mon}`, time: `${hh}:${mm}` };
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
  const now = new Date();
  return now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).toUpperCase().replace(',', ' ·');
}

function EventRow({ event }) {
  const isPast = event.status === 'complete';
  const sevColor = SEV_COLOR[event.severity] || 'var(--wr-text-muted)';

  return (
    <Link
      to={`/sessions/${event.id}`}
      className="row-link"
      style={{
        display: 'grid',
        gridTemplateColumns: ROW_GRID,
        gap: 16,
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid var(--wr-border)',
        textDecoration: 'none',
        opacity: isPast ? 0.78 : 1,
        cursor: 'pointer',
      }}
    >
      {/* DTG */}
      {(() => { const dtg = fmtDTG(event.date); return (
      <div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: 'var(--wr-text-primary)', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
          {dtg.date} / {dtg.time}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, color: 'var(--wr-text-muted)', marginTop: 2, letterSpacing: '0.08em' }}>
          UTC
        </div>
      </div>
      ); })()}

      {/* EVENT */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: sevColor, flexShrink: 0 }} />
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--wr-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
            {event.title}
          </span>
          {event.live && (
            <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#C0392B', flexShrink: 0 }} />
          )}
        </div>
        {event.scenario && (
          <div style={{ fontSize: 12, color: 'var(--wr-text-muted)', marginTop: 4, paddingLeft: 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.scenario}
          </div>
        )}
      </div>

      {/* STATUS */}
      <div style={{ textAlign: 'center' }}>
        <StatusPill status={event.status} live={event.live} />
      </div>

      {/* FINDINGS */}
      <div style={{ textAlign: 'center' }}>
        {event.findings > 0 ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'center' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, color: 'var(--wr-text-primary)' }}>
              {event.findings}
            </span>
            <span style={{ fontSize: 11, color: 'var(--wr-text-muted)' }}>findings</span>
            {event.critical > 0 && (
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, color: '#C0392B', marginLeft: 2 }}>
                {event.critical}C
              </span>
            )}
          </div>
        ) : (
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--wr-text-muted)' }}>—</span>
        )}
      </div>

      {/* OWNER */}
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--wr-text-secondary)' }}>
          {event.owner || '—'}
        </span>
      </div>

      {/* CHEVRON */}
      <span className="row-chev" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: 'var(--wr-text-muted)', textAlign: 'right' }}>
        →
      </span>
    </Link>
  );
}

function DayGroup({ label, sub, events }) {
  if (!events.length) return null;
  return (
    <div>
      <div style={{
        padding: '12px 24px',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        borderBottom: '1px solid var(--wr-border)',
        backgroundColor: 'rgba(138,155,181,0.025)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--wr-text-secondary)' }}>
            {label}
          </span>
          {sub && (
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--wr-text-muted)' }}>
              {sub}
            </span>
          )}
        </div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.1em', color: 'var(--wr-text-muted)' }}>
          {events.length} EVENT{events.length !== 1 ? 'S' : ''}
        </span>
      </div>
      {events.map(e => <EventRow key={e.id} event={e} />)}
    </div>
  );
}

export default function EventsList({ events = [], filterLabel = 'total' }) {
  const today    = events.filter(e => dayDelta(new Date(e.date)) === 0).sort((a, b) => new Date(a.date) - new Date(b.date));
  const upcoming = events.filter(e => dayDelta(new Date(e.date)) > 0).sort((a, b) => new Date(a.date) - new Date(b.date));
  const recent   = events.filter(e => dayDelta(new Date(e.date)) < 0).sort((a, b) => new Date(b.date) - new Date(a.date));

  const isEmpty = !today.length && !upcoming.length && !recent.length;

  return (
    <div style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', borderRadius: 6 }}>

      {/* Header */}
      <div style={{
        padding: '16px 24px',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        borderBottom: '1px solid var(--wr-border)',
      }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--wr-amber)' }}>
            EVENTS
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4, color: 'var(--wr-text-primary)' }}>
            {events.length} {filterLabel} · sorted by date
          </div>
        </div>
        <Link to="/sessions" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--wr-amber)', textDecoration: 'none' }}>
          ALL SESSIONS →
        </Link>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: ROW_GRID,
        gap: 16,
        padding: '8px 24px',
        borderBottom: '1px solid var(--wr-border)',
        backgroundColor: 'rgba(138,155,181,0.03)',
      }}>
        {['DTG', 'EVENT', 'STATUS', 'FINDINGS', 'OWNER', ''].map((h, i) => (
          <span key={i} style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.14em', color: 'var(--wr-text-muted)', textAlign: 'center',
          }}>
            {h}
          </span>
        ))}
      </div>

      {/* Groups */}
      {isEmpty ? (
        <div style={{ padding: '64px 24px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.14em', color: 'var(--wr-text-muted)' }}>
          NO EVENTS MATCH THIS FILTER
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
