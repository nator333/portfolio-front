import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProjectsData } from '../models/project-data';
import { AuthService } from './auth.service';

const CACHE_KEY = 'projects-cache-v1';
// Reads count against the API's 100 req/month usage-plan quota, so projects
// page visits within the TTL are served from sessionStorage instead.
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CachedProjects {
  storedAt: number;
  data: ProjectsData;
}

/**
 * Service for fetching and persisting the projects list through portfolio-api.
 */
@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  getProjects(): Observable<ProjectsData> {
    const cached = this.readCache();
    if (cached) {
      return of(cached);
    }
    const headers = new HttpHeaders({ 'X-Api-Key': environment.apiKey });
    return this.http
      .get<ProjectsData>(`${environment.apiBaseUrl}/projects`, { headers })
      .pipe(tap((data) => this.writeCache(data)));
  }

  updateProjects(data: ProjectsData): Observable<ProjectsData> {
    const headers = new HttpHeaders({
      'X-Api-Key': environment.apiKey,
      // REST API Cognito authorizers expect the raw JWT, not a Bearer-prefixed value.
      Authorization: this.authService.getIdToken(),
    });
    return this.http
      .put<ProjectsData>(`${environment.apiBaseUrl}/projects`, data, { headers })
      .pipe(tap((saved) => this.writeCache(saved)));
  }

  private readCache(): ProjectsData | null {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) {
        return null;
      }
      const cached: CachedProjects = JSON.parse(raw);
      if (Date.now() - cached.storedAt > CACHE_TTL_MS) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }
      return cached.data;
    } catch {
      return null;
    }
  }

  private writeCache(data: ProjectsData): void {
    try {
      const cached: CachedProjects = { storedAt: Date.now(), data };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch {
      // Cache is best-effort; a full or unavailable sessionStorage is fine.
    }
  }
}
