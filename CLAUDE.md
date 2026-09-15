# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Next.js 15 (App Router, React 19, TypeScript, Tailwind 4) web service for Mairie360 hosting the e-learning module (catalog, course progress, admin course management, profile). The browser only talks to this app's own origin; the Next.js server forwards data calls to **BFF_Elearning**, the only service this front may reach (it resolves sessions through BFF User on its side). Only published `X.Y.Z` releases of that BFF are consumed, currently **0.3.0**: never a BFF branch/checkout or a `0.0.0-dev`/`staging` build. UI building blocks come from the private package `@mairie360/lib-components`. Docs are bilingual: `docs/en|fr/module.md` (functional) and `docs/en|fr/technical.md` (routes, config, troubleshooting) — update both languages together. `BFF.md` / `BACKEND.md` contain *proposed* backend needs; the OpenAPI snapshot is the source of truth for implemented behaviour.

## Commands

Private `@mairie360/*` packages come from GitHub Packages: `.npmrc` reads `NODE_AUTH_TOKEN`, so export a token with `read:packages` before installing or building images.

```bash
npm ci
npm run dev -- --port 5006         # needs BFF_Elearning reachable, see "BFF URL" below
npm run build && npm run start -- --port 5006
npm run lint                             # next lint (next/core-web-vitals + next/typescript)
npm test                                 # node:test on tests/*.test.cjs, coverage >= 60% lines/branches/functions, lcov in coverage/lcov.info (what CI runs)
npm run test:contracts                   # same tests, no coverage
node --test --test-name-pattern="<name>" tests/elearning.bff-mocks.test.cjs   # single test
```

Tests are plain CommonJS `node:test` files matching `tests/*.test.cjs`. No Jest/Vitest, no DOM. They `require('./support/load-typescript.cjs')` first: it installs a `require.extensions['.ts']` hook (`typescript.transpileModule` with inline source maps, which `--enable-source-maps` in `npm test` needs so coverage lines match the `.ts` files) and resolves the `@/*` alias, so real route handlers load unchanged. Coverage only counts files that some test loads: `.tsx` components are never loaded, so keep logic out of them (see `catalogActions.ts` / `profileActions.ts`).

### Contract-driven tests (mock BFF)

Same approach as the BFFs' `*.upstream-mocks.test.ts`. `tests/support/openapi-contract.ts`, `contract-mock-server.ts` and `orval-contract.ts` are **verbatim copies** of `../../BFFs/BFF_Elearning/tests/support/`, so keep them identical.

- `tests/support/mocked-front.ts` starts a single `ContractMockServer`, BFF E-learning. It is rebuilt from the published devDependency `@mairie360/bff-elearning-openapi` (orval output, exact version). It also installs `FrontRuntime` (`tests/support/front-runtime.ts`), which replaces `global.fetch`. A browser-side call must target the front origin and goes through the real `middleware` (with its matcher), then the `src/app/**/route.ts` handler that the App Router would pick. A server-side call (inside a handler, tracked with `AsyncLocalStorage`) may only target that mock. After each test, any contract violation or out-of-scope call fails it. `BFF_ELEARNING_BASE_URL` is reset per test. `runtime.navigate(path)` runs only the middleware, for page navigations such as `/logout`.
- Mocked success replies are validated against the package contract. Orval only types success statuses, so error replies go through `errorReply(status, code, message)`. It marks them `outOfContract` but validates the body against the `ApiError` schema of `contracts/openapi.json`.
- `tests/elearning.bff-mocks.test.cjs` asserts in `after()` that every operation listed in `CONSUMED` was exercised. `tests/bff-contracts.test.cjs` enforces several things:
  - the package is an exact `X.Y.Z` and the only `bff-*-openapi` dependency;
  - `contracts/openapi.json` declares exactly the package's operations;
  - every `docker-compose*.yml` uses `bff-elearning:<package version>`;
  - the catch-all is the only route handler (no adapter to another BFF);
  - `src/lib/elearning-api.ts` (`callBff("method", "template"`) calls the consumed operations.

  `tests/network-boundary.test.cjs` walks the TypeScript AST of `src/`. It only allows `fetch` in `bff-client.ts` and `bff-proxy.ts`, and `forwardToBff` only with `configuredBffUrl()`. **Adding a BFF call means:** take a published release that declares it, add a `callBff` function in `elearning-api.ts`, then update the operation lists in the two test files.

### OpenAPI contract

`contracts/openapi.json` is BFF_Elearning's contract **as of a published release tag**. It is the proxy allowlist, and `src/contracts/bff.d.ts` is generated from it (`openapi-typescript@7.10.1`, pinned in `scripts/contracts.mjs`). Never hand-edit either file. The devDependency `@mairie360/bff-elearning-openapi` (same version, used only by tests) is the published artifact both are checked against. Don't use `contracts:sync` from a BFF checkout: `BFFs/BFF_Elearning` usually sits on an unreleased branch that is ahead of the last release. To bump:

```bash
npm install --save-dev --save-exact @mairie360/bff-elearning-openapi@X.Y.Z   # published releases only
git -C ../../BFFs/BFF_Elearning show vX.Y.Z:contracts/openapi.json > contracts/openapi.json
npm run contracts:generate  # regenerate types from the snapshot
npm run contracts:check     # fail if types are stale
```

Then move `BFF_ELEARNING_IMAGE` defaults in every `docker-compose*.yml` to `X.Y.Z`, which the tests enforce. The published contract has no logout route. A logout endpoint is a proposed need in `BFF.md`. `contracts:*` run `npm exec` on `openapi-typescript`, so they need network access.

## Architecture

- **Contract-gated catch-all proxy** — `src/app/[...path]/route.ts` exports `proxyBffRequest` (`src/lib/bff-proxy.ts`) for every method. It matches the path against `contracts/openapi.json` `paths` (brace segments are wildcards): unknown path → 404, method not declared → 405 with `Allow`, `.`/`..` segments → 400; `/openapi.json` and `/swagger.json` are always forwarded. **A BFF route is therefore reachable from the browser only once the synced contract declares it.**
- **`forwardToBff`** strips hop-by-hop headers and the `cookie` header, turns the `accessToken` cookie into `Authorization: Bearer` when no Authorization header is present, keeps the query string and raw (binary) body, uses `redirect: 'manual'`, a 15 s timeout and `Cache-Control: no-store`, preserves upstream status/headers (including `Set-Cookie`, empty 204/205/304 bodies) and returns a controlled 502 JSON error when the BFF is unreachable. `tests/proxy.test.cjs` pins this behaviour.
- **BFF URL** — `BFF_ELEARNING_BASE_URL` → `ELEARNING_BFF_URL` → `NEXT_PUBLIC_BFF_ELEARNING_BASE_URL` (fallback `http://localhost:4006`); resolved at request time on the server.
- **Session and logout, single BFF** — there is no `src/app/api` adapter and no BFF User call. The current user comes from BFF_Elearning responses (`user.isAdmin`, etc.). On a 401 or on logout, `logout()` (`src/lib/auth-session.ts`) clears `localStorage` and navigates to `/logout`. There, the middleware clears the `accessToken` cookie and redirects to Login. The session isn't revoked server-side, because BFF_Elearning 0.3.0 has no logout route.
- **Auth gate** — `src/middleware.ts` redirects every page request (matcher excludes `/api`, `/_next/*` and paths with a dot) to `LOGIN_FRONT_URL` when the request is `/logout`, the `accessToken` cookie is missing or its JWT `exp` is past, clearing the cookie on `COOKIE_DOMAIN`. It only decodes the payload; signature validation is the BFF/Core's job. Note that the catch-all data routes (e.g. `/health`) also pass through it. For authenticated requests it also sets a per-request nonce `Content-Security-Policy` (built in `src/lib/content-security-policy.ts`, forwarded to Next.js via request headers), which is why `src/app/layout.tsx` forces dynamic rendering: a prerendered page would carry no nonce and its scripts would be blocked. Any new external origin (images, fonts, browser-side API calls) must be added to that policy.
- **Client calls** — `src/lib/elearning-api.ts` is the only browser entry point to BFF E-learning. Its `callBff(method, template, { path, body })` is typed from `src/contracts/bff.d.ts`, so a path/method missing from the contract, or a wrong body, does not compile. It builds the URL with `contractUrl` (encoded path params; a `/` inside an id is refused with 400 by the proxy) and calls `requestBff` (`src/lib/bff-client.ts`), which sends same-origin requests, parses `{ error: { message } }` / `{ message }` bodies into typed errors and, when no Authorization header is set, add a Bearer token stored in `localStorage` (`mairie360.auth.jwt`, see `src/lib/auth-token.ts`); in normal use the proxy relies on the cookie.
- `src/app/page.tsx` mounts `ElearningModule`, `src/app/profile/page.tsx` mounts `ProfileModule`. The components only wire React state to `createCatalogActions` (`catalogActions.ts`: load, start, complete, rate and admin CRUD, logout on 401, reload after mutations) and `loadProfile` (`profileActions.ts`). `appData.ts` holds sidebar items and cross-module navigation. lib-components types the admin form's `statusValue` as a free string, so `toContractCourse` drops values outside the contract enum before sending.
- `next.config.ts` sets `output: 'standalone'` (required by the Dockerfile), `poweredByHeader: false` and static security headers on every route (`tests/security-headers.test.cjs` pins them, and the ZAP baseline fails without them), and inlines the `*_FRONT_URL` values at **build time** (defaults `https://<module>.dev.mairie360-eip.fr/`), so changing them requires a rebuild.

## CI/CD

- `.github/workflows/cicd.yml` calls `mairie360/CICD/.github/workflows/frontend-cicd.yml@v2.3.1` (`package_name: elearning-front`, `node_version: "23"`, `cicd_version: "v2.3.1"`, `secrets: inherit`). The `@ref` pin and `cicd_version` must stay equal; Renovate bumps both together (`renovate.json`). Up to the dev release it runs: `npm ci` → `npm run lint` + `npm audit --audit-level=high` (high/critical advisories block) → `npm run build` → `npm test --if-present` (uploads `coverage/lcov.info` to Codecov) → on `main`, builds `Dockerfile` with `NODE_AUTH_TOKEN` as build-arg and pushes `ghcr.io/mairie360/elearning-front:dev-<sha>` / `dev-latest`. Some jobs set up Node without a registry, so the committed `.npmrc` must keep the `@mairie360` registry + `${NODE_AUTH_TOKEN}` lines.
- `.github/workflows/contracts.yml` (Node 22) runs `contracts:check` and `test:contracts` on every push/PR.
- `Dockerfile`: two-stage `node:<ver>-bookworm-slim` build, standalone output, non-root `nextjs` user, `PORT=5006`, `CMD node server.js`.
- `.releaserc.json`: semantic-release on `main` only, producing a GitHub release. Nothing is published to npm.

## Docker dev stack

`docker-compose.yml` is for local development, not CI. Without a profile it only starts `elearning-front`, built from `development.Dockerfile` (`npm run dev`, token passed as a BuildKit secret, `docker compose watch` syncs `./src`). It exposes container port 3000 as host `5006` and expects BFF_Elearning on the host (`BFF_ELEARNING_BASE_URL` defaults to `host.docker.internal:4006`). Postgres, Liquibase, Redis, the ELearning API and the BFF are behind `--profile legacy-stack`. That profile has no Core API (it is commented out), so it does not give you a working authenticated stack. Use the security/performance compose files for that.

## Isolated security & performance tests

Same pattern as the APIs/BFFs, adapted to a web front. Not part of `npm test`; they need Docker and `NODE_AUTH_TOKEN` (the front image is built from the production `Dockerfile`).

- `./security_test.sh` → `docker-compose-security.yml`: full isolated upstream stack (Postgres + Liquibase + `init-test.sql` seed, Redis, Core API, ELearning API, BFF User and `bff-elearning:0.3.0`; published GHCR images, versions overridable via `*_IMAGE` env vars) + this front (which only receives `BFF_ELEARNING_BASE_URL`), then `zap-baseline.py` (spider + passive scan) authenticated with a static `accessToken` cookie. Any WARN/FAIL alert not set to IGNORE in `.zap/rules.tsv` fails the run.
- `./performance_test.sh` → `docker-compose-performance.yml`: same stack + k6 running `load-test.js` (pages, `/health`, `/elearning/*` through the proxy) with a JWT minted from `JWT_SECRET`; thresholds fail the run.
- Test user is id 2 (seeded in `init-test.sql`); every service shares `JWT_SECRET=b"secret"`. `TARGET_IMAGE` lets the stacks reuse a pre-built front image. These files are excluded from the image by `.dockerignore`.
