/**
 * Helpers for editing draw.io diagrams inside the blog editor. The draw.io
 * editor runs in an iframe from embed.diagrams.net and talks to the page over
 * postMessage using its JSON protocol (proto=json):
 *
 *   iframe -> page  {event: 'configure'}   page replies {action: 'configure', config}
 *   iframe -> page  {event: 'init'}        page replies {action: 'load', xml}
 *   iframe -> page  {event: 'save', xml, exit}   diagram XML to store
 *   iframe -> page  {event: 'exit'}        user closed without saving
 *
 * The XML is stored in the post as a ```drawio fence (see blog-markdown.util),
 * so the published page needs nothing beyond the viewer in drawio.util.
 */
export const DRAWIO_EMBED_ORIGIN = 'https://embed.diagrams.net';

// saveAndExit + noSaveBtn leave one "Save & Exit" button (plus Exit to discard);
// configure=1 lets us switch on compressed XML before the editor starts.
export const DRAWIO_EMBED_URL =
  `${DRAWIO_EMBED_ORIGIN}/?embed=1&proto=json&spin=1&libraries=1` +
  '&saveAndExit=1&noSaveBtn=1&configure=1';

/** Config sent in reply to the editor's 'configure' event. */
export const DRAWIO_EMBED_CONFIG = {
  // One compact line of XML per diagram instead of a page of <mxCell>s.
  compressXml: true,
};

export interface DrawioMessage {
  event: string;
  xml?: string;
  exit?: boolean;
}

/** Parse a postMessage payload from the editor; null for anything else. */
export function parseDrawioMessage(data: unknown): DrawioMessage | null {
  if (typeof data !== 'string') {
    return null;
  }
  try {
    const message = JSON.parse(data);
    return message && typeof message.event === 'string' ? message : null;
  } catch {
    return null;
  }
}

export interface DrawioFence {
  /** Line of the opening ```drawio. */
  startLine: number;
  /** Line of the closing ```. */
  endLine: number;
  xml: string;
}

const FENCE = /^\s*(`{3,}|~{3,})\s*(\S*)/;

/**
 * Closed ```drawio fences in a markdown document, by line. Fences of other
 * languages are skipped over, so a ```drawio line quoted inside one is ignored.
 */
export function findDrawioFences(lines: readonly string[]): DrawioFence[] {
  const fences: DrawioFence[] = [];
  let open: { line: number; marker: string; drawio: boolean } | null = null;

  lines.forEach((text, line) => {
    const match = FENCE.exec(text);
    if (!match) {
      return;
    }
    const [, marker, lang] = match;
    if (!open) {
      open = { line, marker, drawio: lang === 'drawio' };
    } else if (!lang && marker[0] === open.marker[0] && marker.length >= open.marker.length) {
      if (open.drawio) {
        fences.push({
          startLine: open.line,
          endLine: line,
          xml: lines.slice(open.line + 1, line).join('\n').trim(),
        });
      }
      open = null;
    }
  });
  return fences;
}

/** Markdown for a diagram: a ```drawio fence wrapping its XML. */
export function drawioFence(xml: string): string {
  return '```drawio\n' + xml.trim() + '\n```';
}
