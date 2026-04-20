import { useState, Fragment } from 'react';
import { Scissors, AlertTriangle, X } from 'lucide-react';

// ── Shared constants ──────────────────────────────────────────────────────────

const LEVERAGE = {
  HIGH:   { color: '#C0392B', bg: 'rgba(192,57,43,0.12)',  border: 'rgba(192,57,43,0.5)',  glow: 'rgba(192,57,43,0.28)' },
  MEDIUM: { color: '#D68910', bg: 'rgba(214,137,16,0.12)', border: 'rgba(214,137,16,0.5)', glow: 'rgba(214,137,16,0.28)' },
  LOW:    { color: '#2E86AB', bg: 'rgba(46,134,171,0.12)', border: 'rgba(46,134,171,0.5)', glow: 'rgba(46,134,171,0.28)' },
};

const DIFFICULTY_COLOR = { EASY: '#27AE60', MODERATE: '#D68910', HARD: '#C0392B' };

// ── Arrow between nodes ───────────────────────────────────────────────────────

function FlowArrow({ leverageOfNext }) {
  const lev = LEVERAGE[leverageOfNext];
  const color = lev ? lev.color + '66' : 'rgba(240,165,0,0.25)';
  return (
    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', width: 44 }}>
      <svg width="44" height="20" viewBox="0 0 44 20" fill="none">
        <line x1="0" y1="10" x2="34" y2="10" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
        <polygon points="34,5 44,10 34,15" fill={color} />
      </svg>
    </div>
  );
}

// ── Individual flow node ──────────────────────────────────────────────────────

const NODE_W = 166;

function FlowNode({ step, analysis, priorityRank, isSelected, onClick }) {
  const lev    = LEVERAGE[analysis?.leverage];
  const isPri  = priorityRank !== null && priorityRank !== undefined;
  const isTop2 = isPri && priorityRank <= 2;

  const borderColor = isSelected
    ? (lev?.color || 'var(--wr-amber)')
    : (lev?.border || 'var(--wr-border)');

  const boxShadow = isSelected
    ? `0 0 0 2px ${lev?.color || 'var(--wr-amber)'}, 0 0 18px ${lev?.glow || 'rgba(240,165,0,0.2)'}`
    : isTop2 && lev
    ? `0 0 14px ${lev.glow}`
    : 'none';

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* Priority rank badge */}
      {isPri && (
        <div style={{
          position: 'absolute', top: -11, right: -11,
          width: 22, height: 22, borderRadius: '50%',
          backgroundColor: lev?.color || '#F0A500',
          color: '#fff', fontSize: 10, fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
          boxShadow: `0 2px 8px ${lev?.glow || 'rgba(240,165,0,0.35)'}`,
        }}>
          {priorityRank}
        </div>
      )}

      {/* Node body */}
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={e => e.key === 'Enter' && onClick()}
        style={{
          width: NODE_W,
          minHeight: 96,
          borderRadius: 8,
          border: `${isSelected ? 2 : 1.5}px solid ${borderColor}`,
          backgroundColor: lev ? lev.bg : 'rgba(255,255,255,0.02)',
          cursor: 'pointer',
          padding: '10px 12px',
          transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
          boxShadow,
          userSelect: 'none',
        }}
      >
        {/* Step number + leverage label + scissors */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              backgroundColor: lev?.color || 'rgba(240,165,0,0.15)',
              border: `1.5px solid ${lev?.color || 'var(--wr-amber)'}`,
              color: '#fff', fontSize: 10, fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {step.step_number}
            </div>
            {analysis?.leverage && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: lev?.color,
                fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em',
              }}>
                {analysis.leverage}
              </span>
            )}
          </div>
          {analysis?.leverage === 'HIGH' && (
            <Scissors style={{ width: 11, height: 11, color: '#C0392B', flexShrink: 0 }} />
          )}
        </div>

        {/* Agent label */}
        {step.agent_label && (
          <p style={{
            fontSize: 10, fontWeight: 700, color: 'var(--wr-amber)', marginBottom: 3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {step.agent_label}
          </p>
        )}

        {/* Step text — 3-line clamp */}
        <p style={{
          fontSize: 10, color: 'var(--wr-text-muted)', lineHeight: 1.45,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {step.step_text}
        </p>

        {/* Break point label on priority HIGH nodes */}
        {isPri && analysis?.leverage === 'HIGH' && (
          <div style={{
            marginTop: 7, paddingTop: 6,
            borderTop: `1px solid ${lev?.border}`,
            fontSize: 9, fontWeight: 700, color: lev?.color,
            fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.07em',
          }}>
            ✂ BREAK POINT
          </div>
        )}
      </div>
    </div>
  );
}

// ── Detail panel rendered below the graph when a node is selected ─────────────

function StepDetailPanel({ step, analysis, priorityRank, onClose }) {
  const lev = LEVERAGE[analysis?.leverage];

  return (
    <div style={{
      borderTop: `2px solid ${lev?.color || 'var(--wr-border)'}`,
      padding: '16px 20px 18px',
      backgroundColor: lev ? lev.bg : 'transparent',
    }}>

      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 3 }}>
            <span style={{
              fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
              color: lev?.color || 'var(--wr-amber)',
            }}>
              STEP {step.step_number}
            </span>
            {priorityRank !== null && (
              <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: lev?.color }}>
                · PRIORITY #{priorityRank}
              </span>
            )}
            {analysis?.leverage && (
              <span style={{
                fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                padding: '1px 7px', borderRadius: 3,
                backgroundColor: lev?.bg, color: lev?.color, border: `1px solid ${lev?.border}`,
              }}>
                {analysis.leverage} LEVERAGE
              </span>
            )}
            {analysis?.difficulty && (
              <span style={{
                fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                padding: '1px 7px', borderRadius: 3,
                backgroundColor: 'var(--wr-bg-secondary)',
                color: DIFFICULTY_COLOR[analysis.difficulty] || 'var(--wr-text-muted)',
                border: '1px solid var(--wr-border)',
              }}>
                {analysis.difficulty}
              </span>
            )}
          </div>
          {step.agent_label && (
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--wr-amber)', lineHeight: 1.3 }}>
              {step.agent_label}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          style={{ color: 'var(--wr-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}
          aria-label="Close detail"
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* No analysis yet */}
      {!analysis && (
        <p style={{ fontSize: 12, color: 'var(--wr-text-muted)' }}>
          Analysis not available for this step. Run Chain Breaker to generate it.
        </p>
      )}

      {analysis && (
        <>
          {/* Adversary objective + dependencies */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div style={{
              borderRadius: 6, padding: '10px 12px',
              backgroundColor: 'rgba(192,57,43,0.07)', border: '1px solid rgba(192,57,43,0.2)',
            }}>
              <p style={{
                fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                color: '#C0392B', marginBottom: 6, letterSpacing: '0.06em',
              }}>
                ADVERSARY OBJECTIVE
              </p>
              <p style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--wr-text-secondary)' }}>
                {analysis.adversary_objective}
              </p>
            </div>
            <div style={{
              borderRadius: 6, padding: '10px 12px',
              backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)',
            }}>
              <p style={{
                fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                color: 'var(--wr-text-muted)', marginBottom: 6, letterSpacing: '0.06em',
              }}>
                STEP DEPENDENCIES
              </p>
              <p style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--wr-text-secondary)' }}>
                {analysis.dependencies}
              </p>
            </div>
          </div>

          {/* Countermeasures */}
          {analysis.countermeasures?.length > 0 && (
            <div style={{
              borderRadius: 6, padding: '10px 12px', marginBottom: 10,
              backgroundColor: lev?.bg, border: `1px solid ${lev?.border}`,
            }}>
              <p style={{
                fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                color: lev?.color, marginBottom: 8, letterSpacing: '0.06em',
              }}>
                BREAK POINT — COUNTERMEASURES
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: analysis.countermeasures.length > 2 ? '1fr 1fr' : '1fr',
                gap: '5px 20px',
              }}>
                {analysis.countermeasures.map((cm, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{
                      fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                      color: lev?.color, flexShrink: 0, marginTop: 2, width: 14,
                    }}>
                      {i + 1}.
                    </span>
                    <p style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--wr-text-secondary)' }}>{cm}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Residual risk */}
          {analysis.residual_risk && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
              <AlertTriangle style={{ width: 12, height: 12, color: '#D68910', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 11, color: 'var(--wr-text-muted)', lineHeight: 1.5 }}>
                <strong style={{ color: '#D68910' }}>Residual risk: </strong>
                {analysis.residual_risk}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ChainFlowGraph({ chain, analysisMap = {}, rankMap = {} }) {
  const [selectedStep, setSelectedStep] = useState(null);
  const steps = chain?.steps || [];

  if (steps.length === 0) return null;

  const toggleStep = (num) => setSelectedStep(prev => prev === num ? null : num);

  const selectedStepData  = steps.find(s => s.step_number === selectedStep) || null;
  const selectedAnalysis  = selectedStep != null ? (analysisMap[selectedStep] || null) : null;
  const selectedRank      = selectedStep != null ? (rankMap[selectedStep] ?? null) : null;

  return (
    <div style={{
      borderRadius: 10, overflow: 'hidden',
      border: '1px solid var(--wr-border)',
      backgroundColor: 'var(--wr-bg-card)',
    }}>

      {/* ── Legend bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        padding: '9px 16px',
        borderBottom: '1px solid var(--wr-border)',
        backgroundColor: 'var(--wr-bg-secondary)',
      }}>
        <span style={{
          fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
          color: 'var(--wr-text-muted)', letterSpacing: '0.08em',
        }}>
          ATTACK CHAIN FLOW
        </span>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          {[['HIGH', '#C0392B'], ['MEDIUM', '#D68910'], ['LOW', '#2E86AB']].map(([label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color }} />
              <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-muted)' }}>
                {label}
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              backgroundColor: '#C0392B', color: '#fff',
              fontSize: 9, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              1
            </div>
            <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-muted)' }}>
              priority rank
            </span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--wr-text-muted)', fontStyle: 'italic' }}>
            click node for detail
          </span>
        </div>
      </div>

      {/* ── Scrollable graph ── */}
      <div style={{ overflowX: 'auto', padding: '24px 24px 20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          // min-width keeps the graph from collapsing when container is narrow
          minWidth: steps.length * NODE_W + (steps.length - 1) * 44 + 2,
        }}>
          {steps.map((step, i) => (
            <Fragment key={step.step_number}>
              <FlowNode
                step={step}
                analysis={analysisMap[step.step_number] || null}
                priorityRank={rankMap[step.step_number] ?? null}
                isSelected={selectedStep === step.step_number}
                onClick={() => toggleStep(step.step_number)}
              />
              {i < steps.length - 1 && (
                <FlowArrow leverageOfNext={analysisMap[steps[i + 1].step_number]?.leverage} />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      {/* ── Step detail panel ── */}
      {selectedStepData && (
        <StepDetailPanel
          step={selectedStepData}
          analysis={selectedAnalysis}
          priorityRank={selectedRank}
          onClose={() => setSelectedStep(null)}
        />
      )}
    </div>
  );
}
