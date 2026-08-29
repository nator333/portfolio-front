/**
 * Blog document as stored behind portfolio-api's GET/PUT /blog.
 * Content is markdown; it is rendered to HTML at display time.
 */
export interface BlogPostEntry {
  title: string;
  /** ISO date string, parsed with new Date() on display. */
  date: string;
  summary: string;
  tags: string[];
  /** Route path the front links to, e.g. "/blog/my-post". */
  url: string;
  image?: string;
  /** Markdown source of the post. */
  content: string;
  /**
   * Draft posts are withheld from the public GET /blog and only reach the front
   * through the Cognito-gated GET /blog/all. When present they render with a
   * "Draft" badge. Absent is treated as false.
   */
  draft?: boolean;
  /**
   * BCP-47 language of the post's title, summary and content, e.g. "ja".
   * Surfaced as a `lang` attribute on the rendered text so browsers and screen
   * readers treat it correctly (and offer to translate it). Absent means the
   * site default, {@link DEFAULT_BLOG_LANG}.
   */
  lang?: string;
}

export interface BlogData {
  posts: BlogPostEntry[];
}

/** Language a post is assumed to be in when it carries no explicit `lang`. */
export const DEFAULT_BLOG_LANG = "en";
