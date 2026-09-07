# Contrat web service / BFF

Ce web service consomme **BFF_Elearning**. La copie [OpenAPI](contracts/openapi.json) définit les routes et les données échangées ; les [types TypeScript](src/contracts/bff.d.ts) sont générés depuis cette copie.

## Routes implémentées

Les chemins sont relatifs au BFF. Les proxies web conservent méthode, paramètres, contenu binaire, statuts et cookies. Les chemins `/api/auth/*` restent des adaptateurs de session vers BFF User ; les pages Next.js sont distinctes des routes de données.

| Méthode | Route | Réponse / schéma |
| --- | --- | --- |
| GET | `/health` | 200 OK |
| GET | `/check_apis` | 200 CheckApiResponse |
| POST | `/elearning/admin/courses` | 201 Formation créée |
| PATCH | `/elearning/admin/courses/{courseId}` | 200 Formation mise à jour |
| DELETE | `/elearning/admin/courses/{courseId}` | 200 Formation supprimée |
| GET | `/elearning/catalog` | 200 Catalogue charge avec succes |
| POST | `/elearning/courses/{courseId}/contents/{contentId}/complete` | 200 Progression mise a jour |
| GET | `/elearning/profile` | 200 Profil charge avec succes |
| PATCH | `/elearning/profile` | 200 Profil mis a jour |
| POST | `/elearning/courses/{courseId}/rating` | 200 Note enregistree |
| POST | `/elearning/courses/{courseId}/start` | 200 Formation demarree ou reprise |

## Mise à jour et validation

Dans le BFF associé, exécuter `npm run contracts:generate`. Dans ce web service, exécuter `npm run contracts:sync`, puis `npm run contracts:check` et `npm run test:contracts`. Les dépôts peuvent être voisins ; sinon `BFF_CONTRACT_DIR` indique le répertoire `contracts` du BFF. La CI vérifie que les types correspondent au document livré, même sans checkout du dépôt voisin.

Le générateur de types est fixé à `openapi-typescript@7.10.1`. Il est exécuté via npm ; aucun jeton privé ne figure dans les contrats.

## Limite existante

Le catalogue, les progressions et les modifications de profil E-learning restent gérés en mémoire par le BFF existant. Cette livraison aligne le contrat et le client ; elle ne migre pas cette persistance vers les API.
