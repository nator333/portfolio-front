import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of, tap } from "rxjs";
import { environment } from "../../environments/environment";
import { PlacesData } from "../models/places-data";
import { withAuth } from "../interceptors/api.interceptors";

const CACHE_KEY = "places-cache-v1";
// Reads count against the API's monthly usage-plan quota, so Places page
// visits within the TTL are served from sessionStorage instead.
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CachedPlaces {
  storedAt: number;
  data: PlacesData;
}

/**
 * Service for fetching and persisting the Places page content (hometown maps
 * and memories) through portfolio-api.
 */
@Injectable({
  providedIn: "root",
})
export class PlacesService {
  constructor(private http: HttpClient) {}

  getPlaces(): Observable<PlacesData> {
    const cached = this.readCache();
    if (cached) {
      return of(cached);
    }
    return this.http
      .get<PlacesData>(`${environment.apiBaseUrl}/places`)
      .pipe(tap((data) => this.writeCache(data)));
  }

  updatePlaces(data: PlacesData): Observable<PlacesData> {
    return this.http
      .put<PlacesData>(`${environment.apiBaseUrl}/places`, data, {
        context: withAuth(),
      })
      .pipe(tap((saved) => this.writeCache(saved)));
  }

  private readCache(): PlacesData | null {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) {
        return null;
      }
      const cached: CachedPlaces = JSON.parse(raw);
      if (Date.now() - cached.storedAt > CACHE_TTL_MS) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }
      return cached.data;
    } catch {
      return null;
    }
  }

  private writeCache(data: PlacesData): void {
    try {
      const cached: CachedPlaces = { storedAt: Date.now(), data };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch {
      // Cache is best-effort; a full or unavailable sessionStorage is fine.
    }
  }
}
