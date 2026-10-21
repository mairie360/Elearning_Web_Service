# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Next.js 16 (App Router, React 19, TypeScript, Tailwind 4) web service for Mairie360 hosting the e-learning module (catalog, course progress, admin course management). The browser only talks to this app's own origin; the Next.js server forwards data calls to **BFF_Elearning**, the only service this front may reach (it resolves sessions through BFF User on its side). Only published packages of that BFF are consumed (a release `X.Y.Z`, a `0.0.0-dev.<sha40>` package or, since MAIR-600, a `0.0.0-staging.<sha40>` package): never a BFF branch/checkout. UI building blocks come from the private package `@mairie360/lib-components`. Docs are bilingual: `docs/en|fr/module.md` (functional) and `docs/en|fr/technical.md` (routes, config, troubleshooting) — update both languages together. `BFF.md` / `BACKEND.md` contain *proposed* backend needs; the OpenAPI snapshot is the source of truth for implemented behaviour.

## Commands

Private `@mairie360/*` packages come from GitHub Packages: `.npmrc` reads `NODE_AUTH_TOKEN`, so export a token with `read:packages` before installing or building images.

```bash
npm ci
npm run dev -- --port 5006         # needs BFF_Elearning reachable, see "BFF URL" below
npm run build && npm run start -- --port 5006
npm run lint                             # ESLint on src/
npm test                                 # node:test on tests/*.test.cjs, coverage >= 60% lines/branches/functions, lcov in coverage/lcov.info (what CI runs)
npm run test:contracts                   # same tests, no coverage
node --test --test-name-pattern="<name>" tests/elearning.bff-mocks.test.cjs   # single test
```

Tests are plain CommonJS `node:test` files matching `tests/*.test.cjs`. No Jest/Vitest, no DOM. They `require('./support/load-typescript.cjs')` first: it installs a `require.extensions['.ts']` hook (`typescript.transpileModule` with inline source maps, which `--enable-source-maps` in `npm test` needs so coverage lines match the `.ts` files) and resolves the `@/*` alias, so real route handlers load unchanged. Coverage only counts files that some test loads: the `.tsx` modules are loaded by `tests/elearning-module-html.bff-mocks.test.cjs` only, so keep logic out of them (see `catalogActions.ts` / `profileActions.ts`).

### Contract-driven tests (mock BFF)

Same approach as the BFFs' `*.upstream-mocks.test.ts`. `tests/support/openapi-contract.ts`, `contract-mock-server.ts` and `orval-contract.ts` are **verbatim copies** of `../../BFFs/BFF_Elearning/tests/support/`, so keep them identical.

- `tests/support/mocked-front.ts` starts a single `ContractMockServer`, BFF E-learning. It is rebuilt from the published devDependency `@mairie360/bff-elearning-openapi` (orval output, exact version). It also installs `FrontRuntime` (`tests/support/front-runtime.ts`), which replaces `global.fetch`. A browser-side call must target the front origin and goes through the real `middleware` (with its matcher), then the `src/app/**/route.ts` handler that the App Router would pick. A server-side call (inside a handler, tracked with `AsyncLocalStorage`) may only target that mock. After each test, any contract violation or out-of-scope call fails it. `BFF_ELEARNING_BASE_URL` is reset per test. `runtime.navigate(path)` runs only the middleware, for page navigations such as `/logout`.
- Mocked success replies are validated against the package contract. Orval only types success statuses, so error replies go through `errorReply(status, code, message)`. It marks them `outOfContract` but validates the body against the `ErrorResponse` schema of `contracts/openapi.json` (`{ error: { code, message, details } }`, the envelope shared by every BFF; scenario codes are mapped to the published enum by `fixtures.apiError`).
- `tests/elearning-module-html.bff-mocks.test.cjs` renders the real `ElearningModule` (behind `src/app/page.tsx`) inside the shared `AppShell` through `tests/support/server-view.cjs` (`react-dom/server` with hook state kept between passes, same file in every front, see `../CLAUDE.md`) on `useMockedFront`: loading state, catalogue, BFF-supplied user/footer, retry after an error, course start, refused mutation, 401 → `/logout`, active-module navigation and Settings profile access are asserted on the HTML. The loader transpiles `.tsx` with `jsx: react-jsx`.
- `tests/elearning.bff-mocks.test.cjs` asserts in `after()` that every operation listed in `CONSUMED` was exercised. `tests/bff-contracts.test.cjs` enforces several things:
  - the package is an accepted exact version (`scripts/contract-version.mjs`: a release `X.Y.Z`, a `0.0.0-dev.<sha40>` dev package of BFF_Elearning `main` or, since MAIR-600, the `0.0.0-staging.<sha40>` staging package of that commit; `0.0.0-staging.<short sha>` and ranges are refused) and the only `bff-*-openapi` dependency;
  - `contracts/openapi.json` declares exactly the package's operations;
  - every `docker-compose*.yml` uses the `bff-elearning` image built from the pinned commit (`X.Y.Z`, `dev-<sha7>` for a dev package, or `staging-<sha7>` for a staging package) and release or `dev-<sha7>` tags for the other BFF images;
  - the catch-all is the only route handler (no adapter to another BFF);
  - `src/lib/elearning-api.ts` calls the consumed operations only through the generated client (`bffElearning`, built in `bff-client.ts` from `getBffElearning` of `@mairie360/bff-elearning-openapi` with an axios adapter that delegates to `requestBff`); it holds no path string.

  `tests/network-boundary.test.cjs` walks the TypeScript AST of `src/`. It only allows `fetch` and `axios` in `bff-client.ts` (and `fetch` in `bff-proxy.ts`), and `forwardToBff` only with `configuredBffUrl()`. **Adding a BFF call means:** take a published release that declares it, add a function in `elearning-api.ts` that calls the generated operation, then update the operation lists in the two test files.

### OpenAPI contract

`contracts/openapi.json` is BFF_Elearning's contract **as of a published package**: a release tag, or, while no release is cut, the `main` commit whose `0.0.0-dev.<sha40>` package is pinned (MAIR-509), or whose `0.0.0-staging.<sha40>` package is pinned once that commit is released on staging (MAIR-600, preferred on a staging release for readability). It is the proxy allowlist, and `src/contracts/bff.d.ts` is generated from it (`openapi-typescript@7.10.1`, pinned in `scripts/contracts.mjs`). Never hand-edit either file. The devDependency `@mairie360/bff-elearning-openapi` (same version, used only by tests) is the published artifact both are checked against. Don't use `contracts:sync` from a BFF checkout: `BFFs/BFF_Elearning` usually sits on an unreleased branch that is ahead of the last release. To bump:

```bash
npm install --save-prod --save-exact @mairie360/bff-elearning-openapi@<version>   # a release X.Y.Z, a published 0.0.0-dev.<sha40> or 0.0.0-staging.<sha40> (MAIR-600)
git -C ../../BFFs/BFF_Elearning show <vX.Y.Z or sha40>:contracts/openapi.json > contracts/openapi.json
npm run contracts:generate  # regenerate types from the snapshot
npm run contracts:check     # fail if types are stale
```

Then move `BFF_ELEARNING_IMAGE` defaults in every `docker-compose*.yml` to the image built from the same commit (`X.Y.Z`, `dev-<sha7>`, or `staging-<sha7>` for a staging package), which the tests enforce. The stacks also pin dev images of BFF User, Core API, E-learning API and the database: the dev Liquibase needs `-Dallow_template_admin=true`, the database enforces argon2id hashes in `init-test.sql`, the dev APIs need `JWT_ALLOW_WEAK_SECRET` for the shared test secret and `RATE_LIMIT_ENABLED=false` (plus a lifted `RATE_LIMIT_PER_SECOND` / `RATE_LIMIT_BURST` on E-learning API, whose per-IP token bucket otherwise answers 429 under load), BFF_Elearning needs `JWT_SECRET` at startup and BFF User `AUTH_RATE_LIMIT_ENABLED=false` for the ZAP scan. The published contract has no logout route. A logout endpoint is a proposed need in `BFF.md`. `contracts:*` run `npm exec` on `openapi-typescript`, so they need network access.

## Figma mockup

Figma is the source of truth: design and agree any UI change on **Mairie360 – Elearning_Web_Service** (https://www.figma.com/design/NqcDzK5hEfDIBEAx9xJE0o) first, then code it. Shared components come from the lib mockup https://www.figma.com/design/T7vetUfuzPEXk5TxjHRiO2 and are instantiated, never redrawn.

## Component tree convention

Every component under `src/components/` is a **folder named after it**, and the folder tree
mirrors the composition tree:

```
Name/
  index.ts          # exports the component (and the helpers it owns)
  Name.tsx          # imports ONLY its direct sub-components, through their index.ts
  Name.test.tsx     # its tests, co-located (vitest + jsdom)
  components/       # one such folder per direct sub-component, recursively
```

- A component needs nothing but the `index.ts` of its direct sub-components: `Name.tsx` imports
  `./components/Sub`, never `./components/Sub/Sub` nor a sub-sub-component. Leaves are folders
  too (without `components/`).
- Helpers a component owns (models, hooks, `*.ts`) sit beside it and are exported by its
  `index.ts`; a helper shared by two siblings sits in their closest common ancestor.
- A big component is acceptable only for a technical reason stated in a comment; otherwise
  split it so that each visible part is a component and what composes it a sub-component.
- Page and journey tests stay in `tests/`; per-component tests are the co-located
  `Name.test.tsx`. `tests/component-tree-convention.test.cjs` enforces the folder, the index,
  the co-located test and the index-only imports.

## Front tickets and the Figma mockup

A front ticket (Jira + GitHub issue + PR) **must link the Figma frame that serves as the
example** of what is being built or changed. Without that link the ticket cannot be worked
on, unless the change does not affect the display (tooling, tests, proxy, contracts…). Update
and agree the mockup first, then code it: the sync direction is Figma → code.

## Architecture

- **E-learning component tree (MAIR-607/608)** — `src/components/ElearningModule/` is the page root (`ElearningModule.tsx`, `module-model.ts`, `use-resource-download.ts`) and follows the component tree convention above: `components/{CatalogFeedbackStack, LogoutErrorNotice, CatalogLoading, CourseManagementNotice, MissingCourseNotice, CourseReviewPanel, ElearningCatalog}`, with `ElearningCatalog` (formerly `@mairie360/lib-components/elearning`, removed because Elearning was its only consumer) holding `CatalogHeader`, `CatalogFilters`, `ManagedCourseCard`, `CatalogEmptyState`, `ElearningAdminStats`, `SelectedCourseDetails` (→ `ElearningCourseDetailsModal` → facts, chapters, progress, media) and `ElearningCourseFormModal` (→ general/presentation/program sections → chapter and content editors). Page logic that is not a component stays in `src/features/elearning/*.ts` (`catalogActions`, `bffCapabilities`, `catalogFilters`, `catalogQuery`, `learnerFeatures`, `profileActions`); `src/app` imports `@/components/ElearningModule`. Component tests are the co-located `Name.test.tsx` (vitest + jsdom, `npm run test:components`); Node stays the coverage authority. `tests/lib-business-ownership.test.cjs` forbids any import of a removed library entry and checks the installed lib has no `./elearning` export.
- **Shell from the lib (MAIR-578)** — `src/components/ElearningModule/ElearningModule.tsx` renders `AccessibleShell` from `@mairie360/lib-components/shell`; `src/lib/front-urls-provider.tsx` uses the lib `configureSidebarCookieDomain`. No local `accessible-shell.tsx`, `desktop-navigation.tsx` or `sidebar-preference.ts` (pinned by `tests/lib-shell-adoption.test.cjs`).

- **Shared shell and profile routing (MAIR-180)** — `ElearningModule` uses the
  published library `AppShell` with BFF-supplied user, role and footer. It reads
  active frontend destinations at runtime and excludes archived modules. The
  middleware redirects authenticated legacy `/profile` URLs to validated
  `SETTINGS_FRONT_URL`; invalid or missing destinations return uncached 503.
  No local profile UI or demo identity is rendered. BFF session contracts are
  unchanged. Deploy only after a published library version exports `AppShell`.

- **Contract-gated catch-all proxy** — `src/app/[...path]/route.ts` exports `proxyBffRequest` (`src/lib/bff-proxy.ts`) for every method. It matches the path against `contracts/openapi.json` `paths` (brace segments are wildcards): unknown path → 404, method not declared → 405 with `Allow`, `.`/`..` segments → 400; `/openapi.json` and `/swagger.json` are always forwarded. **A BFF route is therefore reachable from the browser only once the synced contract declares it.**
- **`forwardToBff`** strips hop-by-hop headers and the `cookie` header, turns the `accessToken` cookie into `Authorization: Bearer` when no Authorization header is present, keeps the query string and raw (binary) body, uses `redirect: 'manual'`, a 15 s timeout and `Cache-Control: no-store`, preserves upstream status/headers (including `Set-Cookie`, empty 204/205/304 bodies) and returns a controlled 502 JSON error when the BFF is unreachable. `tests/proxy.test.cjs` pins this behaviour.
- **BFF URL** — `BFF_ELEARNING_BASE_URL` → `ELEARNING_BFF_URL` → `NEXT_PUBLIC_BFF_ELEARNING_BASE_URL`; resolved at request time on the server. Missing or invalid configuration returns an uncached 503 without contacting an upstream; configure the URL explicitly for local development too.
- **Session and logout, single BFF** — there is no `src/app/api` adapter and no BFF User call. The current user comes from BFF_Elearning responses (`user.isAdmin`, etc.). On a 401 or on logout, `logout()` (`src/lib/auth-session.ts`) clears `localStorage` and navigates to `/logout`. There, the middleware clears the `accessToken` cookie and redirects to Login. The session isn't revoked server-side, because the published BFF_Elearning contract has no logout route.
- **Auth gate** — `src/middleware.ts` redirects every page request (matcher excludes `/api` and the BFF contract roots (their own 401 is relayed), `/_next/*` and paths with a dot) to `LOGIN_FRONT_URL` when the request is `/logout`, the `accessToken` cookie is missing or its JWT `exp` is past, clearing the cookie on `COOKIE_DOMAIN`. It only decodes the payload; signature validation is the BFF/Core's job. Note that the catch-all data routes (e.g. `/health`) also pass through it. For authenticated requests it also sets a per-request nonce `Content-Security-Policy` (built in `src/lib/content-security-policy.ts`, forwarded to Next.js via request headers), which is why `src/app/layout.tsx` forces dynamic rendering: a prerendered page would carry no nonce and its scripts would be blocked. Any new external origin (images, fonts, browser-side API calls) must be added to that policy.
- **Client calls** — `src/lib/elearning-api.ts` is the only browser entry point to BFF E-learning. Its `callBff(method, template, { path, body })` is typed from `src/contracts/bff.d.ts`, so a path/method missing from the contract, or a wrong body, does not compile. It builds the URL with `contractUrl` (encoded path params; a `/` inside an id is refused with 400 by the proxy) and calls `requestBff` (`src/lib/bff-client.ts`), which sends same-origin requests and parses `{ error: { message } }` / `{ message }` bodies into typed errors. Ordinary requests never read, migrate or inject localStorage JWTs (MAIR-410); the unchanged proxy uses the current cookie unless the caller explicitly provides Authorization. The legacy token helpers remain only for existing compatibility/targeted logout cleanup. Manual redirects are handled as opaque before reading status/headers/body; reload the current protected document once with path/query intact, never the data endpoint, and never replay a refused mutation. Check AbortSignal before/after fetch and parsing. Preserve real401 catalogue logout and distinct400/403/503 errors, explicit headers/options and unrelated browser data. `session-navigation.bff-mocks.test.cjs` exercises the real middleware/proxy with the published contract; `front-runtime.ts` exposes opaque responses only in manual mode. This slice does not implement server revocation or change GET logout or middleware destinations.
- `src/app/page.tsx` mounts `ElearningModule`, which wires React state to `createCatalogActions` (`catalogActions.ts`: load, start, complete, rate and admin CRUD, logout on 401, reload after mutations) and passes runtime frontend destinations to the shared AppShell. lib-components types the admin form's `statusValue` as a free string, so `toContractCourse` drops values outside the contract enum before sending. `bffCapabilities.ts` (MAIR-513) says what the pinned BFF serves: with `pinnedBffCapabilities` (default of `ElearningModule`) the rating and admin callbacks are not passed to `ElearningCatalog` (the component hides a control without a callback), `completed: false` is refused locally with `CONTENT_UNCOMPLETION_UNAVAILABLE_MESSAGE` and administrators see `COURSE_MANAGEMENT_UNAVAILABLE_MESSAGE`; tests of those flows render `ElearningModule` with `fullCatalogCapabilities`. `requestBff` turns any 501 into `NOT_IMPLEMENTED_MESSAGE` (French).
- `next.config.ts` sets `output: 'standalone'` (required by the Dockerfile), `poweredByHeader: false` and static security headers on every route (`tests/security-headers.test.cjs` pins them, and the ZAP baseline fails without them), and inlines the `*_FRONT_URL` values at **build time** (defaults `https://<module>.dev.mairie360-eip.fr/`), so changing them requires a rebuild.

## CI/CD

- `.github/workflows/cicd.yml` calls `mairie360/CICD/.github/workflows/frontend-cicd.yml` pinned to a full commit SHA (`package_name: elearning-front`, `node_version: "24.21.0"`, `cicd_version` set to the same SHA). The `@ref` pin and `cicd_version` carry the same SHA followed by a `# vX.Y.Z` comment; Renovate bumps them together with `dev-dependency-exception.yml` (`renovate.json`), and `tests/cicd-pin.test.cjs` checks they agree. Pass only the declared secret references: CODECOV_TOKEN, N8N_WEBHOOK_SECRET, and the release-journal ones (ANTHROPIC_API_KEY, RELEASE_APP_ID, RELEASE_APP_PK, used by CICD to commit `RELEASE_JOURNAL.md` on `main` after each release). Preserve the real blocking required Semgrep/Gitleaks job and the shared high/critical npm audit gate when reconciling main; a failed audit is not a waiver. Check actual run/job outcomes before claiming build, publication or deployment. Keep the committed scoped registry/npm policy; never read or publish credential values. It runs on `pull_request`, `workflow_dispatch` and on `push` to `main` only, so a PR branch no longer runs the pipeline twice (MAIR-436). The workflow token is read-only by default (`permissions: contents: read`); only the `CICD` job gets `contents`/`packages`/`id-token: write`, the cap the reusable workflow needs for its release jobs (dev image push + cosign signature, prod tag). `tests/workflow-permissions.test.cjs` (identical in the eight fronts) pins both rules.
- `.github/workflows/contracts.yml` (exact Node 24.21.0) runs `contracts:check` and `test:contracts` on every PR and on pushes to `main`.
- `Dockerfile`: exact official Node 24.21.0 Bookworm-slim digest, locked install using a required ephemeral BuildKit secret and readonly npm-policy mount (never a token build argument), standalone output, non-root `nextjs` user, `PORT=5006`, `CMD node server.js`.
- `.releaserc.json`: semantic-release on `main` only, producing a GitHub release. Nothing is published to npm.

## Docker dev stack

`docker-compose.yml` is for local development, not CI. Without a profile it only starts `elearning-front`, built from `development.Dockerfile` (`npm run dev`, token passed as a BuildKit secret, `docker compose watch` syncs `./src`). It exposes container port 3000 as host `5006` and expects BFF_Elearning on the host (`BFF_ELEARNING_BASE_URL` defaults to `host.docker.internal:4006`). Postgres, Liquibase, Redis, the ELearning API and the BFF are behind `--profile legacy-stack`. That profile has no Core API (it is commented out), so it does not give you a working authenticated stack. Use the security/performance compose files for that.

## Isolated security & performance tests

Same pattern as the APIs/BFFs, adapted to a web front. Not part of `npm test`; they need Docker and `NODE_AUTH_TOKEN` (the front image is built from the production `Dockerfile`).

- `./security_test.sh` → `docker-compose-security.yml`: full isolated upstream stack (Postgres + Liquibase + `init-test.sql` seed, Redis, Core API, ELearning API, BFF User and the `bff-elearning` image pinned in the Compose file; published GHCR images, versions overridable via `*_IMAGE` env vars) + this front (which only receives `BFF_ELEARNING_BASE_URL`), then `zap-baseline.py` (classic spider + AJAX spider `-j`, which renders the page in a headless browser so the BFF contract routes fetched by the bundle are scanned too, + passive scan) authenticated with a static `accessToken` cookie. Any WARN/FAIL alert not set to IGNORE in `.zap/rules.tsv` fails the run; since MAIR-516 the server-error rule (100000) is no longer ignored, so a 5xx relayed by the proxy fails the scan.
- `./performance_test.sh` → `docker-compose-performance.yml`: same stack + k6 running `load-test.js`: a `reads` scenario (pages, `/health`, `/elearning/*` through the proxy, the paths the page uses) and a `writes` scenario (MAIR-516, `PATCH /elearning/profile` alternating the phone (the only persisted field, in E.164 form), then `POST …/courses/{id}/start` and `POST …/contents/{contentId}/complete` on the course `init-test.sql` enrols the user in (one chapter, one PDF content; the completion is an idempotent upsert upstream); administration and ratings are skipped while the pinned BFF answers 501), both with a JWT minted from `JWT_SECRET`; strict status checks and per-endpoint thresholds fail the run.
- Test user is id 2 (seeded in `init-test.sql`); every service shares `JWT_SECRET=b"secret"`. `TARGET_IMAGE` lets the stacks reuse a pre-built front image. These files are excluded from the image by `.dockerignore`.

## Pull request reviewers

Every PR requests a review from the whole team, minus its author: `CarolinHugo`, `LAURETbenjamin`, `MathTek` and `Quentintnrl` (`gh pr create … --reviewer CarolinHugo,LAURETbenjamin,MathTek`). `.github/CODEOWNERS` makes GitHub request them automatically as well.

## Promotion to staging and prod (MAIR-494)

A push to `main` only releases dev (`cicd.yml` stops at `release-dev`). Staging and prod are manual:
`gh workflow run promote-staging.yml -R mairie360/Elearning_Web_Service` (main's newest commit) or `gh workflow run promote-staging.yml -R mairie360/Elearning_Web_Service -f sha=SHA` (a given commit), then the same with `promote-prod.yml`
(environments `Staging` / `Prod`). Staging refuses a commit without `dev-<sha>` and a green main run, and runs
the ZAP and k6 stacks on that image; prod refuses one without `staging-<sha>` and tags the version semantic-release computes
for that commit. `cicd.yml`, `promote-staging.yml` and `promote-prod.yml` pin the same mairie360/CICD release.
