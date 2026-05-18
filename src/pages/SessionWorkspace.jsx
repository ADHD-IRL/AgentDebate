import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { scoreSourceCredibility, parseCitations, TIER_COLORS, TIER_LABELS, SOURCE_TYPE_LABELS } from '@/lib/sources';
import { analyzeSourceValidity } from '@/lib/llm';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { generateRound1, generateRound2, generateRound0, generateReaction, generateSynthesis as generateSynthesisLLM, extractSessionThreats } from '@/lib/llm';
import { synthesize, getOpenAiKey, DEFAULT_VOICES } from '@/lib/voice';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw, ChevronDown, ChevronUp, Sparkles, AlertCircle, Save, BarChart2, ShieldAlert, Check, X, BookOpen, MessageSquare, BellRing, Volume2, StopCircle, Trash2 } from 'lucide-react';
import SeverityBadge from '@/components/ui/SeverityBadge';
import WrButton from '@/components/ui/WrButton';
import { WrInput } from '@/components/ui/WrInput';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const TABS = ['ROUND 1','ROUND 2','SYNTHESIS','THREATS','SOURCES','SETTINGS'];

function AgentAssessmentCard({ sa, agent, round, onGenerate, onUpdate, onSpeak, speaking, onReset }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [briefExpanded, setBriefExpanded] = useState(false);
  const isGenerating = sa.status === (round === 1 ? 'generating_r1' : 'generating_r2');
  const text = round === 1 ? sa.round1_assessment : sa.round2_rebuttal;
  const severity = round === 1 ? sa.round1_severity : sa.round2_revised_severity;
  const confidence = round === 1 ? sa.round1_confidence : sa.round2_confidence;
  const color = agent?.domain_color || '#F0A500';

  return (
    <div className="rounded overflow-hidden" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
      <div className="h-1" style={{ backgroundColor: color }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs font-mono" style={{ color }}>Agent {agent?.name}</p>
            <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>{agent?.discipline}</p>
          </div>
          <div className="flex items-center gap-2">
            {confidence != null && (
              <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(240,165,0,0.1)', color: 'var(--wr-amber)' }}>
                {confidence}%
              </span>
            )}
            {severity && <SeverityBadge severity={severity} />}
          </div>
        </div>

        {/* Round 0 pre-brief collapsible */}
        {sa.round0_briefing && (
          <div className="mb-3 rounded" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)' }}>
            <button
              onClick={() => setBriefExpanded(!briefExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs"
              style={{ color: 'var(--wr-text-muted)' }}
            >
              <span className="flex items-center gap-1.5 font-mono tracking-wider">
                <BookOpen className="w-3 h-3" /> PRE-SESSION BRIEF
              </span>
              {briefExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {briefExpanded && (
              <div className="px-3 pb-3">
                <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--wr-text-secondary)' }}>
                  {sa.round0_briefing}
                </p>
              </div>
            )}
          </div>
        )}

        {isGenerating ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--wr-amber)' }} />
            <span className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>Generating assessment...</span>
          </div>
        ) : text ? (
          <div>
            {editing ? (
              <div>
                <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={8}
                  className="w-full text-xs px-2 py-2 rounded outline-none resize-none"
                  style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }} />
                <div className="flex gap-2 mt-2">
                  <WrButton size="xs" onClick={() => { onUpdate(editText); setEditing(false); }}>Save</WrButton>
                  <WrButton variant="secondary" size="xs" onClick={() => setEditing(false)}>Cancel</WrButton>
                </div>
              </div>
            ) : (
              <div>
                <div className={expanded ? '' : 'line-clamp-4'}>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--wr-text-secondary)' }}>{text}</p>
                </div>
                <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs mt-2" style={{ color: 'var(--wr-amber)' }}>
                  {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
                </button>
              </div>
            )}
            <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--wr-border)' }}>
              <WrButton variant="secondary" size="xs" onClick={() => { setEditText(text); setEditing(true); }}>Edit</WrButton>
              <WrButton variant="secondary" size="xs" onClick={onGenerate}><RefreshCw className="w-3 h-3" /> Regen</WrButton>
              {onSpeak && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <WrButton variant="secondary" size="xs" onClick={() => onSpeak(text, agent)} disabled={speaking}>
                      {speaking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
                    </WrButton>
                  </TooltipTrigger>
                  <TooltipContent side="top">Speak this assessment aloud (requires OpenAI key)</TooltipContent>
                </Tooltip>
              )}
              {onReset && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <WrButton variant="secondary" size="xs" onClick={onReset}>
                      <Trash2 className="w-3 h-3" />
                    </WrButton>
                  </TooltipTrigger>
                  <TooltipContent side="top">Clear this agent's assessment</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        ) : (
          <div className="py-3">
            <p className="text-xs mb-3" style={{ color: 'var(--wr-text-muted)' }}>No assessment yet</p>
            <WrButton size="xs" onClick={onGenerate}>Generate</WrButton>
          </div>
        )}
      </div>
    </div>
  );
}

function SynthesisPanel({ synthesis, sessionId, onGenerate, generating, synthStatus, r2Done, synthError, streamText }) {
  const [resolvedText, setResolvedText] = useState('');

  useEffect(() => {
    if (!synthesis?.raw_text) return;
    const raw = synthesis.raw_text;
    if (raw.startsWith('http')) {
      fetch(raw).then(r => r.text()).then(setResolvedText);
    } else {
      setResolvedText(raw);
    }
  }, [synthesis?.raw_text]);

  if (!synthesis && !generating) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Sparkles className="w-10 h-10 mb-4" style={{ color: 'var(--wr-amber)' }} />
        <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--wr-text-primary)' }}>Generate Synthesis</h3>
        {synthError ? (
          <div className="mb-6 rounded p-3 max-w-md w-full flex items-start gap-2" style={{ backgroundColor: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#C0392B' }} />
            <p className="text-xs" style={{ color: '#C0392B' }}>{synthError}</p>
          </div>
        ) : !r2Done ? (
          <p className="text-sm mb-6 text-center max-w-md" style={{ color: 'var(--wr-text-secondary)' }}>
            Complete Round 2 first, then generate the synthesis report.
          </p>
        ) : (
          <p className="text-sm mb-6 text-center max-w-md" style={{ color: 'var(--wr-text-secondary)' }}>
            All agents have completed Round 2. Ready to generate the synthesis report.
          </p>
        )}
        <WrButton size="lg" onClick={onGenerate} disabled={!r2Done}>
          <Sparkles className="w-4 h-4" /> Generate Synthesis
        </WrButton>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="py-6">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: 'var(--wr-amber)' }} />
          <span className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-amber)' }}>
            {synthStatus || 'SYNTHESIS ENGINE RUNNING'}
          </span>
        </div>
        {streamText ? (
          <div className="rounded p-4 text-xs leading-relaxed whitespace-pre-wrap font-mono overflow-y-auto max-h-[60vh]"
            style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-secondary)' }}>
            {streamText}
            <span className="inline-block w-1.5 h-3 ml-0.5 animate-pulse" style={{ backgroundColor: 'var(--wr-amber)' }} />
          </div>
        ) : (
          <div className="rounded p-4" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
            <div className="h-2 rounded w-3/4 mb-2 animate-pulse" style={{ backgroundColor: 'var(--wr-border)' }} />
            <div className="h-2 rounded w-1/2 mb-2 animate-pulse" style={{ backgroundColor: 'var(--wr-border)' }} />
            <div className="h-2 rounded w-2/3 animate-pulse" style={{ backgroundColor: 'var(--wr-border)' }} />
          </div>
        )}
      </div>
    );
  }

  const markdownToHtml = (md) => {
    return md
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="section-title">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^---$/gm, '<hr>')
      .replace(/^\d+\.\s+(.+)$/gm, '<li class="ol-item">$1</li>')
      .replace(/^[-*•]\s+(.+)$/gm, '<li>$1</li>')
      .replace(/(<li[^>]*>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
      .replace(/(<li class="ol-item">.*<\/li>\n?)+/g, m => `<ol>${m.replace(/ class="ol-item"/g, '')}</ol>`)
      .replace(/^(?!<[houli]|<hr|<strong|<em)(.+)$/gm, '<p>$1</p>')
      .replace(/\n{2,}/g, '\n');
  };

  const printReport = () => {
    const win = window.open('', '_blank');
    const htmlBody = markdownToHtml(resolvedText);
    win.document.write(`<html><head><title>Synthesis Report</title>
      <style>
        body { font-family: Georgia, serif; max-width: 860px; margin: 60px auto; color: #1a1a1a; line-height: 1.8; font-size: 14px; }
        .report-title { font-size: 26px; border-bottom: 3px solid #F0A500; padding-bottom: 10px; margin-bottom: 32px; }
        h1.section-title { font-size: 22px; color: #111; margin-top: 36px; border-bottom: 2px solid #F0A500; padding-bottom: 6px; }
        h2 { font-size: 17px; color: #333; margin-top: 28px; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-family: Georgia, serif; }
        h3 { font-size: 15px; color: #555; margin-top: 20px; font-style: italic; }
        h4 { font-size: 13px; color: #666; margin-top: 14px; }
        p { margin: 8px 0; }
        ul, ol { margin: 8px 0; padding-left: 24px; }
        li { margin: 4px 0; }
        strong { font-weight: bold; }
        em { font-style: italic; }
        hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
        .footer { margin-top: 60px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
        @media print { body { margin: 30px; } }
      </style></head><body>
      <h1 class="report-title">Synthesis Report</h1>
      ${htmlBody}
      <div class="footer">Generated by AgentDebate — ${new Date().toLocaleDateString()}</div>
      <script>window.onload = function() { window.print(); }; window.onafterprint = function() { window.close(); if (window.opener) window.opener.focus(); };<\/script>
      </body></html>`);
    win.document.close();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <WrButton variant="secondary" size="sm" onClick={() => window.history.back()}>
          ← Back
        </WrButton>
        {resolvedText && (
          <WrButton variant="outline" size="sm" onClick={printReport}>
            🖨 Print Report
          </WrButton>
        )}
      </div>
      {resolvedText && (
        <div className="rounded p-5" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
          <div className="prose-synthesis">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--wr-text-primary)', marginBottom: 12, marginTop: 24, borderBottom: '1px solid var(--wr-border)', paddingBottom: 8 }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ fontWeight: 700, color: 'var(--wr-amber)', marginBottom: 8, marginTop: 24, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--wr-text-primary)', marginBottom: 6, marginTop: 16 }}>{children}</h3>,
                p: ({ children }) => <p style={{ fontSize: 13.5, color: 'var(--wr-text-secondary)', lineHeight: 1.75, marginBottom: 12 }}>{children}</p>,
                ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 12 }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ paddingLeft: 20, marginBottom: 12 }}>{children}</ol>,
                li: ({ children }) => <li style={{ fontSize: 13.5, color: 'var(--wr-text-secondary)', lineHeight: 1.7, marginBottom: 4 }}>{children}</li>,
                strong: ({ children }) => <strong style={{ fontWeight: 700, color: 'var(--wr-text-primary)' }}>{children}</strong>,
                em: ({ children }) => <em style={{ color: 'var(--wr-text-muted)', fontStyle: 'italic' }}>{children}</em>,
                hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--wr-border)', margin: '20px 0' }} />,
                code: ({ children }) => <code style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', backgroundColor: 'var(--wr-bg-secondary)', padding: '1px 5px', borderRadius: 3, color: 'var(--wr-amber)' }}>{children}</code>,
                blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid var(--wr-amber)', paddingLeft: 14, margin: '12px 0', opacity: 0.85 }}>{children}</blockquote>,
              }}
            >
              {resolvedText}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sources Panel ─────────────────────────────────────────────────────────────
function SourcesPanel({ sources, agents, session, db, sessionId, onSourceAdded }) {
  const [addUrl, setAddUrl] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validityReport, setValidityReport] = useState(null);
  const [validityError, setValidityError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const agentMap = Object.fromEntries((agents || []).map(a => [a.id, a]));

  const TIERS = ['authoritative', 'credible', 'speculative', 'unverified'];
  const grouped = TIERS.reduce((acc, t) => {
    acc[t] = sources.filter(s => (s.credibility_tier || 'unverified') === t);
    return acc;
  }, {});

  const handleAdd = async () => {
    if (!addUrl.trim()) return;
    setAdding(true);
    try {
      const { tier, score } = scoreSourceCredibility(addUrl.trim());
      let domain = addUrl;
      try { domain = new URL(addUrl.trim()).hostname; } catch { /* keep */ }
      await db.SessionSource.create({
        session_id: sessionId, source_type: 'facilitator',
        url: addUrl.trim(), title: addTitle.trim() || null,
        domain, credibility_tier: tier, credibility_score: score,
      });
      setAddUrl(''); setAddTitle(''); setShowAddForm(false);
      onSourceAdded?.();
    } catch { /* ignore */ }
    setAdding(false);
  };

  const handleValidate = async () => {
    setValidating(true);
    setValidityReport(null);
    setValidityError(null);
    try {
      const report = await analyzeSourceValidity({ sources, scenarioName: session?.name });
      setValidityReport(report);
    } catch (e) {
      setValidityError(e.message);
    }
    setValidating(false);
  };

  if (sources.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <div className="rounded p-8 text-center" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
          <p className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>NO SOURCES CAPTURED YET</p>
          <p className="text-xs mt-2" style={{ color: 'var(--wr-text-muted)' }}>Sources appear automatically when agents use tools or cite publications. You can also add sources manually below.</p>
          <button onClick={() => setShowAddForm(v => !v)} className="mt-4 text-xs font-mono font-bold px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(240,165,0,0.1)', color: 'var(--wr-amber)', border: '1px solid rgba(240,165,0,0.3)' }}>
            + Add Source
          </button>
        </div>
        {showAddForm && <AddSourceForm url={addUrl} title={addTitle} setUrl={setAddUrl} setTitle={setAddTitle} onAdd={handleAdd} adding={adding} />}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>SESSION SOURCES</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>{sources.length} source{sources.length !== 1 ? 's' : ''} captured</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddForm(v => !v)} className="text-xs font-mono font-bold px-3 py-1.5 rounded" style={{ backgroundColor: 'var(--wr-bg-secondary)', color: 'var(--wr-text-muted)', border: '1px solid var(--wr-border)' }}>
            + Add
          </button>
          <button onClick={handleValidate} disabled={validating} className="text-xs font-mono font-bold px-3 py-1.5 rounded flex items-center gap-1.5" style={{ backgroundColor: 'rgba(240,165,0,0.1)', color: 'var(--wr-amber)', border: '1px solid rgba(240,165,0,0.3)', opacity: validating ? 0.6 : 1 }}>
            {validating ? '…' : '⚡'} {validating ? 'Analysing…' : 'Run Validity Analysis'}
          </button>
        </div>
      </div>

      {showAddForm && <AddSourceForm url={addUrl} title={addTitle} setUrl={setAddUrl} setTitle={setAddTitle} onAdd={handleAdd} adding={adding} />}

      {/* Validity report */}
      {validityError && <p className="text-xs p-3 rounded" style={{ backgroundColor: 'rgba(192,57,43,0.1)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.2)' }}>{validityError}</p>}
      {validityReport && <ValidityReport report={validityReport} />}

      {/* Sources by tier */}
      {TIERS.map(tier => {
        const list = grouped[tier];
        if (!list.length) return null;
        const c = TIER_COLORS[tier];
        return (
          <div key={tier} className="rounded overflow-hidden" style={{ border: `1px solid ${c.border}` }}>
            <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: c.bg }}>
              <span className="text-xs font-bold font-mono tracking-widest" style={{ color: c.text }}>{TIER_LABELS[tier].toUpperCase()}</span>
              <span className="text-xs font-mono" style={{ color: c.text }}>{list.length}</span>
            </div>
            <div className="divide-y" style={{ backgroundColor: 'var(--wr-bg-card)', borderColor: 'var(--wr-border)' }}>
              {list.map(s => <SourceRow key={s.id} source={s} agent={agentMap[s.agent_id]} tierColor={c} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AddSourceForm({ url, title, setUrl, setTitle, onAdd, adding }) {
  return (
    <div className="rounded p-4 space-y-3" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
      <p className="text-xs font-bold font-mono tracking-widest" style={{ color: 'var(--wr-text-muted)' }}>ADD FACILITATOR SOURCE</p>
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded text-sm font-mono" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)', outline: 'none' }} />
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title or description (optional)" className="w-full px-3 py-2 rounded text-sm" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)', outline: 'none' }} />
      <button onClick={onAdd} disabled={adding || !url.trim()} className="px-4 py-1.5 rounded text-xs font-bold font-mono" style={{ backgroundColor: 'rgba(240,165,0,0.15)', color: 'var(--wr-amber)', border: '1px solid rgba(240,165,0,0.3)', opacity: adding || !url.trim() ? 0.5 : 1 }}>
        {adding ? 'Adding…' : 'Add Source'}
      </button>
    </div>
  );
}

function SourceRow({ source, agent, tierColor }) {
  const [expanded, setExpanded] = useState(false);
  const label = source.title || source.domain || source.url || 'Unknown source';
  const typeLabel = SOURCE_TYPE_LABELS[source.source_type] || source.source_type;
  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {source.url ? (
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium truncate hover:underline" style={{ color: 'var(--wr-text-primary)', maxWidth: 380 }}>
                {label}
              </a>
            ) : (
              <span className="text-sm font-medium" style={{ color: 'var(--wr-text-primary)' }}>{label}</span>
            )}
            <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: tierColor.bg, color: tierColor.text, border: `1px solid ${tierColor.border}` }}>{TIER_LABELS[source.credibility_tier || 'unverified']}</span>
            <span className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>{typeLabel}</span>
            {agent && <span className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>via {agent.name}</span>}
          </div>
          {source.cited_claim && (
            <p className="text-xs mt-1 italic" style={{ color: 'var(--wr-text-muted)' }}>
              "{source.cited_claim.slice(0, 120)}{source.cited_claim.length > 120 ? '…' : ''}"
            </p>
          )}
          {source.content_snippet && (
            <button onClick={() => setExpanded(v => !v)} className="text-xs mt-1" style={{ color: 'var(--wr-amber)' }}>
              {expanded ? 'Hide snippet ▲' : 'Show snippet ▼'}
            </button>
          )}
          {expanded && source.content_snippet && (
            <pre className="text-xs mt-1 p-2 rounded whitespace-pre-wrap" style={{ backgroundColor: 'var(--wr-bg-secondary)', color: 'var(--wr-text-secondary)', fontFamily: 'inherit' }}>
              {source.content_snippet}
            </pre>
          )}
        </div>
        {source.credibility_score != null && (
          <span className="text-xs font-mono font-bold flex-shrink-0 mt-0.5" style={{ color: tierColor.text }}>{source.credibility_score}</span>
        )}
      </div>
    </div>
  );
}

function ValidityReport({ report }) {
  const confColors = { HIGH: '#27AE60', MEDIUM: '#F0A500', LOW: '#C0392B' };
  const c = confColors[report.overall_confidence] || 'var(--wr-text-muted)';
  return (
    <div className="rounded p-4 space-y-4" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>VALIDITY ANALYSIS</h3>
        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded" style={{ backgroundColor: `${c}22`, color: c, border: `1px solid ${c}44` }}>
          {report.overall_confidence} CONFIDENCE
        </span>
      </div>
      {report.summary && <p className="text-xs" style={{ color: 'var(--wr-text-secondary)' }}>{report.summary}</p>}
      {report.contradictions?.length > 0 && (
        <div>
          <p className="text-xs font-bold font-mono mb-2" style={{ color: '#C0392B' }}>CONTRADICTIONS ({report.contradictions.length})</p>
          {report.contradictions.map((c, i) => (
            <div key={i} className="rounded p-3 mb-2" style={{ backgroundColor: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)' }}>
              <p className="text-xs font-medium" style={{ color: '#C0392B' }}>{c.source_a} vs {c.source_b}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--wr-text-secondary)' }}>{c.explanation}</p>
            </div>
          ))}
        </div>
      )}
      {report.unsupported_claims?.length > 0 && (
        <div>
          <p className="text-xs font-bold font-mono mb-2" style={{ color: '#E67E22' }}>UNSUPPORTED CLAIMS</p>
          <ul className="space-y-1">
            {report.unsupported_claims.map((claim, i) => <li key={i} className="text-xs" style={{ color: 'var(--wr-text-secondary)' }}>• {claim}</li>)}
          </ul>
        </div>
      )}
      {report.key_agreements?.length > 0 && (
        <div>
          <p className="text-xs font-bold font-mono mb-2" style={{ color: '#27AE60' }}>CROSS-SOURCE AGREEMENTS</p>
          <ul className="space-y-1">
            {report.key_agreements.map((a, i) => <li key={i} className="text-xs" style={{ color: 'var(--wr-text-secondary)' }}>✓ {a}</li>)}
          </ul>
        </div>
      )}
      {report.recommended_sources?.length > 0 && (
        <div>
          <p className="text-xs font-bold font-mono mb-2" style={{ color: 'var(--wr-text-muted)' }}>RECOMMENDED ADDITIONAL SOURCES</p>
          <ul className="space-y-1">
            {report.recommended_sources.map((s, i) => <li key={i} className="text-xs" style={{ color: 'var(--wr-text-secondary)' }}>→ {s}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function SessionSettingsPanel({ session, sessionAgents, getAgent, onSaved }) {
  const { db } = useWorkspace();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: session.name || '', phase_focus: session.phase_focus || '', context_override: session.context_override || '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await db.Session.update(session.id, form);
    setSaving(false);
    onSaved();
    navigate('/sessions');
  };

  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded p-5" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
        <h3 className="text-xs font-bold tracking-widest mb-4 font-mono" style={{ color: 'var(--wr-text-muted)' }}>SESSION DETAILS</h3>
        <div className="space-y-4">
          <WrInput label="NAME" value={form.name} onChange={v => set('name', v)} placeholder="Session name" />
          <WrInput label="PHASE FOCUS" value={form.phase_focus} onChange={v => set('phase_focus', v)} placeholder="e.g. Pre-launch risk assessment" />
          <WrInput label="CONTEXT OVERRIDE" value={form.context_override} onChange={v => set('context_override', v)} placeholder="Optional extra context appended to agent prompts..." rows={4} />
        </div>
        <div className="mt-4">
          <WrButton onClick={handleSave} disabled={saving}>
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </WrButton>
        </div>
      </div>

      <div className="rounded p-5" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
        <h3 className="text-xs font-bold tracking-widest mb-3 font-mono" style={{ color: 'var(--wr-text-muted)' }}>AGENTS ({sessionAgents.length})</h3>
        <div className="space-y-1">
          {sessionAgents.map(sa => {
            const agent = getAgent(sa.agent_id);
            return (
              <div key={sa.id} className="flex items-center gap-2 text-xs py-1" style={{ color: 'var(--wr-text-secondary)' }}>
                <span className="font-medium">{agent?.name}</span>
                <span style={{ color: 'var(--wr-text-muted)' }}>— {agent?.discipline}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SessionWorkspace() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { db, workspace } = useWorkspace();
  const [session, setSession] = useState(null);
  const [sessionAgents, setSessionAgents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [synthesis, setSynthesis] = useState(null);
  const [synthStreamText, setSynthStreamText] = useState('');
  const [tab, setTab] = useState('ROUND 1');
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingSynthesis, setGeneratingSynthesis] = useState(false);
  const [synthStatus, setSynthStatus] = useState('');
  const [scenarios, setScenarios] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [genError, setGenError] = useState(null);
  const [synthError, setSynthError] = useState(null);
  const [threats, setThreats] = useState([]);
  const [extractedThreats, setExtractedThreats] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [savingThreats, setSavingThreats] = useState(false);
  const [selectedThreats, setSelectedThreats] = useState(new Set());
  const [pinnedChains, setPinnedChains] = useState([]);
  const [sessionSources, setSessionSources] = useState([]);
  const [facilitatorNote, setFacilitatorNote] = useState('');
  const [briefingAll, setBriefingAll] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [showReactions, setShowReactions] = useState(false);
  const [loadingReactions, setLoadingReactions] = useState(false);
  const [criticalToast, setCriticalToast] = useState(null);
  const toastTimer = useRef(null);
  const [speakingAgentId, setSpeakingAgentId] = useState(null);
  const cancelRef = useRef(false);

  const load = async () => {
    if (!db) return;
    try {
    const [sess, sa, ag, sc, synth, srcs] = await Promise.all([
      db.Session.filter({ id }),
      db.SessionAgent.filter({ session_id: id }),
      db.Agent.list(),
      db.Scenario.list(),
      db.SessionSynthesis.filter({ session_id: id }),
      db.SessionSource.filter({ session_id: id }).catch(() => []),
    ]);
    setSession(sess[0] || null);
    setSessionAgents(sa);
    setAgents(ag);
    setScenarios(sc);
    setSynthesis(synth[0] || null);
    setSessionSources(srcs || []);

    const sessionData = sess[0];
    if (sessionData?.facilitator_note) setFacilitatorNote(sessionData.facilitator_note);

    const scenarioId = sessionData?.scenario_id;
    if (scenarioId) {
      const t = await db.Threat.filter({ scenario_id: scenarioId });
      setThreats(t);
    }

    // Load pinned chains
    const pinnedIds = sessionData?.pinned_chain_ids || [];
    if (pinnedIds.length > 0) {
      const allChains = await db.Chain.list();
      setPinnedChains(allChains.filter(c => pinnedIds.includes(c.id)));
    } else {
      setPinnedChains([]);
    }
    } catch (err) {
      console.error('SessionWorkspace load failed:', err);
    }
  };

  useEffect(() => { load(); }, [id, db]);

  // Auto-trigger synthesis when navigated from LiveDebateRoom with ?autoSynth=1
  const autoSynthFiredRef = useRef(false);
  useEffect(() => {
    if (!searchParams.get('autoSynth') || autoSynthFiredRef.current) return;
    if (!session || generatingSynthesis) return;
    if (synthesis) return; // already done
    const allR2Done = sessionAgents.length > 0 && sessionAgents.every(sa => sa.round2_rebuttal);
    if (!allR2Done) return;
    autoSynthFiredRef.current = true;
    setTab('SYNTHESIS');
    generateSynthesis();
  }, [session, sessionAgents, synthesis, generatingSynthesis, searchParams]);

  const getAgent = (agentId) => agents.find(a => a.id === agentId);
  const scenario = scenarios.find(s => s.id === session?.scenario_id);

  const buildChainContext = () => {
    if (!pinnedChains.length) return '';
    return pinnedChains.map(c => {
      const steps = (c.steps || []).map(s => `  Step ${s.step_number}: ${s.step_text}`).join('\n');
      return `[${c.name}]\n${c.description || ''}\n${steps}`;
    }).join('\n\n');
  };

  const showCriticalToast = (agentName, severity) => {
    if (severity !== 'CRITICAL') return;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setCriticalToast(agentName);
    toastTimer.current = setTimeout(() => setCriticalToast(null), 7000);
  };

  const speakAssessment = async (text, agent) => {
    if (!getOpenAiKey() || !text) return;
    const agentIdx = sessionAgents.findIndex(sa => sa.agent_id === agent?.id);
    const voiceId = DEFAULT_VOICES[agentIdx % DEFAULT_VOICES.length];
    setSpeakingAgentId(agent?.id);
    try {
      const { url } = await synthesize(text.substring(0, 500), voiceId);
      const audio = new Audio(url);
      audio.onended = () => setSpeakingAgentId(null);
      audio.onerror = () => setSpeakingAgentId(null);
      await audio.play();
    } catch (e) {
      console.warn('TTS failed:', e.message);
      setSpeakingAgentId(null);
    }
  };

  const briefAllAgents = async () => {
    setBriefingAll(true);
    const scenarioCtx = scenario?.context_document || '';
    for (const sa of sessionAgents) {
      const agent = getAgent(sa.agent_id);
      if (!agent) continue;
      try {
        const { briefing } = await generateRound0({
          agent: { ...agent },
          scenarioContext: scenarioCtx,
          phaseFocus: session?.phase_focus || '',
        });
        await db.SessionAgent.update(sa.id, { round0_briefing: briefing });
      } catch { /* skip failures silently */ }
    }
    setBriefingAll(false);
    load();
  };

  const resetAgent = async (sa, round) => {
    const updates = round === 1
      ? { round1_assessment: null, round1_severity: null, round1_confidence: null, compound_chain_text: null, status: 'pending' }
      : { round2_rebuttal: null, round2_revised_severity: null, round2_confidence: null, status: 'r1_done' };
    await db.SessionAgent.update(sa.id, updates);
    setSessionAgents(prev => prev.map(s => s.id === sa.id ? { ...s, ...updates } : s));
  };

  const resetAllAgents = async (round) => {
    for (const sa of sessionAgents) {
      await resetAgent(sa, round);
    }
  };

  const generateRound = async (round) => {
    cancelRef.current = false;
    setGeneratingAll(true);
    setGenError(null);
    const doneField = round === 1 ? 'round1_assessment' : 'round2_rebuttal';
    const agentsToRun = sessionAgents.filter(sa => !sa[doneField]);
    setProgress({ current: 0, total: agentsToRun.length });
    const others = round === 2 ? sessionAgents.filter(sa => sa.round1_assessment) : [];
    const chainContext = buildChainContext();

    // Save facilitator note to session if changed
    if (facilitatorNote !== (session?.facilitator_note || '')) {
      await db.Session.update(id, { facilitator_note: facilitatorNote });
    }

    let completedCount = 0;
    let stuckSaId = null;

    try {
      for (let i = 0; i < agentsToRun.length; i++) {
        if (cancelRef.current) {
          cancelRef.current = false;
          break;
        }
        const sa = agentsToRun[i];
        const agent = getAgent(sa.agent_id);
        if (!agent) continue;

        setProgress({ current: i + 1, total: agentsToRun.length });

        const statusKey = round === 1 ? 'generating_r1' : 'generating_r2';
        stuckSaId = sa.id;
        await db.SessionAgent.update(sa.id, { status: statusKey });
        setSessionAgents(prev => prev.map(s => s.id === sa.id ? { ...s, status: statusKey } : s));

        const othersText = others
          .filter(o => o.agent_id !== sa.agent_id)
          .map(o => {
            const oAgent = getAgent(o.agent_id);
            return `=== ${oAgent?.name} (${oAgent?.discipline}) ===\n${o.round1_assessment}`;
          }).join('\n\n');

        const fn = round === 1 ? generateRound1 : generateRound2;
        const res = await fn({
          agent: { ...agent },
          scenarioContext: scenario?.context_document || '',
          phaseFocus: session?.phase_focus || '',
          othersAssessments: othersText,
          threatCatalog: threats,
          chainContext,
          facilitator_note: facilitatorNote,
        });

        const updates = round === 1 ? {
          round1_assessment: res.assessment,
          round1_severity: res.severity || agent.severity_default,
          round1_confidence: res.confidence,
          compound_chain_text: res.compound_chain_text || null,
          status: 'r1_done',
        } : {
          round2_rebuttal: res.assessment,
          round2_revised_severity: res.severity || sa.round1_severity,
          round2_confidence: res.confidence,
          compound_chain_text: res.compound_chain_text || sa.compound_chain_text || null,
          status: 'complete',
        };

        await db.SessionAgent.update(sa.id, updates);
        setSessionAgents(prev => prev.map(s => s.id === sa.id ? { ...s, ...updates } : s));
        showCriticalToast(agent.name, updates.round1_severity || updates.round2_revised_severity);
        completedCount++;
        stuckSaId = null;

        if (i < agentsToRun.length - 1) await new Promise(r => setTimeout(r, 300));
      }
    } catch (e) {
      if (stuckSaId) {
        const resetStatus = round === 1 ? 'pending' : 'r1_done';
        await db.SessionAgent.update(stuckSaId, { status: resetStatus }).catch(() => {});
        setSessionAgents(prev => prev.map(s => s.id === stuckSaId ? { ...s, status: resetStatus } : s));
      }
      setGenError(e.message || 'Generation failed');
      setGeneratingAll(false);
      setProgress({ current: 0, total: 0 });
      return;
    }

    const allDone = completedCount === agentsToRun.length;
    const newStatus = round === 1 ? 'round1' : 'round2';
    await db.Session.update(id, { status: newStatus });
    setGeneratingAll(false);
    setProgress({ current: 0, total: 0 });

    // After round 2 fully completes, switch to synthesis and auto-generate
    if (round === 2 && allDone) {
      setTab('SYNTHESIS');
      setTimeout(() => generateSynthesis(), 500);
    } else {
      load();
    }
  };

  const generateSingleAgent = async (sa, round) => {
    const agent = getAgent(sa.agent_id);
    if (!agent) return;
    setGenError(null);
    const statusKey = round === 1 ? 'generating_r1' : 'generating_r2';
    await db.SessionAgent.update(sa.id, { status: statusKey });
    setSessionAgents(prev => prev.map(s => s.id === sa.id ? { ...s, status: statusKey } : s));

    const others = round === 2 ? sessionAgents.filter(o => o.agent_id !== sa.agent_id && o.round1_assessment) : [];
    const othersText = others.map(o => {
      const oAgent = getAgent(o.agent_id);
      return `=== ${oAgent?.name} (${oAgent?.discipline}) ===\n${o.round1_assessment}`;
    }).join('\n\n');

    const chainContext = buildChainContext();

    try {
      const fn2 = round === 1 ? generateRound1 : generateRound2;
      const res = await fn2({
        agent: { ...agent },
        scenarioContext: scenario?.context_document || '',
        phaseFocus: session?.phase_focus || '',
        othersAssessments: othersText,
        threatCatalog: threats,
        chainContext,
        facilitator_note: facilitatorNote,
      });

      const updates = round === 1 ? {
        round1_assessment: res.assessment,
        round1_severity: res.severity || agent.severity_default,
        round1_confidence: res.confidence,
        compound_chain_text: res.compound_chain_text || null,
        status: 'r1_done',
      } : {
        round2_rebuttal: res.assessment,
        round2_revised_severity: res.severity || sa.round1_severity,
        round2_confidence: res.confidence,
        compound_chain_text: res.compound_chain_text || sa.compound_chain_text || null,
        status: 'complete',
      };

      await db.SessionAgent.update(sa.id, updates);
      showCriticalToast(agent.name, updates.round1_severity || updates.round2_revised_severity);
      // Check if all agents are now done for this round; if so, advance session status
      const doneField = round === 1 ? 'round1_assessment' : 'round2_rebuttal';
      const updatedAgents = sessionAgents.map(s => s.id === sa.id ? { ...s, ...updates } : s);
      const allRoundDone = updatedAgents.every(s => s[doneField]);
      if (allRoundDone) {
        const newStatus = round === 1 ? 'round1' : 'round2';
        await db.Session.update(id, { status: newStatus });
        if (round === 2) {
          setTab('SYNTHESIS');
          setTimeout(() => generateSynthesis(), 500);
        }
      }
    } catch (e) {
      await db.SessionAgent.update(sa.id, { status: 'pending' });
      setGenError(e.message || 'Generation failed');
    }
    load();
  };

  const updateAgentText = async (sa, round, text) => {
    const field = round === 1 ? 'round1_assessment' : 'round2_rebuttal';
    await db.SessionAgent.update(sa.id, { [field]: text });
    load();
  };

  const generateReactions = async () => {
    const r1Done = sessionAgents.filter(sa => sa.round1_assessment);
    if (r1Done.length < 2) return;
    setLoadingReactions(true);
    setReactions([]);
    const scenarioCtx = scenario?.context_document || '';
    const newReactions = [];

    for (const sa of r1Done) {
      const agent = getAgent(sa.agent_id);
      if (!agent) continue;
      // React to another agent's assessment (next in list)
      const others = r1Done.filter(o => o.agent_id !== sa.agent_id);
      if (!others.length) continue;
      const target = others[Math.floor(Math.random() * others.length)];
      const targetAgent = getAgent(target.agent_id);
      try {
        const text = await generateReaction({
          agent: { ...agent },
          triggerText: target.round1_assessment,
          scenarioContext: scenarioCtx,
        });
        newReactions.push({ agentName: agent.name, targetName: targetAgent?.name, text, color: agent.domain_color || '#F0A500' });
        setReactions([...newReactions]);
      } catch { /* skip */ }
    }
    setLoadingReactions(false);
  };

  const generateSynthesis = async () => {
    setGeneratingSynthesis(true);
    setSynthError(null);
    setSynthStreamText('');
    setSynthStatus('Collecting agent assessments...');

    try {
      // Fetch fresh data from DB — state may be stale if called right after round generation
      const [freshSess, freshAgents, freshAgentDefs, freshScenarios, freshSynth] = await Promise.all([
        db.Session.filter({ id }),
        db.SessionAgent.filter({ session_id: id }),
        db.Agent.list(),
        db.Scenario.list(),
        db.SessionSynthesis.filter({ session_id: id }),
      ]);
      const sess = freshSess[0] || session;
      const agentMap = Object.fromEntries(freshAgentDefs.map(a => [a.id, a]));
      const scenarioDef = freshScenarios.find(s => s.id === sess?.scenario_id);

      setSynthStatus('Streaming synthesis...');
      const res = await generateSynthesisLLM({
        session: sess,
        sessionAgents: freshAgents.map(sa => ({
          ...sa,
          agentName: agentMap[sa.agent_id]?.name,
          discipline: agentMap[sa.agent_id]?.discipline,
        })),
        scenarioContext: scenarioDef?.context_document || '',
        onToken: (_tok, full) => setSynthStreamText(full),
      });

      const existing = freshSynth[0] || null;
      const synthData = {
        raw_text: res.synthesis,
        session_id: id,
        compound_chains: res.compound_chains || [],
      };
      if (existing?.id) {
        await db.SessionSynthesis.update(existing.id, synthData);
      } else {
        await db.SessionSynthesis.create(synthData);
      }

      // Persist parsed compound chains to the chains table
      const newChains = res.compound_chains || [];
      if (newChains.length > 0) {
        // Remove any chains previously generated for this session so re-runs don't duplicate
        const existingChains = await db.Chain.filter({ session_id: id }).catch(() => []);
        for (const c of existingChains.filter(c => c.is_ai_generated)) {
          await db.Chain.delete(c.id).catch(() => {});
        }
        for (const c of newChains) {
          await db.Chain.create({
            session_id: id,
            scenario_id: session?.scenario_id || null,
            name: c.name,
            description: c.description || '',
            steps: c.steps || [],
            is_ai_generated: true,
            tags: [],
          }).catch(() => {});
        }
      }

      await db.Session.update(id, { status: 'complete' });
      setSynthStreamText('');
      load();
    } catch (e) {
      setSynthError(e.message || 'Synthesis failed — check your Anthropic API key and try again.');
      setSynthStreamText('');
      load();
    } finally {
      setGeneratingSynthesis(false);
      setSynthStatus('');
    }
  };

  const handleExtractThreats = async () => {
    setExtracting(true);
    setExtractedThreats(null);
    try {
      const results = await extractSessionThreats({
        sessionAgents: sessionAgents.map(sa => ({
          ...sa,
          agentName: getAgent(sa.agent_id)?.name,
          discipline: getAgent(sa.agent_id)?.discipline,
        })),
        scenarioName: scenario?.name || '',
        scenarioContext: scenario?.context_document || '',
      });
      setExtractedThreats(results);
      setSelectedThreats(new Set(results.map((_, i) => i)));
    } catch {
      setExtractedThreats([]);
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveThreats = async () => {
    if (!extractedThreats || selectedThreats.size === 0) return;
    setSavingThreats(true);
    try {
      const toSave = extractedThreats.filter((_, i) => selectedThreats.has(i));
      for (const t of toSave) {
        await db.Threat.create({
          scenario_id: session.scenario_id,
          name: t.name,
          description: t.description,
          severity: t.severity,
          category: t.category,
          tags: [],
        });
      }
      setExtractedThreats(null);
      setSelectedThreats(new Set());
      load();
    } finally {
      setSavingThreats(false);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'var(--wr-bg-primary)' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--wr-amber)' }} />
      </div>
    );
  }

  const statusConfig = { pending:'#546E7A', round1:'#2E86AB', round2:'#D68910', complete:'#27AE60' };
  const statusColor = statusConfig[session.status] || '#546E7A';
  const round = tab === 'ROUND 1' ? 1 : 2;

  return (
    <div style={{ backgroundColor: 'var(--wr-bg-primary)', minHeight: '100vh' }}>
      {/* CRITICAL escalation toast */}
      {criticalToast && (
        <div
          className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg"
          style={{ backgroundColor: '#C0392B', color: '#fff', maxWidth: 340 }}
        >
          <BellRing className="w-4 h-4 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold tracking-widest font-mono">CRITICAL ESCALATION</p>
            <p className="text-xs mt-0.5">{criticalToast} has assessed CRITICAL severity</p>
          </div>
          <button onClick={() => setCriticalToast(null)} className="opacity-70 hover:opacity-100 flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Bar */}
      <div className="border-b px-6 py-4 flex items-center gap-4" style={{ borderColor: 'var(--wr-border)', backgroundColor: 'var(--wr-bg-secondary)' }}>
        <Link to="/sessions" className="text-xs flex items-center gap-1" style={{ color: 'var(--wr-text-muted)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Sessions
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-bold" style={{ color: 'var(--wr-text-primary)' }}>{session.name}</h1>
            <span className="text-xs px-2 py-0.5 rounded font-bold font-mono" style={{ backgroundColor: `${statusColor}22`, color: statusColor }}>
              {session.status?.toUpperCase()}
            </span>
            {pinnedChains.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(46,134,171,0.15)', color: '#2E86AB' }}>
                {pinnedChains.length} chain{pinnedChains.length !== 1 ? 's' : ''} pinned
              </span>
            )}
          </div>
          {session.phase_focus && <p className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>{session.phase_focus}</p>}
        </div>
        <div className="flex items-center gap-2">
          {session.mode === 'live' && (
            <Link to={`/sessions/${id}/live`}>
              <WrButton size="sm" style={{ backgroundColor: 'rgba(46,134,171,0.15)', borderColor: 'rgba(46,134,171,0.4)', color: '#2E86AB' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#2E86AB', display: 'inline-block', marginRight: 4 }} />
                Enter Debate Room
              </WrButton>
            </Link>
          )}
          <Link to={`/sessions/${id}/results`}>
            <WrButton variant="outline" size="sm"><BarChart2 className="w-3.5 h-3.5" /> Results</WrButton>
          </Link>
          {(tab === 'ROUND 1' || tab === 'ROUND 2') && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <WrButton
                    variant="secondary"
                    size="sm"
                    onClick={briefAllAgents}
                    disabled={briefingAll}
                  >
                    {briefingAll
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Briefing...</>
                      : <><BookOpen className="w-3.5 h-3.5" /> Brief Agents</>}
                  </WrButton>
                </TooltipTrigger>
                <TooltipContent side="bottom">Each agent writes a 100-word pre-session reflection before Round 1</TooltipContent>
              </Tooltip>
              {generatingAll ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <WrButton size="sm" variant="secondary" onClick={() => { cancelRef.current = true; }} style={{ borderColor: '#C0392B', color: '#C0392B' }}>
                      <StopCircle className="w-3.5 h-3.5" /> Stop
                    </WrButton>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Stop generation after the current agent finishes</TooltipContent>
                </Tooltip>
              ) : (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <WrButton
                        size="sm"
                        onClick={() => generateRound(round)}
                        disabled={generatingAll || sessionAgents.every(sa => round === 1 ? sa.round1_assessment : sa.round2_rebuttal)}
                      >
                        <><Sparkles className="w-3.5 h-3.5" /> Generate All {tab === 'ROUND 1' ? 'Round 1' : 'Round 2'}</>
                      </WrButton>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Run {tab === 'ROUND 1' ? 'Round 1' : 'Round 2'} assessments for all agents</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <WrButton
                        size="sm"
                        variant="secondary"
                        onClick={() => resetAllAgents(round)}
                        style={{ color: 'var(--wr-text-muted)' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Reset All
                      </WrButton>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Clear all {tab} assessments and return agents to pending</TooltipContent>
                  </Tooltip>
                </>
              )}
            </>
          )}
          {tab === 'SYNTHESIS' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <WrButton size="sm" onClick={generateSynthesis} disabled={generatingSynthesis}>
                  <Sparkles className="w-3.5 h-3.5" /> {generatingSynthesis ? 'Generating...' : 'Generate Synthesis'}
                </WrButton>
              </TooltipTrigger>
              <TooltipContent side="bottom">Synthesize all Round 2 assessments into a consensus threat picture</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--wr-border)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-6 py-3 text-xs font-bold tracking-widest font-mono transition-colors"
            style={{
              color: tab === t ? 'var(--wr-amber)' : 'var(--wr-text-muted)',
              borderBottom: tab === t ? '2px solid var(--wr-amber)' : '2px solid transparent',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Unrun banner */}
        {session.status === 'pending' && (
          <div className="mb-5 rounded p-4 flex items-center gap-4"
            style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px dashed var(--wr-border)' }}>
            <div className="flex-1">
              <p className="text-xs font-bold tracking-widest font-mono mb-1" style={{ color: 'var(--wr-text-muted)' }}>
                SESSION NOT STARTED
              </p>
              <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>
                {session.mode === 'live'
                  ? 'This session is ready. Enter the debate room to begin live AI moderation.'
                  : 'This session is ready. Generate Round 1 assessments from the tabs below to begin.'}
              </p>
            </div>
            {session.mode === 'live' ? (
              <Link to={`/sessions/${id}/live`}>
                <WrButton>Enter Debate Room</WrButton>
              </Link>
            ) : (
              <WrButton onClick={() => { setTab('ROUND 1'); }}>
                Start Round 1
              </WrButton>
            )}
          </div>
        )}

        {(tab === 'ROUND 1' || tab === 'ROUND 2') && (
          <>
            {/* Facilitator note — shown in Round 2 tab */}
            {tab === 'ROUND 2' && (
              <div className="mb-4 rounded p-4" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                <p className="text-xs font-bold tracking-widest font-mono mb-2" style={{ color: 'var(--wr-text-muted)' }}>FACILITATOR NOTE</p>
                <textarea
                  value={facilitatorNote}
                  onChange={e => setFacilitatorNote(e.target.value)}
                  placeholder="Add a note to guide agents in Round 2 — e.g. focus on supply chain dependencies..."
                  rows={2}
                  className="w-full text-xs px-3 py-2 rounded outline-none resize-none"
                  style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }}
                />
              </div>
            )}

            {genError && (
              <div className="mb-4 rounded p-3 flex items-start gap-2" style={{ backgroundColor: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#C0392B' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold mb-0.5">Generation Failed</p>
                  <p className="text-xs">{genError}</p>
                </div>
                <button onClick={() => setGenError(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
              </div>
            )}

            {/* Per-agent progress panel */}
            {generatingAll && progress.total > 0 && (
              <div className="mb-4 rounded p-3" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs" style={{ color: 'var(--wr-text-secondary)' }}>Generating {tab}...</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--wr-amber)' }}>{progress.current}/{progress.total}</span>
                </div>
                <div className="flex gap-2 mb-3">
                  {sessionAgents.map((sa, i) => {
                    const agent = getAgent(sa.agent_id);
                    const isDone = i < progress.current;
                    const isActive = i === progress.current - 1 && !isDone;
                    return (
                      <div key={sa.id} className="flex flex-col items-center gap-1" title={agent?.name}>
                        <span className="text-xs font-mono" style={{
                          color: isDone ? '#27AE60' : isActive ? 'var(--wr-amber)' : 'var(--wr-text-muted)',
                        }}>
                          {isDone ? '✓' : isActive ? '●' : '○'}
                        </span>
                        <span className="text-xs truncate max-w-[60px]" style={{ color: 'var(--wr-text-muted)', fontSize: '9px' }}>
                          {agent?.name?.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="w-full h-1 rounded-full" style={{ backgroundColor: 'var(--wr-border)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${(progress.current/progress.total)*100}%`, backgroundColor: 'var(--wr-amber)' }} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              {sessionAgents.map(sa => (
                <AgentAssessmentCard
                  key={sa.id}
                  sa={sa}
                  agent={getAgent(sa.agent_id)}
                  round={round}
                  onGenerate={() => generateSingleAgent(sa, round)}
                  onUpdate={(text) => updateAgentText(sa, round, text)}
                  onSpeak={getOpenAiKey() ? speakAssessment : null}
                  speaking={speakingAgentId === getAgent(sa.agent_id)?.id}
                  onReset={!generatingAll ? () => resetAgent(sa, round) : null}
                />
              ))}
            </div>

            {/* Live reactions feed */}
            {tab === 'ROUND 1' && sessionAgents.some(sa => sa.round1_assessment) && (
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => { setShowReactions(!showReactions); if (!showReactions && reactions.length === 0) generateReactions(); }}
                        className="flex items-center gap-2 text-xs font-mono tracking-wider"
                        style={{ color: showReactions ? 'var(--wr-amber)' : 'var(--wr-text-muted)' }}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {showReactions ? 'HIDE REACTIONS' : 'SHOW LIVE REACTIONS'}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Simulated cross-agent reactions to each other's Round 1 assessments</TooltipContent>
                  </Tooltip>
                  {showReactions && reactions.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={generateReactions} className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>
                          <RefreshCw className="w-3 h-3 inline mr-1" />refresh
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Regenerate all agent reactions</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                {showReactions && (
                  <div className="rounded p-4 space-y-3" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                    {loadingReactions ? (
                      <div className="flex items-center gap-2 py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--wr-amber)' }} />
                        <span className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>Generating reactions...</span>
                      </div>
                    ) : reactions.length === 0 ? (
                      <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>No reactions yet.</p>
                    ) : (
                      reactions.map((r, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.color, minHeight: 20 }} />
                          <div>
                            <p className="text-xs font-semibold" style={{ color: 'var(--wr-text-primary)' }}>
                              {r.agentName} <span style={{ color: 'var(--wr-text-muted)', fontWeight: 400 }}>re: {r.targetName}</span>
                            </p>
                            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--wr-text-secondary)' }}>{r.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {tab === 'SYNTHESIS' && (
          <SynthesisPanel
            synthesis={synthesis}
            sessionId={id}
            onGenerate={generateSynthesis}
            generating={generatingSynthesis}
            synthStatus={synthStatus}
            r2Done={sessionAgents.length > 0 && sessionAgents.every(sa => sa.round2_rebuttal)}
            synthError={synthError}
            streamText={synthStreamText}
          />
        )}

        {tab === 'THREATS' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-xs font-bold tracking-widest font-mono mb-3" style={{ color: 'var(--wr-text-muted)' }}>
                SCENARIO THREATS ({threats.length})
              </h3>
              {threats.length === 0 ? (
                <div className="rounded p-4" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                  <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>
                    No threats assigned to this scenario. Extract threats from session assessments below.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {threats.map(t => (
                    <div key={t.id} className="rounded p-3" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--wr-text-primary)' }}>{t.name}</p>
                        <SeverityBadge severity={t.severity} />
                      </div>
                      {t.category && (
                        <p className="text-xs font-mono mb-1.5" style={{ color: 'var(--wr-amber)' }}>{t.category}</p>
                      )}
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--wr-text-secondary)' }}>{t.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded p-5" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>
                    EXTRACT FROM SESSION
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--wr-text-muted)' }}>
                    Analyze agent assessments to surface new threats and save them to this scenario.
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <WrButton size="sm" onClick={handleExtractThreats}
                      disabled={extracting || !sessionAgents.some(sa => sa.round1_assessment)}>
                      {extracting
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Extracting...</>
                        : <><ShieldAlert className="w-3.5 h-3.5" /> Extract Threats</>}
                    </WrButton>
                  </TooltipTrigger>
                  <TooltipContent side="left">Analyze agent assessments and save new threat vectors to this scenario's catalog</TooltipContent>
                </Tooltip>
              </div>

              {!sessionAgents.some(sa => sa.round1_assessment) && (
                <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>
                  Complete at least Round 1 before extracting threats.
                </p>
              )}

              {extractedThreats !== null && (
                <div>
                  {extractedThreats.length === 0 ? (
                    <p className="text-xs py-2" style={{ color: 'var(--wr-text-muted)' }}>
                      No distinct threats could be extracted from the current assessments.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs mb-3" style={{ color: 'var(--wr-text-secondary)' }}>
                        {extractedThreats.length} threat{extractedThreats.length !== 1 ? 's' : ''} found — click to select/deselect
                      </p>
                      <div className="space-y-2 mb-4">
                        {extractedThreats.map((t, i) => (
                          <div key={i}
                            className="flex items-start gap-3 rounded p-3 cursor-pointer transition-all"
                            style={{
                              backgroundColor: selectedThreats.has(i) ? 'rgba(240,165,0,0.08)' : 'var(--wr-bg-secondary)',
                              border: `1px solid ${selectedThreats.has(i) ? 'rgba(240,165,0,0.3)' : 'var(--wr-border)'}`,
                            }}
                            onClick={() => setSelectedThreats(prev => {
                              const next = new Set(prev);
                              if (next.has(i)) next.delete(i); else next.add(i);
                              return next;
                            })}>
                            <div className="flex-shrink-0 w-4 h-4 mt-0.5 rounded flex items-center justify-center"
                              style={{
                                backgroundColor: selectedThreats.has(i) ? 'var(--wr-amber)' : 'transparent',
                                border: `1.5px solid ${selectedThreats.has(i) ? 'var(--wr-amber)' : 'var(--wr-border)'}`,
                              }}>
                              {selectedThreats.has(i) && <Check className="w-2.5 h-2.5" style={{ color: '#0D1B2A' }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="text-xs font-semibold" style={{ color: 'var(--wr-text-primary)' }}>{t.name}</p>
                                <SeverityBadge severity={t.severity} />
                                {t.category && (
                                  <span className="text-xs font-mono" style={{ color: 'var(--wr-amber)' }}>{t.category}</span>
                                )}
                              </div>
                              <p className="text-xs leading-relaxed" style={{ color: 'var(--wr-text-secondary)' }}>{t.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <WrButton size="sm" onClick={handleSaveThreats}
                          disabled={savingThreats || selectedThreats.size === 0}>
                          {savingThreats
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                            : <><Check className="w-3.5 h-3.5" /> Save {selectedThreats.size} Selected</>}
                        </WrButton>
                        <WrButton variant="secondary" size="sm" onClick={() => setExtractedThreats(null)}>
                          <X className="w-3.5 h-3.5" /> Discard
                        </WrButton>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'SOURCES' && (
          <SourcesPanel sources={sessionSources} agents={agents} session={session} db={db} sessionId={id} onSourceAdded={load} />
        )}

        {tab === 'SETTINGS' && (
          <SessionSettingsPanel session={session} sessionAgents={sessionAgents} getAgent={getAgent} onSaved={load} />
        )}
      </div>
    </div>
  );
}
