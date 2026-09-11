import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import {
  WorkoutTargets,
  WorkoutTargetsSaved,
  WorkoutTargetsUpdate,
} from "../models/workout-targets";
import { withAuth } from "../interceptors/api.interceptors";

/**
 * The weekly set targets, for the admin editor.
 *
 * Deliberately uncached in both directions. These are the numbers every volume
 * verdict on the site is judged against, so an editor showing a stale copy would
 * let someone "fix" a value that had already moved — and the API refuses a save
 * written against a version that is no longer current, which only works if the
 * version we hold is the one we actually read.
 *
 * Cognito-gated, not key-gated: the training plan is private, and the ID token
 * is the authority here as it is for the other admin surfaces.
 */
@Injectable({ providedIn: "root" })
export class WorkoutTargetsService {
  private http = inject(HttpClient);

  getTargets(): Observable<WorkoutTargets> {
    return this.http.get<WorkoutTargets>(
      `${environment.apiBaseUrl}/workout-plan/targets`,
      { context: withAuth() },
    );
  }

  /**
   * Publishes the next target set. Errors are left to the caller rather than
   * swallowed: a refused save is the API telling the user something specific —
   * a stale version, or targets the sessions already exceed — and a page that
   * silently returned null would turn that into "nothing happened".
   */
  saveTargets(update: WorkoutTargetsUpdate): Observable<WorkoutTargetsSaved> {
    return this.http.put<WorkoutTargetsSaved>(
      `${environment.apiBaseUrl}/workout-plan/targets`,
      update,
      { context: withAuth() },
    );
  }
}
