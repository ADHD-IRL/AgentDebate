import { Link } from 'react-router-dom';

export const SEV_COLOR = { CRITICAL: '#C0392B', HIGH: '#D68910', MEDIUM: '#2E86AB', LOW: '#27AE60' };
export const SEV_BG    = {
  CRITICAL: 'rgba(192,57,43,0.14)',
  HIGH:     'rgba(214,137,16,0.14)',
  MEDIUM:   'rgba(46,134,171,0.14)',
  LOW:      'rgba(39,174,96,0.14)',
};
export const SEV_ORDINAL = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };

export function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return 'just now';
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

export function Sparkline({ data = [], color = '#F0A500', width = 72, height = 28, fill = true }) {
  if (!data.length) return <svg width={width} height={height} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const xs = data.map((_, i) => (i / (data.length - 1)) * width);
  const ys = data.map(v => height - 2 - ((v - min) / range) * (height - 4));
  const pts = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  const linePath = `M ${pts.replace(/ /g, ' L ')}`;
  const areaPath = `${linePath} L ${xs[xs.length - 1]},${height} L 0,${height} Z`;
  const lastX = xs[xs.length - 1];
  const lastY = ys[ys.length - 1];
  return (
    <svg width={width} height={height} style={{ flexShrink: 0, overflow: 'visible' }}>
      {fill && <path d={areaPath} fill={color} fillOpacity={0.12} />}
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={2} fill={color} />
    </svg>
  );
}

// ── SevPill ───────────────────────────────────────────────────────────────────

export function SevPill({ sev, compact = false }) {
  if (!sev || !SEV_COLOR[sev]) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: compact ? 9 : 10, fontFamily: 'JetBrains Mono, monospace',
      fontWeight: 700, letterSpacing: '0.06em',
      padding: compact ? '1px 5px' : '2px 7px',
      borderRadius: 3,
      color: SEV_COLOR[sev],
      backgroundColor: SEV_BG[sev],
      border: `1px solid ${SEV_COLOR[sev]}40`,
      whiteSpace: 'nowrap',
    }}>
      {sev}
    </span>
  );
}

// ── Delta ─────────────────────────────────────────────────────────────────────

export function Delta({ value, good = 'down', format = 'count' }) {
  if (value == null || isNaN(value)) return null;
  const isGood = (good === 'down' && value <= 0) || (good === 'up' && value >= 0);
  const color  = isGood ? '#27AE60' : '#C0392B';
  const arrow  = value > 0 ? '↑' : value < 0 ? '↓' : '→';
  let label;
  if (format === 'pct') label = `${value > 0 ? '+' : ''}${(value * 100).toFixed(1)}%`;
  else if (format === 'signed') label = `${value > 0 ? '+' : ''}${value.toFixed(1)}`;
  else label = `${value > 0 ? '+' : ''}${Math.abs(value)}`;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
      color, padding: '1px 5px', borderRadius: 3,
      backgroundColor: `${color}18`, border: `1px solid ${color}30`,
      whiteSpace: 'nowrap',
    }}>
      {arrow} {label}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

const AVATAR_HUES = [210, 260, 150, 30, 0, 330];
export function Avatar({ name = '?', size = 24 }) {
  const hue = AVATAR_HUES[(name.charCodeAt(0) || 0) % AVATAR_HUES.length];
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, hsl(${hue},55%,35%), hsl(${hue + 40},55%,25%))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: '#fff',
      fontFamily: 'JetBrains Mono, monospace',
      border: '1.5px solid rgba(255,255,255,0.08)',
    }}>
      {initials}
    </div>
  );
}

export function AvatarStack({ names = [], max = 3, size = 18 }) {
  const shown    = names.slice(0, max);
  const overflow = names.length - shown.length;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((n, i) => (
        <div key={i} style={{ marginLeft: i > 0 ? -(size * 0.35) : 0, zIndex: shown.length - i }}>
          <Avatar name={n} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div style={{
          marginLeft: -(size * 0.35), zIndex: 0,
          width: size, height: size, borderRadius: '50%', flexShrink: 0,
          backgroundColor: 'var(--wr-bg-hover)', border: '1.5px solid var(--wr-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.34, fontWeight: 700, color: 'var(--wr-text-muted)',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          +{overflow}
        </div>
      )}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

export function Card({ children, style, className = '' }) {
  return (
    <div className={className} style={{
      backgroundColor: 'var(--wr-bg-card)',
      border: '1px solid var(--wr-border)',
      borderRadius: 8,
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
}

export function CardHeader({ title, right, sticky = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
      borderBottom: '1px solid var(--wr-border)',
      backgroundColor: 'var(--wr-bg-card)',
      ...(sticky ? { position: 'sticky', top: 0, zIndex: 2 } : {}),
    }}>
      <span style={{
        fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: 'var(--wr-text-secondary)',
      }}>
        {title}
      </span>
      {right && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>}
    </div>
  );
}

export function AmberLink({ to, children }) {
  return (
    <Link to={to} style={{
      fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
      color: 'var(--wr-amber)', textDecoration: 'none', whiteSpace: 'nowrap',
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
      {children}
    </Link>
  );
}
