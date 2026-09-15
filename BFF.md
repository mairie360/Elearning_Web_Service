# Contrat web service / BFF

Ce web service consomme **BFF_Elearning**. La copie [OpenAPI](contracts/openapi.json) définit les routes et les données échangées ; les [types TypeScript](src/contracts/bff.d.ts) sont générés depuis cette copie.

## Routes implémentées

Les chemins sont relatifs au BFF. Le proxy web conserve méthode, paramètres, contenu binaire, statuts et cookies. BFF_Elearning est le seul service joint par ce web service (version publiée **0.3.0**, paquet `@mairie360/bff-elearning-openapi`) ; les pages Next.js sont distinctes des routes de données.

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

Seules les releases publiées `X.Y.Z` du BFF sont consommées. Pour en changer : monter `@mairie360/bff-elearning-openapi` à la nouvelle version, copier `contracts/openapi.json` depuis le tag correspondant du BFF (`git show vX.Y.Z:contracts/openapi.json`), puis exécuter `npm run contracts:generate`, `npm run contracts:check` et `npm test`. La CI vérifie que les types correspondent au document livré, et `tests/bff-contracts.test.cjs` que ce document déclare les mêmes opérations que le paquet publié.

Le générateur de types est fixé à `openapi-typescript@7.10.1`. Il est exécuté via npm ; aucun jeton privé ne figure dans les contrats.

## Limite existante

Le catalogue, les progressions et les modifications de profil E-learning restent gérés en mémoire par le BFF existant. Cette livraison aligne le contrat et le client ; elle ne migre pas cette persistance vers les API.

## Besoin proposé : déconnexion et révocation de session

Le contrat publié ne propose aucune route de déconnexion. En attendant, le web service vide son stockage local et navigue vers `/logout`, où son middleware efface le cookie `accessToken` avant de rediriger vers Login ; la session reste valide côté serveur jusqu’à son expiration. Besoin proposé pour BFF_Elearning : une route (par exemple `POST /elearning/auth/logout`) qui révoque la session auprès de ses services amont et renvoie la suppression du cookie, afin que le front n’ait à joindre aucun autre BFF.
