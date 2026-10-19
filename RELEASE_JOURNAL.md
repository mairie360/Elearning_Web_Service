# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "9cd87f5423498a4e4262f06827690c6ac6677828", "prod": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "prod_tag": "v0.3.0", "staging": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "updated": {"dev": "2026-10-19 21:58 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.3.0 | `322e9d6` | — |
| staging | — | `322e9d6` | — |
| dev | — | `9cd87f5` | 2026-10-19 21:58 UTC |

## Ajouté sur main depuis la dernière release prod (v0.3.0)

#### Nouveautés
- L'écran Formation adopte le thème commun publié de `@mairie360/lib-components` (0.9.0) : la feuille de style partagée `@mairie360/lib-components/styles.css` remplace la copie locale `municipal-theme.css`, et le chargement des formations (« Chargement des formations… ») affiche les placeholders `Skeleton` partagés. D'après la PR, l'écran reprend aussi les résultats vides libellés, les confirmations d'action refermables et un lien d'évitement unique placé avant la navigation, sans perdre les brouillons, les erreurs contextuelles ni la reprise en lecture seule. Le diff de `ElearningModule.tsx` est tronqué, donc le détail de ces écrans n'est pas vérifiable ici. (MAIR-526, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Corrections
- Navigation principale sur ordinateur : avant, le style de l'ancien tiroir s'appliquait aussi à la nouvelle navigation de bureau. Il la passait en positionnement relatif, ce qui repoussait l'en-tête et le catalogue sous elle. Maintenant, ces règles ne visent que la barre latérale publiée (`.app-published-sidebar`) et la navigation de bureau reste fixée au bord de l'écran. (MAIR-526, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Dépendances : le socle partagé (session, garde du proxy, thème, contexte d'instance) est importé depuis les sous-chemins de `@mairie360/lib-components` épinglé en `0.10.2`, à la place de l'archive `@mairie360/front-kit` du dossier `vendor/`, sans changement de comportement annoncé (MAIR-126, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216)). Le contrat `@mairie360/bff-elearning-openapi` passe en `1.0.0`, avec un contenu de contrat inchangé, et les images Docker des stacks de test passent sur leurs versions prod (MAIR-569, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212)).
- CI : pipeline `mairie360/CICD` passé en v4.3.1 avec les secrets du journal de release (MAIR-571, [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214)). Jeton des workflows en lecture seule par défaut et déclenchement sur `push` limité à `main` (MAIR-436, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205)). Nouveau test `npm run test:bundle` sur le contenu du bundle client (MAIR-126, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216)).

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- L'écran Formation adopte le thème commun publié de `@mairie360/lib-components` (0.9.0) : la feuille de style partagée `@mairie360/lib-components/styles.css` remplace la copie locale `municipal-theme.css`, et le chargement des formations (« Chargement des formations… ») affiche les placeholders `Skeleton` partagés. D'après la PR, l'écran reprend aussi les résultats vides libellés, les confirmations d'action refermables et un lien d'évitement unique placé avant la navigation, sans perdre les brouillons, les erreurs contextuelles ni la reprise en lecture seule. Le diff de `ElearningModule.tsx` est tronqué, donc le détail de ces écrans n'est pas vérifiable ici. (MAIR-526, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Corrections
- Navigation principale sur ordinateur : avant, le style de l'ancien tiroir s'appliquait aussi à la nouvelle navigation de bureau. Il la passait en positionnement relatif, ce qui repoussait l'en-tête et le catalogue sous elle. Maintenant, ces règles ne visent que la barre latérale publiée (`.app-published-sidebar`) et la navigation de bureau reste fixée au bord de l'écran. (MAIR-526, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Dépendances : le socle partagé (session, garde du proxy, thème, contexte d'instance) est importé depuis les sous-chemins de `@mairie360/lib-components` épinglé en `0.10.2`, à la place de l'archive `@mairie360/front-kit` du dossier `vendor/`, sans changement de comportement annoncé (MAIR-126, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216)). Le contrat `@mairie360/bff-elearning-openapi` passe en `1.0.0`, avec un contenu de contrat inchangé, et les images Docker des stacks de test passent sur leurs versions prod (MAIR-569, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212)).
- CI : pipeline `mairie360/CICD` passé en v4.3.1 avec les secrets du journal de release (MAIR-571, [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214)). Jeton des workflows en lecture seule par défaut et déclenchement sur `push` limité à `main` (MAIR-436, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205)). Nouveau test `npm run test:bundle` sur le contenu du bundle client (MAIR-126, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216)).

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-19 21:58 UTC | dev | — | `9cd87f5` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39330915338) |
| 2026-10-19 20:40 UTC | dev | — | `6482090` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39320707529) |
<!-- release-journal-history:end -->
