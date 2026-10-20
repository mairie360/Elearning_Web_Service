# Contrat web service / BFF

Ce web service consomme **BFF_Elearning**. La copie [OpenAPI](contracts/openapi.json) définit les routes et les données échangées ; les [types TypeScript](src/contracts/bff.d.ts) sont générés depuis cette copie.

## Routes implémentées

Les chemins sont relatifs au BFF. Le navigateur appelle les routes métier via `/api/bff`. Le proxy conserve méthode, paramètres, corps et statuts ; il dérive l’Authorization du cookie partagé et ignore le bearer du navigateur. Seul Login peut modifier les cookies de session. Les opérations métier utilisent BFF_Elearning **0.4.0**, paquet `@mairie360/bff-elearning-openapi` inchangé. Les opérations de session sont déléguées au frontend Login existant avec le paquet publié `@mairie360/lib-components@0.7.1` ; aucune nouvelle opération BFF_Elearning n’est ajoutée.

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

Le front consomme un paquet publié du BFF : une release `X.Y.Z`, ou, tant qu’aucune release n’est coupée, le paquet `0.0.0-dev.<sha>` du commit courant de son `main` (MAIR-509), ou, une fois ce commit livré en staging, le paquet `0.0.0-staging.<sha40>` du même commit, préféré lors d’une release staging pour la lisibilité (MAIR-600 ; jamais `0.0.0-staging.<sha court>` ni une plage). Pour en changer : monter `@mairie360/bff-elearning-openapi` à la nouvelle version, copier `contracts/openapi.json` depuis le commit correspondant du BFF (`git show <vX.Y.Z ou sha>:contracts/openapi.json`), aligner l’image `bff-elearning` des stacks (`X.Y.Z`, `dev-<sha7>` ou `staging-<sha7>` pour un paquet staging), puis exécuter `npm run contracts:generate`, `npm run contracts:check` et `npm test`. La CI vérifie que les types correspondent au document livré, et `tests/bff-contracts.test.cjs` que ce document déclare les mêmes opérations que le paquet publié.

Le générateur de types est fixé à `openapi-typescript@7.10.1`. Il est exécuté via npm ; aucun jeton privé ne figure dans les contrats.

## Limite existante

Le catalogue, les progressions et les modifications de profil E-learning restent gérés en mémoire par le BFF existant. Cette livraison aligne le contrat et le client ; elle ne migre pas cette persistance vers les API.

## Session partagée et déconnexion

Un refus métier 401 permet une seule reprise auprès de Login puis une seule nouvelle tentative de la même opération. Un refus persistant ramène à la connexion sans invoquer logout. Le middleware des documents conserve le chemin et la query avec `resumeSession=1` ; un GET ne modifie aucun cookie, y compris `/logout`. Le renvoi historique `/profile` vers Settings reste distinct.

La déconnexion explicite utilise `POST /api/auth/logout`, délégué au propriétaire Login. La page et ses commandes restent montées si le reçu ne confirme pas `session_revoked=true`. Le retour à la connexion reste un choix explicite ; les clés de session historiques et les autres données locales sont conservées tant que la révocation n’est pas confirmée. Après confirmation, seules les clés d’authentification connues sont retirées. L’URL de fermeture SSO optionnelle du propriétaire doit être un endpoint de realm HTTPS validé ; aucune déconnexion serveur ou SSO réelle n’est certifiée par les fixtures locales.
