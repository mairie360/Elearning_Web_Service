# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "36b3cb88f92fd05bfe65574b2df0f661a74550c4", "prod": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "prod_tag": "v0.3.0", "staging": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "updated": {"dev": "2026-10-20 12:23 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.3.0 | `322e9d6` | — |
| staging | — | `322e9d6` | — |
| dev | — | `36b3cb8` | 2026-10-20 12:23 UTC |

## Ajouté sur main depuis la dernière release prod (v0.3.0)

#### Changements de comportement
- L'interface e-learning adopte le thème partagé de `@mairie360/lib-components` 0.9.0. La feuille de styles publiée `@mairie360/lib-components/styles.css` remplace le thème municipal local (`municipal-theme.css`, supprimé). L'écran de chargement « Chargement des formations… » affiche désormais les placeholders `Skeleton` partagés. ([#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))
- D'après la PR, l'interface reprend aussi plusieurs éléments partagés : résultats vides libellés, confirmations d'action refermables, lien d'évitement placé avant la navigation. Le diff de `ElearningModule.tsx` est tronqué, ce point n'est donc pas entièrement vérifié. ([#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Corrections
- Sur ordinateur, la navigation principale reste fixe, hors du flux de la page. Avant, un ancien style du tiroir de navigation la repassait en `position: relative`. Ce style ne s'applique plus qu'à la barre latérale `.app-published-sidebar`. ([#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Dépendances, sans changement de comportement annoncé :
  - le socle partagé (session, proxy, garde d'authentification, thème, contexte d'instance) est importé depuis les sous-chemins de `@mairie360/lib-components` 0.10.2 au lieu de l'archive `@mairie360/front-kit` ;
  - le contrat `@mairie360/bff-elearning-openapi` passe à 1.0.0, avec un contenu inchangé ;
  - les stacks `docker-compose*.yml` utilisent les images prod (BFF, API, base).
  (MAIR-126, MAIR-569, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220), [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212))
- CI :
  - jeton en lecture seule par défaut, pipelines lancés au push sur `main` uniquement ;
  - CICD passé en v4.3.1 puis v4.3.2, avec le journal des releases ;
  - suivi Renovate des épinglages ;
  - nouveau test `npm run test:bundle` sur le bundle client.
  (MAIR-436, MAIR-571, MAIR-126, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205), [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214), [#218](https://github.com/mairie360/Elearning_Web_Service/pull/218), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- L'interface e-learning adopte le thème partagé de `@mairie360/lib-components` 0.9.0. La feuille de styles publiée `@mairie360/lib-components/styles.css` remplace le thème municipal local (`municipal-theme.css`, supprimé). L'écran de chargement « Chargement des formations… » affiche désormais les placeholders `Skeleton` partagés. ([#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))
- D'après la PR, l'interface reprend aussi plusieurs éléments partagés : résultats vides libellés, confirmations d'action refermables, lien d'évitement placé avant la navigation. Le diff de `ElearningModule.tsx` est tronqué, ce point n'est donc pas entièrement vérifié. ([#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Corrections
- Sur ordinateur, la navigation principale reste fixe, hors du flux de la page. Avant, un ancien style du tiroir de navigation la repassait en `position: relative`. Ce style ne s'applique plus qu'à la barre latérale `.app-published-sidebar`. ([#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Dépendances, sans changement de comportement annoncé :
  - le socle partagé (session, proxy, garde d'authentification, thème, contexte d'instance) est importé depuis les sous-chemins de `@mairie360/lib-components` 0.10.2 au lieu de l'archive `@mairie360/front-kit` ;
  - le contrat `@mairie360/bff-elearning-openapi` passe à 1.0.0, avec un contenu inchangé ;
  - les stacks `docker-compose*.yml` utilisent les images prod (BFF, API, base).
  (MAIR-126, MAIR-569, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220), [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212))
- CI :
  - jeton en lecture seule par défaut, pipelines lancés au push sur `main` uniquement ;
  - CICD passé en v4.3.1 puis v4.3.2, avec le journal des releases ;
  - suivi Renovate des épinglages ;
  - nouveau test `npm run test:bundle` sur le bundle client.
  (MAIR-436, MAIR-571, MAIR-126, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205), [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214), [#218](https://github.com/mairie360/Elearning_Web_Service/pull/218), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-20 12:23 UTC | dev | — | `36b3cb8` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39421306506) |
| 2026-10-19 22:13 UTC | dev | — | `a2dd9c9` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39332816489) |
| 2026-10-19 21:58 UTC | dev | — | `9cd87f5` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39330915338) |
| 2026-10-19 20:40 UTC | dev | — | `6482090` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39320707529) |
<!-- release-journal-history:end -->
