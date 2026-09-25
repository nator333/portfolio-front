/**
 * Lazy draw.io integration. Blog posts can embed an interactive draw.io diagram
 * with a ```drawio fence whose body is the diagram XML; renderBlogMarkdown
 * emits it as `<pre class="drawio">` holding that XML as text.
 *
 * runDrawio replaces each unprocessed block with a draw.io viewer: zoom, pan,
 * full-screen lightbox, page and layer switching, tooltips, clickable links and
 * custom link actions (show / hide / toggle / highlight cells) all come from the
 * viewer itself. The viewer is not on npm, so its script is injected from
 * viewer.diagrams.net the first time a post actually contains a diagram and
 * never ships in the main bundle.
 */
const VIEWER_SRC = 'https://viewer.diagrams.net/js/viewer-static.min.js';

interface GraphViewerApi {
  createViewerForElement(element: HTMLElement, callback?: (viewer: unknown) => void): void;
}

declare global {
  interface Window {
    GraphViewer?: GraphViewerApi;
  }
}

let viewerPromise: Promise<GraphViewerApi> | null = null;

function loadViewer(): Promise<GraphViewerApi> {
  if (!viewerPromise) {
    viewerPromise = new Promise<GraphViewerApi>((resolve, reject) => {
      if (window.GraphViewer) {
        resolve(window.GraphViewer);
        return;
      }
      const script = document.createElement('script');
      script.src = VIEWER_SRC;
      script.async = true;
      script.onload = () =>
        window.GraphViewer
          ? resolve(window.GraphViewer)
          : reject(new Error('draw.io viewer loaded without GraphViewer'));
      script.onerror = () => reject(new Error(`Failed to load ${VIEWER_SRC}`));
      document.head.appendChild(script);
    }).catch((error) => {
      // Allow a retry on the next render instead of caching the failure.
      viewerPromise = null;
      throw error;
    });
  }
  return viewerPromise;
}

/** Viewer config for one diagram; see draw.io's "Embed HTML" options. */
export function drawioViewerConfig(xml: string): Record<string, unknown> {
  return {
    xml,
    toolbar: 'zoom layers pages lightbox',
    'toolbar-nohide': true,
    nav: true, // lets readers follow page links and collapse / expand groups
    lightbox: true,
    resize: true,
    highlight: '#0000ff',
    center: true,
  };
}

/** Render every not-yet-processed `<pre class="drawio">` under `container`. */
export async function runDrawio(container: HTMLElement): Promise<void> {
  const nodes = Array.from(
    container.querySelectorAll<HTMLElement>('pre.drawio:not([data-processed])'),
  );
  if (nodes.length === 0) {
    return;
  }
  // Mark first so overlapping calls (afterRenderEffect, preview refresh) never
  // render the same block twice while the script is still loading.
  nodes.forEach((node) => node.setAttribute('data-processed', 'true'));

  let viewer: GraphViewerApi;
  try {
    viewer = await loadViewer();
  } catch (error) {
    // Leave the XML source visible rather than blanking the post.
    console.error('draw.io viewer failed to load:', error);
    nodes.forEach((node) => node.removeAttribute('data-processed'));
    return;
  }

  for (const node of nodes) {
    const xml = (node.textContent ?? '').trim();
    if (!xml || !node.isConnected) {
      continue;
    }
    const host = document.createElement('div');
    host.className = 'drawio-diagram';
    // Set via the DOM, after sanitization, so the attribute survives.
    host.setAttribute('data-mxgraph', JSON.stringify(drawioViewerConfig(xml)));
    node.replaceWith(host);
    try {
      viewer.createViewerForElement(host);
    } catch (error) {
      console.error('draw.io rendering failed:', error);
    }
  }
}
