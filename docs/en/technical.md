# Elearning_Web_Service — Technical documentation

## Shared footer — MAIR-180

The package is pinned to published `@mairie360/lib-components@0.6.5` from
[lib-components #388](https://github.com/mairie360/lib-components/pull/388).
AppShell now places copyright in the dark sidebar, outside scrolling navigation.
The mobile drawer retains focus management. No content-footer band reduces the
main viewport; only supplied information is shown, with no invented version.
Contracts, APIs/BFFs and deployment approvals are unchanged. Consumer adoption
is tracked in [shared issue #387](https://github.com/mairie360/lib-components/issues/387).

## CI supply-chain policy — MAIR-230 frontend slice

Third-party checkout, Node setup and Renovate auto-approval actions use full
official commit SHAs. The shared frontend workflow uses v4.0.3 and receives
only its declared CODECOV_TOKEN and N8N_WEBHOOK_SECRET references; no secret value
is stored or read. Existing permissions and Semgrep rules/verdicts are unchanged.

Both CI workflows pin Node 24.21.0. Tests require npm >=11.10, which supports the
committed `min-release-age=7` policy, with only the previously authorized internal
`@mairie360/lib-components` exclusion. This is a
seven-day window for **new dependency resolution**, not a scan or rewriting of
the existing lockfile used by `npm ci`. See the [npm config documentation](https://docs.npmjs.com/cli/v11/using-npm/config/#min-release-age).
Use the same Node/npm toolchain for local dependency updates and tests.
`tests/ci-policy.test.cjs` checks immutable action references, the explicit secret
map, release-age configuration and the npm version actually running the tests.

MAIR-436 pins production/development Docker to the same official Node 24.21.0
Bookworm-slim digest and installs the lockfile using a required ephemeral BuildKit
secret. The follow-up merge of the independently updated main workflow retains
the exact Node version and both real blocking required scanners. No audit gate,
runtime variable, API/BFF contract or shared-CICD source is changed by that merge.
These CI checks do not certify a deployed environment.

## Shared application shell — MAIR-180

`ElearningModule` uses the shared `AppShell` for desktop/mobile navigation,
header and footer. The shell receives runtime URLs for active modules only;
invalid frontend destinations are omitted. The BFF catalogue still supplies
the current user, administrator role and footer data. No BFF call or contract
changes. The frontend requires a published `@mairie360/lib-components` release
that exports `AppShell` before this slice can be deployed.

## Settings account destination — MAIR-180 slice

Authenticated requests to `/profile` and its subpaths redirect (307) in
middleware to `SETTINGS_FRONT_URL`, resolved on each request; no business profile
is fetched by this module. Missing, invalid, credential-bearing or legacy
`profile` path destinations return an uncached HTTP 503. Old bookmark query
parameters are not forwarded. The existing authentication gate runs first.
No new BFF contract, secret or runtime variable is introduced.

## Explicit frontend destinations (MAIR-177)

Frontend redirects use only explicitly configured HTTP(S) URLs without embedded
credentials. There is no implicit localhost destination. Set the existing
`LOGIN_FRONT_URL` (protected fronts) and `PROJECT_FRONT_URL` (Login default)
at runtime, including local development. A valid configured return destination
may still be used by Login when its default is absent. Invalid or missing
Login destinations produce an uncached HTTP 503 message in the middleware;
Login itself displays an unavailable state without a form when no destination
can be resolved. No BFF/API contract or deployment variable is added.


[Module overview](module.md) · [Français](../fr/technical.md) · [README](../../README.md)

## Architecture and request handling

Next.js 15.5.25, React 19 and TypeScript application using the App Router. The browser calls same-origin routes; the Next.js server forwards data to **BFF_Elearning**.

```mermaid
flowchart LR
  Browser --> Next["Elearning_Web_Service"]
  Next --> BFF["BFF_Elearning"]
```

The root page mounts `ElearningModule` inside the shared AppShell; middleware redirects legacy profile URLs to Settings. Files in `src/features/elearning` manage catalogue loading and actions, while the proxy preserves `/elearning` routes.

The generic proxy reads the versioned OpenAPI contract to allow paths and methods. It preserves query parameters, binary bodies, statuses and useful headers, filters transport headers, disables caching and does not automatically follow redirects. Its timeout is 15 seconds.

## Data and persistence

The following sources and limitations describe the associated BFF, which determines persistence for the displayed data.

The initial catalogue is defined in `elearning_helpers.ts`. Course edits, progress, ratings and profile overrides are held in memory, including user-keyed maps. BFF User supplies identity. The included Elearning API client and diagnostics do not make this storage persistent.

Restarting resets in-memory data; multiple instances do not share that state. Contract validation or an HTTP success does not prove durable storage in Elearning API.

React state manages display and pending operations. This repository defines no business database of its own; save guarantees come from the BFF and its sources described above.

## Installation and local startup

Use Node.js 24 and npm >=11.10 to reproduce CI with the committed lockfile. Docker versions are unchanged and detailed below.

Private `@mairie360/*` dependencies require GitHub Packages access. Set `NODE_AUTH_TOKEN` in the environment to a token allowed to read these packages, as configured in `.npmrc`. Do not commit its value.

```bash
npm ci
```

Create `.env.local` in the repository root. Example for BFFs running on the same machine:

```dotenv
BFF_ELEARNING_BASE_URL=http://localhost:4006
```

Start the associated BFF (itself connected to BFF User to resolve sessions), then start the web service. Port `5006` below is an explicit local choice to avoid collisions; it is not a claim about ports in every Compose file.

```bash
npm run dev -- --port 5006
```

Open `http://localhost:5006`. To run the build with the Next.js script:

```bash
npm run build
npm run start -- --port 5006
```

## Configuration

On a missing or expired session, the middleware sends `redirect` to Login. It builds the destination from the runtime `ELEARNING_FRONT_URL` plus the requested path and query, never from the internal ingress host. `/logout` deliberately omits `redirect` to avoid a sign-out loop. Without a valid public URL, Login uses its default Projects destination.

Values below are local examples or explicitly described behavior, not production credentials.

| Variable or precedence | Example / stated fallback | Purpose |
| --- | --- | --- |
| `BFF_ELEARNING_BASE_URL` → `ELEARNING_BFF_URL` → `NEXT_PUBLIC_BFF_ELEARNING_BASE_URL` | http://localhost:4006 | Left-to-right proxy precedence; configure an HTTP(S) URL explicitly. Missing or invalid configuration returns an uncached 503 without contacting an upstream. |
| `BFF_CONTRACT_DIR` | ../BFF_Elearning/contracts | BFF contract directory for synchronization and checking scripts. |
| `COOKIE_DOMAIN` | — | Domain of the `accessToken` cookie cleared by the middleware (expired session, `/logout`); keep it consistent with Login. |
| `ADMINISTRATION_FRONT_URL` | — | Navigation destination; see the source file that reads it. Variables injected by `next.config.ts` or prefixed `NEXT_PUBLIC_` are public and consumed at build time. |
| `CALENDAR_FRONT_URL` | — | Navigation destination; see the source file that reads it. Variables injected by `next.config.ts` or prefixed `NEXT_PUBLIC_` are public and consumed at build time. |
| `ELEARNING_FRONT_URL` | — | Navigation destination; see the source file that reads it. Variables injected by `next.config.ts` or prefixed `NEXT_PUBLIC_` are public and consumed at build time. |
| `EMAIL_FRONT_URL` | — | Navigation destination; see the source file that reads it. Variables injected by `next.config.ts` or prefixed `NEXT_PUBLIC_` are public and consumed at build time. |
| `FILES_FRONT_URL` | — | Navigation destination; see the source file that reads it. Variables injected by `next.config.ts` or prefixed `NEXT_PUBLIC_` are public and consumed at build time. |
| `LOGIN_FRONT_URL` | — | Navigation destination; see the source file that reads it. Variables injected by `next.config.ts` or prefixed `NEXT_PUBLIC_` are public and consumed at build time. |
| `MESSAGE_FRONT_URL` | — | Navigation destination; see the source file that reads it. Variables injected by `next.config.ts` or prefixed `NEXT_PUBLIC_` are public and consumed at build time. |
| `PROJECT_FRONT_URL` | — | Navigation destination; see the source file that reads it. Variables injected by `next.config.ts` or prefixed `NEXT_PUBLIC_` are public and consumed at build time. |

Inside a container, `localhost` refers to that container. Use the BFF service DNS name on the Docker network or a reachable host address. Compose files sometimes include other services and legacy settings; check effective URLs and ports before using them.

## Routes and data contract

Inventory extracted from `contracts/openapi.json`. Replace brace parameters with real identifiers. Detailed types, required fields, responses and any examples are defined in that contract; table statuses are the declared statuses, not an exhaustive list of transport or validation errors.

These data paths are exposed at the same origin through the proxy; Next.js pages are separate. `/openapi.json` and `/swagger.json` are also forwarded. Open the `/docs` Swagger UI directly on the BFF.

| Method | Path | Declared body | Declared statuses |
| --- | --- | --- | --- |
| GET | `/health` | — | 200 |
| GET | `/check_apis` | — | 200, 502 |
| POST | `/elearning/admin/courses` | application/json | 201, 400, 401, 403, 409 |
| PATCH | `/elearning/admin/courses/{courseId}` | application/json | 200, 400, 401, 403, 404 |
| DELETE | `/elearning/admin/courses/{courseId}` | — | 200, 401, 403, 404 |
| GET | `/elearning/catalog` | — | 200, 400, 500 |
| POST | `/elearning/courses/{courseId}/contents/{contentId}/complete` | application/json | 200, 400, 404, 422, 500 |
| GET | `/elearning/profile` | — | 200, 500 |
| PATCH | `/elearning/profile` | application/json | 200, 400, 500 |
| POST | `/elearning/courses/{courseId}/rating` | application/json | 200, 400, 404, 500 |
| POST | `/elearning/courses/{courseId}/start` | application/json | 200, 400, 404, 422, 500 |

### Pages

| Page | Source |
| --- | --- |
| `/` | [src/app/page.tsx](../../src/app/page.tsx) |
| `/profile` and subpaths | [src/middleware.ts](../../src/middleware.ts) redirects to Settings |

`/logout` has no page: the middleware clears the `accessToken` cookie and redirects to Login.

## Session, permissions and errors

The front reaches a single service, BFF_Elearning, which resolves the session (through BFF User) on every `/elearning/*` route; the current user comes from its responses (`user`). On a 401, or on logout, the front removes only the known primary/legacy JWT storage keys and navigates to `/logout`, preserving unrelated browser data. The BFF's published contract has no logout route (see `BFF.md`), so the session is not revoked server-side before it expires. Ordinary `requestBff` calls neither read nor migrate localStorage JWTs (MAIR-410). The unchanged generic proxy uses an explicit caller Bearer header or, when absent, the current `accessToken` cookie. Missing cookies and real service refusals are not turned into successes. Business permissions remain those of the BFF and its sources. GET logout remains unchanged.

`requestBff` uses `redirect: "manual"`. An `opaqueredirect` is handled before
accessing status, headers or body: reload the current document once per Location
object, never the data endpoint. The existing middleware constructs the Login
URL and public return path/query. The original call rejects with a typed307,
without retry/replay. AbortSignal is checked before/after fetch and body parsing;
real401 remains available to the existing catalogue action logout handler,
400/403/503 remain typed errors. Tests model opaque redirects only for manual
fetches that actually encounter the real middleware, preserving follow-mode
CORS failures and the published contract allowlist. No server-auth certification.

The generic proxy returns 400 for an invalid path, 404 for a path outside the contract, 405 for a disallowed method and 502 when the service is unreachable or times out. Upstream responses are preserved, including empty 204/205/304 bodies.

Every response carries `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Resource-Policy`, `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy` (`next.config.ts`), and `X-Powered-By` is disabled. For authenticated requests, [src/middleware.ts](../../src/middleware.ts) adds a `Content-Security-Policy` with a per-request nonce, which Next.js applies to its scripts. Pages are therefore rendered on demand (`dynamic = "force-dynamic"` in the layout). Stylesheets are limited to the origin and the nonce; only `style` attributes rendered by components are allowed through `style-src-attr 'unsafe-inline'`, and `next dev` also allows `'unsafe-eval'`. Any new external resource (image, font, API called from the browser) must be added to the policy in `src/lib/content-security-policy.ts`.

## Synchronization and verification

The front only consumes published `X.Y.Z` releases of BFF_Elearning (never a branch or a `0.0.0-dev`/`staging` version), currently **0.4.0**. To move to a new release, bump the contract package, copy the contract from the same tag and regenerate the types:

```bash
npm install --save-dev --save-exact @mairie360/bff-elearning-openapi@X.Y.Z
git -C ../../BFFs/BFF_Elearning show vX.Y.Z:contracts/openapi.json > contracts/openapi.json
npm run contracts:generate
npm run contracts:check
npm test
npm run lint
npm run build
```

`contracts:generate` regenerates `src/contracts/bff.d.ts` from the committed copy; `contracts:check` checks those types and, with `BFF_CONTRACT_DIR`, compares against a BFF checkout (which must then be on the published tag). The isolated stacks use the published image `ghcr.io/mairie360/bff-elearning:0.4.0` (`BFF_ELEARNING_IMAGE`). `test:contracts` runs every Node test (`npm test` does the same with coverage, 60% minimum on lines, branches and functions).

### Contract-driven unit tests

The browser reaches BFF E-learning only through [src/lib/elearning-api.ts](../../src/lib/elearning-api.ts): paths, methods, parameters, bodies and responses are typed from `src/contracts/bff.d.ts`, so an operation missing from the contract does not compile. Catalogue and profile logic lives in `src/features/elearning/catalogActions.ts` and `profileActions.ts`, which the React components only wire to their state.

- `tests/network-boundary.test.cjs` scans `src/` (TypeScript AST): `fetch` is only allowed in `bff-client.ts` (paths built by `elearning-api.ts`) and `bff-proxy.ts`, whose only target is `configuredBffUrl()`; no other HTTP client or network API.
- `tests/elearning.bff-mocks.test.cjs` runs the real code end to end: browser `fetch` → real middleware → route handler picked like the App Router → proxy → mock BFF E-learning served over HTTP, the only reachable service. The mock is driven by the published `@mairie360/bff-elearning-openapi` package (orval output): it rejects paths, methods, parameters and bodies missing from the contract and validates its success responses; orval does not type errors, so error replies go through `errorReply`, which validates the body against `ApiError`. Any call from the browser to another origin, or from the server to another service, fails the test, and every consumed operation must be exercised.
- `tests/bff-contracts.test.cjs` checks that the package is a pinned `X.Y.Z` release, that `contracts/openapi.json` declares exactly its operations, that `elearning-api.ts` calls the consumed operations, that the catch-all proxy is the only route handler and that fixtures conform.

The shared helpers `tests/support/openapi-contract.ts`, `contract-mock-server.ts` and `orval-contract.ts` are copied verbatim from the BFFs (`BFFs/BFF_Elearning/tests/support`); keep the copies identical.

The type generator is pinned to `openapi-typescript@7.10.1` in `scripts/contracts.mjs` and runs through npm. For documentation-only changes, check links, accuracy in both languages and `git diff --check`; do not regenerate contracts without changing their source.

## CI/CD and Docker execution

The `contracts.yml` job uses Node.js 24 and commit-pinned checkout/setup-node actions (v7). It runs on pushes, pull requests and manual dispatch; it installs with `npm ci`, checks contracts and runs the associated tests.

`cicd.yml` calls `mairie360/CICD/.github/workflows/frontend-cicd.yml@v4.0.3`, with `cicd_version: v4.0.3` and `node_version: "24.21.0"`. Only CODECOV_TOKEN and N8N_WEBHOOK_SECRET are passed explicitly. The required legacy status runs real blocking Semgrep and Gitleaks scans. Reusable steps and GitHub environments determine actual checks, publications and deployments.

The Dockerfile defaults to `NODE_VERSION=24.21.0`, pins the official Bookworm-slim digest and uses the Next.js `standalone` build with a non-root runtime; the image command is `["node", "server.js"]`. The locked install requires an ephemeral BuildKit secret, not a credential build argument. Image ports and Compose mappings can differ from the local port suggested above. This source-level policy does not certify a built or deployed image.

Before running Docker, check service variables, build secrets and networks in the repository files. Green CI validates its jobs; it does not prove business-service availability in a remote environment.

## Troubleshooting

Associated BFF diagnostics: If the catalogue rejects the session, check BFF_Elearning and its BFF User dependency. Progress disappearing after a restart or between instances is a consequence of the current in-memory design. Distinguish catalogue fixtures from the persistent data expected in a future implementation.

For a proxy error, compare the path and method with the inventory, then check the BFF URL and session. For a 401 after navigating between modules, check the `accessToken` cookie, its domain and session resolution by BFF_Elearning. A 404 for a requirement described in `BACKEND.md` may refer to a feature that is only proposed.

## Repository reference

- [src/app/page.tsx](../../src/app/page.tsx)
- [src/features/elearning/ElearningModule.tsx](../../src/features/elearning/ElearningModule.tsx)
- [src/middleware.ts](../../src/middleware.ts)
- [src/lib/bff-proxy.ts](../../src/lib/bff-proxy.ts)
- [src/app/[...path]/route.ts](../../src/app/%5B...path%5D/route.ts)
- [src/lib/auth-session.ts](../../src/lib/auth-session.ts)
- [src/lib/elearning-api.ts](../../src/lib/elearning-api.ts)
- [src/features/elearning/catalogActions.ts](../../src/features/elearning/catalogActions.ts)
- [src/features/elearning/profileActions.ts](../../src/features/elearning/profileActions.ts)
- [tests/elearning.bff-mocks.test.cjs](../../tests/elearning.bff-mocks.test.cjs)
- [tests/network-boundary.test.cjs](../../tests/network-boundary.test.cjs)
- [tests/bff-contracts.test.cjs](../../tests/bff-contracts.test.cjs)
- [contracts/openapi.json](../../contracts/openapi.json)
- [src/contracts/bff.d.ts](../../src/contracts/bff.d.ts)
- [scripts/contracts.mjs](../../scripts/contracts.mjs)
- [package.json](../../package.json)
- [.github/workflows/contracts.yml](../../.github/workflows/contracts.yml)
- [.github/workflows/cicd.yml](../../.github/workflows/cicd.yml)
- [Dockerfile](../../Dockerfile)
- [docker-compose.yml](../../docker-compose.yml)

Historical supplements: [BFF.md](../../BFF.md), [BACKEND.md](../../BACKEND.md). Proposed requirements must remain distinct from implemented behavior.
