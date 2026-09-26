import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, map, of, catchError, tap } from "rxjs";
import { environment } from "../../environments/environment";
import { ActivityEntry } from "../models/activity-data";

/** Response shape of GET /activity in portfolio-api. */
export interface ActivityResponse {
  range: { from: string; to: string };
  entries: ActivityEntry[];
  counts: { github: number; blog: number; gym: number; total: number };
}

const CACHE_KEY = "activity-cache-v1";
// Reads count against the API's daily usage-plan quota, so repeat home visits
// within the TTL are served from sessionStorage. The GitHub snapshot behind the
// endpoint only refreshes daily, so a short TTL would buy nothing.
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CachedActivity {
  storedAt: number;
  data: ActivityResponse;
}

/**
 * Dated activity for the home page's contribution calendar and feed.
 *
 * The API merges GitHub, gym and blog server-side and returns one flat list, so
 * this makes a single call rather than one per source — the calendar gains a
 * source without the front changing.
 */
@Injectable({ providedIn: "root" })
export class ActivityService {
  constructor(private http: HttpClient) {}

  /** Entries newest first, or an empty list when the feed cannot be loaded. */
  getActivity(): Observable<ActivityEntry[]> {
    return this.getActivityData().pipe(map((data) => data?.entries ?? []));
  }

  getActivityData(): Observable<ActivityResponse | null> {
    const cached = this.readCache();
    if (cached) {
      return of(cached);
    }
    return this.http
      .get<ActivityResponse>(`${environment.apiBaseUrl}/activity`)
      .pipe(
        // Cache even an empty feed so retries don't burn the daily quota.
        tap((data) => this.writeCache(data)),
        catchError((error) => {
          console.error("Error loading activity from API:", error);
          return of(null);
        }),
      );
  }

  private readCache(): ActivityResponse | null {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) {
        return null;
      }
      const cached: CachedActivity = JSON.parse(raw);
      if (Date.now() - cached.storedAt > CACHE_TTL_MS) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }
      return cached.data;
    } catch {
      return null;
    }
  }

  private writeCache(data: ActivityResponse): void {
    try {
      const cached: CachedActivity = { storedAt: Date.now(), data };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch {
      // Cache is best-effort; a full or unavailable sessionStorage is fine.
    }
  }
}
