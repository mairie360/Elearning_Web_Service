# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "8f25850151f7d3d80c4f186dfe86de38e02342dd", "prod": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "prod_tag": "v0.3.0", "staging": "6f7aef7f9baa5592726ddfcf4bb6377b4faf7041", "updated": {"dev": "2026-10-21 01:35 UTC", "staging": "2026-10-20 21:28 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.3.0 | `322e9d6` | — |
| staging | — | `6f7aef7` | 2026-10-20 21:28 UTC |
| dev | — | `8f25850` | 2026-10-21 01:35 UTC |

## Ajouté sur main depuis la dernière release prod (v0.3.0)

#### Nouveautés
- Le lien d’évitement unique précède désormais la navigation répétée. Dans la fenêtre de cours, le lien d’évitement est isolé, le focus reste à l’intérieur et revient à l’élément d’origine à la fermeture. (MAIR-526, MAIR-540, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))
- Pendant le chargement de la page Formation, des placeholders `Skeleton` de la lib partagée remplacent les blocs animés locaux. Les résultats vides sont libellés, les accusés de confirmation peuvent être fermés et les brouillons sont conservés en cas d’échec. (MAIR-526, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))
- L’apparence (thème municipal, clair/sombre) vient de la feuille de style publiée de `@mairie360/lib-components` : `municipal-theme.css` est supprimé. (MAIR-515, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Changements de comportement
- Le contrat BFF embarqué déclare une réponse `429` (limite de débit amont, en-tête `Retry-After`, corps `ErrorResponse`) sur neuf opérations. Les types générés l’intègrent, mais aucun code du front ne la traite spécifiquement dans ces diffs. (MAIR-575, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222))
- Le paquet de contrat et l’image `bff-elearning` des stacks de test repassent de `1.0.0` (publiée, MAIR-569) à `0.0.0-dev.15082e0` (MAIR-575). Main n’est donc plus aligné sur la release prod. Le passage en staging (`0.0.0-staging.55dfd4b`, MAIR-600) ne change pas le contrat, qui reste identique. (MAIR-569, MAIR-575, MAIR-600, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212), [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222), [#224](https://github.com/mairie360/Elearning_Web_Service/pull/224))

#### Corrections
- La navigation de bureau reste fixée au bord de la fenêtre. Avant : les règles du tiroir historique ciblaient aussi la navigation de bureau, la passaient en `position: relative` et poussaient l’en-tête et le catalogue dessous. Maintenant : ces règles ne visent que `aside.app-published-sidebar`. (MAIR-526, MAIR-547, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Pipeline : CICD est épinglé par SHA avec un commentaire de version (v4.3.1 puis v4.3.2), suivi par Renovate et `tests/cicd-pin.test.cjs`. Les secrets du journal de release sont transmis, le token est en lecture seule par défaut et `cicd.yml` et `contracts.yml` ne se lancent sur push que pour `main` (MAIR-436, MAIR-571, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205), [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214), [#218](https://github.com/mairie360/Elearning_Web_Service/pull/218)).
- Dépendances : `@mairie360/front-kit` est remplacé par `@mairie360/lib-components` 0.10.2 (sous-chemins), avec test de bundle ; `braces` est backporté en dev et les images des stacks de test passent aux versions de release (MAIR-126, MAIR-569, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220), [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212), [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209)).

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- Renovate met à jour `mairie360/CICD` de v4.3.2 à v4.4.0 (SHA `038bd5b`) dans `cicd.yml` et `dev-dependency-exception.yml`. Selon les notes jointes à la PR, la promotion staging et prod est séparée du workflow de base (MAIR-494, [#230](https://github.com/mairie360/Elearning_Web_Service/pull/230)).
- Aucun changement fonctionnel pour les agents, le front ou le BFF entre dev et staging à ce stade.

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Le lien d’évitement unique précède désormais la navigation répétée. Dans la fenêtre de cours, le lien d’évitement est isolé, le focus reste à l’intérieur et revient à l’élément d’origine à la fermeture. (MAIR-526, MAIR-540, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))
- Pendant le chargement de la page Formation, des placeholders `Skeleton` de la lib partagée remplacent les blocs animés locaux. Les résultats vides sont libellés, les accusés de confirmation peuvent être fermés et les brouillons sont conservés en cas d’échec. (MAIR-526, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))
- L’apparence (thème municipal, clair/sombre) vient de la feuille de style publiée de `@mairie360/lib-components` : `municipal-theme.css` est supprimé. (MAIR-515, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Changements de comportement
- Le contrat BFF embarqué déclare une réponse `429` (limite de débit amont, en-tête `Retry-After`, corps `ErrorResponse`) sur neuf opérations. Les types générés l’intègrent, mais aucun code du front ne la traite spécifiquement dans ces diffs. (MAIR-575, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222))
- Le contrat repasse sur le paquet dev `0.0.0-dev.15082e0` (MAIR-575) après la version `1.0.0` de MAIR-569, puis passe sur `0.0.0-staging.55dfd4b` (MAIR-600) sans changer son contenu. (MAIR-569, MAIR-575, MAIR-600, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212), [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222), [#224](https://github.com/mairie360/Elearning_Web_Service/pull/224))

#### Corrections
- La navigation de bureau reste fixée au bord de la fenêtre. Avant : les règles du tiroir historique ciblaient aussi la navigation de bureau, la passaient en `position: relative` et poussaient l’en-tête et le catalogue dessous. Maintenant : ces règles ne visent que `aside.app-published-sidebar`. (MAIR-526, MAIR-547, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Pipeline : CICD est épinglé par SHA avec un commentaire de version (v4.3.1 puis v4.3.2), les secrets du journal de release sont transmis, le token est en lecture seule par défaut et `cicd.yml` et `contracts.yml` ne se lancent sur push que pour `main` (MAIR-436, MAIR-571, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205), [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214), [#218](https://github.com/mairie360/Elearning_Web_Service/pull/218)).
- Dépendances : `@mairie360/front-kit` est remplacé par `@mairie360/lib-components` 0.10.2 (sous-chemins), avec test de bundle ; `braces` est backporté en dev et les images des stacks de test passent aux versions de release (MAIR-126, MAIR-569, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220), [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212), [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209)).

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 01:35 UTC | dev | — | `8f25850` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39527801944) |
| 2026-10-20 21:28 UTC | staging | — | `6f7aef7` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39499388823) |
| 2026-10-20 21:24 UTC | dev | — | `6f7aef7` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39499388823) |
| 2026-10-20 13:52 UTC | dev | — | `0474b4c` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39433519951) |
| 2026-10-20 12:23 UTC | dev | — | `36b3cb8` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39421306506) |
| 2026-10-19 22:13 UTC | dev | — | `a2dd9c9` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39332816489) |
| 2026-10-19 21:58 UTC | dev | — | `9cd87f5` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39330915338) |
| 2026-10-19 20:40 UTC | dev | — | `6482090` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39320707529) |
<!-- release-journal-history:end -->
