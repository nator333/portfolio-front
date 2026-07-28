/**
 * Lazy Mermaid integration. The library is heavy and only needed on pages that
 * actually contain a ```mermaid fence, so it is dynamically imported the first
 * time a diagram is rendered and never ships in the main bundle.
 *
 * renderBlogMarkdown emits `<pre class="mermaid">` nodes holding the raw diagram
 * source; runMermaid finds the unprocessed ones under a container and turns them
 * into SVG. mermaid.run() marks handled nodes with data-processed, so it is safe
 * to call repeatedly (e.g. from Angular lifecycle hooks or preview refreshes).
 */
type MermaidApi = typeof import('mermaid')['default'];

let mermaidPromise: Promise<MermaidApi> | null = null;

function loadMermaid(): Promise<MermaidApi> {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        // Matches the dark blog surface; securityLevel 'strict' sanitizes labels.
        theme: 'dark',
        securityLevel: 'strict',
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

/** Render every not-yet-processed `<pre class="mermaid">` under `container`. */
export async function runMermaid(container: HTMLElement): Promise<void> {
  const nodes = Array.from(
    container.querySelectorAll<HTMLElement>('pre.mermaid:not([data-processed])'),
  );
  if (nodes.length === 0) {
    return;
  }
  try {
    const mermaid = await loadMermaid();
    await mermaid.run({ nodes });
  } catch (error) {
    // A malformed diagram should not blank the whole post.
    console.error('Mermaid rendering failed:', error);
  }
}
