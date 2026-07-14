import { Injectable } from '@angular/core';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const ID_TOKEN_STORAGE_KEY = 'cv-editor-id-token';

/**
 * Authenticates the single CV-admin user directly against Cognito's USER_PASSWORD_AUTH flow.
 * No self-signup / hosted UI: the admin account is created out-of-band via the AWS console/CLI.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly client = new CognitoIdentityProviderClient({ region: environment.cognitoRegion });

  private idToken: string | null = sessionStorage.getItem(ID_TOKEN_STORAGE_KEY);
  private readonly authenticated$ = new BehaviorSubject<boolean>(!!this.idToken);
  readonly isAuthenticated$: Observable<boolean> = this.authenticated$.asObservable();

  login(username: string, password: string): Observable<void> {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: environment.cognitoClientId,
      AuthParameters: { USERNAME: username, PASSWORD: password },
    });

    return from(this.client.send(command)).pipe(
      map((result) => {
        const idToken = result.AuthenticationResult?.IdToken;
        if (!idToken) {
          throw new Error('Cognito did not return an ID token');
        }
        this.idToken = idToken;
        sessionStorage.setItem(ID_TOKEN_STORAGE_KEY, idToken);
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
