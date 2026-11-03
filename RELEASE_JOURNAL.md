# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "5ab732c090791598bf943238a56cd432a23bd941", "prod": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "prod_tag": "v0.4.0", "staging": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "updated": {"dev": "2026-11-03 14:57 UTC", "prod": "2026-10-21 11:18 UTC", "staging": "2026-10-21 11:16 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.4.0 | `01faf1c` | 2026-10-21 11:18 UTC |
| staging | — | `01faf1c` | 2026-10-21 11:16 UTC |
| dev | — | `5ab732c` | 2026-11-03 14:57 UTC |

## Ajouté sur main depuis la dernière release prod (v0.4.0)

#### Changements de comportement
- La coque de l'application (barre latérale repliable, barre supérieure, pied de page) vient désormais d'`AccessibleShell` de `@mairie360/lib-components/shell`. Les fichiers locaux `accessible-shell.tsx`, `desktop-navigation.tsx` et `sidebar-preference.ts` sont supprimés. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))
- Le catalogue des formations (cartes, filtres, recherche, détails, formulaire de formation) est rendu par des composants locaux qui s'appuient sur `@mairie360/lib-components` 1.0.3 (0.10.2 auparavant). Les états vides passent par `DataState`, le chargement affiche des `Skeleton`, le formulaire utilise les champs de la lib, « Nouvelle formation » est un `Button` Create, la confirmation un `Toast` Success et l'erreur propose un bouton Réessayer. Le diff ne change ni les routes ni les données ; le rendu reste à vérifier sur la maquette Figma. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Corrections
- Le focus des fenêtres modales est corrigé par la lib 1.0.3 (lib-components#471). Le diff du front ne décrit pas le comportement antérieur. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Technique
- Dépendances et runtime : Next.js 16.3.8 → 16.4.2, Node 24.21.0 → 24.22.1 (image Docker épinglée par digest), jsdom 30.1.3, playwright-core 1.64.1, follow-redirects 1.16.2 (GHSA-mrwp-f3q8-3g9p), mise à jour du lock et Zod vendorisé avec ses garde-fous d'installation (MAIR-744, MAIR-771, MAIR-497, MAIR-316, MAIR-768, MAIR-295, MAIR-244 et Renovate). Le diff de #248 est tronqué : le détail de la validation bornée de Zod n'est pas vérifiable ici. ([#248](https://github.com/mairie360/Elearning_Web_Service/pull/248), [#247](https://github.com/mairie360/Elearning_Web_Service/pull/247), [#259](https://github.com/mairie360/Elearning_Web_Service/pull/259), [#256](https://github.com/mairie360/Elearning_Web_Service/pull/256))
- CI et tests : épinglage de mairie360/CICD (v4.5.0, v4.12.0, v5.1.0, v5.2.2, v5.3.0), stacks RGAA (`accessibility_test.sh`, `docker-compose-accessibility.yml`, `rgaa.yaml`) et stack de simulation RGPD (MAIR-497, [#262](https://github.com/mairie360/Elearning_Web_Service/pull/262)), checklist RGPD sur les PR (MAIR-295, [#175](https://github.com/mairie360/Elearning_Web_Service/pull/175)), vérification des avis npm déplacée dans `upstream-advisories.yml` (MAIR-744, [#259](https://github.com/mairie360/Elearning_Web_Service/pull/259)), et tests de composants en Vitest (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- La coque de l'application (barre latérale repliable, barre supérieure, pied de page) vient désormais d'`AccessibleShell` de `@mairie360/lib-components/shell`. Les fichiers locaux `accessible-shell.tsx`, `desktop-navigation.tsx` et `sidebar-preference.ts` sont supprimés. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))
- Le catalogue des formations (cartes, filtres, recherche, détails, formulaire de formation) est rendu par des composants locaux qui s'appuient sur `@mairie360/lib-components` 1.0.3 (0.10.2 auparavant). Les états vides passent par `DataState`, le chargement affiche des `Skeleton`, le formulaire utilise les champs de la lib, « Nouvelle formation » est un `Button` Create, la confirmation un `Toast` Success et l'erreur propose un bouton Réessayer. Le diff ne change ni les routes ni les données ; le rendu reste à vérifier sur la maquette Figma. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Corrections
- Le focus des fenêtres modales est corrigé par la lib 1.0.3 (lib-components#471). Le diff du front ne décrit pas le comportement antérieur. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Technique
- Dépendances et runtime : Next.js 16.3.8 → 16.4.2, Node 24.21.0 → 24.22.1 (image Docker épinglée par digest), jsdom 30.1.3, playwright-core 1.64.1, follow-redirects 1.16.2 (GHSA-mrwp-f3q8-3g9p), mise à jour du lock et Zod vendorisé avec ses garde-fous d'installation (MAIR-744, MAIR-771, MAIR-497, MAIR-316, MAIR-768, MAIR-295, MAIR-244 et Renovate). Le diff de #248 est tronqué : le détail de la validation bornée de Zod n'est pas vérifiable ici. ([#248](https://github.com/mairie360/Elearning_Web_Service/pull/248), [#247](https://github.com/mairie360/Elearning_Web_Service/pull/247), [#259](https://github.com/mairie360/Elearning_Web_Service/pull/259), [#256](https://github.com/mairie360/Elearning_Web_Service/pull/256))
- CI et tests : épinglage de mairie360/CICD (v4.5.0, v4.12.0, v5.1.0, v5.2.2, v5.3.0), stacks RGAA (`accessibility_test.sh`, `docker-compose-accessibility.yml`, `rgaa.yaml`) et stack de simulation RGPD (MAIR-497, [#262](https://github.com/mairie360/Elearning_Web_Service/pull/262)), checklist RGPD sur les PR (MAIR-295, [#175](https://github.com/mairie360/Elearning_Web_Service/pull/175)), vérification des avis npm déplacée dans `upstream-advisories.yml` (MAIR-744, [#259](https://github.com/mairie360/Elearning_Web_Service/pull/259)), et tests de composants en Vitest (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
