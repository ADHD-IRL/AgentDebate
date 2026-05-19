// ── Mock data modeling a real analyst's workspace ──────────────────────────

const NOW = new Date('2026-04-24T14:20:00Z');

const DOMAINS = [
  { id: 'cyber',   name: 'Cyber',        color: '#2E86AB', agents: 4 },
  { id: 'geo',     name: 'Geopolitical', color: '#7B2D8B', agents: 3 },
  { id: 'physec',  name: 'Physical Sec', color: '#F0A500', agents: 2 },
  { id: 'osint',   name: 'OSINT',        color: '#27AE60', agents: 3 },
  { id: 'supply',  name: 'Supply Chain', color: '#D68910', agents: 1 },
  { id: 'insider', name: 'Insider',      color: '#C0392B', agents: 0 },
];

const SCENARIOS = [
  { id: 'sc1', name: 'APT29 targeting Q2 earnings disclosure', status: 'active',  freshness: 2 },
  { id: 'sc2', name: 'Baltic critical-infrastructure scenario', status: 'active',  freshness: 5 },
  { id: 'sc3', name: 'Port of Rotterdam logistics disruption',  status: 'active',  freshness: 14 },
  { id: 'sc4', name: 'Insider exfiltration — R&D division',     status: 'stale',   freshness: 42 },
  { id: 'sc5', name: 'Ransomware via MSP pivot',                status: 'active',  freshness: 1 },
];

// Sessions — a healthy mix of states
const SESSIONS = [
  { id: 's01', name: 'APT29 Q2 earnings window', scenario: 'sc1', status: 'round2',   created: '2026-04-24T11:15:00Z', progress: 0.72, agents: 6,  findings: 9,  critical: 2, high: 3, confidence: 0.78, drift: +0.4 },
  { id: 's02', name: 'Baltic infra — April review', scenario: 'sc2', status: 'round1', created: '2026-04-24T09:05:00Z', progress: 0.34, agents: 5, findings: 4,  critical: 0, high: 2, confidence: 0.61, drift: -0.1 },
  { id: 's03', name: 'Rotterdam logistics delta',   scenario: 'sc3', status: 'complete', created: '2026-04-23T16:40:00Z', progress: 1.0,  agents: 7, findings: 12, critical: 1, high: 5, confidence: 0.83, drift: +0.2 },
  { id: 's04', name: 'MSP ransomware pivot (live)', scenario: 'sc5', status: 'round2', created: '2026-04-24T13:55:00Z', progress: 0.55, agents: 4, findings: 6, critical: 3, high: 1, confidence: 0.69, drift: +0.8, live: true },
  { id: 's05', name: 'Insider — R&D quarterly',     scenario: 'sc4', status: 'complete', created: '2026-04-22T10:10:00Z', progress: 1.0,  agents: 5, findings: 7,  critical: 0, high: 3, confidence: 0.74, drift: 0 },
  { id: 's06', name: 'Supply chain — Asia routing', scenario: 'sc2', status: 'complete', created: '2026-04-21T14:22:00Z', progress: 1.0,  agents: 6, findings: 8,  critical: 1, high: 2, confidence: 0.71, drift: +0.3 },
  { id: 's07', name: 'Pre-earnings tabletop',       scenario: 'sc1', status: 'pending',  created: '2026-04-24T14:00:00Z', progress: 0.0,  agents: 0, findings: 0,  critical: 0, high: 0, confidence: 0,    drift: 0 },
];

// Severity × Domain matrix — last 14 days
const MATRIX = {
  cyber:   { CRITICAL: 4, HIGH: 7, MEDIUM: 9,  LOW: 5,  spark: [2,3,5,4,6,5,7,6,8,7,9,8,11,12] },
  geo:     { CRITICAL: 1, HIGH: 3, MEDIUM: 6,  LOW: 4,  spark: [1,1,2,2,3,2,3,4,3,4,5,5,6,7] },
  physec:  { CRITICAL: 0, HIGH: 2, MEDIUM: 3,  LOW: 2,  spark: [0,0,1,1,2,2,3,3,4,4,5,5,5,5] },
  osint:   { CRITICAL: 0, HIGH: 1, MEDIUM: 4,  LOW: 7,  spark: [1,2,3,4,5,5,6,7,8,9,10,11,11,12] },
  supply:  { CRITICAL: 2, HIGH: 4, MEDIUM: 2,  LOW: 1,  spark: [0,1,1,2,3,4,5,5,6,7,8,8,8,9] },
  insider: { CRITICAL: 0, HIGH: 1, MEDIUM: 2,  LOW: 0,  spark: [0,0,0,1,1,1,2,2,2,3,3,3,3,3] },
};

// Priority queue — items that need an analyst's eyes now
const PRIORITY = [
  {
    id: 'p1', kind: 'drift',
    severity: 'CRITICAL',
    title: 'Severity drift detected — APT29 Q2 window',
    subtitle: 'Round 2 revised UP by 2 bands · agents disagreed',
    meta: 'Session s01 · 14 min ago',
    action: 'Review rebuttals',
    href: '/sessions/s01',
    agents: ['Ava.Cyber','Nik.Geo','Rhea.OSINT'],
  },
  {
    id: 'p2', kind: 'unresolved',
    severity: 'CRITICAL',
    title: '3 unresolved CRITICAL findings — MSP ransomware pivot',
    subtitle: 'Blocking synthesis · awaiting adjudication',
    meta: 'Session s04 · LIVE',
    action: 'Adjudicate',
    href: '/sessions/s04',
    agents: ['Kai.Cyber','Mei.Supply','Jon.Physec'],
  },
  {
    id: 'p3', kind: 'gap',
    severity: 'HIGH',
    title: 'Coverage gap — Insider domain has 0 agents',
    subtitle: '2 active scenarios reference this domain',
    meta: 'Configuration',
    action: 'Assign agents',
    href: '/domains/insider',
    agents: [],
  },
  {
    id: 'p4', kind: 'stale',
    severity: 'MEDIUM',
    title: 'Scenario stale — Insider exfiltration (R&D)',
    subtitle: '42 days since last assessment · threat intel updated 3×',
    meta: 'Scenario sc4',
    action: 'Re-run',
    href: '/scenarios/sc4',
    agents: [],
  },
  {
    id: 'p5', kind: 'lowconf',
    severity: 'HIGH',
    title: 'Low-confidence synthesis — Baltic infra review',
    subtitle: 'Confidence 0.61 · 2 agents abstained',
    meta: 'Session s02 · 5h ago',
    action: 'Request re-debate',
    href: '/sessions/s02',
    agents: ['Eli.Geo','Ari.Cyber'],
  },
];

// KPIs — with 7d deltas + sparklines
const KPIS = [
  { key: 'critical', label: 'Critical findings',  value: 7,   delta: +3,  deltaLabel: 'vs prior 7d',  spark: [0,1,1,2,3,3,4,4,5,5,6,6,7,7], color: '#C0392B', severe: true },
  { key: 'open',     label: 'Open findings',      value: 34,  delta: +8,  deltaLabel: 'vs prior 7d',  spark: [20,22,21,23,24,25,26,28,29,30,31,33,34,34], color: '#D68910' },
  { key: 'sessions', label: 'Sessions this week', value: 11,  delta: -2,  deltaLabel: 'vs prior 7d',  spark: [1,2,2,3,4,5,6,7,8,9,10,10,11,11], color: '#2E86AB' },
  { key: 'conf',     label: 'Avg. confidence',    value: 0.74,format: 'pct', delta: +0.05, deltaLabel: 'vs prior 7d', spark: [0.6,0.62,0.65,0.68,0.66,0.7,0.71,0.7,0.72,0.73,0.74,0.74,0.74,0.74], color: '#27AE60' },
  { key: 'drift',    label: 'Median R1→R2 drift', value: 0.3, format: 'signed', delta: +0.1, deltaLabel: 'vs prior 7d', spark: [0.1,0.1,0.15,0.2,0.2,0.22,0.25,0.25,0.28,0.3,0.3,0.3,0.3,0.3], color: '#7B2D8B' },
];

// Agent workload
const AGENTS = [
  { name: 'Ava.Cyber',   domain: 'cyber',   sessions: 8, avgConf: 0.82 },
  { name: 'Kai.Cyber',   domain: 'cyber',   sessions: 6, avgConf: 0.76 },
  { name: 'Ari.Cyber',   domain: 'cyber',   sessions: 5, avgConf: 0.71 },
  { name: 'Nik.Geo',     domain: 'geo',     sessions: 7, avgConf: 0.79 },
  { name: 'Eli.Geo',     domain: 'geo',     sessions: 4, avgConf: 0.68 },
  { name: 'Jon.Physec',  domain: 'physec',  sessions: 3, avgConf: 0.74 },
  { name: 'Rhea.OSINT',  domain: 'osint',   sessions: 9, avgConf: 0.81 },
  { name: 'Mei.Supply',  domain: 'supply',  sessions: 2, avgConf: 0.66 },
];

window.DATA = { NOW, DOMAINS, SCENARIOS, SESSIONS, MATRIX, PRIORITY, KPIS, AGENTS };
