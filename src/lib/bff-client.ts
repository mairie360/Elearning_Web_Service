import { sessionFetch } from '@mairie360/front-kit/browser';
import axios, { type AxiosAdapter } from 'axios';
import { getBffElearning } from '@mairie360/bff-elearning-openapi/endpoints/bffElearning';
import { navigateToLogin } from './auth-session';

type BffErrorBody = {
  message?: unknown;
  error?: {
    message?: unknown;
  };
};

/** A 501 means "no upstream service persists this yet": the BFF's English message is not meant for the agent. */
export const NOT_IMPLEMENTED_MESSAGE =
  "Cette fonctionnalité n’est pas encore disponible dans le service de formation. Aucune donnée n’a été modifiée.";

function errorMessage(body: BffErrorBody | null, status: number): string {
  if (status === 501) return NOT_IMPLEMENTED_MESSAGE;
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
  const response = await sessionFetch(path, {
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

// The generated operations of the published BFF E-learning contract own every path: axios only carries the
// request through requestBff, which keeps the same-origin cookie, redirect handling, 401 and error class.
export function createElearningClient(request: typeof requestBff = requestBff) {
  const contractAdapter: AxiosAdapter = async (config) => {
    const data = await request<unknown>(axios.getUri(config), {
      method: (config.method ?? 'get').toUpperCase(),
      headers: config.headers.toJSON() as Record<string, string>,
      body: typeof config.data === 'string' ? config.data : undefined,
      signal: (config.signal as AbortSignal | undefined) ?? undefined,
    });
    return {
      data,
      status: data === undefined ? 204 : 200,
      statusText: data === undefined ? 'No Content' : 'OK',
      headers: {},
      config,
    };
  };
  return getBffElearning(axios.create({ adapter: contractAdapter, headers: { Accept: 'application/json' } }));
}

export const bffElearning = createElearningClient();
