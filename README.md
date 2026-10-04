# Elearning_Web_Service

Present the training catalogue and let staff track their learning. The interface consumes BFF Elearning routes and exposes administrator functions according to context.

Présenter le catalogue de formations et permettre aux agents de suivre leur apprentissage. L’interface consomme les routes de BFF Elearning et expose les fonctions administrateur selon le contexte.

## Documentation

| Language / Langue | Module | Technical / Technique |
| --- | --- | --- |
| English | [Module overview](docs/en/module.md) | [Technical documentation](docs/en/technical.md) |
| Français | [Présentation du module](docs/fr/module.md) | [Documentation technique](docs/fr/technical.md) |

The guides describe the implemented module, its current limitations, local setup, routes, data, verification and CI/CD.

Les guides décrivent le module implémenté, ses limites actuelles, le démarrage local, les routes, les données, les vérifications et la CI/CD.

## Confirmed catalog changes (MAIR-452)

Administrator creation and updates retain the course returned by the existing service. Deletion removes a course only after a matching positive confirmation. If the subsequent catalog read fails, these confirmed changes remain visible while the existing refresh error and GET-only retry remain available. Earlier reads cannot overwrite a newer confirmation; unrelated courses, profile data and official statistics are retained until a successful catalog response replaces them. Submitted drafts and fabricated statistics are never used as confirmation.

`tests/catalog-admin-confirmation.test.cjs` exercises the real consumer actions through the unchanged contract-bound HTTP path, including refused writes, refused refreshes, late reads, duplicate IDs and unconfirmed deletion. This frontend behavior does not implement the separate upload/key or resource/download requirements, change API/BFF contracts, or approve a deployment.

Read recovery remains available when another write is refused: both failures share a single feedback stack instead of overlapping or hiding Retry. A pending retry retains the previous read failure and confirmed courses, disables the button and announces the refresh. Only a successful latest catalogue read clears its own error; it neither clears the refused-write message nor repeats that write. HTML consumer regressions cover these independent recovery states.

Repeated deletion of the same course shares the existing in-flight operation, including its subsequent catalogue read. It sends only one DELETE, does not remove a pending or refused course, and releases the guard after settlement so an explicit retry remains possible. Different course identifiers remain independent. The current public library still displays the Delete button while pending; the frontend action prevents duplicate requests rather than claiming a disabled-control state. Contract-backed action and rendered-consumer regressions cover these paths without changing the network contract or shared library.

La suppression répétée d’une même formation partage l’opération déjà en attente, relecture du catalogue comprise. Un seul DELETE est envoyé ; une réponse en attente ou refusée ne supprime pas la formation. Après règlement, une tentative explicite reste possible, et les autres identifiants restent indépendants. Le bouton de la bibliothèque reste visible pendant l’attente : la protection est portée par l’action frontend, sans prétendre désactiver ce contrôle. Aucun BFF/API, contrat ou bibliothèque partagée n’est modifié.

## Contracts and background / Contrats et compléments

The catalog's category and status filters retain one usable `all` reset even when
the supplied list omits it, duplicates it or disables it. This reset is a local
UI operation: it preserves search and the other filter, performs no request and
does not invent or enable any business option. Status reset recovery is tracked
by MAIR-458. The composed candidate brings this reset together with MAIR-452
confirmed administration recovery and reviewed MAIR-436 packaging. Cross-flow
tests cover resetting from empty results after refused reads/writes, retaining
independent write errors through a confirmed empty GET, and never restoring a
confirmed deletion. Integration still requires genuine green CI; this composition
does not approve a deployment or implement the separate backend-dependent flows.

- [BFF.md](BFF.md)
- [BACKEND.md](BACKEND.md)
- [contracts/openapi.json](contracts/openapi.json)

`BACKEND.md`, when present, includes proposed backend requirements; use the guides and versioned OpenAPI contract to identify current behavior.

`BACKEND.md`, lorsqu’il est présent, contient des besoins backend proposés; consulter les guides et le contrat OpenAPI versionné pour identifier le comportement actuel.

## Reproducible frontend images / Images frontend reproductibles

MAIR-436 / #155 pins production and development to the official Node 24.21.0 Bookworm slim digest and the same exact version in both consumer workflows. Both Dockerfiles use `npm ci` with the tracked npm policy mounted readonly and the existing `node_auth_token` BuildKit secret required only during installation. Supply it with `--secret id=node_auth_token,env=NODE_AUTH_TOKEN`, never a build argument. Development keeps npm for its existing command; the non-root standalone production runner retains Node/curl and port 5006 without unused global package managers. The three Compose files adapt only frontend build secrets and remove the unused development runtime credential mount; all other services and runtime configuration are unchanged.

The exact legacy security status required by this repository executes real blocking Semgrep and redacted Gitleaks using reviewed immutable shared actions, full frontend history and read-only contents access. The shared 4.0.2 audit remains enabled. `tests/packaging-policy.test.cjs` and `tests/ci-policy.test.cjs` guard these consumer changes, not actual image publication. This slice does not complete MAIR-436's global permissions, push filters, dependency criteria or other fronts, and does not change product code, APIs/BFFs, contracts, business/demo data, cluster pins or Staging/Prod approvals. Complete image/scanner/signature and isolated ZAP/k6 outcomes must be verified before closing #155.

La tranche MAIR-436 / #155 corrige uniquement le packaging consommateur Elearning : version Node exacte/digest officiel, installation reproductible avec secret temporaire requis et politique npm en lecture seule, aucun jeton d'installation au runtime. Le contrôle requis exécute réellement les scanners bloquants sans affaiblir les protections. Les critères globaux restent ouverts ; cette correction ne valide ni les contrats manquants téléchargement/avis/clés d'accès (#125/#107), ni l'authentification et la persistance déployées, ni la parité fonctionnelle/visuelle complète avec l'ancien prototype.
# Reference navigation presentation (MAIR-180)

The consumer retains the published AppShell and restores the measured 44px
minimum navigation targets and sidebar shadow. Its mobile sidebar stays below
the shared close button. Catalogue/filter/reader behavior and BFF-supplied data
are unchanged; no prototype identity, notifications or static version is copied.
Native responsive evidence and green CI/integration remain separate acceptance
gates. See [issue #161](https://github.com/mairie360/Elearning_Web_Service/issues/161).
