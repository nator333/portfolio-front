import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { CvData } from '../models/cv-data';
import { withAuth } from '../interceptors/api.interceptors';

const CACHE_KEY = 'cv-cache-v1';
// Reads count against the API's monthly usage-plan quota, so profile
// visits within the TTL are served from sessionStorage instead.
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CachedCv {
  storedAt: number;
  data: CvData;
}

/**
 * Service for fetching and persisting CV data through the portfolio-api backend
 */
@Injectable({
  providedIn: 'root',
})
export class CvService {
  constructor(private http: HttpClient) {}

  getCv(): Observable<CvData> {
    const cached = this.readCache();
    if (cached) {
      return of(cached);
    }
    return this.http
      .get<CvData>(`${environment.apiBaseUrl}/cv`)
      .pipe(tap((data) => this.writeCache(data)));
  }

  updateCv(data: CvData): Observable<CvData> {
    return this.http
      .put<CvData>(`${environment.apiBaseUrl}/cv`, data, {
        context: withAuth(),
      })
      .pipe(tap((saved) => this.writeCache(saved)));
  }

  private readCache(): CvData | null {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) {
        return null;
      }
      const cached: CachedCv = JSON.parse(raw);
      if (Date.now() - cached.storedAt > CACHE_TTL_MS) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }
      return cached.data;
    } catch {
      return null;
    }
  }

  private writeCache(data: CvData): void {
    try {
      const cached: CachedCv = { storedAt: Date.now(), data };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch {
      // Cache is best-effort; a full or unavailable sessionStorage is fine.
    }
  }
}
