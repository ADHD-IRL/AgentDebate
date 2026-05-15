// ── Source credibility scoring ─────────────────────────────────────────────

const AUTHORITATIVE = [
  /\.gov$/, /\.mil$/, /\.edu$/,
  /nist\.gov/, /cisa\.gov/, /ncsc\.gov\.uk/, /enisa\.europa\.eu/,
  /mitre\.org/, /nvd\.nist\.gov/, /cve\.mitre\.org/,
  /cdc\.gov/, /who\.int/, /nato\.int/,
];

const CREDIBLE = [
  /reuters\.com/, /bbc\.com/, /theguardian\.com/, /apnews\.com/,
  /wired\.com/, /arstechnica\.com/, /theregister\.com/,
  /krebsonsecurity\.com/, /schneier\.com/, /sans\.org/, /owasp\.org/,
  /exploit-db\.com/, /securityweek\.com/, /darkreading\.com/,
  /bleepingcomputer\.com/, /threatpost\.com/, /recordedfuture\.com/,
  /mandiant\.com/, /crowdstrike\.com/, /paloaltonetworks\.com/,
  /wikipedia\.org/,
];

const SPECULATIVE = [
  /reddit\.com/, /medium\.com/, /substack\.com/,
  /twitter\.com/, /x\.com/, /linkedin\.com/,
  /facebook\.com/, /youtube\.com/, /tiktok\.com/,
  /quora\.com/, /4chan\.org/,
];

export function scoreSourceCredibility(url) {
  if (!url) return { tier: 'unverified', score: 0 };
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    if (AUTHORITATIVE.some(r => r.test(hostname))) return { tier: 'authoritative', score: 95 };
    if (CREDIBLE.some(r => r.test(hostname)))       return { tier: 'credible',      score: 70 };
    if (SPECULATIVE.some(r => r.test(hostname)))    return { tier: 'speculative',   score: 25 };
    return { tier: 'unverified', score: 40 };
  } catch {
    return { tier: 'unverified', score: 0 };
  }
}

// ── Citation parser ────────────────────────────────────────────────────────

// Extracts the sentence immediately before a given index in text
function extractSentenceBefore(text, index) {
  const before = text.slice(0, index).trimEnd();
  const lastSentenceEnd = Math.max(
    before.lastIndexOf('. '),
    before.lastIndexOf('! '),
    before.lastIndexOf('? '),
    before.lastIndexOf('\n'),
  );
  return before.slice(lastSentenceEnd + 1).trim().slice(0, 300) || null;
}

// Parse [SOURCE: "Title" — https://url] or [SOURCE: "Title"] markers from agent text
export function parseCitations(text) {
  const re = /\[SOURCE:\s*"([^"]+)"(?:\s*[—–\-]\s*(https?:\/\/[^\]\s]+))?\]/g;
  const results = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    results.push({
      title: m[1].trim(),
      url: m[2]?.trim() || null,
      cited_claim: extractSentenceBefore(text, m.index),
    });
  }
  return results;
}

// ── Tier display helpers ───────────────────────────────────────────────────

export const TIER_COLORS = {
  authoritative: { bg: 'rgba(39,174,96,0.15)',  text: '#27AE60', border: 'rgba(39,174,96,0.35)'  },
  credible:      { bg: 'rgba(240,165,0,0.12)',  text: '#F0A500', border: 'rgba(240,165,0,0.3)'   },
  speculative:   { bg: 'rgba(230,126,34,0.12)', text: '#E67E22', border: 'rgba(230,126,34,0.3)'  },
  unverified:    { bg: 'rgba(138,155,181,0.1)',  text: '#8A9BB5', border: 'rgba(138,155,181,0.2)' },
};

export const TIER_LABELS = {
  authoritative: 'Authoritative',
  credible:      'Credible',
  speculative:   'Speculative',
  unverified:    'Unverified',
};

export const SOURCE_TYPE_LABELS = {
  tool_fetch:       'Tool fetch',
  agent_citation:   'Agent citation',
  facilitator:      'Facilitator',
};
