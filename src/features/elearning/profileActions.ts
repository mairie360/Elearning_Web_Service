import { logout } from "../../lib/auth-session";
import { BffRequestError } from "../../lib/bff-client";
import { getProfile, type ElearningProfileResponse } from "../../lib/elearning-api";

// Chargement du profil, séparé de ProfileModule.tsx pour être testé sans DOM
// (tests/elearning.bff-mocks.test.cjs).

export type ProfileView = {
  setProfile: (profile: ElearningProfileResponse) => void;
  setLoading: (loading: boolean) => void;
  setError: (message: string | null) => void;
};

export async function loadProfile(
  view: ProfileView,
  signal: AbortSignal,
  onUnauthorized: () => Promise<void> = logout,
) {
  try {
    const response = await getProfile({ cache: "no-store", signal });
    view.setProfile(response);
    view.setError(null);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    if (error instanceof BffRequestError && error.status === 401) {
      await onUnauthorized();
      return;
    }
    view.setError(error instanceof Error ? error.message : "Le profil est indisponible.");
  } finally {
    if (!signal.aborted) view.setLoading(false);
  }
}
