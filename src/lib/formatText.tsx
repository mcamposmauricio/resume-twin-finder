import React from 'react';

/**
 * Detects if text contains list-like patterns (lines starting with -, •, *, or numbered)
 * and renders as proper HTML list. Otherwise renders with preserved whitespace.
 */
export function renderFormattedText(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const listPattern = /^\s*(?:[-•*]|\d+[.)]\s)/;

  // Check if most non-empty lines match list pattern
  const nonEmptyLines = lines.filter((l) => l.trim().length > 0);
  const listLines = nonEmptyLines.filter((l) => listPattern.test(l));
  const isListContent = listLines.length > 0 && listLines.length >= nonEmptyLines.length * 0.5;

  if (!isListContent) {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }

  const items: React.ReactNode[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      items.push(
        <p key={`p-${items.length}`} className="whitespace-pre-wrap mb-2">
          {currentParagraph.join('\n')}
        </p>
      );
      currentParagraph = [];
    }
  };

  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      items.push(
        <ul key={`ul-${items.length}`} className="list-disc list-inside space-y-1 mb-2">
          {listItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line) => {
    if (listPattern.test(line)) {
      flushParagraph();
      const cleaned = line.replace(/^\s*(?:[-•*]|\d+[.)]\s*)\s*/, '').trim();
      listItems.push(cleaned);
    } else if (line.trim() === '') {
      flushList();
      flushParagraph();
    } else {
      flushList();
      currentParagraph.push(line);
    }
  });

  flushList();
  flushParagraph();

  return <>{items}</>;
}
