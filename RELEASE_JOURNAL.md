# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "841afb0a25c573c61f820cf5c3b0e755c0c62e0e", "prod": "322e9d6bf39d06f3bc19e2298ce82653f51a743d", "prod_tag": "v0.3.0", "staging": "6f7aef7f9baa5592726ddfcf4bb6377b4faf7041", "updated": {"dev": "2026-10-21 10:01 UTC", "staging": "2026-10-20 21:28 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.3.0 | `322e9d6` | — |
| staging | — | `6f7aef7` | 2026-10-20 21:28 UTC |
| dev | — | `841afb0` | 2026-10-21 10:01 UTC |

## Ajouté sur main depuis la dernière release prod (v0.3.0)

#### Nouveautés
- Thème municipal partagé et retours d'interface accessibles : le front adopte `@mairie360/lib-components` 0.9.0 (thème commun, squelettes de chargement, états vides libellés, accusés de réception fermables après une action confirmée), et un lien d'évitement unique précède la navigation répétée. Les brouillons et les erreurs contextuelles sont conservés. (MAIR-526, MAIR-515, MAIR-540, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209))

#### Corrections
- La navigation de bureau restait dans le flux normal, si bien que l'en-tête et le catalogue passaient en dessous. Avant : le sélecteur du tiroir historique la rendait `relative`. Maintenant : elle reste fixée au bord de la fenêtre, et l'en-tête et le catalogue sont alignés en haut. (MAIR-526, MAIR-547, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Front : `@mairie360/lib-components` 0.10.2 remplace l'archive `@mairie360/front-kit` vendorisée, et un test de bundle client vérifie qu'aucune entrée inutilisée de la lib n'arrive dans `.next/static` (MAIR-126, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220)).
- Contrat BFF : passage à `1.0.0` puis au paquet staging `55dfd4b`, images de test alignées sur les releases prod, et contrat qui déclare des `429` sur 7 routes (MAIR-569, MAIR-575, MAIR-600, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212), [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222), [#224](https://github.com/mairie360/Elearning_Web_Service/pull/224)).
- CI : CICD en v4.3.x puis v4.4.3, promotion staging et prod manuelle, jetons en lecture seule et push sur `main` seulement, journal des releases (MAIR-436, MAIR-494, MAIR-571, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205), [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214), [#218](https://github.com/mairie360/Elearning_Web_Service/pull/218), [#231](https://github.com/mairie360/Elearning_Web_Service/pull/231)).
- Mises à jour automatiques de CICD par Renovate (v4.4.0, v4.4.1, v4.4.3) et tests de cohérence des pins associés (3 PR).

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- Aucun changement fonctionnel pour le front entre dev et staging : ce sont des mises à jour de la référence CICD (v4.4.0, v4.4.1, v4.4.3) par Renovate dans les workflows (MAIR-494, [#230](https://github.com/mairie360/Elearning_Web_Service/pull/230), [#233](https://github.com/mairie360/Elearning_Web_Service/pull/233), [#234](https://github.com/mairie360/Elearning_Web_Service/pull/234)).
- Ajout de `promote-staging.yml` et `promote-prod.yml`, déclenchés à la main sur `main` avec un verrou par cible, et documentation de la promotion dans `CLAUDE.md` (MAIR-494, [#231](https://github.com/mairie360/Elearning_Web_Service/pull/231)).

## Différence staging → prod (en staging, pas encore en prod)

#### Corrections
- La navigation de bureau restait dans le flux normal, si bien que l'en-tête et le catalogue passaient en dessous. Avant : le sélecteur du tiroir historique la rendait `relative`. Maintenant : elle reste fixée au bord de la fenêtre, et l'en-tête et le catalogue sont alignés en haut. (MAIR-526, MAIR-547, [#210](https://github.com/mairie360/Elearning_Web_Service/pull/210))

#### Technique
- Thème et retours d'interface : adoption de `@mairie360/lib-components` 0.9.0 (thème municipal partagé, squelettes de chargement, états vides, accusés de réception) et lien d'évitement unique, sans changer la logique métier (MAIR-526, MAIR-515, MAIR-540, [#209](https://github.com/mairie360/Elearning_Web_Service/pull/209)).
- Front : `@mairie360/lib-components` 0.10.2 remplace l'archive `@mairie360/front-kit` vendorisée, et un test de bundle client est ajouté (MAIR-126, [#216](https://github.com/mairie360/Elearning_Web_Service/pull/216), [#220](https://github.com/mairie360/Elearning_Web_Service/pull/220)).
- Contrat BFF : le paquet staging `0.0.0-staging.55dfd4b` et l'image `staging-55dfd4b` sont utilisés dans les stacks, et le contrat déclare désormais des `429` sur 7 routes (MAIR-575, MAIR-600, [#222](https://github.com/mairie360/Elearning_Web_Service/pull/222), [#224](https://github.com/mairie360/Elearning_Web_Service/pull/224)).
- Images de test alignées sur les releases prod (BFF 1.0.0, API, base de données) et contrat BFF 1.0.0 (MAIR-569, [#212](https://github.com/mairie360/Elearning_Web_Service/pull/212)).
- CI : CICD v4.3.x, permissions en lecture seule, push sur `main` seulement, journal des releases et secrets associés (MAIR-436, MAIR-571, [#205](https://github.com/mairie360/Elearning_Web_Service/pull/205), [#214](https://github.com/mairie360/Elearning_Web_Service/pull/214), [#218](https://github.com/mairie360/Elearning_Web_Service/pull/218)).

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
