import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/lib/WorkspaceContext';
import {
  Scissors, AlertTriangle, Loader2, Save, FileText,
  CheckCircle2, Trash2, FolderOpen, Zap,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import WrButton from '@/components/ui/WrButton';
import ChainFlowGraph from '@/components/chainbreaker/ChainFlowGraph';
import { openChainBreakerReport } from '@/components/chainbreaker/ChainBreakerReport';
import { toast } from '@/components/ui/use-toast';
import {
  parseAnalysisConfigs,
  saveLibraryAnalysis,
  saveSessionAnalysis,
  clearLibraryAnalysis,
  clearSessionAnalysis,
} from '@/lib/chainBreakStorage';

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVERAGE = {
  HIGH:   { color: '#C0392B', bg: 'rgba(192,57,43,0.1)',  border: 'rgba(192,57,43,0.35)' },
  MEDIUM: { color: '#D68910', bg: 'rgba(214,137,16,0.1)', border: 'rgba(214,137,16,0.35)' },
  LOW:    { color: '#2E86AB', bg: 'rgba(46,134,171,0.1)', border: 'rgba(46,134,171,0.35)' },
};
const RESILIENCE_COLOR = { HIGH: '#C0392B', MEDIUM: '#D68910', LOW: '#27AE60' };

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ChainBreaker() {
  const { db } = useWorkspace();

  // Entity data
  const [chains,    setChains]    = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [syntheses, setSyntheses] = useState([]);
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  // Analysis storage maps (from AppConfig)
  const [libMap, setLibMap] = useState({});  // chainId → { analysis, analyzed_at, configId }
  const [sesMap, setSesMap] = useState({});  // `${synthId}_${idx}` → same

  // Selection state
  const [source,             setSource]             = useState('library');
  const [selectedChainId,    setSelectedChainId]    = useState('');
  const [selectedSynthId,    setSelectedSynthId]    = useState('');
  const [compoundIdx,        setCompoundIdx]        = useState(0);
  const [selectedScenarioId, setSelectedScenarioId] = useState('');

  // Analysis result state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis,  setAnalysis]  = useState(null);
  const [error,     setError]     = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [savedAt,   setSavedAt]   = useState(null);

  // ── Load all data + analysis configs ────────────────────────────────────────

  useEffect(() => {
    if (!db) return;
    Promise.all([
      db.Chain.list(),
      db.Scenario.list(),
      db.SessionSynthesis.list(),
      db.Session.list(),
      db.AppConfig.list(),
    ]).then(([c, sc, sy, s, configs]) => {
      setChains(c);
      setScenarios(sc);
      setSyntheses(sy);
      setSessions(s);
      const { libMap: lm, sesMap: sm } = parseAnalysisConfigs(configs);
      setLibMap(lm);
      setSesMap(sm);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [db]);

  // ── Derived data ─────────────────────────────────────────────────────────────

  const synthesesWithChains = useMemo(
    () => syntheses.filter(s => s.compound_chains?.length > 0),
    [syntheses]
  );

  const sessionById = useMemo(
    () => Object.fromEntries(sessions.map(s => [s.id, s])),
    [sessions]
  );

  const activeChain = useMemo(() => {
    if (source === 'library') {
      return chains.find(c => c.id === selectedChainId) || null;
    }
    const synth = syntheses.find(s => s.id === selectedSynthId);
    const cc    = synth?.compound_chains?.[compoundIdx];
    if (!cc) return null;
    return {
      name:        cc.name        || `Compound Chain ${compoundIdx + 1}`,
      description: cc.description || '',
      steps: (cc.steps || []).map((s, i) => ({ ...s, step_number: s.step_number ?? i + 1 })),
    };
  }, [source, selectedChainId, chains, syntheses, selectedSynthId, compoundIdx]);

  const hasSteps = (activeChain?.steps?.length || 0) > 0;

  const analysisMap = useMemo(() => {
    if (!analysis?.steps) return {};
    return Object.fromEntries(analysis.steps.map(s => [s.step_number, s]));
  }, [analysis]);

  const rankMap = useMemo(() => {
    if (!analysis?.priority_steps) return {};
    const m = {};
    analysis.priority_steps.forEach((n, i) => { m[n] = i + 1; });
    return m;
  }, [analysis]);

  // Saved analyses for management section
  const savedLibraryAnalyses = useMemo(
    () => chains.filter(c => libMap[c.id]),
    [chains, libMap]
  );

  const savedSessionAnalyses = useMemo(() => {
    const result = [];
    for (const synth of syntheses) {
      for (const [key, entry] of Object.entries(sesMap)) {
        if (!key.startsWith(`${synth.id}_`)) continue;
        const idx  = Number(key.slice(synth.id.length + 1));
        const sess = sessionById[synth.session_id];
        result.push({
          synthId:     synth.id,
          idx,
          chainName:   synth.compound_chains?.[idx]?.name || `Compound Chain ${idx + 1}`,
          sessionName: sess?.name || `Session ${synth.session_id?.slice(-6)}`,
          analyzedAt:  entry.analyzed_at,
          result:      entry.analysis,
        });
      }
    }
    return result;
  }, [syntheses, sesMap, sessionById]);

  const hasSavedAnalyses = savedLibraryAnalyses.length > 0 || savedSessionAnalyses.length > 0;

  // ── Selection handlers ────────────────────────────────────────────────────────

  const clearCurrentAnalysis = () => {
    setAnalysis(null);
    setSavedAt(null);
    setError(null);
  };

  const handleSourceChange = (val) => {
    setSource(val);
    setSelectedChainId('');
    setSelectedSynthId('');
    setCompoundIdx(0);
    clearCurrentAnalysis();
  };

  const handleChainSelect = (id) => {
    setSelectedChainId(id);
    setSelectedSynthId('');
    setError(null);
    const saved = libMap[id];
    if (saved) {
      setAnalysis(saved.analysis);
      setSavedAt(saved.analyzed_at);
    } else {
      setAnalysis(null);
      setSavedAt(null);
    }
  };

  const handleSynthSelect = (id) => {
    setSelectedSynthId(id);
    setCompoundIdx(0);
    setSelectedChainId('');
    setError(null);
    const key   = `${id}_0`;
    const saved = sesMap[key];
    if (saved) {
      setAnalysis(saved.analysis);
      setSavedAt(saved.analyzed_at);
    } else {
      setAnalysis(null);
      setSavedAt(null);
    }
  };

  const handleCompoundIdxChange = (idx) => {
    setCompoundIdx(idx);
    setError(null);
    const key   = `${selectedSynthId}_${idx}`;
    const saved = sesMap[key];
    if (saved) {
      setAnalysis(saved.analysis);
      setSavedAt(saved.analyzed_at);
    } else {
      setAnalysis(null);
      setSavedAt(null);
    }
  };

  // ── Run analysis ──────────────────────────────────────────────────────────────

  const runAnalysis = async () => {
    if (!activeChain || !hasSteps) return;
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setSavedAt(null);
    const scenario = scenarios.find(s => s.id === selectedScenarioId);
    try {
      const res = await base44.functions.invoke('analyzeChainBreaker', {
        chain: {
          name:        activeChain.name,
          description: activeChain.description,
          steps: activeChain.steps.map(s => ({
            step_number: s.step_number,
            agent_label: s.agent_label || `Step ${s.step_number}`,
            step_text:   s.step_text   || '',
          })),
        },
        scenarioContext: scenario?.context_document || '',
      });
      if (res.data?.error) throw new Error(res.data.error);
      setAnalysis(res.data);
      toast({
        title: 'Analysis complete',
        description: `${res.data.steps?.length || 0} steps analyzed · Chain resilience: ${res.data.chain_resilience}`,
      });
    } catch (e) {
      const msg = e.message || 'Analysis failed.';
      setError(msg);
      toast({ title: 'Analysis failed', description: msg, variant: 'destructive' });
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Save analysis ─────────────────────────────────────────────────────────────

  const saveAnalysis = async () => {
    if (!analysis || saving) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (source === 'library' && selectedChainId) {
        const configId = await saveLibraryAnalysis(db, selectedChainId, analysis, now);
        setLibMap(prev => ({ ...prev, [selectedChainId]: { analysis, analyzed_at: now, configId } }));
        setSavedAt(now);
        toast({ title: 'Analysis saved', description: 'Saved to chain library. Visible in dashboard.' });
      } else if (source === 'session' && selectedSynthId) {
        const key      = `${selectedSynthId}_${compoundIdx}`;
        const configId = await saveSessionAnalysis(db, selectedSynthId, compoundIdx, analysis, now);
        setSesMap(prev => ({ ...prev, [key]: { analysis, analyzed_at: now, configId } }));
        setSavedAt(now);
        toast({ title: 'Analysis saved', description: 'Saved to session synthesis. Visible in dashboard.' });
      }
    } catch (e) {
      console.error('Save failed:', e);
      toast({ title: 'Save failed', description: e.message || 'Could not save. Try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Clear saved analysis ──────────────────────────────────────────────────────

  const handleClearLibrary = async (chainId) => {
    try {
      await clearLibraryAnalysis(db, chainId);
      setLibMap(prev => { const n = { ...prev }; delete n[chainId]; return n; });
      if (source === 'library' && selectedChainId === chainId) {
        setSavedAt(null);
      }
      toast({ title: 'Analysis removed' });
    } catch (e) {
      toast({ title: 'Remove failed', description: e.message, variant: 'destructive' });
    }
  };

  const handleClearSession = async (synthId, idx) => {
    try {
      await clearSessionAnalysis(db, synthId, idx);
      const key = `${synthId}_${idx}`;
      setSesMap(prev => { const n = { ...prev }; delete n[key]; return n; });
      if (source === 'session' && selectedSynthId === synthId && compoundIdx === idx) {
        setSavedAt(null);
      }
      toast({ title: 'Analysis removed' });
    } catch (e) {
      toast({ title: 'Remove failed', description: e.message, variant: 'destructive' });
    }
  };

  // ── Load saved analysis ───────────────────────────────────────────────────────

  const loadLibraryAnalysis = (chain) => {
    setSource('library');
    setSelectedChainId(chain.id);
    setSelectedSynthId('');
    setError(null);
    const saved = libMap[chain.id];
    if (saved) { setAnalysis(saved.analysis); setSavedAt(saved.analyzed_at); }
    else        { setAnalysis(null);           setSavedAt(null); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadSessionAnalysis = (synthId, idx) => {
    setSource('session');
    setSelectedSynthId(synthId);
    setCompoundIdx(idx);
    setSelectedChainId('');
    setError(null);
    const key   = `${synthId}_${idx}`;
    const saved = sesMap[key];
    if (saved) { setAnalysis(saved.analysis); setSavedAt(saved.analyzed_at); }
    else        { setAnalysis(null);           setSavedAt(null); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Generate report ───────────────────────────────────────────────────────────

  const generateReport = () => {
    if (!analysis || !activeChain) return;
    openChainBreakerReport({
      chain:        activeChain,
      analysis,
      scenarioName: scenarios.find(s => s.id === selectedScenarioId)?.name || null,
      savedAt,
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ backgroundColor: 'var(--wr-bg-primary)', minHeight: '100vh' }}>
      <PageHeader
        icon={Scissors}
        title="CHAIN BREAKER"
        subtitle="Map adversary dependencies across compound attack chains and identify the highest-leverage points to break them"
      />

      <div className="p-6 space-y-6">

        {/* ── Configuration panel ───────────────────────────────────────── */}
        <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
          <h2 className="text-xs font-bold tracking-widest font-mono mb-4" style={{ color: 'var(--wr-text-muted)' }}>
            CONFIGURE ANALYSIS
          </h2>

          <div className="grid grid-cols-2 gap-6">

            {/* LEFT: chain selection */}
            <div className="space-y-4">
              {/* Source toggle */}
              <div>
                <label className="block text-xs font-bold tracking-widest font-mono mb-2" style={{ color: 'var(--wr-text-muted)' }}>
                  CHAIN SOURCE
                </label>
                <div className="flex rounded overflow-hidden" style={{ border: '1px solid var(--wr-border)', width: 'fit-content' }}>
                  {[['library', 'Chain Library'], ['session', 'Session Synthesis']].map(([val, lbl]) => (
                    <button key={val} onClick={() => handleSourceChange(val)}
                      className="px-4 py-2 text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: source === val ? 'var(--wr-amber)' : 'transparent',
                        color: source === val ? '#0D1B2A' : 'var(--wr-text-secondary)',
                      }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Library chain dropdown */}
              {source === 'library' && (
                <div>
                  <label className="block text-xs font-bold tracking-widest font-mono mb-1.5" style={{ color: 'var(--wr-text-muted)' }}>
                    SELECT CHAIN
                  </label>
                  {loading ? (
                    <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>Loading chains…</p>
                  ) : chains.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>No chains in library — build one in the Chains page first.</p>
                  ) : (
                    <select value={selectedChainId}
                      onChange={e => handleChainSelect(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded outline-none"
                      style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }}>
                      <option value="">Select a chain…</option>
                      {chains.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.steps?.length || 0} steps){libMap[c.id] ? ' ✓ saved' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Session synthesis selectors */}
              {source === 'session' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold tracking-widest font-mono mb-1.5" style={{ color: 'var(--wr-text-muted)' }}>
                      SELECT SESSION
                    </label>
                    {synthesesWithChains.length === 0 ? (
                      <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>No sessions with compound chains yet.</p>
                    ) : (
                      <select value={selectedSynthId}
                        onChange={e => handleSynthSelect(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded outline-none"
                        style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }}>
                        <option value="">Select a session…</option>
                        {synthesesWithChains.map(sy => {
                          const sess = sessionById[sy.session_id];
                          return (
                            <option key={sy.id} value={sy.id}>
                              {sess?.name || `Session ${sy.session_id?.slice(-6)}`} — {sy.compound_chains.length} chain{sy.compound_chains.length !== 1 ? 's' : ''}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>

                  {selectedSynthId && (() => {
                    const synth = syntheses.find(s => s.id === selectedSynthId);
                    const ccs   = synth?.compound_chains || [];
                    if (ccs.length <= 1) return null;
                    return (
                      <div>
                        <label className="block text-xs font-bold tracking-widest font-mono mb-1.5" style={{ color: 'var(--wr-text-muted)' }}>
                          COMPOUND CHAIN
                        </label>
                        <select value={compoundIdx}
                          onChange={e => handleCompoundIdxChange(Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm rounded outline-none"
                          style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }}>
                          {ccs.map((cc, i) => (
                            <option key={i} value={i}>
                              {cc.name || `Compound Chain ${i + 1}`}{sesMap[`${selectedSynthId}_${i}`] ? ' ✓ saved' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Chain preview */}
              {hasSteps && (
                <div className="rounded p-3 space-y-1" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)' }}>
                  <p className="text-xs font-bold font-mono mb-1" style={{ color: 'var(--wr-amber)' }}>{activeChain.name}</p>
                  {activeChain.description && (
                    <p className="text-xs mb-2" style={{ color: 'var(--wr-text-muted)' }}>{activeChain.description}</p>
                  )}
                  {activeChain.steps.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--wr-amber)' }}>{s.step_number}.</span>
                      <span className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>
                        {s.agent_label && <strong style={{ color: 'var(--wr-text-secondary)' }}>{s.agent_label}: </strong>}
                        {s.step_text?.slice(0, 90)}{(s.step_text?.length || 0) > 90 ? '…' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: scenario + explainer + run */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold tracking-widest font-mono mb-1.5" style={{ color: 'var(--wr-text-muted)' }}>
                  SCENARIO CONTEXT
                  <span className="ml-2 font-normal" style={{ color: 'var(--wr-text-muted)', opacity: 0.7 }}>(optional — improves specificity)</span>
                </label>
                <select value={selectedScenarioId}
                  onChange={e => setSelectedScenarioId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded outline-none"
                  style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }}>
                  <option value="">No scenario context</option>
                  {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="flex-1 rounded p-4" style={{ backgroundColor: 'rgba(240,165,0,0.05)', border: '1px solid rgba(240,165,0,0.15)' }}>
                <p className="text-xs font-bold font-mono mb-3" style={{ color: 'var(--wr-amber)' }}>WHAT THIS ANALYSIS PRODUCES</p>
                <div className="space-y-2">
                  {[
                    ['Adversary objective',  'What the threat actor gains at each step'],
                    ['Step dependencies',    'What conditions must hold for each step to execute'],
                    ['Leverage rating',      'HIGH / MEDIUM / LOW — impact of breaking this step'],
                    ['Countermeasures',      'Specific, actionable controls to disrupt each step'],
                    ['Break difficulty',     'EASY / MODERATE / HARD — implementation cost'],
                    ['Residual risk',        'What capability survives if only this step is broken'],
                  ].map(([label, desc]) => (
                    <div key={label} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: 'var(--wr-amber)' }} />
                      <p className="text-xs leading-snug" style={{ color: 'var(--wr-text-muted)' }}>
                        <strong style={{ color: 'var(--wr-text-secondary)' }}>{label}</strong> — {desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <WrButton onClick={runAnalysis} disabled={!hasSteps || analyzing} className="w-full justify-center" size="lg">
                {analyzing
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Chain…</>
                  : <><Scissors className="w-4 h-4" /> Run Chain Breaker</>}
              </WrButton>
            </div>
          </div>
        </div>

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded p-4 flex items-start gap-3"
            style={{ backgroundColor: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.3)' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#C0392B' }} />
            <p className="text-sm" style={{ color: '#C0392B' }}>{error}</p>
          </div>
        )}

        {/* ── Analysis results ──────────────────────────────────────────── */}
        {analysis && activeChain && (
          <div className="space-y-4">

            {/* Summary + resilience */}
            <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
              <div className="flex items-start gap-6 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>
                      CHAIN BREAK ANALYSIS — {activeChain.name.toUpperCase()}
                    </h2>
                    {savedAt && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: '#27AE60' }} />
                        <span className="text-xs font-mono" style={{ color: '#27AE60' }}>Saved</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--wr-text-secondary)', maxWidth: 720 }}>
                    {analysis.summary}
                  </p>
                </div>
                {analysis.chain_resilience && (
                  <div className="flex-shrink-0 text-center rounded-lg p-4"
                    style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', minWidth: 110 }}>
                    <p className="text-xs font-bold font-mono mb-1" style={{ color: 'var(--wr-text-muted)' }}>CHAIN RESILIENCE</p>
                    <p className="text-xl font-bold font-mono" style={{ color: RESILIENCE_COLOR[analysis.chain_resilience] || 'var(--wr-amber)' }}>
                      {analysis.chain_resilience}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--wr-text-muted)' }}>
                      {analysis.chain_resilience === 'HIGH'   && 'Hard to break overall'}
                      {analysis.chain_resilience === 'MEDIUM' && 'Breakable with effort'}
                      {analysis.chain_resilience === 'LOW'    && 'Vulnerable — act now'}
                    </p>
                  </div>
                )}
              </div>

              {/* Priority break point chips */}
              {analysis.priority_steps?.length > 0 && (
                <div>
                  <p className="text-xs font-bold font-mono mb-2" style={{ color: 'var(--wr-text-muted)' }}>
                    PRIORITY BREAK POINTS (highest leverage first)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.priority_steps.map((stepNum, i) => {
                      const sa       = analysisMap[stepNum];
                      const stepData = activeChain.steps.find(s => s.step_number === stepNum);
                      const lev      = LEVERAGE[sa?.leverage] || LEVERAGE.MEDIUM;
                      return (
                        <div key={stepNum} className="flex items-center gap-2.5 rounded px-3 py-2"
                          style={{ backgroundColor: lev.bg, border: `1px solid ${lev.border}` }}>
                          <span className="text-xs font-bold font-mono" style={{ color: lev.color }}>#{i + 1}</span>
                          <div>
                            <p className="text-xs font-bold leading-none" style={{ color: lev.color }}>STEP {stepNum}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>
                              {stepData?.agent_label || stepData?.step_text?.slice(0, 45) || ''}
                              {!stepData?.agent_label && (stepData?.step_text?.length || 0) > 45 ? '…' : ''}
                            </p>
                          </div>
                          {sa?.leverage && (
                            <span className="text-xs font-mono font-bold ml-1" style={{ color: lev.color }}>
                              {sa.leverage}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Save + report action bar */}
            <div className="flex items-center justify-between rounded px-4 py-3"
              style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
              <div className="flex items-center gap-2">
                {savedAt ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#27AE60' }} />
                    <span className="text-xs font-mono" style={{ color: '#27AE60' }}>Saved {fmtDate(savedAt)}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#D68910' }} />
                    <span className="text-xs font-mono" style={{ color: '#D68910' }}>
                      Unsaved — save to preserve and display in dashboard
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <WrButton size="sm" variant="outline" onClick={saveAnalysis} disabled={saving}>
                  {saving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                    : <><Save className="w-3.5 h-3.5" /> {savedAt ? 'Re-save' : 'Save Analysis'}</>}
                </WrButton>
                <WrButton size="sm" onClick={generateReport}>
                  <FileText className="w-3.5 h-3.5" />
                  Generate Report
                </WrButton>
              </div>
            </div>

            {/* Interactive flow graph */}
            <div>
              <p className="text-xs font-bold tracking-widest font-mono mb-3 px-1" style={{ color: 'var(--wr-text-muted)' }}>
                INTERACTIVE CHAIN FLOW — click any step to inspect
              </p>
              <ChainFlowGraph
                chain={activeChain}
                analysisMap={analysisMap}
                rankMap={rankMap}
              />
            </div>
          </div>
        )}

        {/* ── Idle / empty state ─────────────────────────────────────────── */}
        {!analysis && !analyzing && !error && (
          <div className="rounded-lg py-20 text-center"
            style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
            <Scissors className="w-10 h-10 mx-auto mb-4 opacity-20" style={{ color: 'var(--wr-amber)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--wr-text-muted)' }}>
              Select a chain above and run the analysis
            </p>
            <p className="text-xs mt-1.5" style={{ color: 'var(--wr-text-muted)', opacity: 0.6 }}>
              Chain Breaker maps adversary objectives step-by-step and shows where to cut the chain
            </p>
          </div>
        )}

        {/* ── Saved analyses management ──────────────────────────────────── */}
        {hasSavedAnalyses && (
          <div className="rounded-lg" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
            <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: 'var(--wr-border)' }}>
              <FolderOpen className="w-4 h-4" style={{ color: 'var(--wr-amber)' }} />
              <h2 className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>
                SAVED ANALYSES
              </h2>
              <span className="text-xs font-mono ml-auto" style={{ color: 'var(--wr-text-muted)' }}>
                {savedLibraryAnalyses.length + savedSessionAnalyses.length} total
              </span>
            </div>

            {/* Library chain analyses */}
            {savedLibraryAnalyses.length > 0 && (
              <div className="px-5 py-4">
                <p className="text-xs font-bold font-mono mb-3" style={{ color: 'var(--wr-text-muted)', opacity: 0.7 }}>
                  CHAIN LIBRARY
                </p>
                <div className="space-y-2">
                  {savedLibraryAnalyses.map(chain => {
                    const entry    = libMap[chain.id];
                    const res      = entry?.analysis?.chain_resilience;
                    const isActive = source === 'library' && selectedChainId === chain.id;
                    return (
                      <div key={chain.id} className="flex items-center gap-3 rounded px-4 py-3"
                        style={{
                          backgroundColor: isActive ? 'rgba(240,165,0,0.06)' : 'var(--wr-bg-secondary)',
                          border: `1px solid ${isActive ? 'rgba(240,165,0,0.3)' : 'var(--wr-border)'}`,
                        }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--wr-text-primary)' }}>{chain.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>
                            {chain.steps?.length || 0} steps · Analyzed {fmtDate(entry?.analyzed_at)}
                          </p>
                        </div>
                        {res && (
                          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded flex-shrink-0"
                            style={{ color: RESILIENCE_COLOR[res] || 'var(--wr-amber)', border: `1px solid ${RESILIENCE_COLOR[res] || 'var(--wr-amber)'}40` }}>
                            {res}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <WrButton size="xs" variant="outline" onClick={() => loadLibraryAnalysis(chain)}>
                            Load
                          </WrButton>
                          <WrButton size="xs" variant="ghost" onClick={() => openChainBreakerReport({
                            chain: { name: chain.name, description: chain.description, steps: chain.steps || [] },
                            analysis: entry?.analysis,
                            savedAt: entry?.analyzed_at,
                          })}>
                            <FileText className="w-3 h-3" />
                          </WrButton>
                          <WrButton size="xs" variant="danger" onClick={() => handleClearLibrary(chain.id)}>
                            <Trash2 className="w-3 h-3" />
                          </WrButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {savedLibraryAnalyses.length > 0 && savedSessionAnalyses.length > 0 && (
              <div className="mx-5 border-t" style={{ borderColor: 'var(--wr-border)' }} />
            )}

            {/* Session synthesis analyses */}
            {savedSessionAnalyses.length > 0 && (
              <div className="px-5 py-4">
                <p className="text-xs font-bold font-mono mb-3" style={{ color: 'var(--wr-text-muted)', opacity: 0.7 }}>
                  SESSION SYNTHESES
                </p>
                <div className="space-y-2">
                  {savedSessionAnalyses.map(({ synthId, idx, chainName, sessionName, analyzedAt, result }) => {
                    const res      = result?.chain_resilience;
                    const isActive = source === 'session' && selectedSynthId === synthId && compoundIdx === idx;
                    return (
                      <div key={`${synthId}-${idx}`} className="flex items-center gap-3 rounded px-4 py-3"
                        style={{
                          backgroundColor: isActive ? 'rgba(240,165,0,0.06)' : 'var(--wr-bg-secondary)',
                          border: `1px solid ${isActive ? 'rgba(240,165,0,0.3)' : 'var(--wr-border)'}`,
                        }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--wr-text-primary)' }}>{chainName}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>
                            {sessionName} · Analyzed {fmtDate(analyzedAt)}
                          </p>
                        </div>
                        {res && (
                          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded flex-shrink-0"
                            style={{ color: RESILIENCE_COLOR[res] || 'var(--wr-amber)', border: `1px solid ${RESILIENCE_COLOR[res] || 'var(--wr-amber)'}40` }}>
                            {res}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <WrButton size="xs" variant="outline" onClick={() => loadSessionAnalysis(synthId, idx)}>
                            Load
                          </WrButton>
                          <WrButton size="xs" variant="ghost" onClick={() => {
                            const synth = syntheses.find(s => s.id === synthId);
                            const cc    = synth?.compound_chains?.[idx];
                            if (!cc || !result) return;
                            openChainBreakerReport({
                              chain: {
                                name:        cc.name || `Compound Chain ${idx + 1}`,
                                description: cc.description || '',
                                steps: (cc.steps || []).map((s, i) => ({ ...s, step_number: s.step_number ?? i + 1 })),
                              },
                              analysis: result,
                              savedAt:  analyzedAt,
                            });
                          }}>
                            <FileText className="w-3 h-3" />
                          </WrButton>
                          <WrButton size="xs" variant="danger" onClick={() => handleClearSession(synthId, idx)}>
                            <Trash2 className="w-3 h-3" />
                          </WrButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
