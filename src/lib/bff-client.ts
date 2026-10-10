import { navigateToLogin } from './auth-session';

type BffErrorBody = {
  message?: unknown;
  error?: {
    message?: unknown;
  };
};

function errorMessage(body: BffErrorBody | null, status: number): string {
  for (const message of [body?.message, body?.error?.message]) {
    if (typeof message === "string" && message.trim()) return message;
  }
  return status >= 500
    ? "Le service est momentanément indisponible. Veuillez réessayer plus tard."
    : "La demande n’a pas pu aboutir. Veuillez réessayer.";
}

export class BffRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "BffRequestError";
  }
}
function createRequestHeaders(init: RequestInit) {
  const headers = new Headers(init.headers);
  headers.delete("Authorization");

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

export async function requestBff<T>(path: string, init: RequestInit = {}) {
  init.signal?.throwIfAborted();
  const response = await fetch("/api/bff" + path, {
    ...init,
    headers: createRequestHeaders(init),
    redirect: "manual",
    credentials: "same-origin", cache: "no-store",
  });
  init.signal?.throwIfAborted();

  if (response.type === "opaqueredirect") {
    navigateToLogin();
    throw new BffRequestError(307, "Redirection vers la connexion en cours.");
  }

  if (!response.ok) {
    let body: BffErrorBody | null = null;

    try {
      body = (await response.json()) as BffErrorBody;
    } catch {
      // La réponse peut ne pas contenir de JSON exploitable.
    }

    init.signal?.throwIfAborted();

    if (response.status === 401) navigateToLogin();
    throw new BffRequestError(response.status, errorMessage(body, response.status));
  }

  if (response.status === 204) return undefined as T;

  const body = (await response.json()) as T;
  init.signal?.throwIfAborted();
  return body;
}
