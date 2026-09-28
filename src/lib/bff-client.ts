import { getStoredAuthorizationHeader } from "./auth-token";

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

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Authorization")) {
    const authorizationHeader = getStoredAuthorizationHeader();

    if (authorizationHeader) {
      headers.set("Authorization", authorizationHeader);
    }
  }

  return headers;
}

export async function requestBff<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(path, {
    ...init,
    headers: createRequestHeaders(init),
  });

  if (!response.ok) {
    let body: BffErrorBody | null = null;

    try {
      body = (await response.json()) as BffErrorBody;
    } catch {
      // La réponse peut ne pas contenir de JSON exploitable.
    }

    throw new BffRequestError(response.status, errorMessage(body, response.status));
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}
