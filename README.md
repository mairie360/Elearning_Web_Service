# Elearning_Web_Service

## Published shared workflow fixes — 8 October 2026

This candidate consumes the real shared UI0.6.11 published from library mainf243318. Its downloaded SHA512 and all compiled files were verified against that main. The release delivers conversation/account draft isolation, faithful author-status display, full type validation and patched template tooling. Only the exact UI pin/root lock entry and release regressions change; all other resolved packages and BFF contracts remain unchanged.

The npm11.15 version chooser rejects the fresh release and warns that the existing internal UI age-exclusion key is unsupported. The lock is therefore updated from the verified registry metadata; the seven-day configuration and its existing exception are retained. A normal locked installation and consumer checks must verify this candidate. This is a documented dependency-selection bypass, not green aggregate CI, main/dev delivery or browser acceptance.

Cette proposition utilise le paquet réellement publié0.6.11 ; empreinte et fichiers vérifiés depuis le registre. La sélection npm avertit que l’exception existante n’est pas reconnue : verrou mis à jour depuis les métadonnées vérifiées, configuration inchangée. L’installation verrouillée, les tests du consommateur, main et la recette navigateur/dev restent des étapes distinctes.


## Runtime maintenance / Maintenance des dépendances — 8 October 2026

Next and eslint-config-next are pinned to `16.3.8`; the existing scoped
image runtime resolves sharp `0.35.5` and source-map-js `1.2.2`. The public
seven-day release policy, published BFF contract and shared UI pins are
retained. The full blocking audit remains required; braces is independently
unresolved. Candidate changes require their own checks and protected main
integration before delivery is declared complete.

Next et eslint-config-next sont épinglés à `16.3.8` ; le moteur d’images
ciblé utilise sharp `0.35.5`, et source-map-js est verrouillé à `1.2.2`.
Le délai public de sept jours, les contrats BFF publiés et les versions de
l’UI sont conservés. L’audit bloquant reste requis ; braces demeure un
blocage indépendant. Les vérifications du candidat et son intégration
protégée sur main restent nécessaires avant de déclarer la livraison.

## Reader comparison / Comparaison du lecteur (MAIR-350)

The preserved local prototype adds download eligibility and attributed written
reviews through demonstration-only routes. Published contract `0.4.0` does not
provide those operations: opening a supplied resource link or confirming content
completion is not evidence of a persisted download acknowledgement or review.
The current published reader does not invent content or a percentage when
details, chapters or supports are absent. Contract-backed HTML tests now exercise
actual nested chapter controls and verify that the selected chapter and the
server-returned percentage survive a refused catalogue refresh. The test runner
collects nested React child arrays without changing ordinary DTO arrays.
This is source/HTTP/HTML evidence, not a fresh native visual, mobile, media,
authorization or cross-session persistence certification. No product code,
API/BFF, contract, dependency or workflow changed in this verification slice.

Le prototype conservé ajoute l'éligibilité au téléchargement et les avis écrits
attribués par des routes de démonstration uniquement. Le contrat publié `0.4.0`
ne fournit pas ces opérations : ouvrir un lien fourni ou confirmer la complétion
ne prouve pas un téléchargement acquitté ni un avis persisté. Le lecteur publié
n'invente ni support ni pourcentage en l'absence de détails, chapitres ou contenus.
Les tests HTTP/HTML actionnent maintenant les vrais contrôles de chapitres
imbriqués et vérifient la conservation du chapitre sélectionné et du pourcentage
officiel après refus du GET. Le harnais collecte les tableaux React imbriqués
sans modifier les tableaux DTO ordinaires. Ce n'est pas une nouvelle recette
native/mobile/média ni une preuve d'autorisation ou de persistance intersession.
Aucun code produit, API/BFF, contrat, dépendance ou workflow modifié ici.

Present the training catalogue and let staff track their learning. The interface consumes BFF Elearning routes and exposes administrator functions according to context.

Présenter le catalogue de formations et permettre aux agents de suivre leur apprentissage. L’interface consomme les routes de BFF Elearning et expose les fonctions administrateur selon le contexte.

## Current cookie session / Session cookie courante (MAIR-410)

Ordinary catalogue, learner and administrator requests no longer read, migrate
or inject JWTs from browser localStorage. The unchanged same-origin proxy uses
the current `accessToken` cookie; an explicitly supplied Authorization header
remains supported. A missing cookie or a service refusal is not a successful
session. Logout still removes only known token keys, preserving unrelated data.
Contract-backed regressions cover these paths. This frontend slice does not fix
server revocation, GET logout policy or persistence,
and does not complete the mixed audit ticket before genuine CI and integration.

Les requêtes ordinaires catalogue, apprenant et administrateur ne lisent,
ne migrent et n'injectent plus les anciens JWT du localStorage. Le proxy inchangé
utilise le cookie `accessToken` courant ; un Authorization explicitement fourni
reste accepté. Une session absente ou refusée n'est pas simulée comme réussie.
La déconnexion retire seulement les clés d'authentification connues. Cette
tranche frontend ne corrige ni révocation serveur, ni déconnexion en GET, ni
persistance. L'audit global reste ouvert.

Expired data-fetch redirects are captured in manual mode. The client reloads
the current protected document once, preserving its path/query so the existing
middleware chooses Login and its return destination. It never reads opaque
redirect headers/body or replays a refused mutation. Cancelled requests cannot
trigger recovery; real service401 retains the existing logout flow, while
400/403/503 remain separate typed refusals. No middleware/proxy/BFF change.

Une redirection pendant un fetch expiré est interceptée en mode manuel. Le
client recharge une fois la page protégée courante, chemin/query conservés ;
le middleware existant choisit Login et la destination de retour. Aucun accès
aux en-têtes/corps opaques ni replay d'écriture refusée. Une requête annulée
ne déclenche pas de navigation ; le vrai401 conserve le logout existant et les
400/403/503 restent distincts. Middleware/proxy/BFF inchangés.

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

The exact legacy security status required by this repository executes real blocking Semgrep and redacted Gitleaks using reviewed immutable shared actions, full frontend history and read-only contents access. The shared 4.0.3 audit remains enabled. Reconciliation with the independent main workflow update keeps Node 24.21.0 exact, matching release pins and both blocking scanners; it does not suppress audit findings. `tests/packaging-policy.test.cjs` and `tests/ci-policy.test.cjs` guard these consumer changes, not actual image publication. This slice does not complete MAIR-436's global permissions, push filters, dependency criteria or other fronts, and does not change product code, APIs/BFFs, contracts, business/demo data, cluster pins or Staging/Prod approvals. Complete image/scanner/signature and isolated ZAP/k6 outcomes must be verified before closing #155.

La tranche MAIR-436 / #155 corrige uniquement le packaging consommateur Elearning : version Node exacte/digest officiel, installation reproductible avec secret temporaire requis et politique npm en lecture seule, aucun jeton d'installation au runtime. La réconciliation avec la mise à jour indépendante de main conserve Node24.21.0 exact, les deux références4.0.3 concordantes et les deux scanners requis réellement bloquants ; aucun constat d'audit n'est masqué. Les critères globaux restent ouverts ; cette correction ne valide ni les contrats manquants téléchargement/avis/clés d'accès (#125/#107), ni l'authentification et la persistance déployées, ni la parité fonctionnelle/visuelle complète avec l'ancien prototype.
# Reference navigation presentation (MAIR-180)

The consumer retains the published AppShell and restores the measured 44px
minimum navigation targets and sidebar shadow. Its mobile sidebar stays below
the shared close button. Catalogue/filter/reader behavior and BFF-supplied data
are unchanged; no prototype identity, notifications or static version is copied.
Native responsive evidence and green CI/integration remain separate acceptance
gates. See [issue #161](https://github.com/mairie360/Elearning_Web_Service/issues/161).
