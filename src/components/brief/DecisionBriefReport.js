import { getPosture } from '@/lib/scrsEngine';

const POSTURE_CSS = {
  CRITICAL: { color: '#C0392B', bg: '#fdf2f2', border: '#f5c6c6' },
  HIGH:     { color: '#D68910', bg: '#fdf8f0', border: '#f5dfa8' },
  MEDIUM:   { color: '#2E86AB', bg: '#f0f7fc', border: '#b8d9ed' },
  LOW:      { color: '#27AE60', bg: '#f0faf4', border: '#b8e0c8' },
};

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function severityColor(sev) {
  const MAP = { CRITICAL: '#C0392B', HIGH: '#D68910', MEDIUM: '#2E86AB', LOW: '#27AE60' };
  return MAP[sev] || '#546E7A';
}

export function openDecisionBrief({ session, sessionAgents, synthesis, scrs, appliedCMs = [], projectedScrs, topFindings = [], topChains = [], priorityActions = [] }) {
  const posture    = getPosture(scrs);
  const pc         = POSTURE_CSS[posture.label] || POSTURE_CSS.LOW;
  const date       = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const projPosture = projectedScrs !== undefined ? getPosture(projectedScrs) : null;

  const findingsHtml = topFindings.slice(0, 5).map((f, i) => `
    <tr>
      <td style="padding:8px 12px;font-size:12px;color:#333;border-bottom:1px solid #eee;">
        ${i + 1}. ${esc(f.text)}
      </td>
      <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #eee;">
        <span style="font-size:10px;font-weight:700;color:${severityColor(f.severity)};font-family:monospace;">
          ${esc(f.severity)}
        </span>
      </td>
      <td style="padding:8px 12px;font-size:11px;color:#666;border-bottom:1px solid #eee;">
        ${esc(f.agentName || '')}
      </td>
    </tr>`).join('');

  const actionsHtml = priorityActions.slice(0, 5).map((a, i) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">
        <span style="font-size:11px;font-weight:700;color:#F0A500;font-family:monospace;">${i + 1}.</span>
        <span style="font-size:12px;color:#333;margin-left:6px;">${esc(a.text)}</span>
      </td>
      <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #eee;">
        <span style="font-size:10px;color:#27AE60;font-family:monospace;">−${a.delta || '?'} pts</span>
      </td>
      <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #eee;">
        <span style="font-size:10px;font-family:monospace;color:${a.difficulty === 'EASY' ? '#27AE60' : a.difficulty === 'HARD' ? '#C0392B' : '#D68910'};">
          ${esc(a.difficulty || '')}
        </span>
      </td>
    </tr>`).join('');

  const chainsHtml = topChains.slice(0, 3).map(c => `
    <div style="margin-bottom:10px;padding:10px;background:#f9f9f9;border-left:3px solid ${c.chain_resilience === 'LOW' ? '#27AE60' : c.chain_resilience === 'HIGH' ? '#C0392B' : '#D68910'};">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#1a1a2e;">${esc(c.name)}</p>
      <p style="margin:0;font-size:11px;color:#555;">
        Resilience: <strong style="color:${c.chain_resilience === 'LOW' ? '#27AE60' : c.chain_resilience === 'HIGH' ? '#C0392B' : '#D68910'};">
          ${esc(c.chain_resilience)}
        </strong>
        &nbsp;·&nbsp; ${(c.steps || []).length} steps
      </p>
    </div>`).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Decision Brief — ${esc(session?.name)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; color: #333; }
    .page { max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; }
    @media print {
      body { background: #fff; }
      .page { padding: 20px; box-shadow: none; }
      .no-print { display: none; }
    }
    h2 { font-size: 13px; font-family: monospace; letter-spacing: 0.06em; color: #888; margin: 24px 0 10px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 8px 12px; text-align: left; font-size: 10px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.05em; color: #888; background: #f9f9f9; border-bottom: 2px solid #eee; }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div style="border-bottom:3px solid ${pc.color};padding-bottom:20px;margin-bottom:24px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <p style="font-size:10px;font-family:monospace;letter-spacing:0.1em;color:#888;text-transform:uppercase;margin-bottom:4px;">
          AGENTDEBATE — RISK ASSESSMENT BRIEF
        </p>
        <h1 style="font-size:22px;font-weight:800;color:#1a1a2e;">${esc(session?.name || 'Assessment')}</h1>
        <p style="font-size:12px;color:#666;margin-top:4px;">${esc(date)}</p>
      </div>
      <div style="text-align:center;padding:16px 20px;background:${pc.bg};border:1px solid ${pc.border};border-radius:8px;min-width:120px;">
        <p style="font-size:10px;font-family:monospace;color:#888;margin-bottom:4px;">RISK POSTURE</p>
        <p style="font-size:28px;font-weight:900;font-family:monospace;color:${pc.color};">${scrs}</p>
        <p style="font-size:11px;font-weight:700;font-family:monospace;color:${pc.color};">${posture.label}</p>
        <p style="font-size:10px;color:#888;margin-top:2px;">/ 100</p>
      </div>
    </div>
  </div>

  <!-- Assessment summary -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px;">
    ${[
      ['Analyst Agents', sessionAgents?.length || 0],
      ['Threat Chains', topChains.length],
      ['Controls Applied', appliedCMs.length],
    ].map(([l, v]) => `
      <div style="padding:12px;background:#f9f9f9;border-radius:6px;text-align:center;">
        <p style="font-size:22px;font-weight:800;font-family:monospace;color:#1a1a2e;">${v}</p>
        <p style="font-size:10px;font-family:monospace;text-transform:uppercase;letter-spacing:0.05em;color:#888;">${l}</p>
      </div>`).join('')}
  </div>

  <!-- Top findings -->
  ${findingsHtml ? `
  <h2>Top Threat Findings</h2>
  <table style="margin-bottom:24px;">
    <thead><tr>
      <th>Finding</th><th style="text-align:center;">Severity</th><th>Agent</th>
    </tr></thead>
    <tbody>${findingsHtml}</tbody>
  </table>` : ''}

  <!-- Threat chains -->
  ${chainsHtml ? `
  <h2>Threat Chains</h2>
  <div style="margin-bottom:24px;">${chainsHtml}</div>` : ''}

  <!-- Priority actions -->
  ${actionsHtml ? `
  <h2>Priority Actions — Immediate</h2>
  <table style="margin-bottom:16px;">
    <thead><tr>
      <th>Countermeasure</th><th style="text-align:center;">Est. Impact</th><th style="text-align:center;">Effort</th>
    </tr></thead>
    <tbody>${actionsHtml}</tbody>
  </table>
  ${projPosture ? `
  <div style="padding:12px 16px;background:${getPosture(projectedScrs).bg};border:1px solid ${getPosture(projectedScrs).border};border-radius:6px;margin-bottom:24px;">
    <p style="font-size:12px;">
      <strong>If all priority controls applied → Projected SCRS:
        <span style="color:${getPosture(projectedScrs).color};">${projectedScrs} (${getPosture(projectedScrs).label})</span>
      </strong>
    </p>
  </div>` : ''}` : ''}

  <!-- Footer -->
  <div style="border-top:1px solid #eee;padding-top:16px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
    <p style="font-size:10px;color:#aaa;font-family:monospace;">AGENTDEBATE RISK INTELLIGENCE</p>
    <button onclick="window.print()" class="no-print"
      style="padding:8px 20px;background:#F0A500;color:#0D1B2A;border:none;border-radius:4px;font-weight:700;font-size:12px;cursor:pointer;">
      Print / Save PDF
    </button>
  </div>

</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}
