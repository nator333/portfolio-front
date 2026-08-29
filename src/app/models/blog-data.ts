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
}

export interface BlogData {
  posts: BlogPostEntry[];
}
