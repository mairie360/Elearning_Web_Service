# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "d9bf625097b892d387ff9e5827cfb7bf6bdf5529", "prod": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "prod_tag": "v0.4.0", "staging": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "updated": {"dev": "2026-11-04 18:23 UTC", "prod": "2026-10-21 11:18 UTC", "staging": "2026-10-21 11:16 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.4.0 | `01faf1c` | 2026-10-21 11:18 UTC |
| staging | — | `01faf1c` | 2026-10-21 11:16 UTC |
| dev | — | `d9bf625` | 2026-11-04 18:23 UTC |

## Ajouté sur main depuis la dernière release prod (v0.4.0)

#### Changements de comportement
- L'interface de l'e-learning affiche désormais le shell `AccessibleShell` de `@mairie360/lib-components/shell` (barre latérale repliable, barre supérieure, pied de page). Les composants locaux `accessible-shell.tsx`, `desktop-navigation.tsx` et `sidebar-preference.ts` sont supprimés. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))
- `@mairie360/lib-components` passe de 0.10.2 à 1.0.3. Le catalogue, les cartes de cours, les fenêtres de détail et de formulaire, les filtres et la notation ne viennent plus de `@mairie360/lib-components/elearning` : ils sont rendus par les composants du front dans `src/components/ElearningModule/`. (MAIR-607 et MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Nouveautés
- Le catalogue affiche un composant d'état vide dédié (`CatalogEmptyState`) et un composant de chargement (`CatalogLoading`). (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Technique
- Chaîne CI : `mairie360/CICD` passe de v4.4.3 à v5.3.1 dans les workflows `cicd.yml`, `promote-*.yml` et `dev-dependency-exception.yml` ; le scan Semgrep et Gitleaks utilise les actions du dépôt CICD ; la checklist RGPD des PR est ajoutée par `gdpr-pr.yml`. (MAIR-295, MAIR-771, [#175](https://github.com/mairie360/Elearning_Web_Service/pull/175), [#260](https://github.com/mairie360/Elearning_Web_Service/pull/260), [#254](https://github.com/mairie360/Elearning_Web_Service/pull/254), [#262](https://github.com/mairie360/Elearning_Web_Service/pull/262))
- Stacks de test : stack d'accessibilité RGAA (`accessibility_test.sh`, `docker-compose-accessibility.yml`, `rgaa.yaml`) et stack de simulation RGPD (`gdpr_simulation_test.sh`, `docker-compose-gdpr-simulation.yml`, `gdpr-journey.yaml`). (MAIR-316, MAIR-768, MAIR-497, [#168](https://github.com/mairie360/Elearning_Web_Service/pull/168), [#254](https://github.com/mairie360/Elearning_Web_Service/pull/254), [#262](https://github.com/mairie360/Elearning_Web_Service/pull/262), [#263](https://github.com/mairie360/Elearning_Web_Service/pull/263))
- npm : `postinstall`, `prebuild` et `pretest` ne contactent plus le service d'avis npm ; la vérification amont passe dans `npm run audit:upstream`, exécutée chaque jour par `upstream-advisories.yml`. (MAIR-744, [#259](https://github.com/mairie360/Elearning_Web_Service/pull/259))
- Dépendances : Next.js 16.3.8 à 16.4.2, image Node 24.22.1 épinglée par digest, `follow-redirects` 1.16.2 (GHSA-mrwp-f3q8-3g9p), `zod` vendorisé avec backport de validation bornée, mises à jour de `jsdom`, `playwright-core` et `@types/node`. ([#247](https://github.com/mairie360/Elearning_Web_Service/pull/247), [#256](https://github.com/mairie360/Elearning_Web_Service/pull/256), [#248](https://github.com/mairie360/Elearning_Web_Service/pull/248), [#246](https://github.com/mairie360/Elearning_Web_Service/pull/246))
- Tests : Vitest et Testing Library pour les composants co-localisés (`npm test` lance aussi `vitest run`) ; `tests/component-tree-convention.test.cjs` vérifie l'arborescence des composants. ([#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- L'interface de l'e-learning affiche désormais le shell `AccessibleShell` de `@mairie360/lib-components/shell` (barre latérale repliable, barre supérieure, pied de page). Les composants locaux `accessible-shell.tsx`, `desktop-navigation.tsx` et `sidebar-preference.ts` sont supprimés. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))
- `@mairie360/lib-components` passe de 0.10.2 à 1.0.3. Le catalogue, les cartes de cours, les fenêtres de détail et de formulaire, les filtres et la notation ne viennent plus de `@mairie360/lib-components/elearning` : ils sont rendus par les composants du front dans `src/components/ElearningModule/`. (MAIR-607 et MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Nouveautés
- Le catalogue affiche un composant d'état vide dédié (`CatalogEmptyState`) et un composant de chargement (`CatalogLoading`). (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Technique
- Chaîne CI : `mairie360/CICD` passe de v4.4.3 à v5.3.1 dans les workflows `cicd.yml`, `promote-*.yml` et `dev-dependency-exception.yml` ; le scan Semgrep et Gitleaks utilise les actions du dépôt CICD ; la checklist RGPD des PR est ajoutée par `gdpr-pr.yml`. (MAIR-295, MAIR-771, [#175](https://github.com/mairie360/Elearning_Web_Service/pull/175), [#260](https://github.com/mairie360/Elearning_Web_Service/pull/260), [#254](https://github.com/mairie360/Elearning_Web_Service/pull/254), [#262](https://github.com/mairie360/Elearning_Web_Service/pull/262))
- Stacks de test : stack d'accessibilité RGAA (`accessibility_test.sh`, `docker-compose-accessibility.yml`, `rgaa.yaml`) et stack de simulation RGPD (`gdpr_simulation_test.sh`, `docker-compose-gdpr-simulation.yml`, `gdpr-journey.yaml`). (MAIR-316, MAIR-768, MAIR-497, [#168](https://github.com/mairie360/Elearning_Web_Service/pull/168), [#254](https://github.com/mairie360/Elearning_Web_Service/pull/254), [#262](https://github.com/mairie360/Elearning_Web_Service/pull/262), [#263](https://github.com/mairie360/Elearning_Web_Service/pull/263))
- npm : `postinstall`, `prebuild` et `pretest` ne contactent plus le service d'avis npm ; la vérification amont passe dans `npm run audit:upstream`, exécutée chaque jour par `upstream-advisories.yml`. (MAIR-744, [#259](https://github.com/mairie360/Elearning_Web_Service/pull/259))
- Dépendances : Next.js 16.3.8 à 16.4.2, image Node 24.22.1 épinglée par digest, `follow-redirects` 1.16.2 (GHSA-mrwp-f3q8-3g9p), `zod` vendorisé avec backport de validation bornée, mises à jour de `jsdom`, `playwright-core` et `@types/node`. ([#247](https://github.com/mairie360/Elearning_Web_Service/pull/247), [#256](https://github.com/mairie360/Elearning_Web_Service/pull/256), [#248](https://github.com/mairie360/Elearning_Web_Service/pull/248), [#246](https://github.com/mairie360/Elearning_Web_Service/pull/246))
- Tests : Vitest et Testing Library pour les composants co-localisés (`npm test` lance aussi `vitest run`) ; `tests/component-tree-convention.test.cjs` vérifie l'arborescence des composants. ([#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
