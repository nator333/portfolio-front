import { NavigationError } from "@angular/router";

/** How long to suppress another recovery reload, so a genuinely missing chunk
 * can't drive an endless reload loop. */
const COOLDOWN_MS = 10_000;
const LAST_RELOAD_KEY = "chunk-reload-ts";

/**
 * True when an error looks like a failed lazy-route chunk import — i.e. the
 * cached app shell referenced a hashed bundle that a later deploy removed.
 * Message wording differs across engines (Chrome, Safari, Firefox), so match
 * the known variants loosely.
 */
export function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error ?? "");
  return (
    /ChunkLoadError/i.test(message) ||
    /Loading chunk [\w-]+ failed/i.test(message) ||
    /(error|failed)[\s\S]*dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message)
  );
}

/**
 * Recover from a stale-shell navigation failure by doing one full-page load to
 * the URL the router was trying to reach. The fresh document pulls the current
 * index.html and the hashed chunks it references, so the lazy route loads.
 *
 * Without a service worker, an installed PWA can keep an old app shell whose
 * lazy chunks 404 after a redeploy; the eagerly-bundled pages (e.g. the blog
 * list) still work, so the symptom is a link that silently does nothing. A
 * cooldown guards against reloading in a loop when a chunk is truly gone.
 */
export function recoverFromChunkLoadError(error: NavigationError): void {
  if (!isChunkLoadError(error.error)) {
    return;
  }

  const now = Date.now();
  let last = 0;
  try {
    last = Number(sessionStorage.getItem(LAST_RELOAD_KEY)) || 0;
  } catch {
    // sessionStorage may be unavailable; fall through and attempt one reload.
  }
  if (now - last < COOLDOWN_MS) {
    return;
  }
  try {
    sessionStorage.setItem(LAST_RELOAD_KEY, String(now));
  } catch {
    // Best-effort; without the marker we simply lose loop protection.
  }

  window.location.assign(error.url);
}
