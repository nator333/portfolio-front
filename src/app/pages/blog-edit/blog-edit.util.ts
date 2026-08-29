/**
 * A post is identified in the editor routes by the slug portion of its route
 * path (`/blog/<slug>` → `<slug>`). Posts have no separate id, and the url is
 * unique and required, so it is the stable handle between the list and editor.
 */
export function blogSlug(url: string): string {
  return url.replace(/^\/blog\//, "");
}

/** Rebuilds the stored route path from a slug. */
export function blogUrlFromSlug(slug: string): string {
  return `/blog/${slug}`;
}
