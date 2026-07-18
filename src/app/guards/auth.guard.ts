import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guards the admin edit pages. The guarded URLs double as the registered
 * Cognito OAuth callbacks, so a ?code= redirect must pass through for the
 * page to finish the token exchange. Anyone else is sent straight to the
 * Cognito hosted Google sign-in; only the admin email can complete it.
 */
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);

  if (authService.isAuthenticated() || route.queryParamMap.has('code')) {
    return true;
  }

  authService.signInWithGoogle();
  return false;
};
