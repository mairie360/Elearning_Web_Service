# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "64820902f62c398f31cd7202694200604dc96c3b", "prod": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "prod_tag": "v0.3.0", "staging": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "updated": {"dev": "2026-10-19 20:40 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.3.0 | `322e9d6` | — |
| staging | — | `322e9d6` | — |
| dev | — | `6482090` | 2026-10-19 20:40 UTC |

## Ajouté sur main depuis la dernière release prod (v0.3.0)

#### Nouveautés
- L'interface Formation adopte le thème commun de `@mairie360/lib-components` 0.9.0 : feuille de style partagée `@mairie360/lib-components/styles.css` à la place du thème local `municipal-theme.css`, et squelettes de chargement partagés (`Skeleton`) sur l'écran « Chargement des formations… ». D'après la PR, on trouve aussi des résultats vides libellés, des confirmations d'action refermables et un lien d'évitement placé avant la navigation répétée. Le diff est tronqué, donc le détail des écrans concernés reste à vérifier. (MAIR-526, MAIR-515, MAIR-540, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Corrections
- Sur grand écran, la navigation principale pouvait passer en positionnement relatif, ce qui repoussait l'en-tête et le catalogue sous elle. Elle reste maintenant fixée au bord de la fenêtre : les anciens styles du tiroir ne s'appliquent plus qu'à la barre latérale mobile (`.app-published-sidebar`). (MAIR-526, MAIR-547, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Le contrat `@mairie360/bff-elearning-openapi` passe de `0.0.0-dev.c4c3f73…` à `1.0.0`, avec un contenu inchangé. Les piles `docker-compose*.yml` utilisent désormais les images prod : `bff-elearning` et `bff-user` 1.0.0, `core-api` 2.1.0, `elearning-api` 1.1.0, `database` et `liquibase-migrations` 3.2.0. (MAIR-569, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212))
- Deux changements de CI :
  - Le jeton des workflows est en lecture seule par défaut, l'écriture étant réservée au job `CICD`, et les déclenchements sur `push` sont limités à `main`. (MAIR-436, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205))
  - Le workflow réutilisable passe à CICD v4.3.1, qui ajoute l'étape de journal des releases (`RELEASE_JOURNAL.md`) et transmet les secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK`. (MAIR-571, [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214))

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- L'interface Formation adopte le thème commun de `@mairie360/lib-components` 0.9.0 : feuille de style partagée `@mairie360/lib-components/styles.css` à la place du thème local `municipal-theme.css`, et squelettes de chargement partagés (`Skeleton`) sur l'écran « Chargement des formations… ». D'après la PR, on trouve aussi des résultats vides libellés, des confirmations d'action refermables et un lien d'évitement placé avant la navigation répétée. Le diff est tronqué, donc le détail des écrans concernés reste à vérifier. (MAIR-526, MAIR-515, MAIR-540, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Corrections
- Sur grand écran, la navigation principale pouvait passer en positionnement relatif, ce qui repoussait l'en-tête et le catalogue sous elle. Elle reste maintenant fixée au bord de la fenêtre : les anciens styles du tiroir ne s'appliquent plus qu'à la barre latérale mobile (`.app-published-sidebar`). (MAIR-526, MAIR-547, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Le contrat `@mairie360/bff-elearning-openapi` passe de `0.0.0-dev.c4c3f73…` à `1.0.0`, avec un contenu inchangé. Les piles `docker-compose*.yml` utilisent désormais les images prod : `bff-elearning` et `bff-user` 1.0.0, `core-api` 2.1.0, `elearning-api` 1.1.0, `database` et `liquibase-migrations` 3.2.0. (MAIR-569, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212))
- Deux changements de CI :
  - Le jeton des workflows est en lecture seule par défaut, l'écriture étant réservée au job `CICD`, et les déclenchements sur `push` sont limités à `main`. (MAIR-436, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205))
  - Le workflow réutilisable passe à CICD v4.3.1, qui ajoute l'étape de journal des releases (`RELEASE_JOURNAL.md`) et transmet les secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK`. (MAIR-571, [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-19 20:40 UTC | dev | — | `6482090` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39320707529) |
<!-- release-journal-history:end -->
