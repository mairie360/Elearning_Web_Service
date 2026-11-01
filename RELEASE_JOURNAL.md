# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "a57e4bd84ba4d0f97eeaed97ce8093fc11a8d620", "prod": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "prod_tag": "v0.4.0", "staging": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "updated": {"dev": "2026-10-23 13:05 UTC", "prod": "2026-10-21 11:18 UTC", "staging": "2026-10-21 11:16 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.4.0 | `01faf1c` | 2026-10-21 11:18 UTC |
| staging | — | `01faf1c` | 2026-10-21 11:16 UTC |
| dev | — | `a57e4bd` | 2026-10-23 13:05 UTC |

## Ajouté sur main depuis la dernière release prod (v0.4.0)

#### Nouveautés
- Pendant le chargement, le catalogue affiche des cartes squelettes (Skeleton) ; l'animation n'est active que si `prefers-reduced-motion` vaut `no-preference`, d'après la description de la PR. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Changements de comportement
- La barre latérale, la barre supérieure et le pied de page viennent désormais de `@mairie360/lib-components/shell` (`AccessibleShell`). Les copies locales `accessible-shell.tsx`, `desktop-navigation.tsx` et `sidebar-preference.ts` sont supprimées, et le cookie de préférence de la barre latérale est configuré par la lib (`configureSidebarCookieDomain`). (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Corrections
- La fenêtre modale conserve le focus grâce au correctif repris de mairie360/lib-components#471, d'après la description de la PR. Le diff tronqué ne permet pas de décrire le comportement antérieur. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Technique
- Node passe de 24.21.0 à 24.22.1 dans les workflows CI, `Dockerfile` et `development.Dockerfile` (digest d'image officielle mis à jour), et Next.js passe à 16.4.2 avec `eslint-config-next` (correctifs de sécurité). ([#247](https://github.com/mairie360/Elearning_Web_Service/pull/247))
- La lib `@mairie360/lib-components` passe de 0.10.2 à 1.0.3 ; Vitest, Testing Library et jest-axe sont ajoutés, avec `npm run test:components` lancé par `npm test`. Les tests de composants sont co-localisés (`Name.test.tsx`), la convention d'arborescence est testée, les tests sont exclus de la couverture, et la documentation est mise à jour. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- Pendant le chargement, le catalogue affiche des cartes squelettes (Skeleton) ; l'animation n'est active que si `prefers-reduced-motion` vaut `no-preference`, d'après la description de la PR. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Changements de comportement
- La barre latérale, la barre supérieure et le pied de page viennent désormais de `@mairie360/lib-components/shell` (`AccessibleShell`). Les copies locales `accessible-shell.tsx`, `desktop-navigation.tsx` et `sidebar-preference.ts` sont supprimées, et le cookie de préférence de la barre latérale est configuré par la lib (`configureSidebarCookieDomain`). (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Corrections
- La fenêtre modale conserve le focus grâce au correctif repris de mairie360/lib-components#471, d'après la description de la PR. Le diff tronqué ne permet pas de décrire le comportement antérieur. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Technique
- Node passe de 24.21.0 à 24.22.1 dans les workflows CI, `Dockerfile` et `development.Dockerfile` (digest d'image officielle mis à jour), et Next.js passe à 16.4.2 avec `eslint-config-next` (correctifs de sécurité). ([#247](https://github.com/mairie360/Elearning_Web_Service/pull/247))
- La lib `@mairie360/lib-components` passe de 0.10.2 à 1.0.3 ; Vitest, Testing Library et jest-axe sont ajoutés, avec `npm run test:components` lancé par `npm test`. Les tests de composants sont co-localisés (`Name.test.tsx`), la convention d'arborescence est testée, les tests sont exclus de la couverture, et la documentation est mise à jour. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
