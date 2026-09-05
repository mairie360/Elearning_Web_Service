# Backend — Formation

Correspondance front/BFF : [BFF.md](BFF.md). Référentiel de besoins harmonisé le 5 septembre 2026. Documentation uniquement : aucune route ni migration n'est créée par ces fichiers. Les chemins BFF sont relatifs au service indiqué, pas au préfixe des proxies Next.js ; les chemins backend conservent leurs préfixes réels.

`Existant` : déclaré dans les sources locales ; `Partiel` : route présente mais données manquantes, SQL direct ou mémoire ; `Client généré` : chemin observé dans le client installé, déploiement non vérifié ; `Proposé` : contrat cible à implémenter/valider. Pour les tables, `SQL observé` ne prouve pas qu'une migration est déployée.

Les tables sont des sources ou des besoins cibles, pas un script SQL. Les références interservices (`user_id`, `file_id`, etc.) sont logiques : elles n'imposent pas de clé étrangère entre bases distinctes. Les BFF doivent à terme passer par les API propriétaires ; les accès SQL directs et replis mémoire actuels sont signalés. Les permissions restent contrôlées par le serveur.

## Tables communes

| Table / source propriétaire | Clés et données nécessaires | État |
| --- | --- | --- |
| Core `users` | `id` ; `first_name`, `last_name`, `email`, `phone_number`, `status`, `is_archived`, `first_connect`. `password` reste exclusivement côté serveur | SQL observé |
| Core `roles`, `user_roles` | `roles.id`, `roles.name` ; association `user_roles(user_id, role_id)` vers `users.id` et `roles.id` | SQL observé |
| Core `groups`, `group_users` | `groups.id`, `owner_id`, `name`, `description` ; association `group_users(group_id, user_id)` ; nomenclature cible commune basée sur Core | SQL observé dans Core ; divergence `group_members` dans les BFF User/Calendar/Project à résoudre, pas une seconde table cible |
| Core `sessions` | `id`, `user_id`, `created_at`, `expires_at`, `device_info`, `ip_address`, `revoked_at` ; `token_hash` interne, jamais exposé. Dernière connexion dérivée des sessions, pas de la date courante | SQL observé ; vue `v_sessions` utilisée par Core |
| Core `user_profiles` | `user_id` unique vers `users.id` ; `avatar_file_id` vers Files `files.id`, `service_id` vers `services.id`, `position`, `biography` ; `address`, `city` seulement pour compatibilité des anciens profils | Proposé ; ne pas dupliquer identité, mot de passe ou rôles |
| Core `services` | `id`, `code` unique, `name`, `active` ; même annuaire pour Paramètres, Administration, Calendrier, contacts et membres de projets | Proposé ; distinct des groupes d'habilitation |
| Core `notifications` | `id`, `user_id`, `type`, `title`, `body`, `resource_type`, `resource_id`, `created_at`, `read_at` ; source du compteur commun | Proposé ; distinct des préférences `user_notification_settings` |

## Tables du module

| Table / source propriétaire | Clés et données nécessaires | État |
| --- | --- | --- |
| Elearning `formations` | `id`, `name`, `description`, `instructor_id` vers Core users, `category_id`, `level`, `mandatory`, `deadline`, `created_at`, `updated_at` | Cible proposée ; DTO formation existant, schéma SQL non vérifié |
| Elearning `formation_categories` | `id`, `code`, `name`, `active` | Proposé ; catégories de formation, distinctes de services et catégories documentaires |
| Elearning `formation_modules` | `id`, `formation_id`, `name`, `description`, `position`, `duration_seconds` | Cible proposée ; modules/chapitres du client API, pas Core modules |
| Elearning `formation_contents` | `id`, `module_id`, `title`, `description`, `type`, `file_id` vers Files ou `href`, `position`, `duration_seconds`, `required` | Cible proposée ; description/durée/required manquent au client fichier actuel |
| Elearning `formation_enrollments` | Clé `(formation_id, user_id)` ; `progress_status`, `started_at`, `completed_at`, échéance individuelle éventuelle | Cible proposée ; DTO progression existant, persistance BFF absente |
| Elearning `formation_module_progress`, `formation_content_progress` | Clés `(module_id, user_id)` et `(content_id, user_id)` ; état terminé et horodatage | Cible proposée ; API actuelle complète un module, pas un contenu isolé |
| Elearning `formation_ratings` | Clé `(formation_id, user_id)`, note 1–5, created_at/updated_at ; moyenne/distribution calculées | Proposé |
| Elearning `certifications` | `id`, `formation_id`, `user_id`, `issued_at`, `expires_at`, référence de justificatif éventuelle | Proposé ; remplace le compteur statique |
| Files `files` | `id`, `name`, `mime_type`, `size_bytes`, `storage_key`, `owner_id` ; formation_contents.file_id vers cette même source | Proposé ; nom physique du stockage Elearning existant non vérifié |

## Routes backend communes

| Méthode | Service et route backend | Tables / source | État |
| --- | --- | --- | --- |
| GET | Core `/api/v1/user/me/` | `users`, `roles`, `user_roles` ; cible : `user_profiles`, `services`, `sessions` | Existant ; enrichissement proposé (notamment `id`, absent de GetMeResponseView local) |
| PATCH | Core `/api/v1/user/me/` | `users` ; cible : `user_profiles` | Existant pour prénom, nom, e-mail, téléphone ; extension proposée pour le profil |
| GET | Core `/api/v1/groups/` | `groups`, `group_users` | Existant ; groupes de l'appelant |
| GET | Core `/api/v1/sessions/` | `sessions`, vue `v_sessions` | Existant ; sessions de l'appelant |
| GET | Core `/api/v1/sessions/history` | `sessions`, vue `v_sessions` | Existant ; historique de l'appelant |
| POST | Core `/api/v1/sessions/refresh` | `sessions` ; entrée `refresh_token` | Existant |
| POST | Core `/api/v1/sessions/revoke` | `sessions` ; entrée `refresh_token` | Existant ; ce n'est pas une révocation par `sessionId` |
| DELETE | Core `/api/v1/sessions/{sessionId}` | `sessions` ; session appartenant à l'appelant | Proposé pour la déconnexion d'un autre appareil, sans exposer son refresh token |
| GET | Core `/api/v1/services/` | `services` | Proposé ; annuaire unique |
| GET | Core `/api/v1/users/directory/` | `users`, `user_profiles`, `services`, `roles`, `user_roles`, `groups`, `group_users` | Proposé ; annuaire limité au périmètre autorisé |
| GET | Core `/api/v1/user/me/notifications/` | `notifications` ; filtre utilisateur connecté | Proposé |
| PATCH | Core `/api/v1/user/me/notifications/{notificationId}/read` | `notifications.read_at` ; filtre utilisateur connecté | Proposé |

## Routes backend du module

| Méthode | Service et route backend | Tables / source | État |
| --- | --- | --- | --- |
| GET | Elearning `/v1/formations/` | Cible `formations`, `formation_enrollments` | Client généré ; non branché au catalogue BFF |
| GET | Elearning `/v1/formations/{formationId}/` | Cible `formations`, `formation_modules`, `formation_module_progress` | Client généré |
| GET | Elearning `/v1/formations/{formationId}/{moduleId}/` | Cible `formation_contents`, `formation_content_progress`, Files `files` | Client généré ; type fichier Video/Pdf/Error limité |
| PATCH | Elearning `/v1/formations/{formationId}/{moduleId}/` | Cible `formation_module_progress` | Client généré ; complétion d'un module, pas d'un contenu isolé |
| GET | Elearning `/v1/admin/formations/` | Cible `formations`, `formation_modules`, `formation_contents` | Client généré |
| GET | Elearning `/v1/admin/formations/{formationId}` | Cible `formations`, `formation_modules`, `formation_contents` | Client généré |
| POST | Elearning `/v1/admin/formations/{formationId}` | Cible `formation_enrollments` ; utilisateurs fournis | Client généré : inscription d'utilisateurs, pas création/modification de formation |
| GET | Elearning `/v1/admin/users/` | Utilisateurs inscrits / identités Core | Client généré ; pas un second annuaire propriétaire |
| GET | Elearning `/v1/admin/users/{userId}/` | Cible `formation_enrollments`, `formations` | Client généré |
| GET, DELETE | Elearning `/v1/admin/users/{userId}/{formationId}` | Cible `formation_enrollments`, `formation_module_progress`, `formation_content_progress` | Client généré ; lecture progression / désinscription |
| POST | Elearning `/v1/admin/formations/` | Cible `formations`, `formation_modules`, `formation_contents` | Proposé ; création de formation |
| PATCH, DELETE | Elearning `/v1/admin/formations/{formationId}` | Cible `formations`, `formation_modules`, `formation_contents`, inscriptions selon politique | Proposé ; distinct du POST d'inscription existant |
| POST | Elearning `/v1/formations/{formationId}/start` | `formation_enrollments` ; identité utilisateur issue de la session | Proposé |
| POST | Elearning `/v1/formations/{formationId}/contents/{contentId}/complete` | `formation_content_progress`, `formation_module_progress`, `formation_enrollments` | Proposé ; agrégation de progression persistée |
| POST | Elearning `/v1/formations/{formationId}/ratings` | `formation_ratings` | Proposé |
| GET | Elearning `/v1/users/me/certifications` | `certifications`, `formation_enrollments` | Proposé |
| GET | Files `/api/v1/files/{fileId}/content` | `files`, stockage objet ; droit d'accès à la formation vérifié avant délégation | Proposé ; même route que Fichiers |

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
