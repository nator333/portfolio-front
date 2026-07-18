import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const ID_TOKEN_STORAGE_KEY = 'cv-editor-id-token';
const PKCE_VERIFIER_STORAGE_KEY = 'cv-editor-pkce-verifier';

interface TokenResponse {
  id_token?: string;
}

/**
 * Google sign-in through the Cognito hosted domain using the OAuth
 * authorization-code + PKCE flow. The pool's pre-signup trigger restricts
 * sign-in to the admin email, so no other login method exists.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private idToken: string | null = this.readStoredToken();
  private readonly authenticated$ = new BehaviorSubject<boolean>(!!this.idToken);
  readonly isAuthenticated$: Observable<boolean> = this.authenticated$.asObservable();

  constructor(private http: HttpClient) {}

  private readStoredToken(): string | null {
    const token = sessionStorage.getItem(ID_TOKEN_STORAGE_KEY);
    return token && !isExpired(token) ? token : null;
  }

  /** The registered OAuth callback: the app's /login page, base-href aware. */
  private redirectUri(): string {
    return new URL('login', document.baseURI).toString();
  }

  /** Kicks off Google sign-in by redirecting to the Cognito hosted domain. */
  async signInWithGoogle(): Promise<void> {
    const verifier = randomUrlSafeString(64);
    sessionStorage.setItem(PKCE_VERIFIER_STORAGE_KEY, verifier);

    const params = new HttpParams({
      fromObject: {
        client_id: environment.cognitoClientId,
        response_type: 'code',
        scope: 'openid email profile',
        redirect_uri: this.redirectUri(),
        identity_provider: 'Google',
        code_challenge_method: 'S256',
        code_challenge: await sha256Base64Url(verifier),
      },
    });

    location.assign(`${environment.cognitoDomain}/oauth2/authorize?${params.toString()}`);
  }

  /** Exchanges the ?code= returned by Cognito for tokens. */
  handleRedirectCallback(code: string): Observable<void> {
    const verifier = sessionStorage.getItem(PKCE_VERIFIER_STORAGE_KEY) ?? '';
    const body = new HttpParams({
      fromObject: {
        grant_type: 'authorization_code',
        client_id: environment.cognitoClientId,
        redirect_uri: this.redirectUri(),
        code,
        code_verifier: verifier,
      },
    });
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

    return this.http
      .post<TokenResponse>(`${environment.cognitoDomain}/oauth2/token`, body.toString(), { headers })
      .pipe(
        map((response) => {
          sessionStorage.removeItem(PKCE_VERIFIER_STORAGE_KEY);
          if (!response.id_token) {
            throw new Error('Cognito did not return an ID token');
          }
          this.idToken = response.id_token;
          sessionStorage.setItem(ID_TOKEN_STORAGE_KEY, response.id_token);
          this.authenticated$.next(true);
        }),
      );
  }

  logout(): void {
    this.idToken = null;
    sessionStorage.removeItem(ID_TOKEN_STORAGE_KEY);
    this.authenticated$.next(false);
  }

  isAuthenticated(): boolean {
    return this.authenticated$.value;
  }

  getIdToken(): string {
    return this.idToken ?? '';
  }
}

function randomUrlSafeString(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return base64UrlEncode(bytes);
}

async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function isExpired(jwt: string): boolean {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
