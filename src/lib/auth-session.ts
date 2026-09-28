"use client";

// Le front ne parle qu'à BFF_Elearning, qui résout la session pour lui. Son contrat publié (0.3.0) ne
// propose pas de déconnexion : le front retire ses jetons locaux puis navigue vers `/logout`, où le
// middleware efface le cookie `accessToken` et redirige vers Login (voir BFF.md, besoin proposé).

import { clearStoredAuthJwtToken } from "./auth-token";

export const LOGOUT_PATH = "/logout";

export async function logout() {
  try {
    clearStoredAuthJwtToken();
  } catch {
    // Un contexte navigateur peut refuser l'accès au stockage : la navigation suffit à fermer la session.
  } finally {
    window.location.assign(LOGOUT_PATH);
  }
}
