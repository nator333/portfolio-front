import {
  HttpContext,
  HttpContextToken,
  HttpInterceptorFn,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { finalize } from "rxjs";

import { LoadingService } from "../services/loading.service";

/**
 * Opt a request out of the global loading indicator (e.g. silent background
 * polling). Set on a request's HttpContext via `withoutLoading()`.
 */
export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);

/** A request context that excludes the request from the global loading bar. */
export function withoutLoading(context = new HttpContext()): HttpContext {
  return context.set(SKIP_LOADING, true);
}

/**
 * Counts in-flight requests in LoadingService so a single global indicator can
 * reflect whether any data is loading. `finalize` runs on success, error and
 * unsubscribe, so the count is always balanced.
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_LOADING)) {
    return next(req);
  }
  const loading = inject(LoadingService);
  loading.start();
  return next(req).pipe(finalize(() => loading.stop()));
};
