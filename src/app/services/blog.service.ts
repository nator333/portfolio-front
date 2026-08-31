import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, catchError, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { BlogData, BlogPostEntry, DEFAULT_BLOG_LANG } from '../models/blog-data';
import { renderBlogMarkdown } from '../utils/blog-markdown.util';
import { AuthService } from './auth.service';
import { withAuth } from '../interceptors/api.interceptors';

export interface BlogPost {
  id: number;
  title: string;
  date: Date;
  summary: string;
  /** HTML content, ready for [innerHTML]. */
  content: string;
  image: string;
  tags: string[];
  url: string;
  /** True for draft posts; only ever set for authenticated viewers. */
  draft: boolean;
  /** BCP-47 language of the post text; falls back to the site default. */
  lang: string;
}

const CACHE_KEY = 'blog-cache-v1';
// Reads count against the API's monthly usage-plan quota, so blog page
// visits within the TTL are served from sessionStorage instead.
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CachedBlog {
  storedAt: number;
  data: BlogData;
}

/**
 * Service for blog posts. Loads the blog document from portfolio-api (DynamoDB)
 * and renders its markdown content to HTML. The API document is the single
 * source of truth; the list renders empty when it is unavailable.
 */
@Injectable({
  providedIn: 'root'
})
export class BlogService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  /**
   * Get all blog posts, newest first.
   */
  getAllPosts(): Observable<BlogPost[]> {
    return this.getBlogData().pipe(
      map((data) => {
        const posts = (data?.posts ?? []).map((entry, index) =>
          this.toBlogPost(entry, index),
        );
        posts.sort((a, b) => b.date.getTime() - a.date.getTime());
        return posts;
      }),
    );
  }

  /**
   * Get a blog post by URL, with its HTML content loaded.
   * @param url The URL of the blog post, e.g. "/blog/my-post"
   */
  getPostByUrl(url: string): Observable<BlogPost | undefined> {
    return this.getAllPosts().pipe(
      map(posts => posts.find(post => post.url === url)),
    );
  }

  /**
   * Persist the full blog document (admin blog editor).
   */
  updateBlog(data: BlogData): Observable<BlogData> {
    // The saved document may contain drafts, which must never sit in the shared
    // public cache — so invalidate it and let the next public read re-fetch the
    // server-stripped list rather than writing the response back.
    return this.http
      .put<BlogData>(`${environment.apiBaseUrl}/blog`, data, {
        context: withAuth(),
      })
      .pipe(tap(() => this.clearCache()));
  }

  /**
   * The raw blog document as stored behind the API (markdown content), or
   * null when it could not be loaded. Used by the admin blog editor.
   */
  getBlogData(): Observable<BlogData | null> {
    // Authenticated viewers read the draft-inclusive admin endpoint; drafts must
    // never be cached under the shared public key, so that path skips the cache
    // entirely (in both directions) and always fetches fresh.
    if (this.authService.isAuthenticated()) {
      return this.http
        .get<BlogData>(`${environment.apiBaseUrl}/blog/all`, {
          context: withAuth(),
        })
        .pipe(
          catchError((error) => {
            console.error('Error loading draft-inclusive blog data from API:', error);
            return of(null);
          }),
        );
    }

    const cached = this.readCache();
    if (cached) {
      return of(cached);
    }
    return this.http
      .get<BlogData>(`${environment.apiBaseUrl}/blog`)
      .pipe(
        // Cache even an empty document so retries don't burn the monthly quota.
        tap((data) => this.writeCache(data)),
        catchError((error) => {
          console.error('Error loading blog data from API:', error);
          return of(null);
        }),
      );
  }

  private toBlogPost(entry: BlogPostEntry, index: number): BlogPost {
    return {
      id: index + 1,
      title: entry.title,
      date: new Date(entry.date),
      summary: entry.summary,
      content: renderBlogMarkdown(entry.content),
      image: entry.image ?? '',
      tags: entry.tags,
      url: entry.url,
      draft: entry.draft ?? false,
      lang: entry.lang ?? DEFAULT_BLOG_LANG,
    };
  }

  private readCache(): BlogData | null {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) {
        return null;
      }
      const cached: CachedBlog = JSON.parse(raw);
      if (Date.now() - cached.storedAt > CACHE_TTL_MS) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }
      return cached.data;
    } catch {
      return null;
    }
  }

  private writeCache(data: BlogData): void {
    try {
      const cached: CachedBlog = { storedAt: Date.now(), data };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch {
      // Cache is best-effort; a full or unavailable sessionStorage is fine.
    }
  }

  private clearCache(): void {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch {
      // Best-effort; an unavailable sessionStorage is fine.
    }
  }
}
