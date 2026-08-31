import {
  HttpContext,
  HttpContextToken,
  HttpInterceptorFn,
} from "@angular/common/http";
import { inject } from "@angular/core";

import { environment } from "../../environments/environment";
import { AuthService } from "../services/auth.service";

/**
 * Which usage-plan API key a portfolio-api request should carry. Most endpoints
 * share the site key (`standard`); chat and workout sit on their own usage
 * plans, and the Cognito-gated endpoints (media, agent, uploads) send no key at
 * all — the ID token is their authority.
 */
export type ApiKeyKind = "standard" | "chat" | "workout" | "none";

/** Selects the X-Api-Key for a request; defaults to the standard site key. */
export const API_KEY_KIND = new HttpContextToken<ApiKeyKind>(() => "standard");

/** Marks a request that must carry the signed-in user's Cognito ID token. */
export const REQUIRES_AUTH = new HttpContextToken<boolean>(() => false);

/**
 * A request context requesting the raw-JWT `Authorization` header, optionally
 * with a non-standard api key. Use for authenticated writes and admin reads.
 */
export function withAuth(kind: ApiKeyKind = "standard"): HttpContext {
  return new HttpContext().set(REQUIRES_AUTH, true).set(API_KEY_KIND, kind);
}

/** A request context selecting a non-standard api key (no auth). */
export function withApiKey(kind: ApiKeyKind): HttpContext {
  return new HttpContext().set(API_KEY_KIND, kind);
}

const API_KEYS: Record<Exclude<ApiKeyKind, "none">, string> = {
  standard: environment.apiKey,
  chat: environment.chatApiKey,
  workout: environment.workoutApiKey,
};

/** True for requests bound for portfolio-api (not Cognito or S3 uploads). */
function isApiRequest(url: string): boolean {
  return url.startsWith(environment.apiBaseUrl);
}

/** Attaches the appropriate `X-Api-Key` to portfolio-api requests. */
export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }
  const kind = req.context.get(API_KEY_KIND);
  if (kind === "none") {
    return next(req);
  }
  return next(req.clone({ setHeaders: { "X-Api-Key": API_KEYS[kind] } }));
};

/**
 * Attaches the Cognito ID token to portfolio-api requests that opt in via
 * `withAuth()`. The REST API's Cognito authorizers expect the raw JWT, not a
 * `Bearer`-prefixed value.
 */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url) || !req.context.get(REQUIRES_AUTH)) {
    return next(req);
  }
  const token = inject(AuthService).getIdToken();
  return next(req.clone({ setHeaders: { Authorization: token } }));
};
