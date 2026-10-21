# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "prod": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "prod_tag": "v0.3.0", "staging": "6f7aef7f9baa5592726ddfcf4bb6377b4faf7041", "updated": {"dev": "2026-10-21 11:11 UTC", "staging": "2026-10-20 21:28 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.3.0 | `322e9d6` | — |
| staging | — | `6f7aef7` | 2026-10-20 21:28 UTC |
| dev | — | `01faf1c` | 2026-10-21 11:11 UTC |

## Ajouté sur main depuis la dernière release prod (v0.3.0)

#### Nouveautés
- Les écrans de chargement du catalogue utilisent des placeholders `Skeleton` de `@mairie360/lib-components` au lieu de blocs animés maison. Les résultats vides ont un libellé, et le lien d'évitement (skip link) précède la navigation répétée. (a8626d5, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))
- Les reçus de confirmation peuvent être fermés, sans effacer les brouillons ni les messages d'erreur contextuels. (a8626d5, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Changements de comportement
- Le thème vient désormais de `@mairie360/lib-components` 0.9.0 ; le fichier local `municipal-theme.css` est supprimé. (a8626d5, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))
- Le contrat BFF déclare une réponse `429` (limite de débit amont, en-tête `Retry-After`) sur neuf opérations e-learning. Aucun traitement de ce statut côté front n'apparaît dans le diff. (0474b4c, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222))
- Un push sur `main` ne déclenche plus que la release dev ; staging et prod se lancent à la main via `promote-staging.yml` et `promote-prod.yml`. (7161388, [#231](https://github.com/mairie360/Elearning_Web_Service/pull/231))

#### Corrections
- Navigation de bureau : avant, la navigation latérale de bureau passait en position relative et repoussait l'en-tête et le catalogue vers le bas ; maintenant elle reste fixée au bord de la fenêtre, et l'en-tête et le contenu sont alignés en haut. (665fb58, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- `@mairie360/front-kit` (archive vendorisée) est remplacé par les sous-chemins de `@mairie360/lib-components` 0.10.2 ; un test de bundle client (`npm run test:bundle`) vérifie qu'aucune entrée inutilisée n'arrive dans le navigateur. (9cd87f5, a2dd9c9, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220))
- Le contrat BFF est épinglé en 1.0.0 puis les images des stacks de test passent aux versions prod (core-api 2.1.0, elearning-api 1.1.0, database et liquibase 3.2.0). Le SHA-256 du contrat ne change pas. (a695d9b, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212))
- Le journal de release rédigé par Claude est branché : les secrets ANTHROPIC_API_KEY, RELEASE_APP_ID et RELEASE_APP_PK sont transmis, et mairie360/CICD est épinglé par SHA avec son tag (v4.3.1 puis v4.3.2). (6482090, 36b3cb8, [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214), [#218](https://github.com/mairie360/Elearning_Web_Service/pull/218))
- Les permissions CI sont en lecture seule par défaut, les droits d'écriture ne sont accordés qu'au job de release, et `cicd.yml` et `contracts.yml` ne tournent sur push que pour `main`. (9f8010a, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205))
- Le paquet du contrat passe au staging `0.0.0-staging.<sha40>` (scripts et tests acceptent ce format), puis les stacks suivent l'image `staging-55dfd4b`. (6f7aef7, [#224](https://github.com/mairie360/Elearning_Web_Service/pull/224))
- Une copie vendorisée de `braces` (dév. uniquement) est ajoutée avec sa licence et sa provenance. (a8626d5, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- Nouveaux workflows manuels `promote-staging.yml` et `promote-prod.yml` : une promotion se lance avec `gh workflow run` (option `-f sha=<sha>`), sur `main` uniquement, une à la fois par cible, avec l'approbation des environnements Staging et Prod. (7161388, [#231](https://github.com/mairie360/Elearning_Web_Service/pull/231))

#### Changements de comportement
- Un push sur `main` ne déploie plus en staging ni en prod : `cicd.yml` s'arrête à `release-dev`. (7161388, [#231](https://github.com/mairie360/Elearning_Web_Service/pull/231))

#### Technique
- Le paquet `@mairie360/bff-elearning-openapi` passe de `0.0.0-staging.55dfd4b…` à la release `1.1.0`. Le SHA-256 de `contracts/source.json` reste identique, donc le contrat n'a pas changé. (01faf1c, [#241](https://github.com/mairie360/Elearning_Web_Service/pull/241))
- Les images des stacks de test passent aux versions prod : bff-elearning et bff-user 1.1.0, core-api 2.2.0, elearning-api 1.2.0, database et liquibase 3.3.0. (01faf1c, [#241](https://github.com/mairie360/Elearning_Web_Service/pull/241))
- mairie360/CICD passe de v4.3.2 à v4.4.3 en trois mises à jour Renovate, et un test (`cicd-pin`) vérifie que les huit références restent alignées. (8f25850, 63fc94b, 841afb0, [#230](https://github.com/mairie360/Elearning_Web_Service/pull/230), [#233](https://github.com/mairie360/Elearning_Web_Service/pull/233), [#234](https://github.com/mairie360/Elearning_Web_Service/pull/234))

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Le lien d'évitement (skip link) précède la navigation répétée, les résultats vides sont libellés et les reçus de confirmation peuvent être fermés. (a8626d5, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Changements de comportement
- Le thème vient de `@mairie360/lib-components` 0.9.0 ; le fichier local `municipal-theme.css` est supprimé. Les placeholders de chargement utilisent `Skeleton`. (a8626d5, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))
- Le contrat BFF déclare une réponse `429` (limite de débit amont, en-tête `Retry-After`) sur neuf opérations e-learning. Aucun traitement de ce statut côté front n'apparaît dans le diff. (0474b4c, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222))

#### Corrections
- Navigation de bureau : avant, la navigation latérale passait en position relative et repoussait l'en-tête et le catalogue vers le bas ; maintenant elle reste fixée au bord de la fenêtre, et l'en-tête et le contenu sont alignés en haut. (665fb58, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Le BFF est épinglé à `0.0.0-dev.15082e0` (MAIR-575), puis au paquet staging `0.0.0-staging.55dfd4b…` (MAIR-600), que les scripts et tests acceptent. Le contrat n'a pas changé. (0474b4c, 6f7aef7, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222), [#224](https://github.com/mairie360/Elearning_Web_Service/pull/224))
- `@mairie360/front-kit` est remplacé par les sous-chemins de `@mairie360/lib-components` 0.10.2, et un test de bundle client est ajouté. (9cd87f5, a2dd9c9, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220))
- Le journal de release et les secrets associés sont branchés, avec CICD épinglé en v4.3.1 puis v4.3.2. (6482090, 36b3cb8, [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214), [#218](https://github.com/mairie360/Elearning_Web_Service/pull/218))
- Les permissions CI sont en lecture seule par défaut, et `cicd.yml` et `contracts.yml` ne tournent sur push que pour `main`. (9f8010a, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205))
- Une copie vendorisée de `braces` (dév. uniquement) est ajoutée avec sa licence et sa provenance. (a8626d5, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
