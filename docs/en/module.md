# Elearning_Web_Service — Module overview

## Confirmed administration feedback (MAIR-452)

Creation and editing announce success with the canonical title returned by the
existing POST/PATCH response. Deletion announces success only when `deleted` is
true and the response identifies the requested course. Pending/refused writes
never show this success. A later failed catalogue read keeps the confirmation
beside its separate read error; Retry sends GET only. The next mutation clears
the preceding success, while Close dismisses the message without a request or
timer. Keyboard-accessible feedback does not cover author-form retry/cancel controls.

This restores the prototype's visible return, not its optimistic confirmation
before a server response. No data, business counters, backend operation, shared
library, dependency or environment is invented or changed. Resource downloads,
written reviews, uploads, keys and deployed persistence remain separate scopes.

## Reference sidebar presentation (MAIR-180)

The shared navigation keeps the measured prototype's 44px minimum targets and
sidebar shadow, without a local navigation copy. In the mobile drawer, the
sidebar is below the published close control; click, keyboard and focus-return
checks are required alongside catalogue/filter/reader checks. Published data,
permissions and learner actions remain unchanged. The prototype's unsupported
detail/review request and static footer version are not reintroduced. This
presentation slice does not validate resource downloads or deployed persistence.

## Current cookie session (MAIR-410)

Catalogue reads and learner/administrator actions use the current cookie session
through the existing same-origin proxy, without reading or migrating old browser
JWTs (MAIR-410). Stale primary or legacy localStorage values cannot override it.
Real service refusals still log out; only known token keys are removed, preserving
unrelated preferences. When a data call instead receives a middleware redirect,
the current protected page reloads once with its path/query preserved for Login.
Cancelled calls do not navigate and refused mutations are never replayed.
400/403/503 feedback remains distinct. Server revocation, GET logout policy and
durable persistence remain separate unresolved audit findings; integration and
deployed session validation are not implied by local checks.

## Active-module navigation

Desktop and mobile menus omit the archived E-mails and Files modules, matching
the local presentation. The remaining module order and administrator visibility
are unchanged; Settings remains available through the shared AppShell. Attachments
and business documents inside active modules are not removed.

## One account destination

Profile access now opens **Settings**. Existing `/profile` bookmarks and subpaths
redirect to the configured Settings frontend for authenticated visitors. The
sidebar keeps Settings without a duplicate Profile entry. If Settings is not
configured correctly, those bookmarks return an uncached 503; no demo identity
or simulated save is shown.

[Technical documentation](technical.md) · [Français](../fr/module.md) · [README](../../README.md)

Present the training catalogue and let staff track their learning. The interface consumes BFF Elearning routes and exposes administrator functions according to context.

## Audience and value

Learners and training catalogue administrators.

Business domain: E-learning.

## Available capabilities

- Catalogue, filters and course details.
- Start, resume, content progress and rating.
- Account access through Settings and administrator course management.

## Typical workflow

1. Validate the session with BFF User and load the catalogue.
2. Start a course, view its content and record progress.
3. Retrieve progress and ratings while the BFF process retains its state.

## Role within Mairie360

Associated repositories: [BFF_Elearning](https://github.com/mairie360/BFF_Elearning).

This repository contains the browser interface and its Next.js adapters. The associated BFF supplies business data and coordinates its sources.

## Data and current state

The initial catalogue is defined in `elearning_helpers.ts`. Course edits, progress, ratings and profile overrides are held in memory, including user-keyed maps. BFF User supplies identity. The included Elearning API client and diagnostics do not make this storage persistent.

## Scope and limitations

Restarting resets in-memory data; multiple instances do not share that state. Contract validation or an HTTP success does not prove durable storage in Elearning API.

### Refresh failures and response ordering (MAIR-350)

If catalogue refresh fails after a progress, rating or administrator action, the
last successfully loaded catalogue stays visible with an error and a retry button.
Retry only reloads the catalogue: it does not submit the mutation again. An older
catalogue response or error cannot replace a newer refresh or a server-confirmed
course start. No optimistic progress or rating success is invented by the front.
Error feedback is visible above the course dialog. A 401 always triggers logout,
including a superseded request; response ordering does not relax authentication.

This is a frontend-only reliability slice. Authorized resource downloads, written
reviews and durable cross-session progress remain unverified dependencies of
MAIR-350; this change does not declare that ticket complete or add unpublished routes.

### Editing a confirmed numeric rating (MAIR-350)

After a numeric rating is confirmed, **Modifier ma note** explicitly opens editing.
Select stars and use **Enregistrer ma note** to send the existing rating POST.
While it is pending, stars, saving and cancellation are locked. A refusal keeps
the draft available for an explicit retry; only success confirms the change.
**Annuler la modification** restores the last confirmed own note without a write.
The submitted own note is separate from the server's aggregate rating; the front
does not increment vote counts or replace the official rating distribution.
This does not implement an attributed written review or its editing: the
published contract still supplies only the numeric rating operation.

### Learner action confirmation (MAIR-350)

The installed `0.6.10` reader keeps a supplied empty chapter visible but does not
create a fallback video, resource link, completion button or progress percentage.
Absent course details or chapter lists similarly show an honest unavailable/empty
content state. Five HTTP/HTML regressions verify these four absence cases and
actual chapter selection followed by a completion response and refused refresh:
the reader keeps the selected chapter and the returned percentage, not a local
calculated percentage. This verification does not establish download eligibility,
written reviews, media playback, native layout or cross-session persistence.

Start, content completion and numeric-rating callbacks forward their full result
to the published shared UI `0.6.10`. The reader/card controls lock while a write
and its catalogue refresh are pending; repeated dispatches share the same request.
Pending completion uses neutral “Enregistrement…” styling, not the green completed
state. A refusal keeps the confirmed progress and selected stars, with retry feedback.
Only a successful response confirms completion or the numeric rating. Its official
DTO is retained even if the subsequent catalogue GET fails; retry reloads only GET.
No written review or download acknowledgment is simulated, and this reliability
slice does not satisfy the remaining durable/cross-session acceptance criteria.

### Statistics after a confirmed start (MAIR-382)

Starting a course retains the server-confirmed course immediately, then fetches
the catalogue with `no-store` to display its official statistics. No full page
reload or client-side business counter calculation is needed. A refused start
changes nothing and does not fetch the catalogue. If only the refresh fails, the
confirmed course and reader remain visible with GET-only retry, never a second
start POST. Search/category/status filters remain intact. Existing 401 logout and
stale-response protection still apply; no contract or backend change is made.

### Course form confirmation (MAIR-378)

Course creation/update actions return `false` after a refused mutation and `true`
after a confirmed mutation, independently of a later catalogue refresh failure.
The component forwards that promise to the shared catalogue instead of discarding
it. The exact published `@mairie360/lib-components@0.6.10` release is pinned for the
form to retain fields/chapters/resources after refusal and freeze edits/cancellation
while pending. A confirmed mutation closes the form; retrying a failed catalogue
refresh only reloads the catalogue and does not repeat the mutation. While an author
form is open, its own failure alert replaces global catalogue toasts so retry/cancel
controls stay accessible; learner reader feedback is unaffected. Existing contract DTOs
and routes remain unchanged; uploads/keys and written reviews are separate work.

### Resetting category filters (MAIR-379)

The catalog always offers one usable `all` reset choice. If category options are
supplied without it (including an empty list), the front adds only the neutral
“Toutes les catégories” control, not business data. Existing reset labels/positions
are retained and duplicate resets removed; disabled business categories remain
disabled. When options are absent, the shared component derives them from received
courses as before. Resetting preserves search/status filters and makes no additional
network request. The published library, BFF contract and environment are unchanged.

### Status reset and confirmed administration recovery (MAIR-458 / MAIR-452)

The status selector always offers exactly one usable neutral `all` reset, including
received empty, missing-reset, disabled-reset or duplicate-reset lists. Business
labels, order and disabled flags are preserved without adding business statuses.
Resetting stays local and retains search/category, including after a refused read.
Create/update use only the returned server course; deletion requires matching
positive confirmation. Confirmed changes survive a refused catalogue refresh;
the reset never restores a confirmed deletion or resends a write. GET-only retry
clears only its read error after a confirmed latest response, preserving independent
write refusal and filters. Official statistics remain unchanged until a new GET.
This does not supply protected downloads, written reviews or upload/access keys.

## Developing or operating this module

### Preserved catalogue and reader presentation (MAIR-384)

The catalogue retains the preserved prototype's 17px system typography, full-width
content with 1.5rem horizontal / 2rem vertical spacing (25.5px / 34px at 17px), card shadows and
poster colour. The reader preserves its desktop chapter columns and mobile stack;
its title and close control stay visible while its own content scrolls. The mobile
reader uses 16px padding. CSS targets only the published reader's chapter-aside
structure, not author forms, and adds no scroll listeners or network calls. Search,
filters and existing contract-backed actions are unchanged. Authorized downloads,
persisted progress and written reviews remain separate unresolved MAIR-350 work.

The [technical guide](technical.md) covers architecture, configuration, routes, session handling, persistence, tests and CI/CD. It describes sources of truth and contract synchronization with associated repositories.
