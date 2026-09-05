# BFF — Formation

Référentiel de besoins harmonisé le 5 septembre 2026. Documentation uniquement : aucune route ni migration n'est créée par ces fichiers. Les chemins BFF sont relatifs au service indiqué, pas au préfixe des proxies Next.js ; les chemins backend conservent leurs préfixes réels.

Le front appelle BFF E-learning, mais les formations proviennent encore de courseTemplates et les modifications/progressions/notes de Maps en mémoire. Le client Elearning API installé expose des lectures/inscriptions/progression de module qui ne sont pas encore utilisées pour alimenter ces données.

Tables et routes propriétaires : [BACKEND.md](BACKEND.md).

`Existant` : déclaré dans les sources locales ; `Partiel` : route présente mais données manquantes, SQL direct ou mémoire ; `Client généré` : chemin observé dans le client installé, déploiement non vérifié ; `Proposé` : contrat cible à implémenter/valider. Pour les tables, `SQL observé` ne prouve pas qu'une migration est déployée.

## Routes communes

Les identifiants renvoyés par un domaine restent ceux de son backend, même lorsqu'un BFF les sérialise en chaîne. `phone` côté Core/DTO correspond à `users.phone_number` en SQL ; `name`/`fullName` est composé à partir du prénom et du nom, sans découpage automatique inverse. Les rôles d'affichage sont adaptés par chaque front à partir de `roles`, sans nouvelle table de rôles par module. Le profil s'édite dans **Paramètres > Profil** ; les anciennes pages `/profile` ne définissent pas un stockage distinct.

| Méthode | Service et route BFF | Route backend / source | Données nécessaires au front | État |
| --- | --- | --- | --- | --- |
| GET | BFF User `/me` (alias `/session/me`) | Core `GET /api/v1/user/me/` + `GET /api/v1/groups/` | Identité, rôles et groupes communs ; réponse actuelle `{user, groups, roles}` ; enrichir avec identifiant, avatar, service, poste et dernière connexion | Partiel |
| POST | BFF User `/auth/logout` | Actuel : suppression du cookie ; cible : Core `POST /api/v1/sessions/revoke` avec le refresh token de la session courante | Déconnexion ; révocation serveur à brancher, pas une suppression de toutes les sessions | Partiel |
| GET | BFF User `/notifications` | Core `GET /api/v1/user/me/notifications/` | Notifications du bandeau et compteur non lu ; ne pas utiliser la constante de démonstration 3 | Proposé |
| PATCH | BFF User `/notifications/{notificationId}/read` | Core `PATCH /api/v1/user/me/notifications/{notificationId}/read` | Marquage lu et compteur actualisé pour l'utilisateur connecté | Proposé |

## Routes du module

| Méthode | Service et route BFF | Route backend / source | Données nécessaires au front | État |
| --- | --- | --- | --- | --- |
| GET | BFF E-learning `/elearning/catalog` | Elearning lectures formations/modules/contenus/progression ci-dessous ; BFF User /me ; Core notifications | Utilisateur, catalogue, catégories/statistiques, détails/chapitres/contenus, progression, échéances, notes, statistiques admin, certifications | Partiel ; formations fictives, compteur notifications 3 et certifications 14 statiques |
| POST | BFF E-learning `/elearning/courses/{courseId}/start` | Elearning `POST /v1/formations/{formationId}/start` | Démarrer/reprendre ; inscription autorisée, startedAt, progression, prochain contenu | Partiel ; Map mémoire |
| POST | BFF E-learning `/elearning/courses/{courseId}/contents/{contentId}/complete` | Elearning `POST /v1/formations/{formationId}/contents/{contentId}/complete` ; PATCH module existant | Contenu terminé, progression chapitre/formation, totaux requis | Partiel ; Map mémoire |
| POST | BFF E-learning `/elearning/courses/{courseId}/rating` | Elearning `POST /v1/formations/{formationId}/ratings` | Note utilisateur, moyenne, nombre et distribution des notes | Partiel ; Map mémoire |
| POST | BFF E-learning `/elearning/admin/courses` | Elearning `POST /v1/admin/formations/` | Créer formation, catégories, instructeur, niveau, obligation, échéance, chapitres et contenus | Partiel ; courseTemplates en mémoire |
| PATCH | BFF E-learning `/elearning/admin/courses/{courseId}` | Elearning `PATCH /v1/admin/formations/{formationId}` | Modifier les mêmes champs sans perdre la progression des inscrits | Partiel ; Maps mémoire |
| DELETE | BFF E-learning `/elearning/admin/courses/{courseId}` | Elearning `DELETE /v1/admin/formations/{formationId}` | Supprimer une formation selon droits et politique de conservation des progrès | Partiel ; Maps mémoire |
| GET, PATCH | BFF E-learning `/elearning/profile` (ancien profil) | Cible : Core `GET, PATCH /api/v1/user/me/` ; édition via Paramètres | Même utilisateur, avatar, service et poste communs | Partiel ; overrides mémoire, pas de persistance Core |

## Points d'alignement

| Sujet | Contrat / écart |
| --- | --- |
| Correspondances | `courseId` = formationId ; chapterId = moduleId ; contentId reste l'identifiant du contenu, distinct du fileId. Les noms de tables Elearning sont une cible logique à valider contre les migrations non présentes localement, pas la preuve de tables existantes. |
| Commun | Notifications : Core `/api/v1/user/me/notifications/`, pas un nouveau `/v1/users/me/notifications` Elearning. Profil : même Core user_profiles/services que Paramètres. |
| Affichage | Badges, libellés de statut, durée formatée, footer et version UI ne nécessitent pas de tables. Les champs statistiques doivent être calculés à partir de formations/inscriptions/progressions/notes persistées. |

## Sources

| Périmètre | Référence |
| --- | --- |
| Front inspecté | [src/features/elearning/ElearningModule.tsx](src/features/elearning/ElearningModule.tsx) |
| Identité / sessions / groupes | [Core_API 9904624](https://github.com/mairie360/Core_API/tree/99046240dd9742217d2a2c3d282721b785cacca0/src) ; [BFF_user b7c3477](https://github.com/mairie360/BFF_user/tree/b7c3477f858073aa846ba0129cbb29152528e6d2/src) |
| BFF métier inspecté | [BFF_Elearning b1a23e8](https://github.com/mairie360/BFF_Elearning/tree/b1a23e8e577222d656bade5182a7fb4eacdcc088/src) |
| Client API installé | `@mairie360/elearning-api-openapi@0.0.0-dev.1054189c2bdcecf1627dbfafb6283f5c33f0c20c` ; chemin et DTO vérifiés localement, pas appel réseau de validation |
