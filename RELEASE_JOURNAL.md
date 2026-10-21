# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "7161388e038b05e0a48d3c70de586d66bd532bf0", "prod": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "prod_tag": "v0.3.0", "staging": "6f7aef7f9baa5592726ddfcf4bb6377b4faf7041", "updated": {"dev": "2026-10-21 01:41 UTC", "staging": "2026-10-20 21:28 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.3.0 | `322e9d6` | — |
| staging | — | `6f7aef7` | 2026-10-20 21:28 UTC |
| dev | — | `7161388` | 2026-10-21 01:41 UTC |

## Ajouté sur main depuis la dernière release prod (v0.3.0)

#### Nouveautés
- Un lien d'évitement (skip link) précède désormais la navigation répétée et cible l'unique zone principale de la page. Le chargement affiche des placeholders partagés (`Skeleton`), et, selon la description de la PR, les résultats vides sont libellés et les confirmations d'action se ferment. (MAIR-526, MAIR-515, MAIR-540, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Changements de comportement
- Un push sur `main` ne lance plus que la release dev : staging et prod se lancent à la main avec `promote-staging.yml` et `promote-prod.yml` (`workflow_dispatch`, `-f sha=<sha>` optionnel, approbation des environnements `Staging` et `Prod` maintenue). (MAIR-494, [#231](https://github.com/mairie360/Elearning_Web_Service/pull/231))
- Le thème municipal local `src/app/municipal-theme.css` est supprimé. L'apparence vient désormais de la feuille publiée `@mairie360/lib-components/styles.css` (0.9.0, puis 0.10.2), donc les couleurs et l'aspect des écrans changent. (MAIR-526, MAIR-515, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Corrections
- Navigation desktop : avant, les règles de la barre latérale historique s'appliquaient aussi à la navigation desktop du shell et la passaient en `position: relative`, si bien que le header et le catalogue descendaient sous elle. Maintenant la navigation reste fixée au bord de la fenêtre et le header et le contenu principal sont alignés en haut. (MAIR-526, MAIR-547, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Contrat BFF_Elearning passé à la version `1.0.0` (commit `34ef96d`, contenu inchangé). Les stacks de test passent aux releases prod : core-api `2.1.0`, database et liquibase `3.2.0`, elearning-api `1.1.0`. (MAIR-569, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212))
- Contrat épinglé sur des paquets `0.0.0-dev` puis `0.0.0-staging` (commit `55dfd4b`), avec `staging-<sha7>` dans les stacks et la politique de version mise à jour. Le contrat ajoute des réponses `429` à plusieurs opérations (neuf blocs dans le diff). (MAIR-575, MAIR-600, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222), [#224](https://github.com/mairie360/Elearning_Web_Service/pull/224))
- Remplacement de `@mairie360/front-kit` (archive vendorée supprimée) par les sous-chemins de `@mairie360/lib-components` 0.10.2. Ajout de `test:bundle`, lancé après le build de performance, pour vérifier le contenu du bundle client. (MAIR-126, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220))
- Pipeline CICD mis à jour par étapes : v4.3.1 avec secrets du journal de release, v4.3.2 avec épinglage par SHA et commentaire de tag suivi par Renovate, et tests `cicd-pin` associés. (MAIR-571, [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214), [#218](https://github.com/mairie360/Elearning_Web_Service/pull/218), [#230](https://github.com/mairie360/Elearning_Web_Service/pull/230))
- CI durcie : jeton en lecture seule par défaut, écriture réservée au job d'appel du pipeline réutilisable, et `push` limité à `main` (les branches de PR ne tournent plus deux fois). (MAIR-436, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205))
- Mise à jour de la documentation (`CLAUDE.md`, `docs/en|fr/technical.md`, `BFF.md`) et des tests de politique associés.

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Un push sur `main` ne lance plus que la release dev. Staging et prod se lancent à la main avec les workflows `promote-staging.yml` et `promote-prod.yml` (`gh workflow run ... -f sha=<sha>` optionnel, contrôles et approbations des environnements). (MAIR-494, [#231](https://github.com/mairie360/Elearning_Web_Service/pull/231))

#### Technique
- CICD passe à `mairie360/CICD` v4.4.0 (commit `038bd5b`) dans `cicd.yml`, `dev-dependency-exception.yml` et les deux nouveaux workflows de promotion. Renovate regroupe la mise à jour et le test `cicd-pin` vérifie les 8 références. (MAIR-494, [#230](https://github.com/mairie360/Elearning_Web_Service/pull/230), [#231](https://github.com/mairie360/Elearning_Web_Service/pull/231))

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Un lien d'évitement (skip link) précède désormais la navigation répétée et cible l'unique zone principale de la page. Le chargement affiche des placeholders partagés (`Skeleton`), et, selon la description de la PR, les résultats vides sont libellés et les confirmations d'action se ferment. (MAIR-526, MAIR-515, MAIR-540, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Changements de comportement
- Le thème municipal local `src/app/municipal-theme.css` est supprimé. L'apparence vient désormais de la feuille publiée `@mairie360/lib-components/styles.css` (0.9.0, puis 0.10.2), donc les couleurs et l'aspect des écrans changent. (MAIR-526, MAIR-515, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Corrections
- Navigation desktop : avant, les règles de la barre latérale historique s'appliquaient aussi à la navigation desktop du shell et la passaient en `position: relative`, si bien que le header et le catalogue descendaient sous elle. Maintenant la navigation reste fixée au bord de la fenêtre et le header et le contenu principal sont alignés en haut. (MAIR-526, MAIR-547, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Contrat BFF_Elearning passé à la version `1.0.0` (commit `34ef96d`, contenu inchangé). Les stacks de test passent aux releases prod : core-api `2.1.0`, database et liquibase `3.2.0`, elearning-api `1.1.0`. (MAIR-569, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212))
- Contrat épinglé sur des paquets `0.0.0-dev` puis `0.0.0-staging` (commit `55dfd4b`), avec `staging-<sha7>` dans les stacks et la politique de version mise à jour. Le contrat ajoute des réponses `429` à plusieurs opérations (neuf blocs dans le diff). (MAIR-575, MAIR-600, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222), [#224](https://github.com/mairie360/Elearning_Web_Service/pull/224))
- Remplacement de `@mairie360/front-kit` (archive vendorée supprimée) par les sous-chemins de `@mairie360/lib-components` 0.10.2. Ajout de `test:bundle`, lancé après le build de performance, pour vérifier le contenu du bundle client. (MAIR-126, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220))
- Pipeline CICD mis à jour par étapes : v4.3.1 avec secrets du journal de release, puis v4.3.2 avec épinglage par SHA et commentaire de tag suivi par Renovate, et tests `cicd-pin` associés. (MAIR-571, [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214), [#218](https://github.com/mairie360/Elearning_Web_Service/pull/218))
- CI durcie : jeton en lecture seule par défaut, écriture réservée au job d'appel du pipeline réutilisable, et `push` limité à `main` (les branches de PR ne tournent plus deux fois). (MAIR-436, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205))
- Mise à jour de la documentation (`CLAUDE.md`, `docs/en|fr/technical.md`, `BFF.md`) et des tests de politique associés.

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
