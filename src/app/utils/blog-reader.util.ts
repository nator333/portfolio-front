/**
 * Read-aloud ("playback") support for blog posts, built entirely on browser
 * primitives so it ships without a library or an API cost:
 *
 *  - SpeechSynthesis (Web Speech API) speaks the text, one sentence-sized
 *    utterance at a time. Chunking keeps the play/pause controls reliable —
 *    Chrome is flaky pausing a single long utterance — and lets us know exactly
 *    which sentence is sounding without depending on `boundary` events (which
 *    Firefox does not fire).
 *  - Intl.Segmenter splits the text into sentences using the post's own BCP-47
 *    `lang`, so Japanese (。！？) and Latin (.!?) terminators are both handled.
 *  - The CSS Custom Highlight API paints the current sentence via a Range,
 *    leaving the rendered HTML untouched — so Prism-highlighted code and Mermaid
 *    SVGs (which we skip anyway) are never disturbed.
 *
 * Each feature is progressively enhanced: without Intl.Segmenter we fall back to
 * a regex split; without the Highlight API the audio still plays, just without
 * the visual highlight; without SpeechSynthesis the reader reports unsupported
 * and the UI hides itself.
 */

export type ReaderStatus = "idle" | "playing" | "paused";

/** Named highlight registered with CSS.highlights; see the ::highlight() rule. */
const HIGHLIGHT_NAME = "blog-reader-sentence";

/** Speaking rate, 30% faster than the engine default of 1. */
const READING_RATE = 1.3;

/**
 * Leaf block elements whose text is read. A block that contains another block
 * from this set is skipped, so its text is not read twice (e.g. a <blockquote>
 * wrapping a <p>, or an <li> wrapping a nested list). Code and diagrams live in
 * <pre>, which is deliberately absent here and never read aloud.
 */
const BLOCK_SELECTOR =
  "p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, dd, dt";

interface Sentence {
  readonly text: string;
  readonly range: Range;
}

// Minimal shapes for the CSS Custom Highlight API, declared locally so the code
// compiles regardless of whether the DOM lib in use ships these types yet.
interface HighlightLike {
  add(range: Range): void;
  clear(): void;
}
interface HighlightRegistryLike {
  set(name: string, highlight: HighlightLike): void;
  delete(name: string): void;
}
type HighlightCtor = new (...ranges: Range[]) => HighlightLike;

/** A run of readable text and the global-offset span each text node occupies. */
interface FlatText {
  readonly text: string;
  readonly spans: ReadonlyArray<{ node: Text; start: number; end: number }>;
}

export class BlogReader {
  private readonly synth: SpeechSynthesis;
  private readonly sentences: Sentence[];
  private readonly highlight: HighlightLike | null;
  private readonly lang: string;
  private readonly onStatus: (status: ReaderStatus) => void;

  private index = 0;
  private disposed = false;
  /** Set while cancelling so the utterance's own end/error events are ignored. */
  private stopping = false;

  /** True when the browser can speak at all; gates the whole feature/UI. */
  static isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  constructor(
    container: HTMLElement,
    lang: string,
    onStatus: (status: ReaderStatus) => void,
  ) {
    this.synth = window.speechSynthesis;
    this.lang = lang;
    this.onStatus = onStatus;
    this.sentences = collectSentences(container, lang);
    this.highlight = createHighlight();
  }

  /** False when there was no readable prose (e.g. a code-only post). */
  get available(): boolean {
    return this.sentences.length > 0;
  }

  /** Play from the start, resume when paused, or pause when playing. */
  toggle(): void {
    if (this.disposed) {
      return;
    }
    if (this.synth.speaking && !this.synth.paused) {
      this.pause();
    } else if (this.synth.paused) {
      this.resume();
    } else {
      this.start();
    }
  }

  pause(): void {
    this.synth.pause();
    this.onStatus("paused");
  }

  /** Cancel playback and clear the highlight, returning to idle. */
  stop(): void {
    // Stays true until the next start(); cancel()'s end/error events fire
    // asynchronously and must not advance or restart playback.
    this.stopping = true;
    this.synth.cancel();
    this.index = 0;
    this.clearHighlight();
    this.onStatus("idle");
  }

  /** Cancel playback and release the highlight registration. */
  dispose(): void {
    this.disposed = true;
    this.stopping = true;
    this.synth.cancel();
    this.clearHighlight();
    getHighlightRegistry()?.delete(HIGHLIGHT_NAME);
  }

  private resume(): void {
    this.synth.resume();
    this.onStatus("playing");
  }

  private start(): void {
    this.stopping = false;
    this.index = 0;
    this.speakCurrent();
  }

  private speakCurrent(): void {
    if (this.disposed || this.stopping) {
      return;
    }
    if (this.index >= this.sentences.length) {
      this.finish();
      return;
    }

    const sentence = this.sentences[this.index];
    const utterance = new SpeechSynthesisUtterance(sentence.text);
    utterance.lang = this.lang;
    utterance.rate = READING_RATE;
    const voice = pickVoice(this.synth, this.lang);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      if (this.disposed || this.stopping) {
        return;
      }
      this.paint(sentence.range);
      this.onStatus("playing");
    };
    utterance.onend = () => {
      if (this.disposed || this.stopping) {
        return;
      }
      this.index += 1;
      this.speakCurrent();
    };
    utterance.onerror = () => {
      // cancel() surfaces here as "interrupted"/"canceled"; stopping guards it.
      if (this.disposed || this.stopping) {
        return;
      }
      // Skip a sentence the engine refused rather than stalling the whole post.
      this.index += 1;
      this.speakCurrent();
    };

    this.synth.speak(utterance);
  }

  private finish(): void {
    this.index = 0;
    this.clearHighlight();
    this.onStatus("idle");
  }

  private paint(range: Range): void {
    if (!this.highlight) {
      return;
    }
    this.highlight.clear();
    this.highlight.add(range);
  }

  private clearHighlight(): void {
    this.highlight?.clear();
  }
}

/** Register (or reuse) the named highlight; null when the API is unavailable. */
function createHighlight(): HighlightLike | null {
  const registry = getHighlightRegistry();
  const ctor = getHighlightCtor();
  if (!registry || !ctor) {
    return null;
  }
  const highlight = new ctor();
  registry.set(HIGHLIGHT_NAME, highlight);
  return highlight;
}

function getHighlightRegistry(): HighlightRegistryLike | null {
  const css = (globalThis as { CSS?: { highlights?: HighlightRegistryLike } })
    .CSS;
  return css?.highlights ?? null;
}

function getHighlightCtor(): HighlightCtor | null {
  const ctor = (globalThis as { Highlight?: HighlightCtor }).Highlight;
  return typeof ctor === "function" ? ctor : null;
}

/**
 * Choose a voice for `lang`, preferring a male one and a natural accent.
 * Candidates are the voices matching the exact BCP-47 tag, or failing that the
 * primary subtag (e.g. "ja" for "ja-JP"). Among the male candidates the best
 * accent wins (see {@link accentRank}) — so on Chrome an OS voice like Alex or
 * David (US) is chosen over "Google UK English Male"; with no male voice it
 * falls back to the first candidate. Returns null when voices have not loaded
 * yet, which is fine — `utterance.lang` still steers the default voice.
 *
 * The Web Speech API exposes no gender field, so "male" is inferred from the
 * voice name against the known catalogues below. It is therefore best-effort and
 * device-dependent: a listener whose OS/browser ships no male voice for the
 * language keeps the default one.
 */
function pickVoice(
  synth: SpeechSynthesis,
  lang: string,
): SpeechSynthesisVoice | null {
  const voices = synth.getVoices();
  if (voices.length === 0) {
    return null;
  }
  const target = lang.toLowerCase();
  const base = target.split("-")[0];
  const region = target.includes("-") ? target.split("-")[1] : "";
  const exact = voices.filter((v) => v.lang.toLowerCase() === target);
  const candidates =
    exact.length > 0
      ? exact
      : voices.filter((v) => v.lang.toLowerCase().startsWith(base));
  if (candidates.length === 0) {
    return null;
  }
  const males = candidates.filter(isMaleVoice);
  if (males.length === 0) {
    return candidates[0];
  }
  return males
    .slice()
    .sort((a, b) => accentRank(a, region) - accentRank(b, region))[0];
}

/**
 * Accent preference among same-language voices (lower is better): the post's
 * own region if it names one, then US, then any other region, and finally GB —
 * kept last so a US voice like Alex beats "Google UK English Male".
 */
function accentRank(voice: SpeechSynthesisVoice, region: string): number {
  const lang = voice.lang.toLowerCase();
  const voiceRegion = lang.includes("-") ? lang.split("-")[1] : "";
  if (region && voiceRegion === region) {
    return 0;
  }
  if (voiceRegion === "us") {
    return 1;
  }
  if (voiceRegion === "gb") {
    return 3;
  }
  return 2;
}

/**
 * Known male voice names across macOS/iOS, Windows/Edge and Chrome, plus the
 * generic "male" tag Google uses (e.g. "Google UK English Male"). Names are
 * checked case-insensitively as substrings.
 */
const MALE_VOICE_NAMES = [
  "male",
  // macOS / iOS — English
  "alex",
  "fred",
  "daniel",
  "aaron",
  "arthur",
  "tom",
  "reed",
  "rishi",
  "oliver",
  // macOS / iOS — Japanese
  "otoya",
  "hattori",
  // Microsoft — English
  "david",
  "mark",
  "guy",
  "christopher",
  "eric",
  "brian",
  // Microsoft — Japanese
  "ichiro",
  "keita",
];

/** Best-effort male-voice test by name; see {@link pickVoice}. */
function isMaleVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  // "female" wins over a stray male substring (e.g. a name containing "mark").
  if (name.includes("female")) {
    return false;
  }
  return MALE_VOICE_NAMES.some((hint) => name.includes(hint));
}

/** Walk the post's readable blocks and split each into highlightable sentences. */
function collectSentences(container: HTMLElement, lang: string): Sentence[] {
  const blocks = Array.from(
    container.querySelectorAll<HTMLElement>(BLOCK_SELECTOR),
  ).filter((el) => el.querySelector(BLOCK_SELECTOR) === null);

  const segment = makeSegmenter(lang);
  const sentences: Sentence[] = [];

  for (const block of blocks) {
    // Defensive: never read code/diagram content even if selectors change.
    if (block.closest("pre")) {
      continue;
    }
    const flat = flattenText(block);
    if (!flat.text.trim()) {
      continue;
    }
    for (const [start, end] of segment(flat.text)) {
      const slice = flat.text.slice(start, end);
      if (!/\S/.test(slice)) {
        continue;
      }
      const range = rangeFor(flat, start, end);
      if (range) {
        sentences.push({ text: slice.trim(), range });
      }
    }
  }
  return sentences;
}

/** Concatenate a block's text nodes, tracking each node's global offset span. */
function flattenText(root: HTMLElement): FlatText {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const spans: Array<{ node: Text; start: number; end: number }> = [];
  let text = "";
  let node = walker.nextNode() as Text | null;
  while (node) {
    const value = node.nodeValue ?? "";
    if (value.length > 0) {
      spans.push({ node, start: text.length, end: text.length + value.length });
      text += value;
    }
    node = walker.nextNode() as Text | null;
  }
  return { text, spans };
}

/** Build a DOM Range for the [start, end) slice of a flattened block. */
function rangeFor(flat: FlatText, start: number, end: number): Range | null {
  const from = locate(flat, start);
  const to = locate(flat, end);
  if (!from || !to) {
    return null;
  }
  const range = document.createRange();
  range.setStart(from.node, from.offset);
  range.setEnd(to.node, to.offset);
  return range;
}

/** Map a global offset back to the text node and in-node offset that hold it. */
function locate(
  flat: FlatText,
  offset: number,
): { node: Text; offset: number } | null {
  for (const span of flat.spans) {
    if (offset >= span.start && offset <= span.end) {
      return { node: span.node, offset: offset - span.start };
    }
  }
  return null;
}

/** A sentence segmenter for `lang`, falling back to a regex where unsupported. */
function makeSegmenter(
  lang: string,
): (text: string) => Array<[number, number]> {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    let segmenter: Intl.Segmenter;
    try {
      segmenter = new Intl.Segmenter(lang, { granularity: "sentence" });
    } catch {
      // An unusable lang tag should degrade to locale-default segmentation.
      segmenter = new Intl.Segmenter(undefined, { granularity: "sentence" });
    }
    return (text) => {
      const ranges: Array<[number, number]> = [];
      for (const part of segmenter.segment(text)) {
        ranges.push([part.index, part.index + part.segment.length]);
      }
      return ranges;
    };
  }
  return regexSentences;
}

/** Fallback sentence split on Latin and CJK terminators, keeping their indices. */
function regexSentences(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const terminator = /[.!?。！？…]+\s*/gu;
  let start = 0;
  let match: RegExpExecArray | null;
  while ((match = terminator.exec(text)) !== null) {
    const end = match.index + match[0].length;
    ranges.push([start, end]);
    start = end;
  }
  if (start < text.length) {
    ranges.push([start, text.length]);
  }
  return ranges;
}
