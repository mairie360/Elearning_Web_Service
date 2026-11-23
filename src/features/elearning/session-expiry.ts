import { isLoginNavigationPending, navigateToLogin } from "../../lib/auth-session";

// What every action module does with a 401 of the BFF by default: go back to Login. When that redirect cannot
// start (Login address missing or invalid, the browser refused the navigation), the agent is told instead of
// seeing the action stop without a word; a redirect already under way says nothing more.

export const LOGIN_UNAVAILABLE_TITLE = 'Session expirée';
export const LOGIN_UNAVAILABLE_MESSAGE = 'Votre session a expiré et la page de connexion n’a pas pu s’ouvrir. Rechargez la page pour vous reconnecter.';

/** The default 401 handler of an action module; `notify` is called only when no redirect to Login is under way. */
export function leaveForLogin(notify: (message: string) => void) {
  return async () => {
    if (!navigateToLogin() && !isLoginNavigationPending()) notify(LOGIN_UNAVAILABLE_MESSAGE);
  };
}
