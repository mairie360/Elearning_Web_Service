import { AsyncLocalStorage } from 'node:async_hooks';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { config as middlewareConfig, middleware } from '../../src/middleware';

// Simule le navigateur et le runtime Next.js autour du vrai code du front, sans build ni DOM :
// - `fetch` côté navigateur (hors route handler) n'a le droit d'appeler que l'origine du front ;
// - chaque requête same-origin passe par le vrai middleware (matcher compris) puis par le route handler
//   de src/app/**/route.ts choisi comme le ferait l'App Router (segments fixes > [param] > [...catchAll]) ;
// - `fetch` côté serveur (dans un route handler) n'a le droit d'appeler que les services simulés déclarés.
// Tout autre appel réseau est refusé (TypeError, comme un fetch en échec) et consigné dans `violations`.

export const FRONT_ORIGIN = 'http://localhost:5006';
const APP_DIR = path.join(__dirname, '..', '..', 'src', 'app');
const HTTP_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

type RouteContext = { params: Promise<Record<string, string | string[]>> };
type RouteHandler = (request: NextRequest, context: RouteContext) => Response | Promise<Response>;
type Route = { file: string; segments: string[]; rank: number };

export type FrontCall = { method: string; pathname: string; search: string; route?: string; status?: number; redirectedTo?: string };
export type UpstreamCall = { method: string; url: URL; route: string };

const serverScope = new AsyncLocalStorage<{ route: string }>();

function discoverRoutes(dir = APP_DIR, segments: string[] = []): Route[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return discoverRoutes(path.join(dir, entry.name), [...segments, entry.name]);
    if (entry.name !== 'route.ts') return [];
    // Rang : un segment catch-all coûte plus qu'un paramètre, qui coûte plus qu'un segment fixe.
    const rank = segments.reduce((total, segment) => total + (segment.startsWith('[...') ? 100 : segment.startsWith('[') ? 1 : 0), 0);
    return [{ file: path.join(dir, entry.name), segments, rank }];
  }).sort((a, b) => a.rank - b.rank || b.segments.length - a.segments.length);
}

function matchRoute(route: Route, parts: string[]): Record<string, string | string[]> | undefined {
  const params: Record<string, string | string[]> = {};
  for (let index = 0; index < route.segments.length; index += 1) {
    const segment = route.segments[index];
    if (segment.startsWith('[...')) {
      if (index !== route.segments.length - 1 || parts.length <= index) return undefined;
      params[segment.slice(4, -1)] = parts.slice(index);
      return params;
    }
    if (parts[index] === undefined) return undefined;
    if (segment.startsWith('[')) params[segment.slice(1, -1)] = parts[index];
    else if (segment !== parts[index]) return undefined;
  }
  return parts.length === route.segments.length ? params : undefined;
}

function middlewareApplies(pathname: string): boolean {
  return middlewareConfig.matcher.some((matcher) => new RegExp(`^${matcher}$`).test(pathname));
}

export class FrontRuntime {
  readonly frontCalls: FrontCall[] = [];
  readonly upstreamCalls: UpstreamCall[] = [];
  readonly violations: string[] = [];
  /** Cookie `accessToken` détenu par le navigateur (posé par Login en production). */
  accessToken?: string;
  private readonly routes = discoverRoutes();
  private originalFetch?: typeof fetch;

  /** @param upstreams origines des services simulés joignables depuis les route handlers. */
  constructor(private readonly upstreams: () => string[]) {}

  get routeFiles(): string[] {
    return this.routes.map((route) => path.relative(path.join(APP_DIR, '..', '..'), route.file));
  }

  install(): void {
    this.originalFetch = globalThis.fetch;
    globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => this.fetch(input, init)) as typeof fetch;
  }

  restore(): void {
    if (this.originalFetch) globalThis.fetch = this.originalFetch;
  }

  reset(): void {
    this.frontCalls.length = 0;
    this.upstreamCalls.length = 0;
    this.violations.length = 0;
    this.accessToken = undefined;
  }

  private async fetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const url = new URL(input instanceof Request ? input.url : String(input), FRONT_ORIGIN);
    const method = (init.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const scope = serverScope.getStore();

    if (!scope) {
      if (init.signal?.aborted) throw init.signal.reason ?? new DOMException('This operation was aborted', 'AbortError');
      if (url.origin !== FRONT_ORIGIN) return this.refuse(`navigateur : ${method} ${url.href} ne vise pas l'origine du front`);
      return this.dispatch(method, url, init);
    }
    if (!this.upstreams().includes(url.origin)) return this.refuse(`serveur (${scope.route}) : ${method} ${url.href} ne vise aucun service simulé`);
    this.upstreamCalls.push({ method, url, route: scope.route });
    return this.originalFetch!(input, init);
  }

  private refuse(message: string): never {
    this.violations.push(message);
    throw new TypeError('fetch failed');
  }

  private async dispatch(method: string, url: URL, init: RequestInit): Promise<Response> {
    const call: FrontCall = { method, pathname: url.pathname, search: url.search };
    this.frontCalls.push(call);
    const headers = new Headers(init.headers);
    if (this.accessToken) headers.set('cookie', `accessToken=${this.accessToken}`);
    let request = new NextRequest(url, { ...init, method, headers } as ConstructorParameters<typeof NextRequest>[1]);

    if (middlewareApplies(url.pathname)) {
      const response = middleware(request);
      if (response.headers.get('x-middleware-next') !== '1') {
        // Le navigateur suit la redirection vers Login, autre origine sans CORS : le fetch échoue.
        call.status = response.status;
        call.redirectedTo = response.headers.get('location') ?? undefined;
        throw new TypeError('Failed to fetch');
      }
      const overridden = new Headers();
      for (const name of (response.headers.get('x-middleware-override-headers') ?? '').split(',').filter(Boolean)) {
        const value = response.headers.get(`x-middleware-request-${name}`);
        if (value !== null) overridden.set(name, value);
      }
      request = new NextRequest(url, { ...init, method, headers: overridden } as ConstructorParameters<typeof NextRequest>[1]);
    }

    const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    for (const route of this.routes) {
      const params = matchRoute(route, parts);
      if (!params) continue;
      const relative = path.relative(path.join(APP_DIR, '..', '..'), route.file);
      call.route = relative;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const handlers = require(route.file) as Partial<Record<string, RouteHandler>>;
      const handler = handlers[method];
      if (!handler) {
        call.status = 405;
        const allow = HTTP_METHODS.filter((candidate) => handlers[candidate]).join(', ');
        return new Response(null, { status: 405, headers: { Allow: allow } });
      }
      const response = await serverScope.run({ route: relative }, () => handler(request, { params: Promise.resolve(params) }));
      call.status = response.status;
      return response;
    }
    call.status = 404;
    return new Response(null, { status: 404 });
  }
}
