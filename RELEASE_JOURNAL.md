# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "63fc94bec00147cf99c610e51bf9427438f1e0f6", "prod": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "prod_tag": "v0.3.0", "staging": "6f7aef7f9baa5592726ddfcf4bb6377b4faf7041", "updated": {"dev": "2026-10-21 06:13 UTC", "staging": "2026-10-20 21:28 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.3.0 | `322e9d6` | — |
| staging | — | `6f7aef7` | 2026-10-20 21:28 UTC |
| dev | — | `63fc94b` | 2026-10-21 06:13 UTC |

## Ajouté sur main depuis la dernière release prod (v0.3.0)

#### Nouveautés
- Chargement du catalogue : placeholders partagés (Skeleton) à la place des blocs animés maison ; listes vides avec un état vide étiqueté ; après une action confirmée, un reçu fermable s’affiche, sans perdre les brouillons ni les messages d’erreur contextuels. (MAIR-526, MAIR-515, MAIR-540, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))
- Lien d’évitement unique placé avant la navigation répétée. (MAIR-526, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Changements de comportement
- Un push sur `main` ne livre plus que l’environnement dev : `cicd.yml` s’arrête à `release-dev`. Le staging et la prod se font à la main avec `promote-staging.yml` puis `promote-prod.yml` (`gh workflow run`, `-f sha=<sha>` optionnel), avec un verrou par cible et l’approbation de l’environnement. (MAIR-494, [#231](https://github.com/mairie360/Elearning_Web_Service/pull/231), [#230](https://github.com/mairie360/Elearning_Web_Service/pull/230))
- L’apparence ne vient plus de `src/app/municipal-theme.css` (supprimé) mais du thème publié de `@mairie360/lib-components`. (MAIR-526, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Corrections
- Navigation de bureau : avant, le sélecteur des styles du drawer historique s’appliquait aussi à la nouvelle navigation de bureau, qui passait en position relative et repoussait l’en-tête et le catalogue sous elle. Maintenant, elle reste fixée au bord gauche de la fenêtre et l’en-tête et le contenu sont alignés en haut. Le défaut venait de #209 et n’a jamais été livré en prod. (MAIR-526, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- `@mairie360/front-kit` (archive vendorisée) remplacé par les sous-chemins de `@mairie360/lib-components` 0.10.2 ; test de bundle client `npm run test:bundle` ajouté au workflow de performance. (MAIR-126, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220))
- Contrat `@mairie360/bff-elearning-openapi` passé à 1.0.0 puis aux paquets dev et staging du même contenu ; la réponse 429 (`Retry-After`) est documentée sur neuf opérations du contrat, sans traitement particulier côté front dans ce diff. Images de stacks de test alignées. (MAIR-569, MAIR-575, MAIR-600, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212), [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222), [#224](https://github.com/mairie360/Elearning_Web_Service/pull/224))
- CI : mairie360/CICD épinglé de v4.3.1 à v4.4.1 ; journal de release (`RELEASE_JOURNAL.md`) et ses secrets ajoutés ; jobs en lecture seule par défaut, CI qui ne tourne plus deux fois sur les PR, `tests/cicd-pin.test.cjs`. (MAIR-571, MAIR-436, [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214), [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205), [#218](https://github.com/mairie360/Elearning_Web_Service/pull/218))
- Backport de développement de `braces` dans `vendor/` et tests d’outillage associés. ([#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))
- Tests et documentation seuls : tests de bundle et de cohérence des contrats, docs FR/EN.

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Un push sur `main` ne livre plus que l’environnement dev : `cicd.yml` s’arrête à `release-dev`. Le staging et la prod se font à la main avec `promote-staging.yml` puis `promote-prod.yml` (`gh workflow run`, `-f sha=<sha>` optionnel), avec un verrou par cible et l’approbation de l’environnement GitHub. (MAIR-494, [#231](https://github.com/mairie360/Elearning_Web_Service/pull/231), [#230](https://github.com/mairie360/Elearning_Web_Service/pull/230))

#### Technique
- mairie360/CICD épinglé à v4.4.0 (#230), puis v4.4.1 par Renovate (#233) dans `cicd.yml`, `dev-dependency-exception.yml` et les deux workflows de promotion ; `tests/cicd-pin.test.cjs` compte 8 références identiques. ([#230](https://github.com/mairie360/Elearning_Web_Service/pull/230), [#233](https://github.com/mairie360/Elearning_Web_Service/pull/233))
- Renovate regroupe les trois fichiers de pin dans une seule PR ; `CLAUDE.md` décrit la promotion. ([#231](https://github.com/mairie360/Elearning_Web_Service/pull/231))

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Chargement du catalogue : placeholders partagés (Skeleton) ; listes vides avec un état vide étiqueté ; après une action confirmée, un reçu fermable s’affiche, sans perdre les brouillons. (MAIR-526, MAIR-515, MAIR-540, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))
- Lien d’évitement unique avant la navigation répétée ; navigation de bureau fixée au bord de la fenêtre (le défaut du drawer historique, corrigé dans [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210), ne touche pas la prod). (MAIR-526, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209), [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Changements de comportement
- L’apparence passe du thème local `municipal-theme.css` (supprimé) au thème publié de `@mairie360/lib-components`. (MAIR-526, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Technique
- Contrat `@mairie360/bff-elearning-openapi` sur le paquet `0.0.0-staging.55dfd4b…` (même contenu que le dev `15082e0`), image `bff-elearning` `staging-55dfd4b` dans les stacks ; `scripts/contract-version.mjs` accepte les paquets staging. (MAIR-600, [#224](https://github.com/mairie360/Elearning_Web_Service/pull/224))
- Contrat : réponse 429 (limite de débit amont, `Retry-After`) documentée sur neuf opérations dans le diff, alors que la description en annonce sept ; aucun traitement 429 ajouté côté front. (MAIR-575, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222))
- CI : CICD v4.3.2 puis v4.3.1 en amont, journal de release (`RELEASE_JOURNAL.md`, secrets ANTHROPIC_API_KEY, RELEASE_APP_ID, RELEASE_APP_PK), jobs en lecture seule par défaut, push sur `main` seulement. (MAIR-571, MAIR-436, [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214), [#218](https://github.com/mairie360/Elearning_Web_Service/pull/218), [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205))
- Dépendance `@mairie360/front-kit` vendorisée remplacée par `@mairie360/lib-components` 0.10.2 (sous-chemins) ; test `npm run test:bundle` ajouté. (MAIR-126, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220))
- Contrat BFF passé à `1.0.0` avec images de stacks et de base de données alignées sur leurs releases prod. (MAIR-569, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
