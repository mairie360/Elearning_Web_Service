# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "6f7aef7f9baa5592726ddfcf4bb6377b4faf7041", "prod": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "prod_tag": "v0.3.0", "staging": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "updated": {"dev": "2026-10-20 21:24 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.3.0 | `322e9d6` | — |
| staging | — | `322e9d6` | — |
| dev | — | `6f7aef7` | 2026-10-20 21:24 UTC |

## Ajouté sur main depuis la dernière release prod (v0.3.0)

#### Changements de comportement
- L'interface e-learning adopte le thème et les composants partagés publiés de `@mairie360/lib-components` (0.9.0, puis 0.10.2). Le thème municipal local `municipal-theme.css` est supprimé au profit de la feuille de style commune `@mairie360/lib-components/styles.css`. L'écran de chargement « Chargement des formations… » affiche désormais les placeholders partagés `Skeleton`. D'après la PR, les résultats vides sont libellés, les confirmations d'action peuvent être fermées et le lien d'évitement précède la navigation répétée ; le diff est tronqué sur ces écrans. (MAIR-526, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))
- Le front s'appuie maintenant sur le contrat BFF_Elearning du commit `55dfd4b` (`@mairie360/bff-elearning-openapi` `0.0.0-staging.55dfd4b4cb34e881c243d79394b807631879eca2`, image `bff-elearning:staging-55dfd4b`), au lieu du build dev `c4c3f73`. Le seul changement de contrat : neuf opérations documentent une réponse `429` (« An upstream API rate limit is reached: retry after the Retry-After header (seconds) ») avec le corps `ErrorResponse`. Les routes relayées ne changent pas. (MAIR-575, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222) ; MAIR-600, [#224](https://github.com/mairie360/Elearning_Web_Service/pull/224))

#### Corrections
- Navigation sur ordinateur : avant, un ancien style du tiroir mobile s'appliquait aussi à la navigation de bureau et la passait en `position: relative`, ce qui repoussait l'en-tête et le catalogue sous elle. Désormais, ce style ne cible plus que `.app-published-sidebar`, et la navigation de bureau reste fixée au bord de l'écran. (MAIR-547, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Socle partagé (session, proxy, garde, thème) importé depuis les sous-chemins de `@mairie360/lib-components` à la place de l'archive `@mairie360/front-kit`, sans changement de comportement. S'y ajoutent un test de bundle client `npm run test:bundle` et son durcissement, ainsi que le passage des images des stacks de test (API, base, BFF) sur des versions publiées. (MAIR-126, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220) ; MAIR-569, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212))
- CI : jeton en lecture seule par défaut et `push` limité à `main`. Le workflow CICD passe en v4.3.1 puis v4.3.2 avec l'étape « Release journal » et des épingles suivies par Renovate. (MAIR-436, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205) ; MAIR-571, [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214), [#218](https://github.com/mairie360/Elearning_Web_Service/pull/218))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- L'interface e-learning adopte le thème et les composants partagés publiés de `@mairie360/lib-components` (0.9.0, puis 0.10.2). Le thème municipal local `municipal-theme.css` est supprimé au profit de la feuille de style commune `@mairie360/lib-components/styles.css`. L'écran de chargement « Chargement des formations… » affiche désormais les placeholders partagés `Skeleton`. D'après la PR, les résultats vides sont libellés, les confirmations d'action peuvent être fermées et le lien d'évitement précède la navigation répétée ; le diff est tronqué sur ces écrans. (MAIR-526, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))
- Le front s'appuie maintenant sur le contrat BFF_Elearning du commit `55dfd4b` (`@mairie360/bff-elearning-openapi` `0.0.0-staging.55dfd4b4cb34e881c243d79394b807631879eca2`, image `bff-elearning:staging-55dfd4b`), au lieu du build dev `c4c3f73`. Le seul changement de contrat : neuf opérations documentent une réponse `429` (« An upstream API rate limit is reached: retry after the Retry-After header (seconds) ») avec le corps `ErrorResponse`. Les routes relayées ne changent pas. (MAIR-575, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222) ; MAIR-600, [#224](https://github.com/mairie360/Elearning_Web_Service/pull/224))

#### Corrections
- Navigation sur ordinateur : avant, un ancien style du tiroir mobile s'appliquait aussi à la navigation de bureau et la passait en `position: relative`, ce qui repoussait l'en-tête et le catalogue sous elle. Désormais, ce style ne cible plus que `.app-published-sidebar`, et la navigation de bureau reste fixée au bord de l'écran. (MAIR-547, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Socle partagé (session, proxy, garde, thème) importé depuis les sous-chemins de `@mairie360/lib-components` à la place de l'archive `@mairie360/front-kit`, sans changement de comportement. S'y ajoutent un test de bundle client `npm run test:bundle` et son durcissement, ainsi que le passage des images des stacks de test (API, base, BFF) sur des versions publiées. (MAIR-126, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220) ; MAIR-569, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212))
- CI : jeton en lecture seule par défaut et `push` limité à `main`. Le workflow CICD passe en v4.3.1 puis v4.3.2 avec l'étape « Release journal » et des épingles suivies par Renovate. (MAIR-436, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205) ; MAIR-571, [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214), [#218](https://github.com/mairie360/Elearning_Web_Service/pull/218))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-20 21:24 UTC | dev | — | `6f7aef7` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39499388823) |
| 2026-10-20 13:52 UTC | dev | — | `0474b4c` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39433519951) |
| 2026-10-20 12:23 UTC | dev | — | `36b3cb8` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39421306506) |
| 2026-10-19 22:13 UTC | dev | — | `a2dd9c9` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39332816489) |
| 2026-10-19 21:58 UTC | dev | — | `9cd87f5` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39330915338) |
| 2026-10-19 20:40 UTC | dev | — | `6482090` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39320707529) |
<!-- release-journal-history:end -->
