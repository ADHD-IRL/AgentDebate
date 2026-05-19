// ── Shared atoms: icons, sparkline, sev chips, ring, avatar stack ──────────

const { useMemo, useState, useEffect, useRef } = React;

const SEV_COLOR = { CRITICAL: '#C0392B', HIGH: '#D68910', MEDIUM: '#2E86AB', LOW: '#27AE60' };
const SEV_BG    = { CRITICAL: 'rgba(192,57,43,0.14)', HIGH: 'rgba(214,137,16,0.14)', MEDIUM: 'rgba(46,134,171,0.14)', LOW: 'rgba(39,174,96,0.14)' };

function Ico({ name, size = 14, stroke = 1.75, style }) {
  // Minimal inline SVG icons so we don't need a library
  const s = { width: size, height: size, display: 'inline-block', verticalAlign: '-2px', ...style };
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', style: s };
  switch (name) {
    case 'shield':   return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>;
    case 'search':   return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>;
    case 'plus':     return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'arrow-r':  return <svg {...common}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'arrow-u':  return <svg {...common}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case 'arrow-d':  return <svg {...common}><path d="M12 5v14M19 12l-7 7-7-7"/></svg>;
    case 'chev-r':   return <svg {...common}><path d="m9 6 6 6-6 6"/></svg>;
    case 'chev-d':   return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>;
    case 'dot':      return <svg {...common}><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>;
    case 'alert':    return <svg {...common}><path d="M12 9v4M12 17h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>;
    case 'bolt':     return <svg {...common}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/></svg>;
    case 'clock':    return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'bot':      return <svg {...common}><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4M8 2h8M9 14h.01M15 14h.01M9 18h6"/></svg>;
    case 'globe':    return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    case 'target':   return <svg {...common}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>;
    case 'swords':   return <svg {...common}><path d="m14.5 17.5 4-4M17.5 14.5 20 17l-3 3-2.5-2.5M6.5 6.5l-4 4M9.5 9.5 7 7 4 10l2.5 2.5M14.5 6.5 20 12M9.5 17.5 4 12"/></svg>;
    case 'link':     return <svg {...common}><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 1 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 1 0 7 7l1-1"/></svg>;
    case 'map':      return <svg {...common}><path d="M3 6v15l6-3 6 3 6-3V3l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/></svg>;
    case 'brain':    return <svg {...common}><path d="M9 3a3 3 0 0 0-3 3v1a3 3 0 0 0-2 2v2a3 3 0 0 0 1 2 3 3 0 0 0 1 2v1a3 3 0 0 0 3 3h1V3H9ZM15 3a3 3 0 0 1 3 3v1a3 3 0 0 1 2 2v2a3 3 0 0 1-1 2 3 3 0 0 1-1 2v1a3 3 0 0 1-3 3h-1V3h1Z"/></svg>;
    case 'report':   return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>;
    case 'scissors': return <svg {...common}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/></svg>;
    case 'flask':    return <svg {...common}><path d="M10 2v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V2M8 2h8"/></svg>;
    case 'gear':     return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>;
    case 'book':     return <svg {...common}><path d="M4 4v16a2 2 0 0 0 2 2h14V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2Z"/><path d="M4 4h14v18"/></svg>;
    case 'wifi':     return <svg {...common}><path d="M5 12.55a11 11 0 0 1 14 0M8.5 16a6 6 0 0 1 7 0M12 20h.01M2 8.82a15 15 0 0 1 20 0"/></svg>;
    case 'filter':   return <svg {...common}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z"/></svg>;
    case 'layers':   return <svg {...common}><path d="m12 2 10 6-10 6L2 8l10-6Z"/><path d="m2 16 10 6 10-6M2 12l10 6 10-6"/></svg>;
    case 'dashboard':return <svg {...common}><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>;
    case 'check':    return <svg {...common}><path d="M20 6 9 17l-5-5"/></svg>;
    case 'x':        return <svg {...common}><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case 'flame':    return <svg {...common}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/></svg>;
    case 'users':    return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'trend-u':  return <svg {...common}><path d="m23 6-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>;
    case 'trend-d':  return <svg {...common}><path d="m23 18-9.5-9.5-5 5L1 6"/><path d="M17 18h6v-6"/></svg>;
    default:         return null;
  }
}

function Sparkline({ data, color = '#F0A500', width = 72, height = 22, fill = true }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => [i * stepX, height - ((v - min) / range) * (height - 2) - 1]);
  const d = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = d + ` L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {fill && <path d={area} fill={color} opacity="0.12" />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="2" fill={color} />
    </svg>
  );
}

function SevPill({ sev, compact = false }) {
  return (
    <span className="font-mono inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
      style={{
        fontSize: compact ? 9 : 10,
        letterSpacing: '0.08em',
        color: SEV_COLOR[sev],
        backgroundColor: SEV_BG[sev],
        border: `1px solid ${SEV_COLOR[sev]}40`,
      }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: SEV_COLOR[sev], display: 'inline-block' }} />
      {compact ? sev.slice(0, 4) : sev}
    </span>
  );
}

function Delta({ value, good = 'down', format = 'num' }) {
  if (value === 0) {
    return <span className="font-mono text-xs" style={{ color: 'var(--wr-text-muted)' }}>— 0</span>;
  }
  const up = value > 0;
  const isGood = good === 'up' ? up : !up;
  const color = isGood ? '#27AE60' : '#C0392B';
  const val = format === 'pct' ? `${(value * 100).toFixed(0)}%` : format === 'signed' ? value.toFixed(1) : Math.abs(value);
  return (
    <span className="font-mono text-xs inline-flex items-center gap-0.5" style={{ color }}>
      <Ico name={up ? 'arrow-u' : 'arrow-d'} size={10} stroke={2.2} />
      {val}
    </span>
  );
}

function Avatar({ name, size = 20, ring }) {
  const initials = (name || '?').split(/[\s.]/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
  // Colorize based on first letter
  const hues = [198, 270, 38, 142, 12, 200];
  const hue = hues[initials.charCodeAt(0) % hues.length];
  return (
    <div className="font-mono flex items-center justify-center flex-shrink-0"
      title={name}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, oklch(0.42 0.08 ${hue}) 0%, oklch(0.32 0.07 ${hue + 20}) 100%)`,
        color: '#E8EDF5',
        fontSize: size * 0.4, fontWeight: 700,
        border: ring ? `1.5px solid ${ring}` : '1.5px solid var(--wr-bg-card)',
      }}>
      {initials}
    </div>
  );
}

function AvatarStack({ names = [], max = 4, size = 20 }) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <div className="flex items-center" style={{ marginLeft: 0 }}>
      {shown.map((n, i) => (
        <div key={n} style={{ marginLeft: i === 0 ? 0 : -6 }}>
          <Avatar name={n} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div className="font-mono flex items-center justify-center"
          style={{ marginLeft: -6, width: size, height: size, borderRadius: '50%',
            background: 'var(--wr-bg-hover)', color: 'var(--wr-text-secondary)',
            fontSize: size * 0.38, fontWeight: 600, border: '1.5px solid var(--wr-bg-card)' }}>
          +{extra}
        </div>
      )}
    </div>
  );
}

function Card({ children, style, className = '', noPad = false }) {
  return (
    <div className={`rounded-md ${className}`} style={{
      backgroundColor: 'var(--wr-bg-card)',
      border: '1px solid var(--wr-border)',
      ...(noPad ? {} : {}),
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ title, right, sticky }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between border-b"
      style={{ borderColor: 'var(--wr-border)', ...(sticky ? { position: 'sticky', top: 0, backgroundColor: 'var(--wr-bg-card)', zIndex: 1 } : {}) }}>
      <p className="text-[11px] font-bold tracking-[0.14em] font-mono uppercase" style={{ color: 'var(--wr-text-secondary)' }}>
        {title}
      </p>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}

function timeAgo(iso) {
  const diff = new Date(window.DATA.NOW).getTime() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

Object.assign(window, { Ico, Sparkline, SevPill, Delta, Avatar, AvatarStack, Card, CardHeader, SEV_COLOR, SEV_BG, timeAgo });
