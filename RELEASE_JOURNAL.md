# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "a2dd9c9b49f8b32f88229acbde05221d18eb82f3", "prod": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "prod_tag": "v0.3.0", "staging": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "updated": {"dev": "2026-10-19 22:13 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.3.0 | `322e9d6` | — |
| staging | — | `322e9d6` | — |
| dev | — | `a2dd9c9` | 2026-10-19 22:13 UTC |

## Ajouté sur main depuis la dernière release prod (v0.3.0)

#### Nouveautés
- L'écran Formation adopte le thème commun de `@mairie360/lib-components` 0.9.0 (feuille de style partagée `@mairie360/lib-components/styles.css`, la copie locale `municipal-theme.css` est supprimée). Il affiche aussi les retours partagés : squelettes de chargement (`Skeleton`) pendant « Chargement des formations… », résultats vides libellés et confirmations d'action refermables. Les brouillons, les erreurs contextuelles et la reprise en lecture seule sont conservés, et le lien d'évitement unique précède la navigation répétée. (MAIR-526, MAIR-515, MAIR-540, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))
#### Corrections
- Navigation sur ordinateur : avant, l'ancien style du tiroir mobile s'appliquait aussi à la navigation de bureau et la passait en position relative, ce qui repoussait l'en-tête et le catalogue sous elle. Maintenant, ce style ne vise plus que la barre latérale publiée (`.app-published-sidebar`) et la navigation de bureau reste fixée au bord de l'écran. (MAIR-526, MAIR-547, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))
#### Technique
- Dépendances :
  - Le socle partagé (session, proxy, garde, thème) est importé depuis les sous-chemins de `@mairie360/lib-components` 0.10.2 au lieu de l'archive `@mairie360/front-kit` vendorisée, sans changement de comportement annoncé.
  - Nouveau contrôle `npm run test:bundle` du bundle client.
  - `@mairie360/bff-elearning-openapi` passe en 1.0.0 (contenu du contrat inchangé) et les images Docker des stacks de test passent en versions prod.
  - (MAIR-126, MAIR-569, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220), [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212))
- CI :
  - Le jeton est en lecture seule par défaut, avec écriture réservée au job de release.
  - Les workflows ne se déclenchent sur `push` que pour `main`.
  - Passage à CICD v4.3.1, avec l'étape de journal de release.
  - (MAIR-436, MAIR-571, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205), [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214))

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- L'écran Formation adopte le thème commun de `@mairie360/lib-components` 0.9.0 (feuille de style partagée `@mairie360/lib-components/styles.css`, la copie locale `municipal-theme.css` est supprimée). Il affiche aussi les retours partagés : squelettes de chargement (`Skeleton`) pendant « Chargement des formations… », résultats vides libellés et confirmations d'action refermables. Les brouillons, les erreurs contextuelles et la reprise en lecture seule sont conservés, et le lien d'évitement unique précède la navigation répétée. (MAIR-526, MAIR-515, MAIR-540, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))
#### Corrections
- Navigation sur ordinateur : avant, l'ancien style du tiroir mobile s'appliquait aussi à la navigation de bureau et la passait en position relative, ce qui repoussait l'en-tête et le catalogue sous elle. Maintenant, ce style ne vise plus que la barre latérale publiée (`.app-published-sidebar`) et la navigation de bureau reste fixée au bord de l'écran. (MAIR-526, MAIR-547, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))
#### Technique
- Dépendances :
  - Le socle partagé (session, proxy, garde, thème) est importé depuis les sous-chemins de `@mairie360/lib-components` 0.10.2 au lieu de l'archive `@mairie360/front-kit` vendorisée, sans changement de comportement annoncé.
  - Nouveau contrôle `npm run test:bundle` du bundle client.
  - `@mairie360/bff-elearning-openapi` passe en 1.0.0 (contenu du contrat inchangé) et les images Docker des stacks de test passent en versions prod.
  - (MAIR-126, MAIR-569, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220), [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212))
- CI :
  - Le jeton est en lecture seule par défaut, avec écriture réservée au job de release.
  - Les workflows ne se déclenchent sur `push` que pour `main`.
  - Passage à CICD v4.3.1, avec l'étape de journal de release.
  - (MAIR-436, MAIR-571, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205), [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-19 22:13 UTC | dev | — | `a2dd9c9` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39332816489) |
| 2026-10-19 21:58 UTC | dev | — | `9cd87f5` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39330915338) |
| 2026-10-19 20:40 UTC | dev | — | `6482090` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39320707529) |
<!-- release-journal-history:end -->
