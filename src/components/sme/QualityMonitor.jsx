import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, CartesianGrid } from 'recharts';

export default function QualityMonitor({ stats, smes = [] }) {
  const topByUsage = (stats?.top_by_usage || []).slice(0, 10);

  const buckets = [
    { range: '0–19', min: 0, max: 20 },
    { range: '20–39', min: 20, max: 40 },
    { range: '40–59', min: 40, max: 60 },
    { range: '60–79', min: 60, max: 80 },
    { range: '80–100', min: 80, max: 101 },
  ].map(b => ({
    range: b.range,
    count: smes.filter(s => s.quality_score != null && s.quality_score >= b.min && s.quality_score < b.max).length,
  }));

  const scatterData = smes
    .filter(s => s.quality_score != null && s.usage_count != null)
    .map(s => ({ x: s.usage_count, y: s.quality_score, name: s.name }));

  const lowQuality = smes.filter(s => s.is_library_sme && s.quality_score != null && s.quality_score < 60);
  const unscored = smes.filter(s => s.quality_score == null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Quality distribution */}
        <div style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', borderRadius: 6, padding: '14px 16px' }}>
          <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--wr-text-muted)', marginBottom: 12 }}>
            QUALITY DISTRIBUTION
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={buckets} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'var(--wr-text-muted)', fontFamily: 'JetBrains Mono, monospace' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--wr-text-muted)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', fontSize: 11 }} />
              <Bar dataKey="count" fill="#F0A500" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top by usage */}
        <div style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', borderRadius: 6, padding: '14px 16px' }}>
          <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--wr-text-muted)', marginBottom: 12 }}>
            TOP BY USAGE
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={topByUsage} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--wr-text-muted)' }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9, fill: 'var(--wr-text-secondary)', fontFamily: 'JetBrains Mono, monospace' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', fontSize: 11 }} />
              <Bar dataKey="usage_count" fill="#4EA8DE" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Action items */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ActionList
          title="LOW QUALITY LIBRARY SMEs"
          subtitle="quality_score < 60 — candidates for enhancement or archive"
          items={lowQuality}
          emptyMsg="No low-quality library SMEs"
          color="#C0392B"
        />
        <ActionList
          title="UNSCORED SMEs"
          subtitle="Never used in a session — consider assessing via MCP"
          items={unscored}
          emptyMsg="All SMEs have been scored"
          color="#888"
        />
      </div>
    </div>
  );
}

function ActionList({ title, subtitle, items, emptyMsg, color }) {
  return (
    <div style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', borderRadius: 6, padding: '14px 16px' }}>
      <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.1em', color, marginBottom: 2 }}>{title}</p>
      <p style={{ fontSize: 10, color: 'var(--wr-text-muted)', marginBottom: 10 }}>{subtitle}</p>
      {items.length === 0 ? (
        <p style={{ fontSize: 11, color: 'var(--wr-text-muted)', fontStyle: 'italic' }}>{emptyMsg}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.slice(0, 6).map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--wr-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                {s.name}
              </span>
              <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color }}>
                {s.quality_score != null ? s.quality_score : '—'}
              </span>
            </div>
          ))}
          {items.length > 6 && (
            <p style={{ fontSize: 10, color: 'var(--wr-text-muted)', marginTop: 2 }}>+{items.length - 6} more</p>
          )}
        </div>
      )}
    </div>
  );
}
