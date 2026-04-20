/**
 * Renders synthesis text as a styled PDF-like document.
 * Parses markdown syntax and renders clean typography — no visible symbols.
 */
export default function SynthesisDocument({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H1
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-xl font-bold mt-8 mb-3 pb-2 border-b" style={{ color: 'var(--wr-text-primary)', borderColor: 'var(--wr-amber)', fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em' }}>
          {renderInline(line.replace(/^# /, ''))}
        </h1>
      );
      i++; continue;
    }

    // H2
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-base font-bold mt-6 mb-2 uppercase tracking-wide" style={{ color: 'var(--wr-amber)', fontFamily: 'Inter, sans-serif' }}>
          {renderInline(line.replace(/^## /, ''))}
        </h2>
      );
      i++; continue;
    }

    // H3
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold mt-4 mb-1" style={{ color: 'var(--wr-text-primary)', fontFamily: 'Inter, sans-serif' }}>
          {renderInline(line.replace(/^### /, ''))}
        </h3>
      );
      i++; continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} className="my-5" style={{ borderColor: 'var(--wr-border)' }} />);
      i++; continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="my-3 pl-4 py-1 text-sm italic" style={{ borderLeft: '3px solid var(--wr-amber)', color: 'var(--wr-text-muted)', backgroundColor: 'rgba(240,165,0,0.04)' }}>
          {renderInline(line.replace(/^> /, ''))}
        </blockquote>
      );
      i++; continue;
    }

    // Unordered list — collect consecutive bullet lines
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].replace(/^[-*] /, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-3 space-y-1.5 pl-0">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--wr-text-secondary)' }}>
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--wr-amber)' }} />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list — collect consecutive numbered lines
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-3 space-y-1.5 pl-0">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-sm" style={{ color: 'var(--wr-text-secondary)' }}>
              <span className="flex-shrink-0 w-5 h-5 rounded text-xs font-bold flex items-center justify-center mt-0.5" style={{ backgroundColor: 'rgba(240,165,0,0.15)', color: 'var(--wr-amber)' }}>
                {j + 1}
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line → spacing
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-1" />);
      i++; continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm leading-relaxed mb-2" style={{ color: 'var(--wr-text-secondary)' }}>
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="py-1 space-y-0.5">{elements}</div>;
}

/**
 * Renders inline markdown: **bold**, *italic*, `code`
 */
function renderInline(text) {
  if (!text) return null;
  const parts = [];
  // Split on **bold**, *italic*, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[0].startsWith('**')) {
      parts.push(<strong key={key++} style={{ color: 'var(--wr-text-primary)', fontWeight: 700 }}>{match[2]}</strong>);
    } else if (match[0].startsWith('*')) {
      parts.push(<em key={key++} style={{ color: 'var(--wr-text-muted)', fontStyle: 'italic' }}>{match[3]}</em>);
    } else if (match[0].startsWith('`')) {
      parts.push(<code key={key++} className="px-1 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: 'var(--wr-bg-secondary)', color: 'var(--wr-amber)' }}>{match[4]}</code>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}