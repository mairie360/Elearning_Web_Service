# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "3a65d6ff8b4f23dd9f6e91737924b89549c867fb", "prod": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "prod_tag": "v0.4.0", "staging": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "updated": {"dev": "2026-10-21 18:00 UTC", "prod": "2026-10-21 11:18 UTC", "staging": "2026-10-21 11:16 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.4.0 | `01faf1c` | 2026-10-21 11:18 UTC |
| staging | — | `01faf1c` | 2026-10-21 11:16 UTC |
| dev | — | `3a65d6f` | 2026-10-21 18:00 UTC |

## Ajouté sur main depuis la dernière release prod (v0.4.0)

#### Changements de comportement
- La bibliothèque partagée passe à `@mairie360/lib-components` 1.0.3 (diff du `package.json`, la description de la PR annonce 1.0.1) : la charte, les tailles et les composants partagés des fronts (champs, boutons, toasts, squelettes de chargement) sont normalisés. Le diff est tronqué, donc l'effet écran par écran reste à vérifier. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))
- Le shell (barre latérale, barre supérieure, pied de page) vient de `@mairie360/lib-components/shell` : `AccessibleShell` et `configureSidebarCookieDomain` remplacent les fichiers locaux `accessible-shell.tsx`, `desktop-navigation.tsx` et `sidebar-preference.ts`, supprimés. La navigation de bureau locale n'existe plus ; son rendu final dépend de la lib. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))
- `src/app/globals.css` perd 29 lignes de styles, sans que le diff tronqué permette de confirmer l'effet visuel. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Technique
- Le catalogue `ElearningCatalog` (formulaire, détail, cartes, filtres) est recopié depuis la lib dans `src/components/ElearningModule/`, découpé en un dossier par composant avec tests co-localisés (Vitest + jsdom), et la convention d'arbre est testée par `tests/component-tree-convention.test.cjs`. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))
- Scripts de couverture et `vitest.config.mjs` mis à jour pour exclure les fichiers de test ; documentation et `tsconfig` ajustés en conséquence.

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- La bibliothèque partagée passe à `@mairie360/lib-components` 1.0.3 (diff du `package.json`, la description de la PR annonce 1.0.1) : la charte, les tailles et les composants partagés des fronts (champs, boutons, toasts, squelettes de chargement) sont normalisés. Le diff est tronqué, donc l'effet écran par écran reste à vérifier. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))
- Le shell (barre latérale, barre supérieure, pied de page) vient de `@mairie360/lib-components/shell` : `AccessibleShell` et `configureSidebarCookieDomain` remplacent les fichiers locaux `accessible-shell.tsx`, `desktop-navigation.tsx` et `sidebar-preference.ts`, supprimés. La navigation de bureau locale n'existe plus ; son rendu final dépend de la lib. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))
- `src/app/globals.css` perd 29 lignes de styles, sans que le diff tronqué permette de confirmer l'effet visuel. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Technique
- Le catalogue `ElearningCatalog` (formulaire, détail, cartes, filtres) est recopié depuis la lib dans `src/components/ElearningModule/`, découpé en un dossier par composant avec tests co-localisés (Vitest + jsdom), et la convention d'arbre est testée par `tests/component-tree-convention.test.cjs`. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))
- Scripts de couverture et `vitest.config.mjs` mis à jour pour exclure les fichiers de test ; documentation et `tsconfig` ajustés en conséquence.

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
