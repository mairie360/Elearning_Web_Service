# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "81059391da5098c0f9db81228d4230cfefbdc473", "prod": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "prod_tag": "v0.4.0", "staging": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "updated": {"dev": "2026-11-02 22:59 UTC", "prod": "2026-10-21 11:18 UTC", "staging": "2026-10-21 11:16 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.4.0 | `01faf1c` | 2026-10-21 11:18 UTC |
| staging | — | `01faf1c` | 2026-10-21 11:16 UTC |
| dev | — | `8105939` | 2026-11-02 22:59 UTC |

## Ajouté sur main depuis la dernière release prod (v0.4.0)

#### Nouveautés
- Le catalogue e-learning affiche les états vides via `DataState`, les cartes en chargement via des `Skeleton`, et une confirmation par Toast (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).

#### Changements de comportement
- La coquille de navigation (barre latérale, barre du haut, pied de page) vient désormais de `@mairie360/lib-components/shell` (`AccessibleShell`) ; les fichiers locaux `accessible-shell.tsx`, `desktop-navigation.tsx` et `sidebar-preference.ts` sont supprimés (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).
- `@mairie360/lib-components` passe de 0.10.2 à 1.0.3 ; les composants `ElearningCatalog` et ses sous-composants quittent la bibliothèque pour `src/components/ElearningModule/`. Changement de rupture pour les consommateurs de la lib (`feat!`) (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).

#### Corrections
- Modale : le correctif de focus de mairie360/lib-components#471 est repris par la lib 1.0.x utilisée par ce front (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).

#### Technique
- Mise à jour de mairie360/CICD jusqu'à v5.2.2 dans `cicd.yml`, `gdpr-pr.yml`, `promote-staging.yml`, `promote-prod.yml` et `dev-dependency-exception.yml`, avec tests de pin (MAIR-771, [#260](https://github.com/mairie360/Elearning_Web_Service/pull/260)).
- Le `postinstall`, `prebuild` et `pretest` ne interrogent plus le service d'avis npm ; la vérification amont passe dans `npm run audit:upstream` et un workflow planifié `upstream-advisories.yml` (MAIR-744, [#259](https://github.com/mairie360/Elearning_Web_Service/pull/259)).
- Mise à jour de `follow-redirects` vers 1.16.2 dans le lock (GHSA-mrwp-f3q8-3g9p, [#256](https://github.com/mairie360/Elearning_Web_Service/pull/256)).
- Alignement de la pile d'accessibilité RGAA : rapport vidé à chaque run, verrou `flock`, délais bornés sur les sondes de disponibilité (MAIR-768, [#254](https://github.com/mairie360/Elearning_Web_Service/pull/254)).
- Pile RGAA ajoutée au dépôt (`accessibility_test.sh`, `docker-compose-accessibility.yml`, `rgaa.yaml`, `init-accessibility.sql`), CICD épinglé à v5.1.0 à cette étape (MAIR-316, [#168](https://github.com/mairie360/Elearning_Web_Service/pull/168)).
- Checklist RGPD sur les PR via `gdpr-pr.yml`, avec Renovate qui suit la version CICD (MAIR-295, [#175](https://github.com/mairie360/Elearning_Web_Service/pull/175)).
- Renovate : CICD v4.5.0 puis v4.12.0 (#245, #250) ; mises à jour TypeScript, jsdom 30.1.3 et playwright-core 1.64.1 (#246).
- Node 24.22.1 et Next.js 16.4.2 (correctif de sécurité GHSA-673q-mjm6-r5xr), image Node épinglée par digest (#247).
- Dépendances zod vendorisée avec validation bornée des collections, réparation des locks, vérification de provenance du bundle pour la baseline de performance (MAIR-?, [#248](https://github.com/mairie360/Elearning_Web_Service/pull/248)).
- Tests Vitest/jsdom des composants co-localisés et règle d'arborescence des composants (`tests/component-tree-convention.test.cjs`) (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- Le catalogue e-learning affiche les états vides via `DataState`, les cartes en chargement via des `Skeleton`, et une confirmation par Toast (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).

#### Changements de comportement
- La coquille de navigation (barre latérale, barre du haut, pied de page) vient désormais de `@mairie360/lib-components/shell` (`AccessibleShell`) ; les fichiers locaux `accessible-shell.tsx`, `desktop-navigation.tsx` et `sidebar-preference.ts` sont supprimés (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).
- `@mairie360/lib-components` passe de 0.10.2 à 1.0.3 ; les composants `ElearningCatalog` et ses sous-composants quittent la bibliothèque pour `src/components/ElearningModule/`. Changement de rupture pour les consommateurs de la lib (`feat!`) (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).

#### Corrections
- Modale : le correctif de focus de mairie360/lib-components#471 est repris par la lib 1.0.x utilisée par ce front (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).

#### Technique
- Mise à jour de mairie360/CICD jusqu'à v5.2.2 dans `cicd.yml`, `gdpr-pr.yml`, `promote-staging.yml`, `promote-prod.yml` et `dev-dependency-exception.yml`, avec tests de pin (MAIR-771, [#260](https://github.com/mairie360/Elearning_Web_Service/pull/260)).
- Le `postinstall`, `prebuild` et `pretest` ne interrogent plus le service d'avis npm ; la vérification amont passe dans `npm run audit:upstream` et un workflow planifié `upstream-advisories.yml` (MAIR-744, [#259](https://github.com/mairie360/Elearning_Web_Service/pull/259)).
- Mise à jour de `follow-redirects` vers 1.16.2 dans le lock (GHSA-mrwp-f3q8-3g9p, [#256](https://github.com/mairie360/Elearning_Web_Service/pull/256)).
- Alignement de la pile d'accessibilité RGAA : rapport vidé à chaque run, verrou `flock`, délais bornés sur les sondes de disponibilité (MAIR-768, [#254](https://github.com/mairie360/Elearning_Web_Service/pull/254)).
- Pile RGAA ajoutée au dépôt (`accessibility_test.sh`, `docker-compose-accessibility.yml`, `rgaa.yaml`, `init-accessibility.sql`), CICD épinglé à v5.1.0 à cette étape (MAIR-316, [#168](https://github.com/mairie360/Elearning_Web_Service/pull/168)).
- Checklist RGPD sur les PR via `gdpr-pr.yml`, avec Renovate qui suit la version CICD (MAIR-295, [#175](https://github.com/mairie360/Elearning_Web_Service/pull/175)).
- Renovate : CICD v4.5.0 puis v4.12.0 (#245, #250) ; mises à jour TypeScript, jsdom 30.1.3 et playwright-core 1.64.1 (#246).
- Node 24.22.1 et Next.js 16.4.2 (correctif de sécurité GHSA-673q-mjm6-r5xr), image Node épinglée par digest (#247).
- Dépendances zod vendorisée avec validation bornée des collections, réparation des locks, vérification de provenance du bundle pour la baseline de performance (MAIR-?, [#248](https://github.com/mairie360/Elearning_Web_Service/pull/248)).
- Tests Vitest/jsdom des composants co-localisés et règle d'arborescence des composants (`tests/component-tree-convention.test.cjs`) (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-02 22:59 UTC | dev | — | `8105939` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/41540142814) |
| 2026-11-02 19:53 UTC | dev | — | `718ab46` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/41513014827) |
| 2026-11-02 18:21 UTC | dev | — | `eab212c` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/41470529217) |
| 2026-10-23 13:05 UTC | dev | — | `a57e4bd` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39957326316) |
| 2026-10-21 18:00 UTC | dev | — | `3a65d6f` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39647858939) |
| 2026-10-21 11:18 UTC | prod | v0.4.0 | `01faf1c` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39590823142) |
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
