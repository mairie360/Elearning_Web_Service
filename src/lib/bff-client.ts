import { sessionFetch } from '@mairie360/lib-components/browser';
import axios, { type AxiosAdapter } from 'axios';
import { getBffElearning } from '@mairie360/bff-elearning-openapi/endpoints/bffElearning';
import { navigateToLogin } from './auth-session';

type BffErrorBody = {
  message?: unknown;
  error?: {
    message?: unknown;
    details?: unknown;
  };
};

/** One field the BFF refused (`{ path: 'body.title', message }` of the shared error envelope). */
export interface BffErrorDetail {
  path?: string;
  message: string;
}

function errorDetails(body: BffErrorBody | null): BffErrorDetail[] {
  const details = body?.error?.details;
  if (!Array.isArray(details)) return [];
  return details.flatMap((detail): BffErrorDetail[] => {
    if (!detail || typeof detail !== 'object') return [];
    const { path, message } = detail as { path?: unknown; message?: unknown };
    if (typeof message !== 'string') return [];
    return [{ ...(typeof path === 'string' ? { path } : {}), message }];
  });
}

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
    /** Fields the BFF refused (400), from the `details` of its error envelope. */
    public readonly details: BffErrorDetail[] = [],
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

/** A binary answer (the PDF attestations): its content and the `Content-Disposition` header. */
export interface BffFile {
  blob: Blob;
  contentDisposition: string | null;
}

export async function requestBff<T>(path: string, init: RequestInit = {}): Promise<T> {
  return (await sendBff(path, init, 'json')) as T;
}

/** Same request rules as requestBff, for an operation that answers a file. */
export async function requestBffFile(path: string, init: RequestInit = {}): Promise<BffFile> {
  return (await sendBff(path, init, 'file')) as BffFile;
}

async function sendBff(path: string, init: RequestInit, kind: 'json' | 'file'): Promise<unknown> {
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
    throw new BffRequestError(response.status, errorMessage(body, response.status), errorDetails(body));
  }

  if (kind === 'file') {
    const blob = await response.blob();
    init.signal?.throwIfAborted();
    return { blob, contentDisposition: response.headers.get('Content-Disposition') };
  }

  if (response.status === 204) return undefined;

  const body = await response.json();
  init.signal?.throwIfAborted();
  return body;
}

// The generated operations of the published BFF E-learning contract own every path: axios only carries the
// request through requestBff, which keeps the same-origin cookie, redirect handling, 401 and error class.
export function createElearningClient(request: typeof requestBff = requestBff, requestFile: typeof requestBffFile = requestBffFile) {
  const contractAdapter: AxiosAdapter = async (config) => {
    const init = {
      method: (config.method ?? 'get').toUpperCase(),
      headers: config.headers.toJSON() as Record<string, string>,
      body: typeof config.data === 'string' ? config.data : undefined,
      signal: (config.signal as AbortSignal | undefined) ?? undefined,
    };
    // The PDF operations of the contract ask for a blob: the file and its name header go back to the caller.
    if (config.responseType === 'blob') {
      const file = await requestFile(axios.getUri(config), { ...init, headers: { ...init.headers, Accept: 'application/pdf' } });
      return {
        data: file.blob,
        status: 200,
        statusText: 'OK',
        headers: file.contentDisposition ? { 'content-disposition': file.contentDisposition } : {},
        config,
      };
    }
    const data = await request<unknown>(axios.getUri(config), init);
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
