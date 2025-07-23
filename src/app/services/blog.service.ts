import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, catchError } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface BlogPost {
  id: number;
  title: string;
  date: Date;
  summary: string;
  content: string;
  image: string;
  eyeCatchImage: string;
  tags: string[];
  url: string;
  filename: string;
  originalFilename: string;
}

/**
 * Service for managing blog posts
 * Loads pre-generated HTML and metadata from build-time processing
 */
@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private blogPosts: BlogPost[] = [];
  private initialized = false;

  constructor(
    private http: HttpClient
  ) {}

  /**
   * Initialize the blog service by loading all blog posts from the pre-generated manifest
   */
  initialize(): Observable<BlogPost[]> {
    if (this.initialized) {
      return of(this.blogPosts);
    }

    // Load the pre-generated manifest file
    return this.http.get<{posts: BlogPost[]}>('assets/blog-html/manifest.json').pipe(
      map(manifest => {
        // Convert string dates to Date objects
        const posts = manifest.posts.map(post => ({
          ...post,
          date: new Date(post.date)
        }));
        
        this.blogPosts = posts;
        this.initialized = true;
        return this.blogPosts;
      }),
      catchError(error => {
        console.error('Error loading blog manifest:', error);
        return of([]);
      })
    );
  }

  /**
   * Get all blog posts
   */
  getAllPosts(): Observable<BlogPost[]> {
    return this.initialize();
  }

  /**
   * Get a blog post by URL
   * @param url The URL of the blog post
   */
  getPostByUrl(url: string): Observable<BlogPost | undefined> {
    return this.getAllPosts().pipe(
      map(posts => posts.find(post => post.url === url)),
      switchMap(post => {
        if (!post) {
          return of(undefined);
        }
        
        // Load the pre-generated HTML content
        return this.http.get(`assets/blog-html/${post.filename}`, { responseType: 'text' }).pipe(
          map(content => ({
            ...post,
            content
          })),
          catchError(error => {
            console.error(`Error loading blog post HTML: ${post.filename}`, error);
            return of({
              ...post,
              content: `<p>Error loading content: ${error.message || 'Unknown error'}</p>`
            });
          })
        );
      })
    );
  }
}