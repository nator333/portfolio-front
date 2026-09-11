import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of, catchError, tap } from "rxjs";
import { environment } from "../../environments/environment";
import { MuscleVolumeStatus, WorkoutSummary } from "../models/workout-data";
import { withApiKey } from "../interceptors/api.interceptors";

const CACHE_KEY = "workout-cache-v1";
// The summary is rebuilt only when a new CSV is imported (rarely), so a longer
// TTL is safe and keeps repeat visits off the workout key's daily quota.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface CachedWorkout {
  storedAt: number;
  data: WorkoutSummary;
}

/**
 * Workout summaries for the progress page: strength progression, weekly
 * training volume, muscle balance and consistency.
 *
 * Uses the workout API key, which has its own daily usage plan, so a
 * chart-heavy page can't draw down the content endpoints' quota.
 */
@Injectable({ providedIn: "root" })
export class WorkoutService {
  constructor(private http: HttpClient) {}

  getWorkout(): Observable<WorkoutSummary | null> {
    const cached = this.readCache();
    if (cached) {
      return of(cached);
    }
    return this.http
      .get<WorkoutSummary>(`${environment.apiBaseUrl}/workout`, {
        context: withApiKey("workout"),
      })
      .pipe(
        tap((data) => this.writeCache(data)),
        catchError((error) => {
          console.error("Error loading workout data from API:", error);
          return of(null);
        }),
      );
  }

  /**
   * Whether each muscle is under, in range or over target, as computed by the
   * API against the current training plan.
   *
   * Deliberately uncached, unlike the summary above. The summary only changes
   * when a CSV is imported, so a six-hour TTL costs nothing; this answer depends
   * on the moment it is asked (the window trails wall-clock now) and on the plan
   * version live at that moment. Serving a cached verdict would put back exactly
   * the staleness the endpoint exists to remove — a plan revised this morning
   * still reading as yesterday's targets — and that is worth one request against
   * the workout key's daily quota.
   *
   * Fails soft: the page drops its target bands rather than its charts.
   */
  getMuscleVolumeStatus(): Observable<MuscleVolumeStatus | null> {
    return this.http
      .get<MuscleVolumeStatus>(`${environment.apiBaseUrl}/muscle-volume-status`, {
        context: withApiKey("workout"),
      })
      .pipe(
        catchError((error) => {
          console.error("Error loading muscle volume status from API:", error);
          return of(null);
        }),
      );
  }

  private readCache(): WorkoutSummary | null {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) {
        return null;
      }
      const cached: CachedWorkout = JSON.parse(raw);
      if (Date.now() - cached.storedAt > CACHE_TTL_MS) {
        sessionStorage.removeItem(CACHE_KEY);
        return null;
      }
      return cached.data;
    } catch {
      return null;
    }
  }

  private writeCache(data: WorkoutSummary): void {
    try {
      const cached: CachedWorkout = { storedAt: Date.now(), data };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch {
      // Cache is best-effort.
    }
  }
}
