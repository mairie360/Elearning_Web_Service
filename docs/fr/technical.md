# Elearning_Web_Service — Documentation technique

## Destinations frontend explicites (MAIR-177)

Les redirections utilisent uniquement des URL HTTP(S) configurées, sans
identifiants intégrés. Aucun repli implicite vers localhost. Renseigner à
l’exécution les variables existantes `LOGIN_FRONT_URL` (fronts protégés) et
`PROJECT_FRONT_URL` (destination par défaut de Login), même en local. Login
accepte toujours un retour vers un front autorisé si sa destination par défaut
manque. Sans destination Login valide, le middleware répond 503 sans cache ;
Login affiche un état indisponible sans formulaire si aucune destination ne
peut être résolue. Aucun contrat API/BFF ni variable de déploiement ajouté.


[Présentation du module](module.md) · [English](../en/technical.md) · [README](../../README.md)

## Architecture et traitement des requêtes

Application Next.js 15.5.25, React 19 et TypeScript avec App Router. Le navigateur appelle les routes de la même origine; le serveur Next.js relaie les données vers **BFF_Elearning**.

```mermaid
flowchart LR
  Browser --> Next["Elearning_Web_Service"]
  Next --> BFF["BFF_Elearning"]
```

La page racine monte `ElearningModule`; la page profil monte le module de profil. Les fichiers de `src/features/elearning` pilotent le chargement, les actions et la navigation, tandis que le proxy conserve les routes `/elearning`.

Le proxy générique lit le contrat OpenAPI versionné pour autoriser chemins et méthodes. Il conserve paramètres de requête, corps binaire, statuts et en-têtes utiles, filtre les en-têtes de transport, désactive le cache et n’effectue pas de suivi automatique des redirections. Son délai est de 15 secondes.

## Données et persistance

Les sources et limites suivantes concernent le BFF associé, dont dépend la sauvegarde des données affichées.

Le catalogue initial est défini dans `elearning_helpers.ts`. Les formations modifiées, progressions, notes et surcharges de profil sont gérées en mémoire, notamment dans des Map indexées par utilisateur. BFF User fournit l’identité. Le client Elearning API et les diagnostics présents ne rendent pas ce stockage persistant.

Un redémarrage réinitialise les données en mémoire; plusieurs instances ne partagent pas cet état. La validation du contrat ou un succès HTTP ne prouve pas un enregistrement durable dans Elearning API.

L’état React gère l’affichage et les opérations en cours. Ce dépôt ne définit pas de base métier propre; les garanties de sauvegarde sont celles du BFF et de ses sources décrites ci-dessus.

## Installation et lancement local

Utiliser Node.js 22 pour reproduire le job de contrats et npm avec le fichier de verrouillage versionné. Les versions des autres jobs et de Docker sont précisées plus bas.

Les dépendances privées `@mairie360/*` nécessitent un accès GitHub Packages. Configurer `NODE_AUTH_TOKEN` dans l’environnement avec un jeton autorisé à lire ces packages, conformément à `.npmrc`. Ne pas enregistrer la valeur dans Git.

```bash
npm ci
```

Créer `.env.local` à la racine. Exemple pour des BFF exécutés sur la même machine:

```dotenv
BFF_ELEARNING_BASE_URL=http://localhost:4006
```

Démarrer le BFF associé (lui-même relié à BFF User pour résoudre la session), puis lancer le web service. Le port `5006` ci-dessous est un choix local explicite pour éviter les collisions; ce n’est pas une affirmation sur les ports de tous les fichiers Compose.

```bash
npm run dev -- --port 5006
```

Ouvrir `http://localhost:5006`. Pour exécuter le build avec le script Next.js:

```bash
npm run build
npm run start -- --port 5006
```

## Configuration

Si la session manque ou a expiré, le middleware transmet `redirect` à Login. Il construit la destination avec `ELEARNING_FRONT_URL` lu à l’exécution, puis le chemin et la query demandés, jamais avec l’hôte interne de l’ingress. `/logout` omet volontairement `redirect` pour éviter une boucle de déconnexion. Sans URL publique valide, Login utilise sa destination Projets par défaut.

Les valeurs ci-dessous sont des exemples locaux ou des comportements explicitement indiqués, pas des identifiants de production.

| Variable ou priorité | Exemple / repli indiqué | Rôle |
| --- | --- | --- |
| `BFF_ELEARNING_BASE_URL` → `ELEARNING_BFF_URL` → `NEXT_PUBLIC_BFF_ELEARNING_BASE_URL` | http://localhost:4006 | Priorité de gauche à droite dans le proxy ; configurer explicitement une URL HTTP(S). Une configuration absente ou invalide renvoie un 503 non mis en cache, sans appel réseau. |
| `BFF_CONTRACT_DIR` | ../BFF_Elearning/contracts | Répertoire des contrats BFF pour les scripts de synchronisation et de contrôle. |
| `COOKIE_DOMAIN` | — | Domaine du cookie `accessToken` effacé par le middleware (session expirée, `/logout`); vérifier sa cohérence avec Login. |
| `ADMINISTRATION_FRONT_URL` | — | Destination de navigation; voir le fichier source qui la lit. Les variables injectées par `next.config.ts` ou préfixées `NEXT_PUBLIC_` sont publiques et prises en compte lors du build. |
| `CALENDAR_FRONT_URL` | — | Destination de navigation; voir le fichier source qui la lit. Les variables injectées par `next.config.ts` ou préfixées `NEXT_PUBLIC_` sont publiques et prises en compte lors du build. |
| `ELEARNING_FRONT_URL` | — | Destination de navigation; voir le fichier source qui la lit. Les variables injectées par `next.config.ts` ou préfixées `NEXT_PUBLIC_` sont publiques et prises en compte lors du build. |
| `EMAIL_FRONT_URL` | — | Destination de navigation; voir le fichier source qui la lit. Les variables injectées par `next.config.ts` ou préfixées `NEXT_PUBLIC_` sont publiques et prises en compte lors du build. |
| `FILES_FRONT_URL` | — | Destination de navigation; voir le fichier source qui la lit. Les variables injectées par `next.config.ts` ou préfixées `NEXT_PUBLIC_` sont publiques et prises en compte lors du build. |
| `LOGIN_FRONT_URL` | — | Destination de navigation; voir le fichier source qui la lit. Les variables injectées par `next.config.ts` ou préfixées `NEXT_PUBLIC_` sont publiques et prises en compte lors du build. |
| `MESSAGE_FRONT_URL` | — | Destination de navigation; voir le fichier source qui la lit. Les variables injectées par `next.config.ts` ou préfixées `NEXT_PUBLIC_` sont publiques et prises en compte lors du build. |
| `PROJECT_FRONT_URL` | — | Destination de navigation; voir le fichier source qui la lit. Les variables injectées par `next.config.ts` ou préfixées `NEXT_PUBLIC_` sont publiques et prises en compte lors du build. |

Dans un conteneur, `localhost` désigne le conteneur lui-même. Utiliser le nom DNS du service BFF sur le réseau Docker, ou une adresse d’hôte accessible. Les fichiers Compose incluent parfois d’autres services et des paramètres hérités; vérifier les URL et ports effectifs avant de les employer.

## Routes et contrat de données

Inventaire extrait de `contracts/openapi.json`. Les paramètres entre accolades sont remplacés par des identifiants réels. Les types détaillés, champs requis, réponses et exemples éventuels sont définis dans ce contrat; les statuts du tableau sont ceux déclarés, sans prétendre lister toutes les erreurs de transport ou de validation.

Ces chemins de données sont exposés à la même origine par le proxy; les pages Next.js sont distinctes. `/openapi.json` et `/swagger.json` sont également relayés. L’interface Swagger `/docs` se consulte directement sur le BFF.

| Méthode | Chemin | Corps déclaré | Statuts déclarés |
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
| `/profile` | [src/app/profile/page.tsx](../../src/app/profile/page.tsx) |

`/logout` n’a pas de page: le middleware efface le cookie `accessToken` et redirige vers Login.

## Session, permissions et erreurs

Le front ne joint qu’un service, BFF_Elearning, qui résout la session (auprès de BFF User) pour chaque route `/elearning/*`; l’utilisateur courant provient de ses réponses (`user`). Sur un 401, ou à la déconnexion, le front vide son stockage local et navigue vers `/logout`: le contrat publié du BFF ne propose pas de route de déconnexion (voir `BFF.md`), la session n’est donc pas révoquée côté serveur avant son expiration. Le proxy générique utilise le Bearer explicite ou, en son absence, le cookie `accessToken`. Les permissions métier restent celles du BFF et de ses sources.

Le proxy générique répond 400 pour un chemin invalide, 404 pour un chemin hors contrat, 405 pour une méthode interdite et 502 si le service est injoignable ou dépasse le délai. Les réponses amont sont conservées, y compris les corps vides 204/205/304.

Toutes les réponses portent `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` et `Cross-Origin-Resource-Policy`, `Cross-Origin-Embedder-Policy` et `Cross-Origin-Opener-Policy` (`next.config.ts`), et `X-Powered-By` est désactivé. Pour les requêtes authentifiées, [src/middleware.ts](../../src/middleware.ts) ajoute une `Content-Security-Policy` avec un nonce propre à chaque requête, que Next.js applique à ses scripts. Les pages sont donc rendues à la demande (`dynamic = "force-dynamic"` dans le layout). Les feuilles de style sont limitées à l'origine et au nonce ; seuls les attributs `style` rendus par les composants passent par `style-src-attr 'unsafe-inline'`, et `next dev` autorise aussi `'unsafe-eval'`. Toute nouvelle ressource externe (image, police, API appelée depuis le navigateur) doit être ajoutée à la politique dans `src/lib/content-security-policy.ts`.

## Synchronisation et vérifications

Le front ne consomme que des versions publiées `X.Y.Z` de BFF_Elearning (jamais une branche ni une version `0.0.0-dev`/`staging`), actuellement **0.4.0**. Pour passer à une nouvelle release, monter le paquet de contrat, copier le contrat du même tag puis régénérer les types:

```bash
npm install --save-dev --save-exact @mairie360/bff-elearning-openapi@X.Y.Z
git -C ../../BFFs/BFF_Elearning show vX.Y.Z:contracts/openapi.json > contracts/openapi.json
npm run contracts:generate
npm run contracts:check
npm test
npm run lint
npm run build
```

`contracts:generate` régénère `src/contracts/bff.d.ts` depuis la copie versionnée; `contracts:check` vérifie ces types et, avec `BFF_CONTRACT_DIR`, compare au contrat d’un checkout BFF (qui doit alors être sur le tag publié). Les stacks isolées utilisent l’image publiée `ghcr.io/mairie360/bff-elearning:0.4.0` (`BFF_ELEARNING_IMAGE`). `test:contracts` exécute tous les tests Node (`npm test` fait de même avec la couverture, minimum 60 % sur lignes, branches et fonctions).

### Tests unitaires pilotés par les contrats

Le navigateur n’atteint BFF E-learning que par [src/lib/elearning-api.ts](../../src/lib/elearning-api.ts): chemins, méthodes, paramètres, corps et réponses sont typés depuis `src/contracts/bff.d.ts`, donc une opération absente du contrat ne compile pas. La logique du catalogue et du profil vit dans `src/features/elearning/catalogActions.ts` et `profileActions.ts`, que les composants React se contentent de brancher sur leur état.

- `tests/network-boundary.test.cjs` analyse `src/` (AST TypeScript): `fetch` n’est autorisé que dans `bff-client.ts` (chemins construits par `elearning-api.ts`) et `bff-proxy.ts`, dont l’unique cible est `configuredBffUrl()`; aucun autre client HTTP ni API réseau.
- `tests/elearning.bff-mocks.test.cjs` exécute le vrai code de bout en bout: `fetch` navigateur → vrai middleware → route handler choisi comme par l’App Router → proxy → BFF E-learning simulé en HTTP, seul service joignable. Le mock est piloté par le paquet publié `@mairie360/bff-elearning-openapi` (sortie orval): il refuse chemins, méthodes, paramètres et corps absents du contrat et valide ses réponses de succès; orval ne typant pas les erreurs, les réponses d’erreur passent par `errorReply`, qui valide le corps contre `ApiError`. Tout appel du navigateur vers une autre origine, ou du serveur vers un autre service, fait échouer le test, et chaque opération consommée doit être rejouée.
- `tests/bff-contracts.test.cjs` vérifie que le paquet est une version `X.Y.Z` épinglée, que `contracts/openapi.json` déclare exactement ses opérations, que `elearning-api.ts` appelle les opérations consommées, que le proxy catch-all est le seul route handler et que les fixtures sont conformes.

Les utilitaires `tests/support/openapi-contract.ts`, `contract-mock-server.ts` et `orval-contract.ts` sont copiés à l’identique depuis les BFFs (`BFFs/BFF_Elearning/tests/support`); garder les copies identiques.

Le générateur de types est fixé à `openapi-typescript@7.10.1` dans `scripts/contracts.mjs` et s’exécute via npm. Pour une modification uniquement documentaire, vérifier les liens, l’exactitude des deux langues et `git diff --check`; ne pas régénérer les contrats sans modification de leur source.

## CI/CD et exécution Docker

Le job `contracts.yml` utilise Node.js 22, `actions/checkout@v7` et `actions/setup-node@v7`. Il s’exécute sur push, pull request et lancement manuel; il installe avec `npm ci`, contrôle les contrats et lance les tests dédiés.

`cicd.yml` appelle `mairie360/CICD/.github/workflows/frontend-cicd.yml@v2.0.0`, avec `cicd_version: v2.0.0` et `node_version: "23"`. Les étapes réutilisables et les environnements GitHub déterminent les contrôles, publications et déploiements effectifs.

Le Dockerfile utilise par défaut `NODE_VERSION=23.10.0` et le build Next.js `standalone`; la commande de l’image est `["node", "server.js"]`. Le port de l’image et les mappings Compose peuvent différer du port local proposé plus haut.

Avant un lancement Docker, vérifier les variables de service, les secrets de build et les réseaux dans les fichiers du dépôt. Une CI verte valide ses jobs; elle ne prouve pas la disponibilité des services métier dans un environnement distant.

## Diagnostic

Diagnostic du BFF associé: Si le catalogue refuse la session, vérifier BFF_Elearning et sa dépendance BFF User. Si une progression disparaît après redémarrage ou entre deux instances, cela correspond à la limite mémoire actuelle. Distinguer les fixtures du catalogue des données persistantes attendues à terme.

En cas d’erreur de proxy, comparer la route et la méthode à l’inventaire, vérifier l’URL du BFF puis la session. Pour un 401 après navigation entre modules, vérifier le cookie `accessToken`, son domaine et la résolution de session par BFF_Elearning. Un 404 sur un besoin décrit dans `BACKEND.md` peut correspondre à une fonctionnalité seulement proposée.

## Repères dans le dépôt

- [src/app/page.tsx](../../src/app/page.tsx)
- [src/features/elearning/ElearningModule.tsx](../../src/features/elearning/ElearningModule.tsx)
- [src/features/elearning/ProfileModule.tsx](../../src/features/elearning/ProfileModule.tsx)
- [src/features/elearning/appData.ts](../../src/features/elearning/appData.ts)
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

Compléments historiques: [BFF.md](../../BFF.md), [BACKEND.md](../../BACKEND.md). Les besoins proposés doivent rester distincts du comportement effectivement implémenté.
