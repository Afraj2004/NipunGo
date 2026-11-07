import React from 'react';

// Minimal, safe formatting for chat messages (no HTML injection, no library):
//   **bold**   -> <strong>
//   "- " / "* " / "• " at line start -> bullet
// Everything else is plain text with line breaks preserved.

const renderInline = (line, keyPrefix) => {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== '');
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    return bold ? (
      <strong key={`${keyPrefix}-${i}`}>{bold[1]}</strong>
    ) : (
      <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>
    );
  });
};

// Remove JSON / code fences the AI sometimes appends, plus stray lone asterisks
export const cleanMessageText = (text) =>
  String(text || '')
    .split(/```|\{/)[0]
    .replace(/(^|\s)\*(?=\s|$)/g, '$1')
    .trim();

function RichText({ text, className = '' }) {
  const lines = cleanMessageText(text).split('\n');
  return (
    <div className={className}>
      {lines.map((line, i) => {
        const bullet = line.match(/^\s*(?:[-*•])\s+(.*)$/);
        if (bullet) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span aria-hidden="true">•</span>
              <span>{renderInline(bullet[1], i)}</span>
            </div>
          );
        }
        if (!line.trim()) return <div key={i} className="h-2" />;
        return <div key={i}>{renderInline(line, i)}</div>;
      })}
    </div>
  );
}

export default RichText;
