# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "prod": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "prod_tag": "v0.3.0", "staging": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "updated": {"dev": "2026-10-21 11:11 UTC", "staging": "2026-10-21 11:16 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.3.0 | `322e9d6` | — |
| staging | — | `01faf1c` | 2026-10-21 11:16 UTC |
| dev | — | `01faf1c` | 2026-10-21 11:11 UTC |

## Ajouté sur main depuis la dernière release prod (v0.3.0)

#### Nouveautés
- Le socle d'interface passe à `@mairie360/lib-components` 0.9.0 : thème municipal partagé, lien d'évitement unique placé avant la navigation répétée, états de chargement en squelettes, états de liste vide libellés et accusés de confirmation fermables. (MAIR-526, MAIR-515, MAIR-540, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Changements de comportement
- Le contrat OpenAPI consommé déclare désormais une réponse `429` (limite de débit amont, en-tête `Retry-After`) sur neuf opérations e-learning, avec le schéma `ErrorResponse`. (MAIR-575, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222))

#### Corrections
- Navigation principale de bureau : avant, les règles de style du drawer historique s'appliquaient aussi à la navigation de bureau du shell, la passaient en position relative et repoussaient l'en-tête et le catalogue en dessous. Maintenant, elle reste fixée au bord gauche de la fenêtre et l'en-tête et le contenu sont alignés en haut. (MAIR-526, MAIR-547, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Contrat BFF épinglé à la version 1.1.0 (contenu `contracts/openapi.json` inchangé), puis 0.0.0-staging, 1.0.0 et dev selon les releases ; images des stacks de test alignées sur les versions prod (BFF 1.1.0, core-api 2.2.0, elearning-api 1.2.0, database et liquibase 3.3.0). (MAIR-612, [#241](https://github.com/mairie360/Elearning_Web_Service/pull/241) ; MAIR-600, [#224](https://github.com/mairie360/Elearning_Web_Service/pull/224) ; MAIR-569, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212) ; MAIR-575, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222))
- Le socle partagé passe de `@mairie360/front-kit` (archive vendue) à `@mairie360/lib-components` 0.10.2, avec un test de bundle client et des tests d'intégrité. (MAIR-126, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220))
- Workflows CI : `mairie360/CICD` passe en v4.4.3 avec promotion staging et prod manuelle, permissions de jeton en lecture seule, exécution sur push limitée à `main`, secrets de journal de release transmis. (MAIR-494, [#231](https://github.com/mairie360/Elearning_Web_Service/pull/231) ; MAIR-436, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205) ; MAIR-571, [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214) ; Renovate, [#230](https://github.com/mairie360/Elearning_Web_Service/pull/230), [#233](https://github.com/mairie360/Elearning_Web_Service/pull/233), [#234](https://github.com/mairie360/Elearning_Web_Service/pull/234), [#241](https://github.com/mairie360/Elearning_Web_Service/pull/241))

## Différence dev → staging (en dev, pas encore en staging)

_Rien._

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Le socle d'interface passe à `@mairie360/lib-components` 0.9.0 : thème municipal partagé, lien d'évitement unique placé avant la navigation répétée, états de chargement en squelettes, états de liste vide libellés et accusés de confirmation fermables. (MAIR-526, MAIR-515, MAIR-540, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Changements de comportement
- Le contrat OpenAPI consommé déclare désormais une réponse `429` (limite de débit amont, en-tête `Retry-After`) sur neuf opérations e-learning, avec le schéma `ErrorResponse`. (MAIR-575, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222))

#### Corrections
- Navigation principale de bureau : avant, les règles de style du drawer historique s'appliquaient aussi à la navigation de bureau du shell, la passaient en position relative et repoussaient l'en-tête et le catalogue en dessous. Maintenant, elle reste fixée au bord gauche de la fenêtre et l'en-tête et le contenu sont alignés en haut. (MAIR-526, MAIR-547, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Contrat BFF épinglé à la version 1.1.0 (contenu `contracts/openapi.json` inchangé), puis 0.0.0-staging, 1.0.0 et dev selon les releases ; images des stacks de test alignées sur les versions prod (BFF 1.1.0, core-api 2.2.0, elearning-api 1.2.0, database et liquibase 3.3.0). (MAIR-612, [#241](https://github.com/mairie360/Elearning_Web_Service/pull/241) ; MAIR-600, [#224](https://github.com/mairie360/Elearning_Web_Service/pull/224) ; MAIR-569, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212) ; MAIR-575, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222))
- Le socle partagé passe de `@mairie360/front-kit` (archive vendue) à `@mairie360/lib-components` 0.10.2, avec un test de bundle client et des tests d'intégrité. (MAIR-126, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220))
- Workflows CI : `mairie360/CICD` passe en v4.4.3 avec promotion staging et prod manuelle, permissions de jeton en lecture seule, exécution sur push limitée à `main`, secrets de journal de release transmis. (MAIR-494, [#231](https://github.com/mairie360/Elearning_Web_Service/pull/231) ; MAIR-436, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205) ; MAIR-571, [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214) ; Renovate, [#230](https://github.com/mairie360/Elearning_Web_Service/pull/230), [#233](https://github.com/mairie360/Elearning_Web_Service/pull/233), [#234](https://github.com/mairie360/Elearning_Web_Service/pull/234), [#241](https://github.com/mairie360/Elearning_Web_Service/pull/241))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 11:16 UTC | staging | — | `01faf1c` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39590225259) |
| 2026-10-21 11:11 UTC | dev | — | `01faf1c` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39589446510) |
| 2026-10-21 10:01 UTC | dev | — | `841afb0` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39580562530) |
| 2026-10-21 06:13 UTC | dev | — | `63fc94b` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39553635602) |
| 2026-10-21 01:41 UTC | dev | — | `7161388` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39528109678) |
| 2026-10-21 01:35 UTC | dev | — | `8f25850` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39527801944) |
| 2026-10-20 21:28 UTC | staging | — | `6f7aef7` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39499388823) |
| 2026-10-20 21:24 UTC | dev | — | `6f7aef7` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39499388823) |
| 2026-10-20 13:52 UTC | dev | — | `0474b4c` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39433519951) |
| 2026-10-20 12:23 UTC | dev | — | `36b3cb8` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39421306506) |
| 2026-10-19 22:13 UTC | dev | — | `a2dd9c9` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39332816489) |
| 2026-10-19 21:58 UTC | dev | — | `9cd87f5` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39330915338) |
| 2026-10-19 20:40 UTC | dev | — | `6482090` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39320707529) |
<!-- release-journal-history:end -->
