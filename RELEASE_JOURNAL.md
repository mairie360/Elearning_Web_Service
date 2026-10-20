# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "6f7aef7f9baa5592726ddfcf4bb6377b4faf7041", "prod": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "prod_tag": "v0.3.0", "staging": "6f7aef7f9baa5592726ddfcf4bb6377b4faf7041", "updated": {"dev": "2026-10-20 21:24 UTC", "staging": "2026-10-20 21:28 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.3.0 | `322e9d6` | — |
| staging | — | `6f7aef7` | 2026-10-20 21:28 UTC |
| dev | — | `6f7aef7` | 2026-10-20 21:24 UTC |

## Ajouté sur main depuis la dernière release prod (v0.3.0)

#### Nouveautés
- L'interface e-learning adopte le thème partagé de `@mairie360/lib-components` (feuille `@mairie360/lib-components/styles.css`) à la place de la copie locale `municipal-theme.css`, désormais supprimée. Pendant le chargement, la page Formation affiche les placeholders `Skeleton` partagés. Selon la PR, les résultats vides sont étiquetés, les confirmations d'action peuvent être fermées et le lien d'évitement unique précède la navigation répétée ; le diff de ces composants est tronqué. (MAIR-526, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Changements de comportement
- Le contrat BFF consommé (`@mairie360/bff-elearning-openapi`) documente désormais une réponse `429` sur neuf opérations e-learning. Elle signale qu'une limite de débit amont est atteinte, invite à réessayer après l'en-tête `Retry-After` (en secondes) et porte un corps `ErrorResponse`. Aucune autre opération ni aucun schéma ne change. (MAIR-575, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222))

#### Corrections
- Navigation sur ordinateur : avant, une ancienne règle CSS du tiroir s'appliquait aussi à la navigation partagée. Elle la passait en positionnement relatif et repoussait l'en-tête et le catalogue sous elle. Maintenant, la règle ne vise plus que la barre latérale publiée `.app-published-sidebar`, et la navigation reste fixée au bord de l'écran. (MAIR-526, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Dépendances et contrats sans effet fonctionnel :
  - Contrat BFF épinglé successivement sur `1.0.0`, `0.0.0-dev.15082e0…` puis `0.0.0-staging.55dfd4b…`, avec les images `bff-elearning` des stacks de test alignées (`1.0.0`, puis `dev-15082e0`, puis `staging-55dfd4b`). Les images API et base des stacks passent sur leurs versions prod.
  - La politique de version accepte désormais `0.0.0-staging.<sha40>`.
  - Le socle partagé est importé depuis `@mairie360/lib-components@0.10.2` au lieu de l'archive vendorisée `@mairie360/front-kit`.
  - (MAIR-569, MAIR-600, MAIR-126, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212), [#224](https://github.com/mairie360/Elearning_Web_Service/pull/224), [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216))
- CI et tests, en 4 PR :
  - Jeton de workflow en lecture seule par défaut et push limité à `main`.
  - `mairie360/CICD` monté en v4.3.1 puis v4.3.2, avec le journal des releases et un épinglage suivi par Renovate.
  - Test du bundle client amélioré.
  - (MAIR-436, MAIR-571, MAIR-126, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205), [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214), [#218](https://github.com/mairie360/Elearning_Web_Service/pull/218), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220))

## Différence dev → staging (en dev, pas encore en staging)

_Rien._

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- L'interface e-learning adopte le thème partagé de `@mairie360/lib-components` (feuille `@mairie360/lib-components/styles.css`) à la place de la copie locale `municipal-theme.css`, désormais supprimée. Pendant le chargement, la page Formation affiche les placeholders `Skeleton` partagés. Selon la PR, les résultats vides sont étiquetés, les confirmations d'action peuvent être fermées et le lien d'évitement unique précède la navigation répétée ; le diff de ces composants est tronqué. (MAIR-526, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Changements de comportement
- Le contrat BFF consommé (`@mairie360/bff-elearning-openapi`) documente désormais une réponse `429` sur neuf opérations e-learning. Elle signale qu'une limite de débit amont est atteinte, invite à réessayer après l'en-tête `Retry-After` (en secondes) et porte un corps `ErrorResponse`. Aucune autre opération ni aucun schéma ne change. (MAIR-575, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222))

#### Corrections
- Navigation sur ordinateur : avant, une ancienne règle CSS du tiroir s'appliquait aussi à la navigation partagée. Elle la passait en positionnement relatif et repoussait l'en-tête et le catalogue sous elle. Maintenant, la règle ne vise plus que la barre latérale publiée `.app-published-sidebar`, et la navigation reste fixée au bord de l'écran. (MAIR-526, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Dépendances et contrats sans effet fonctionnel :
  - Contrat BFF épinglé successivement sur `1.0.0`, `0.0.0-dev.15082e0…` puis `0.0.0-staging.55dfd4b…`, avec les images `bff-elearning` des stacks de test alignées (`1.0.0`, puis `dev-15082e0`, puis `staging-55dfd4b`). Les images API et base des stacks passent sur leurs versions prod.
  - La politique de version accepte désormais `0.0.0-staging.<sha40>`.
  - Le socle partagé est importé depuis `@mairie360/lib-components@0.10.2` au lieu de l'archive vendorisée `@mairie360/front-kit`.
  - (MAIR-569, MAIR-600, MAIR-126, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212), [#224](https://github.com/mairie360/Elearning_Web_Service/pull/224), [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216))
- CI et tests, en 4 PR :
  - Jeton de workflow en lecture seule par défaut et push limité à `main`.
  - `mairie360/CICD` monté en v4.3.1 puis v4.3.2, avec le journal des releases et un épinglage suivi par Renovate.
  - Test du bundle client amélioré.
  - (MAIR-436, MAIR-571, MAIR-126, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205), [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214), [#218](https://github.com/mairie360/Elearning_Web_Service/pull/218), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-20 21:28 UTC | staging | — | `6f7aef7` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39499388823) |
| 2026-10-20 21:24 UTC | dev | — | `6f7aef7` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39499388823) |
| 2026-10-20 13:52 UTC | dev | — | `0474b4c` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39433519951) |
| 2026-10-20 12:23 UTC | dev | — | `36b3cb8` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39421306506) |
| 2026-10-19 22:13 UTC | dev | — | `a2dd9c9` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39332816489) |
| 2026-10-19 21:58 UTC | dev | — | `9cd87f5` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39330915338) |
| 2026-10-19 20:40 UTC | dev | — | `6482090` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39320707529) |
<!-- release-journal-history:end -->
