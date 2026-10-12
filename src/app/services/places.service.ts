import { Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of, tap } from "rxjs";
import { environment } from "../../environments/environment";
import { PlaceCityId, PlacesData } from "../models/places-data";
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
  /**
   * The town tab open on the Places page, or null when the page is not shown.
   * The chat widget sends it so the assistant talks about that town first.
   */
  readonly openCity = signal<PlaceCityId | null>(null);

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

  /**
   * Every memory as stored, private Google Maps links and coordinates
   * included, for the editor. Never cached: the shared cache holds only what
   * the public endpoint serves.
   */
  getPlacesForEdit(): Observable<PlacesData> {
    return this.http.get<PlacesData>(`${environment.apiBaseUrl}/places/all`, {
      context: withAuth("none"),
    });
  }

  updatePlaces(data: PlacesData): Observable<PlacesData> {
    // The saved document carries the private links, so rather than caching it
    // the next public read refetches the sanitised version.
    return this.http
      .put<PlacesData>(`${environment.apiBaseUrl}/places`, data, {
        context: withAuth(),
      })
      .pipe(tap(() => this.clearCache()));
  }

  private clearCache(): void {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch {
      // Cache is best-effort.
    }
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
