# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "0586513cb2884815b9551a60d5a1913f45639015", "prod": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "prod_tag": "v0.4.0", "staging": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "updated": {"dev": "2026-11-04 21:28 UTC", "prod": "2026-10-21 11:18 UTC", "staging": "2026-10-21 11:16 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.4.0 | `01faf1c` | 2026-10-21 11:18 UTC |
| staging | — | `01faf1c` | 2026-10-21 11:16 UTC |
| dev | — | `0586513` | 2026-11-04 21:28 UTC |

## Ajouté sur main depuis la dernière release prod (v0.4.0)

#### Nouveautés

- Catalogue e-learning : états vides affichés via `DataState`, cartes en chargement remplacées par des `Skeleton`, retours de confirmation affichés par le composant de feedback du catalogue (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).

#### Changements de comportement

- La barre latérale et la barre supérieure viennent désormais de `@mairie360/lib-components/shell` ; les fichiers locaux `accessible-shell.tsx`, `desktop-navigation.tsx` et `sidebar-preference.ts` sont supprimés (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).
- Le formulaire de formation utilise les champs et boutons de la lib (`TextField`, `TextArea`, select, Annuler / Enregistrer / Créer) ; `@mairie360/lib-components` passe de 0.10.2 à 1.0.3 et son export `elearning` n'est plus utilisé (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).

#### Corrections

- Installation npm : avant, `postinstall` interrogeait le service d'avis npm et `npm ci` échouait hors ligne ou pendant une panne ; maintenant `postinstall`, `prebuild` et `pretest` ne lancent que la vérification locale, la vérification amont passe dans `npm run audit:upstream` (MAIR-744, [#259](https://github.com/mairie360/Elearning_Web_Service/pull/259)).
- `follow-redirects` 1.16.0 à 1.16.1 (via axios) : `npm audit --omit=dev` échouait (GHSA-mrwp-f3q8-3g9p) ; la lock passe à 1.16.2 ([#256](https://github.com/mairie360/Elearning_Web_Service/pull/256)).
- Next.js passe de 16.3.8 à 16.4.2 pour corriger GHSA-673q-mjm6-r5xr ([#247](https://github.com/mairie360/Elearning_Web_Service/pull/247)).

#### Technique

- Tests E2E Playwright des parcours (démarrer un cours, progression, refus 403/404, session absente 307), stack `docker-compose-e2e.yml` et `e2e_test.sh` (MAIR-603, [#244](https://github.com/mairie360/Elearning_Web_Service/pull/244)).
- Simulation RGPD avant prod et revue IA des logs et de la base (`gdpr_simulation_test.sh`, `docker-compose-gdpr-simulation.yml`), nettoyage et contrôles Redis durcis (MAIR-497, [#262](https://github.com/mairie360/Elearning_Web_Service/pull/262), [#263](https://github.com/mairie360/Elearning_Web_Service/pull/263)).
- Stack RGAA : rapport réinitialisé à chaque run, verrou `.rgaa-run.lock`, sondes de readiness bornées (MAIR-316, [#168](https://github.com/mairie360/Elearning_Web_Service/pull/168) ; MAIR-768, [#254](https://github.com/mairie360/Elearning_Web_Service/pull/254)).
- Checklist RGPD sur les PR (MAIR-295, [#175](https://github.com/mairie360/Elearning_Web_Service/pull/175)) ; politique Gitleaks `.gitleaks.toml` remplaçant `.gitleaksignore` (MAIR-743, [#265](https://github.com/mairie360/Elearning_Web_Service/pull/265)) ; workflow quotidien `upstream-advisories.yml` (MAIR-744, [#259](https://github.com/mairie360/Elearning_Web_Service/pull/259)).
- Épinglage mairie360/CICD : v4.5.0 vers v4.12.0 ([#250](https://github.com/mairie360/Elearning_Web_Service/pull/250)), v5.1.0 ([#168](https://github.com/mairie360/Elearning_Web_Service/pull/168)), v5.2.2 (MAIR-771, [#260](https://github.com/mairie360/Elearning_Web_Service/pull/260)), v5.3.0 ([#262](https://github.com/mairie360/Elearning_Web_Service/pull/262)), v5.3.1 ([#263](https://github.com/mairie360/Elearning_Web_Service/pull/263)), v5.5.0 ([#244](https://github.com/mairie360/Elearning_Web_Service/pull/244)).
- Dépendances : jsdom 30.1.3 et playwright-core 1.64.1 ([#246](https://github.com/mairie360/Elearning_Web_Service/pull/246)) ; Node 24.22.1 et nouveaux digests d'image ([#247](https://github.com/mairie360/Elearning_Web_Service/pull/247)) ; Vitest et Testing Library pour les composants ([#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).
- Backport Zod vendorisé avec validation bornée des collections et garde d'intégrité ; les source maps de bundle ne sont activées qu'en CI avec `MAIRIE360_BUNDLE_PROVENANCE` ([#248](https://github.com/mairie360/Elearning_Web_Service/pull/248)).
- Diffs tronqués (#244, #239, #248, #262, #263) : seule la partie visible a été analysée.

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés

- Catalogue e-learning : états vides affichés via `DataState`, cartes en chargement remplacées par des `Skeleton`, retours de confirmation affichés par le composant de feedback du catalogue (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).

#### Changements de comportement

- La barre latérale et la barre supérieure viennent désormais de `@mairie360/lib-components/shell` ; les fichiers locaux `accessible-shell.tsx`, `desktop-navigation.tsx` et `sidebar-preference.ts` sont supprimés (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).
- Le formulaire de formation utilise les champs et boutons de la lib (`TextField`, `TextArea`, select, Annuler / Enregistrer / Créer) ; `@mairie360/lib-components` passe de 0.10.2 à 1.0.3 et son export `elearning` n'est plus utilisé (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).

#### Corrections

- Installation npm : avant, `postinstall` interrogeait le service d'avis npm et `npm ci` échouait hors ligne ou pendant une panne ; maintenant `postinstall`, `prebuild` et `pretest` ne lancent que la vérification locale, la vérification amont passe dans `npm run audit:upstream` (MAIR-744, [#259](https://github.com/mairie360/Elearning_Web_Service/pull/259)).
- `follow-redirects` 1.16.0 à 1.16.1 (via axios) : `npm audit --omit=dev` échouait (GHSA-mrwp-f3q8-3g9p) ; la lock passe à 1.16.2 ([#256](https://github.com/mairie360/Elearning_Web_Service/pull/256)).
- Next.js passe de 16.3.8 à 16.4.2 pour corriger GHSA-673q-mjm6-r5xr ([#247](https://github.com/mairie360/Elearning_Web_Service/pull/247)).

#### Technique

- Tests E2E Playwright des parcours (démarrer un cours, progression, refus 403/404, session absente 307), stack `docker-compose-e2e.yml` et `e2e_test.sh` (MAIR-603, [#244](https://github.com/mairie360/Elearning_Web_Service/pull/244)).
- Simulation RGPD avant prod et revue IA des logs et de la base (`gdpr_simulation_test.sh`, `docker-compose-gdpr-simulation.yml`), nettoyage et contrôles Redis durcis (MAIR-497, [#262](https://github.com/mairie360/Elearning_Web_Service/pull/262), [#263](https://github.com/mairie360/Elearning_Web_Service/pull/263)).
- Stack RGAA : rapport réinitialisé à chaque run, verrou `.rgaa-run.lock`, sondes de readiness bornées (MAIR-316, [#168](https://github.com/mairie360/Elearning_Web_Service/pull/168) ; MAIR-768, [#254](https://github.com/mairie360/Elearning_Web_Service/pull/254)).
- Checklist RGPD sur les PR (MAIR-295, [#175](https://github.com/mairie360/Elearning_Web_Service/pull/175)) ; politique Gitleaks `.gitleaks.toml` remplaçant `.gitleaksignore` (MAIR-743, [#265](https://github.com/mairie360/Elearning_Web_Service/pull/265)) ; workflow quotidien `upstream-advisories.yml` (MAIR-744, [#259](https://github.com/mairie360/Elearning_Web_Service/pull/259)).
- Épinglage mairie360/CICD : v4.5.0 vers v4.12.0 ([#250](https://github.com/mairie360/Elearning_Web_Service/pull/250)), v5.1.0 ([#168](https://github.com/mairie360/Elearning_Web_Service/pull/168)), v5.2.2 (MAIR-771, [#260](https://github.com/mairie360/Elearning_Web_Service/pull/260)), v5.3.0 ([#262](https://github.com/mairie360/Elearning_Web_Service/pull/262)), v5.3.1 ([#263](https://github.com/mairie360/Elearning_Web_Service/pull/263)), v5.5.0 ([#244](https://github.com/mairie360/Elearning_Web_Service/pull/244)).
- Dépendances : jsdom 30.1.3 et playwright-core 1.64.1 ([#246](https://github.com/mairie360/Elearning_Web_Service/pull/246)) ; Node 24.22.1 et nouveaux digests d'image ([#247](https://github.com/mairie360/Elearning_Web_Service/pull/247)) ; Vitest et Testing Library pour les composants ([#239](https://github.com/mairie360/Elearning_Web_Service/pull/239)).
- Backport Zod vendorisé avec validation bornée des collections et garde d'intégrité ; les source maps de bundle ne sont activées qu'en CI avec `MAIRIE360_BUNDLE_PROVENANCE` ([#248](https://github.com/mairie360/Elearning_Web_Service/pull/248)).
- Diffs tronqués (#244, #239, #248, #262, #263) : seule la partie visible a été analysée.

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-04 21:28 UTC | dev | — | `0586513` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/41915169326) |
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
