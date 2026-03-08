import React from 'react';

/**
 * Strips HTML tags and decodes common HTML entities to plain text.
 * Useful for previews/cards that need plain text from HTML content.
 */
export function stripHtmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é').replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó').replace(/&uacute;/g, 'ú').replace(/&atilde;/g, 'ã')
    .replace(/&otilde;/g, 'õ').replace(/&ccedil;/g, 'ç').replace(/&ecirc;/g, 'ê')
    .replace(/&acirc;/g, 'â').replace(/&ocirc;/g, 'ô')
    .replace(/&Aacute;/g, 'Á').replace(/&Eacute;/g, 'É').replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó').replace(/&Uacute;/g, 'Ú').replace(/&Atilde;/g, 'Ã')
    .replace(/&Otilde;/g, 'Õ').replace(/&Ccedil;/g, 'Ç')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a string contains HTML tags
 */
function containsHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

/**
 * Sanitizes HTML by removing script tags, event handlers, and dangerous elements.
 * Also strips HTML comments (e.g. <!-- x-tinymce/html -->, <!-- notionvc: ... -->).
 */
function sanitizeHtml(html: string): string {
  return html
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove iframe, object, embed
    .replace(/<(iframe|object|embed|form)\b[^>]*>.*?<\/\1>/gi, '')
    .replace(/<(iframe|object|embed|form)\b[^>]*\/?>/gi, '')
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove &nbsp; → space
    .replace(/&nbsp;/g, ' ')
    // Clean up empty paragraphs left after comment removal
    .replace(/<p>\s*<\/p>/g, '');
}

/**
 * Detects if text contains list-like patterns (lines starting with -, •, *, or numbered)
 * and renders as proper HTML list. If text contains HTML tags, renders as sanitized HTML.
 * Otherwise renders with preserved whitespace.
 */
export function renderFormattedText(text: string): React.ReactNode {
  if (!text) return null;

  // If the text contains HTML tags, render as sanitized HTML
  if (containsHtml(text)) {
    const sanitized = sanitizeHtml(text);
    return (
      <div
        className="prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-1 [&_li]:text-sm [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1 [&_p]:mb-2 [&_p]:last:mb-0"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

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
