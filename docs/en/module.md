# Elearning_Web_Service — Module overview

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

## Developing or operating this module

The [technical guide](technical.md) covers architecture, configuration, routes, session handling, persistence, tests and CI/CD. It describes sources of truth and contract synchronization with associated repositories.
