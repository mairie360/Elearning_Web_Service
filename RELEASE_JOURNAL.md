# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "44be9c80b17ec72d18488a08493e20089817e3d6", "prod": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "prod_tag": "v0.4.0", "staging": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "updated": {"dev": "2026-11-04 18:29 UTC", "prod": "2026-10-21 11:18 UTC", "staging": "2026-10-21 11:16 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.4.0 | `01faf1c` | 2026-10-21 11:18 UTC |
| staging | — | `01faf1c` | 2026-10-21 11:16 UTC |
| dev | — | `44be9c8` | 2026-11-04 18:29 UTC |

## Ajouté sur main depuis la dernière release prod (v0.4.0)

#### Changements de comportement

- Le shell (barre latérale repliable, barre du haut, pied de page) vient désormais de `@mairie360/lib-components/shell`. Les fichiers locaux `accessible-shell.tsx`, `desktop-navigation.tsx` et `sidebar-preference.ts` sont supprimés. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))
- Le module e-learning (catalogue, fiches de cours, formulaire de cours) est rendu par des composants locaux de `src/components/ElearningModule/`. `@mairie360/lib-components` passe en 1.0.3 et `@mairie360/lib-components/elearning` n'est plus importé. D'après la description de la PR, les états vides passent par `DataState` et les cartes en chargement par `Skeleton` ; le diff est tronqué, ce point n'est pas vérifié ligne à ligne. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Corrections

- `npm ci` dépendait du service d'avis npm : le `postinstall` l'interrogeait, donc l'installation échouait hors ligne, pendant une panne, ou dès qu'un avis zod était modifié. Maintenant, `postinstall`, `prebuild` et `pretest` ne vérifient que l'intégrité locale ; l'audit amont passe dans `npm run audit:upstream`, lancé chaque jour par `upstream-advisories.yml` hors PR. (MAIR-744, [#259](https://github.com/mairie360/Elearning_Web_Service/pull/259))
- `npm audit --omit=dev` échouait à cause de `follow-redirects` 1.16.0 à 1.16.1 (GHSA-mrwp-f3q8-3g9p) : le lock résout désormais 1.16.2. (sans clé Jira, [#256](https://github.com/mairie360/Elearning_Web_Service/pull/256))
- Le scan Gitleaks du commit squashé sur main échouait à cause de 5 empreintes de `.gitleaksignore` liées à un commit de la branche. `.gitleaks.toml` remplace ce fichier et n'autorise que les digests SHA-256 de `vendor/security-patches.json` pour la règle `generic-api-key`. (MAIR-743, [#265](https://github.com/mairie360/Elearning_Web_Service/pull/265))

#### Technique

- Pins et dépendances : mairie360/CICD passe de v4.4.3 à v5.3.1 ; Node 24.22.1 avec image Bookworm-slim figée ; Next 16.4.2 ; jsdom 30.1.3 ; playwright-core 1.64.1. (#245, #246, #247, #250, #260, #263)
- Stacks de test RGAA et RGPD (`accessibility_test.sh`, `gdpr_simulation_test.sh`, leurs compose et YAML) : outils de test, rien dans le service livré. (#168, #254, #262, #263)
- Backport zod vendorisé dans `vendor/zod`, check « GDPR checklist » sur les PR (`gdpr-pr.yml`, MAIR-295, [#175](https://github.com/mairie360/Elearning_Web_Service/pull/175)), et garde-fous de tests de politique CI.

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement

- Le shell (barre latérale repliable, barre du haut, pied de page) vient désormais de `@mairie360/lib-components/shell`. Les fichiers locaux `accessible-shell.tsx`, `desktop-navigation.tsx` et `sidebar-preference.ts` sont supprimés. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))
- Le module e-learning (catalogue, fiches de cours, formulaire de cours) est rendu par des composants locaux de `src/components/ElearningModule/`. `@mairie360/lib-components` passe en 1.0.3 et `@mairie360/lib-components/elearning` n'est plus importé. D'après la description de la PR, les états vides passent par `DataState` et les cartes en chargement par `Skeleton` ; le diff est tronqué, ce point n'est pas vérifié ligne à ligne. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Corrections

- `npm ci` dépendait du service d'avis npm : le `postinstall` l'interrogeait, donc l'installation échouait hors ligne, pendant une panne, ou dès qu'un avis zod était modifié. Maintenant, `postinstall`, `prebuild` et `pretest` ne vérifient que l'intégrité locale ; l'audit amont passe dans `npm run audit:upstream`, lancé chaque jour par `upstream-advisories.yml` hors PR. (MAIR-744, [#259](https://github.com/mairie360/Elearning_Web_Service/pull/259))
- `npm audit --omit=dev` échouait à cause de `follow-redirects` 1.16.0 à 1.16.1 (GHSA-mrwp-f3q8-3g9p) : le lock résout désormais 1.16.2. (sans clé Jira, [#256](https://github.com/mairie360/Elearning_Web_Service/pull/256))
- Le scan Gitleaks du commit squashé sur main échouait à cause de 5 empreintes de `.gitleaksignore` liées à un commit de la branche. `.gitleaks.toml` remplace ce fichier et n'autorise que les digests SHA-256 de `vendor/security-patches.json` pour la règle `generic-api-key`. (MAIR-743, [#265](https://github.com/mairie360/Elearning_Web_Service/pull/265))

#### Technique

- Pins et dépendances : mairie360/CICD passe de v4.4.3 à v5.3.1 ; Node 24.22.1 avec image Bookworm-slim figée ; Next 16.4.2 ; jsdom 30.1.3 ; playwright-core 1.64.1. (#245, #246, #247, #250, #260, #263)
- Stacks de test RGAA et RGPD (`accessibility_test.sh`, `gdpr_simulation_test.sh`, leurs compose et YAML) : outils de test, rien dans le service livré. (#168, #254, #262, #263)
- Backport zod vendorisé dans `vendor/zod`, check « GDPR checklist » sur les PR (`gdpr-pr.yml`, MAIR-295, [#175](https://github.com/mairie360/Elearning_Web_Service/pull/175)), et garde-fous de tests de politique CI.

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-04 18:29 UTC | dev | — | `44be9c8` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/41884403650) |
| 2026-11-04 18:23 UTC | dev | — | `d9bf625` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/41882982754) |
| 2026-11-03 14:57 UTC | dev | — | `5ab732c` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/41656764278) |
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
