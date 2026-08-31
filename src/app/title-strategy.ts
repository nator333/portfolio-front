import { inject, Injectable } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { RouterStateSnapshot, TitleStrategy } from "@angular/router";

/** Site name appended to each page title (browser tab, history, bookmarks). */
export const SITE_NAME = "Hiro Nakamata";

/** Shown when a route declares no title (the landing page, mainly). */
const DEFAULT_TITLE = "Hiro Nakamata — Software Engineer";

/**
 * Formats a page title as "Page · Hiro Nakamata", falling back to the default
 * landing title when no page name is given. Shared by the router strategy and
 * pages that set their own title (e.g. an individual blog post).
 */
export function pageTitle(name: string | undefined | null): string {
  return name ? `${name} · ${SITE_NAME}` : DEFAULT_TITLE;
}

/**
 * Sets the document title from each route's `title`, branded with the site
 * name. Routes without a `title` fall back to the default; the blog post page
 * leaves its route title unset and sets the post's title itself once loaded.
 */
@Injectable({ providedIn: "root" })
export class BrandTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.title.setTitle(pageTitle(this.buildTitle(snapshot)));
  }
}
