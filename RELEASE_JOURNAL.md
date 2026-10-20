# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "0474b4c6d470ff0b2c282f73dbb580b04183247e", "prod": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "prod_tag": "v0.3.0", "staging": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "updated": {"dev": "2026-10-20 13:52 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.3.0 | `322e9d6` | — |
| staging | — | `322e9d6` | — |
| dev | — | `0474b4c` | 2026-10-20 13:52 UTC |

## Ajouté sur main depuis la dernière release prod (v0.3.0)

#### Nouveautés
- L'écran Formation adopte le thème partagé de `@mairie360/lib-components` (0.9.0, feuille de style publiée à la place de la copie locale `municipal-theme.css`). Le chargement affiche les squelettes partagés (`Skeleton`). D'après la PR, les résultats vides sont libellés, les confirmations d'action peuvent être fermées et le lien d'évitement précède la navigation répétée ; le diff est tronqué sur ces points. (MAIR-526, MAIR-515, MAIR-540, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Changements de comportement
- Le front suit le contrat dev `@mairie360/bff-elearning-openapi` `0.0.0-dev.15082e063d46c3fcf9b31c697eeacdcd6858970c`. Ce contrat documente une réponse `429` (limite de débit d'une API amont, réessayer après l'en-tête `Retry-After`) sur 9 opérations. La projection `ElearningCatalogResponse` reste inchangée. (MAIR-575, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222))

#### Corrections
- Sur ordinateur, la navigation latérale partagée passait en positionnement relatif à cause d'un ancien style de tiroir, ce qui repoussait l'en-tête et le catalogue sous elle. Elle reste maintenant fixée au bord de l'écran ; le style historique ne s'applique plus qu'au tiroir `.app-published-sidebar`. (MAIR-526, MAIR-547, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- 3 changements CI :
  - workflow `mairie360/CICD` épinglé en v4.3.1 puis v4.3.2, avec l'étape de journal des releases et un suivi Renovate des épinglages SHA ;
  - jeton en lecture seule par défaut ;
  - pipelines déclenchés sur `push` vers `main` uniquement.

  (MAIR-436, MAIR-571, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205), [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214), [#218](https://github.com/mairie360/Elearning_Web_Service/pull/218))
- 4 changements de dépendances et de tests, sans effet visible :
  - `@mairie360/front-kit` vendorisé remplacé par les sous-chemins de `@mairie360/lib-components` 0.10.2 ;
  - nouveau test `npm run test:bundle` sur le bundle client, puis affiné ;
  - contrat BFF passé en 1.0.0 au contenu inchangé ;
  - images des stacks de test (`docker-compose*.yml`) alignées.

  (MAIR-126, MAIR-569, MAIR-575, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220), [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212), [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222))

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- L'écran Formation adopte le thème partagé de `@mairie360/lib-components` (0.9.0, feuille de style publiée à la place de la copie locale `municipal-theme.css`). Le chargement affiche les squelettes partagés (`Skeleton`). D'après la PR, les résultats vides sont libellés, les confirmations d'action peuvent être fermées et le lien d'évitement précède la navigation répétée ; le diff est tronqué sur ces points. (MAIR-526, MAIR-515, MAIR-540, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Changements de comportement
- Le front suit le contrat dev `@mairie360/bff-elearning-openapi` `0.0.0-dev.15082e063d46c3fcf9b31c697eeacdcd6858970c`. Ce contrat documente une réponse `429` (limite de débit d'une API amont, réessayer après l'en-tête `Retry-After`) sur 9 opérations. La projection `ElearningCatalogResponse` reste inchangée. (MAIR-575, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222))

#### Corrections
- Sur ordinateur, la navigation latérale partagée passait en positionnement relatif à cause d'un ancien style de tiroir, ce qui repoussait l'en-tête et le catalogue sous elle. Elle reste maintenant fixée au bord de l'écran ; le style historique ne s'applique plus qu'au tiroir `.app-published-sidebar`. (MAIR-526, MAIR-547, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- 3 changements CI :
  - workflow `mairie360/CICD` épinglé en v4.3.1 puis v4.3.2, avec l'étape de journal des releases et un suivi Renovate des épinglages SHA ;
  - jeton en lecture seule par défaut ;
  - pipelines déclenchés sur `push` vers `main` uniquement.

  (MAIR-436, MAIR-571, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205), [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214), [#218](https://github.com/mairie360/Elearning_Web_Service/pull/218))
- 4 changements de dépendances et de tests, sans effet visible :
  - `@mairie360/front-kit` vendorisé remplacé par les sous-chemins de `@mairie360/lib-components` 0.10.2 ;
  - nouveau test `npm run test:bundle` sur le bundle client, puis affiné ;
  - contrat BFF passé en 1.0.0 au contenu inchangé ;
  - images des stacks de test (`docker-compose*.yml`) alignées.

  (MAIR-126, MAIR-569, MAIR-575, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220), [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212), [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-20 13:52 UTC | dev | — | `0474b4c` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39433519951) |
| 2026-10-20 12:23 UTC | dev | — | `36b3cb8` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39421306506) |
| 2026-10-19 22:13 UTC | dev | — | `a2dd9c9` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39332816489) |
| 2026-10-19 21:58 UTC | dev | — | `9cd87f5` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39330915338) |
| 2026-10-19 20:40 UTC | dev | — | `6482090` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39320707529) |
<!-- release-journal-history:end -->
