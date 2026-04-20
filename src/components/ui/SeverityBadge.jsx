export default function SeverityBadge({ severity, size = 'sm' }) {
  const config = {
    CRITICAL: { bg: '#C0392B', text: '#fff', label: 'CRITICAL' },
    HIGH:     { bg: '#D68910', text: '#0D1B2A', label: 'HIGH' },
    MEDIUM:   { bg: '#2E86AB', text: '#fff', label: 'MEDIUM' },
    LOW:      { bg: '#27AE60', text: '#fff', label: 'LOW' },
  };
  const c = config[severity] || config.MEDIUM;
  const padding = size === 'xs' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs';
  return (
    <span 
      className={`${padding} rounded font-bold tracking-wider font-mono inline-block`}
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}