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
}

export interface BlogData {
  posts: BlogPostEntry[];
}
