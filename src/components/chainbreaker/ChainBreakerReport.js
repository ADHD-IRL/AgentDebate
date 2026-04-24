// ── Color constants ───────────────────────────────────────────────────────────

const LEV_CSS = {
  HIGH:   { color: '#C0392B', bg: '#fdf0ef', border: '#f0b8b2' },
  MEDIUM: { color: '#C97D10', bg: '#fdf8ec', border: '#f0dda0' },
  LOW:    { color: '#1A6E8E', bg: '#eef6fb', border: '#b0d4e8' },
};

const DIF_COLOR = { EASY: '#1E8449', MODERATE: '#C97D10', HARD: '#C0392B' };

const RES_CSS = {
  HIGH:   { color: '#C0392B', bg: '#fdf0ef', label: 'Chain is highly resilient — difficult to break' },
  MEDIUM: { color: '#C97D10', bg: '#fdf8ec', label: 'Breakable with focused defensive effort' },
  LOW:    { color: '#1E8449', bg: '#eef9f1', label: 'Vulnerable — focused intervention can collapse it' },
};

// ── HTML builder ──────────────────────────────────────────────────────────────

function buildReportHtml({ chain, analysis, scenarioName, savedAt }) {
  const now      = savedAt ? new Date(savedAt) : new Date();
  const dateStr  = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr  = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const resilience = analysis.chain_resilience || 'MEDIUM';
  const resStyle   = RES_CSS[resilience] || RES_CSS.MEDIUM;

  // ── Priority chips ──
  const priorityHtml = (analysis.priority_steps || []).map((stepNum, i) => {
    const sa       = analysis.steps.find(s => s.step_number === stepNum);
    const stepData = chain.steps.find(s => s.step_number === stepNum);
    const lev      = LEV_CSS[sa?.leverage] || { color: '#666', bg: '#f5f5f5', border: '#ccc' };
    const label    = stepData?.agent_label || stepData?.step_text?.slice(0, 50) || `Step ${stepNum}`;
    return `
      <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:4px;
                  background:${lev.bg};border:1px solid ${lev.border};margin:0 6px 8px 0;">
        <span style="font-family:monospace;font-size:11px;font-weight:700;color:${lev.color};min-width:22px;">#${i + 1}</span>
        <div>
          <div style="font-family:monospace;font-size:11px;font-weight:700;color:${lev.color};">STEP ${stepNum}</div>
          <div style="font-size:11px;color:#555;margin-top:1px;">${escHtml(label)}</div>
        </div>
        <span style="font-family:monospace;font-size:10px;font-weight:700;color:${lev.color};margin-left:4px;">${sa?.leverage || ''}</span>
      </div>`;
  }).join('');

  // ── Step rows ──
  const stepsHtml = analysis.steps.map(sa => {
    const stepData    = chain.steps.find(s => s.step_number === sa.step_number);
    const lev         = LEV_CSS[sa.leverage] || { color: '#666', bg: '#f9f9f9', border: '#ddd' };
    const difColor    = DIF_COLOR[sa.difficulty] || '#666';
    const rankIdx     = (analysis.priority_steps || []).indexOf(sa.step_number);
    const hasPriority = rankIdx >= 0;

    const cmsHtml = (sa.countermeasures || []).map((cm, i) => `
      <div style="display:flex;gap:8px;margin-bottom:6px;align-items:flex-start;">
        <span style="font-family:monospace;font-size:11px;font-weight:700;color:${lev.color};flex-shrink:0;margin-top:1px;">${i + 1}.</span>
        <span style="font-size:12px;line-height:1.55;color:#333;">${escHtml(cm)}</span>
      </div>`).join('');

    return `
      <div style="margin-bottom:20px;border:1px solid #ddd;border-radius:6px;overflow:hidden;page-break-inside:avoid;">

        <!-- Step header -->
        <div style="padding:10px 14px;background:${lev.bg};border-bottom:2px solid ${lev.color}55;
                    display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:28px;height:28px;border-radius:50%;background:${lev.color};flex-shrink:0;
                        display:flex;align-items:center;justify-content:center;
                        color:#fff;font-family:monospace;font-size:11px;font-weight:700;">
              ${sa.step_number}
            </div>
            <div>
              ${stepData?.agent_label ? `<div style="font-size:13px;font-weight:700;color:#1a1a2e;">${escHtml(stepData.agent_label)}</div>` : ''}
              <div style="font-size:11px;color:#555;margin-top:1px;">${escHtml(stepData?.step_text || '')}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            ${hasPriority ? `<span style="font-family:monospace;font-size:10px;font-weight:700;padding:2px 8px;border-radius:3px;background:${lev.color};color:#fff;">PRIORITY #${rankIdx + 1}</span>` : ''}
            <span style="font-family:monospace;font-size:10px;font-weight:700;padding:2px 8px;border-radius:3px;background:${lev.color}22;color:${lev.color};border:1px solid ${lev.border};">${sa.leverage} LEVERAGE</span>
            <span style="font-family:monospace;font-size:10px;padding:2px 8px;border-radius:3px;background:#f0f0f0;color:${difColor};border:1px solid #e0e0e0;">${sa.difficulty}</span>
          </div>
        </div>

        <!-- Objective + dependencies -->
        <div style="padding:12px 14px;display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#fff;">
          <div style="padding:10px;border-radius:4px;background:#fef5f5;border:1px solid #f0c8c8;">
            <div style="font-family:monospace;font-size:10px;font-weight:700;color:#C0392B;margin-bottom:6px;letter-spacing:0.06em;">ADVERSARY OBJECTIVE</div>
            <div style="font-size:12px;line-height:1.55;color:#333;">${escHtml(sa.adversary_objective || '')}</div>
          </div>
          <div style="padding:10px;border-radius:4px;background:#f8f8f8;border:1px solid #e0e0e0;">
            <div style="font-family:monospace;font-size:10px;font-weight:700;color:#555;margin-bottom:6px;letter-spacing:0.06em;">STEP DEPENDENCIES</div>
            <div style="font-size:12px;line-height:1.55;color:#333;">${escHtml(sa.dependencies || '')}</div>
          </div>
        </div>

        <!-- Countermeasures -->
        ${cmsHtml ? `
        <div style="padding:2px 14px 12px;background:#fff;">
          <div style="padding:10px;border-radius:4px;background:${lev.bg};border:1px solid ${lev.border};">
            <div style="font-family:monospace;font-size:10px;font-weight:700;color:${lev.color};margin-bottom:8px;letter-spacing:0.06em;">COUNTERMEASURES</div>
            ${cmsHtml}
          </div>
        </div>` : ''}

        <!-- Residual risk -->
        ${sa.residual_risk ? `
        <div style="padding:0 14px 12px;background:#fff;">
          <div style="display:flex;align-items:flex-start;gap:6px;padding:8px 10px;background:#fff8ec;border:1px solid #f0d890;border-radius:4px;">
            <span style="font-family:monospace;font-size:11px;font-weight:700;color:#C97D10;flex-shrink:0;">⚠</span>
            <div>
              <span style="font-size:11px;font-weight:700;color:#C97D10;">Residual risk: </span>
              <span style="font-size:11px;color:#555;line-height:1.5;">${escHtml(sa.residual_risk)}</span>
            </div>
          </div>
        </div>` : ''}
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Chain Break Analysis — ${escHtml(chain.name)}</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#fff; color:#1a1a2e; }
    @media print {
      .no-print { display:none !important; }
      body { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
    }
    .page { max-width:900px; margin:0 auto; padding:32px 40px 48px; }
    .print-btn { position:fixed; top:20px; right:20px; padding:8px 16px; background:#1a1a2e; color:#fff;
                 border:none; border-radius:4px; font-size:12px; cursor:pointer; font-family:monospace; }
    .print-btn:hover { background:#2e2e4e; }
  </style>
</head>
<body>
<button class="no-print print-btn" onclick="window.print()">Print / Save PDF</button>
<div class="page">

  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:16px;
              border-bottom:3px solid #1a1a2e;margin-bottom:24px;">
    <div>
      <div style="font-family:monospace;font-size:20px;font-weight:700;color:#1a1a2e;letter-spacing:0.15em;">⚔ AgentDebate</div>
      <div style="font-size:12px;color:#888;margin-top:3px;font-family:monospace;letter-spacing:0.08em;">CHAIN BREAK ANALYSIS REPORT</div>
    </div>
    <div style="text-align:right;font-family:monospace;font-size:11px;color:#666;line-height:1.7;">
      <div style="font-weight:700;color:#C0392B;font-size:12px;letter-spacing:0.06em;">CONFIDENTIAL</div>
      <div>Generated: ${dateStr} ${timeStr}</div>
      ${scenarioName ? `<div>Scenario: ${escHtml(scenarioName)}</div>` : ''}
    </div>
  </div>

  <!-- Chain metadata + resilience -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:20px;
              margin-bottom:24px;padding:16px 20px;background:#f8f8f8;border-radius:6px;border:1px solid #e0e0e0;">
    <div style="flex:1;">
      <div style="font-size:22px;font-weight:700;color:#1a1a2e;margin-bottom:5px;">${escHtml(chain.name)}</div>
      ${chain.description ? `<div style="font-size:13px;color:#555;line-height:1.5;margin-bottom:6px;">${escHtml(chain.description)}</div>` : ''}
      <div style="font-family:monospace;font-size:11px;color:#888;">${chain.steps.length} step${chain.steps.length !== 1 ? 's' : ''} analyzed</div>
    </div>
    <div style="flex-shrink:0;text-align:center;padding:12px 24px;border-radius:6px;
                background:${resStyle.bg};border:1px solid ${resStyle.color}44;">
      <div style="font-family:monospace;font-size:10px;font-weight:700;color:#888;margin-bottom:4px;letter-spacing:0.07em;">CHAIN RESILIENCE</div>
      <div style="font-family:monospace;font-size:26px;font-weight:700;color:${resStyle.color};">${resilience}</div>
      <div style="font-size:10px;color:#666;margin-top:4px;max-width:130px;">${resStyle.label}</div>
    </div>
  </div>

  <!-- Executive summary -->
  <div style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#888;
              margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #e0e0e0;">
    EXECUTIVE SUMMARY
  </div>
  <div style="font-size:13px;line-height:1.7;color:#333;padding:14px 16px;background:#f8f8f8;
              border-left:3px solid #1a1a2e;border-radius:0 4px 4px 0;margin-bottom:24px;">
    ${escHtml(analysis.summary || '')}
  </div>

  <!-- Priority break points -->
  <div style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#888;
              margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #e0e0e0;">
    PRIORITY BREAK POINTS — HIGHEST LEVERAGE FIRST
  </div>
  <div style="margin-bottom:24px;">${priorityHtml}</div>

  <!-- Step-by-step analysis -->
  <div style="font-family:monospace;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#888;
              margin-bottom:12px;padding-bottom:5px;border-bottom:1px solid #e0e0e0;">
    STEP-BY-STEP BREAK ANALYSIS
  </div>
  ${stepsHtml}

  <!-- Footer -->
  <div style="margin-top:32px;padding-top:14px;border-top:1px solid #e0e0e0;
              display:flex;align-items:center;justify-content:space-between;
              font-family:monospace;font-size:10px;color:#aaa;">
    <span>Generated by AgentDebate — Structured Red Team Intelligence Platform</span>
    <span>CONFIDENTIAL — ${dateStr}</span>
  </div>

</div>
<script>window.onload = function() { window.focus(); }<\/script>
</body>
</html>`;
}

// ── Safe HTML escape ──────────────────────────────────────────────────────────

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Public API ────────────────────────────────────────────────────────────────

export function openChainBreakerReport({ chain, analysis, scenarioName = null, savedAt = null }) {
  const html = buildReportHtml({ chain, analysis, scenarioName, savedAt });
  const win  = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
