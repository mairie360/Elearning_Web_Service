# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "eab212c3a6650b63c2545ea27103aaf42385c348", "prod": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "prod_tag": "v0.4.0", "staging": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "updated": {"dev": "2026-11-02 18:21 UTC", "prod": "2026-10-21 11:18 UTC", "staging": "2026-10-21 11:16 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.4.0 | `01faf1c` | 2026-10-21 11:18 UTC |
| staging | — | `01faf1c` | 2026-10-21 11:16 UTC |
| dev | — | `eab212c` | 2026-11-02 18:21 UTC |

## Ajouté sur main depuis la dernière release prod (v0.4.0)

#### Nouveautés
- Formulaire de formation et catalogue reconstruits sur `@mairie360/lib-components` 1.0.3 (MAIR-608) : champs TextField/TextArea et sélecteur de la lib, boutons Annuler, Enregistrer et Créer, confirmation par Toast, chargement en cartes Skeleton, états vides en DataState, bouton Réessayer en cas d'erreur, d'après la description de la PR. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))
- Barre latérale, barre supérieure et pied de page fournis par `AccessibleShell` de la lib, la préférence de barre latérale étant gérée par la lib. (MAIR-578, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Changements de comportement
- Le chemin `@mairie360/lib-components/elearning` n'existe plus : les composants du catalogue vivent dans `src/components/ElearningModule/`. Tout import de l'ancien chemin ne se résout plus. (MAIR-607/608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))
- `src/features/elearning/ElearningModule.tsx` est déplacé vers `src/components/ElearningModule/ElearningModule.tsx`, et `src/app` importe `@/components/ElearningModule`. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))
- Validation Zod : les collections sont bornées par le backport de sécurité embarqué dans `vendor/zod`. Les bornes exactes ne sont pas visibles dans le diff fourni, qui est tronqué. (sans clé Jira, [#248](https://github.com/mairie360/Elearning_Web_Service/pull/248))
- `npm install` lance désormais `postinstall` (`verify-security-backports --installed --audit-upstream`), et `prebuild` comme `pretest` lancent la vérification des backports : un écart fait échouer l'installation, le build ou les tests. (sans clé Jira, [#248](https://github.com/mairie360/Elearning_Web_Service/pull/248))
- `npm test` lance aussi Vitest (`test:components`) sur `src/**/*.test.tsx`. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Corrections
- `follow-redirects`, tiré par axios : avant, les versions 1.16.0 à 1.16.1 pouvaient transmettre des identifiants personnalisés lors de redirections inter-origines (GHSA-mrwp-f3q8-3g9p) et `npm audit --omit=dev` échouait. Maintenant le lock résout 1.16.2. (sans clé Jira, [#256](https://github.com/mairie360/Elearning_Web_Service/pull/256))
- Next.js : `next` et `eslint-config-next` passent de 16.3.8 à 16.4.2 pour le correctif GHSA-673q-mjm6-r5xr. Node passe de 24.21.0 à 24.22.1 dans les Dockerfile et la CI, pour le bulletin de sécurité Node d'octobre 2026. (sans clé Jira, [#247](https://github.com/mairie360/Elearning_Web_Service/pull/247))

#### Technique
- Pipeline d'accessibilité RGAA : `accessibility_test.sh`, `docker-compose-accessibility.yml`, `rgaa.yaml` et `init-accessibility.sql`, moteur mairie360/CICD épinglé en v5.1.0, verrou `.rgaa-run.lock`, rapport vidé à chaque run et sondes de readiness bornées. (MAIR-316, MAIR-768, [#168](https://github.com/mairie360/Elearning_Web_Service/pull/168) et [#254](https://github.com/mairie360/Elearning_Web_Service/pull/254))
- Mises à jour CI et dépendances : CICD passe de v4.4.3 à v4.5.0 ([#245](https://github.com/mairie360/Elearning_Web_Service/pull/245)) puis à v4.12.0 ([#250](https://github.com/mairie360/Elearning_Web_Service/pull/250)) ; jsdom 30.1.3 et playwright-core 1.64.1 ([#246](https://github.com/mairie360/Elearning_Web_Service/pull/246)).
- Checklist RGPD des PR (`gdpr-pr.yml`, appel de mairie360/CICD v4.12.2) et règle Renovate associée. (MAIR-295, [#175](https://github.com/mairie360/Elearning_Web_Service/pull/175))
- Tests et outillage : nouveaux tests de politique CI, de backport Zod et de provenance de la baseline de performance (`scripts/prepare-performance-baseline.cjs`, `productionBrowserSourceMaps` activé seulement dans la CI avec `MAIRIE360_BUNDLE_PROVENANCE`), et tests Vitest co-localisés. ([#248](https://github.com/mairie360/Elearning_Web_Service/pull/248), [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

## Différence dev → staging (en dev, pas encore en staging)

#### Nouveautés
- Formulaire de formation et catalogue reconstruits sur `@mairie360/lib-components` 1.0.3 (MAIR-608) : champs TextField/TextArea et sélecteur de la lib, boutons Annuler, Enregistrer et Créer, confirmation par Toast, chargement en cartes Skeleton, états vides en DataState, bouton Réessayer en cas d'erreur, d'après la description de la PR. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))
- Barre latérale, barre supérieure et pied de page fournis par `AccessibleShell` de la lib, la préférence de barre latérale étant gérée par la lib. (MAIR-578, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Changements de comportement
- Le chemin `@mairie360/lib-components/elearning` n'existe plus : les composants du catalogue vivent dans `src/components/ElearningModule/`. Tout import de l'ancien chemin ne se résout plus. (MAIR-607/608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))
- `src/features/elearning/ElearningModule.tsx` est déplacé vers `src/components/ElearningModule/ElearningModule.tsx`, et `src/app` importe `@/components/ElearningModule`. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))
- Validation Zod : les collections sont bornées par le backport de sécurité embarqué dans `vendor/zod`. Les bornes exactes ne sont pas visibles dans le diff fourni, qui est tronqué. (sans clé Jira, [#248](https://github.com/mairie360/Elearning_Web_Service/pull/248))
- `npm install` lance désormais `postinstall` (`verify-security-backports --installed --audit-upstream`), et `prebuild` comme `pretest` lancent la vérification des backports : un écart fait échouer l'installation, le build ou les tests. (sans clé Jira, [#248](https://github.com/mairie360/Elearning_Web_Service/pull/248))
- `npm test` lance aussi Vitest (`test:components`) sur `src/**/*.test.tsx`. (MAIR-608, [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

#### Corrections
- `follow-redirects`, tiré par axios : avant, les versions 1.16.0 à 1.16.1 pouvaient transmettre des identifiants personnalisés lors de redirections inter-origines (GHSA-mrwp-f3q8-3g9p) et `npm audit --omit=dev` échouait. Maintenant le lock résout 1.16.2. (sans clé Jira, [#256](https://github.com/mairie360/Elearning_Web_Service/pull/256))
- Next.js : `next` et `eslint-config-next` passent de 16.3.8 à 16.4.2 pour le correctif GHSA-673q-mjm6-r5xr. Node passe de 24.21.0 à 24.22.1 dans les Dockerfile et la CI, pour le bulletin de sécurité Node d'octobre 2026. (sans clé Jira, [#247](https://github.com/mairie360/Elearning_Web_Service/pull/247))

#### Technique
- Pipeline d'accessibilité RGAA : `accessibility_test.sh`, `docker-compose-accessibility.yml`, `rgaa.yaml` et `init-accessibility.sql`, moteur mairie360/CICD épinglé en v5.1.0, verrou `.rgaa-run.lock`, rapport vidé à chaque run et sondes de readiness bornées. (MAIR-316, MAIR-768, [#168](https://github.com/mairie360/Elearning_Web_Service/pull/168) et [#254](https://github.com/mairie360/Elearning_Web_Service/pull/254))
- Mises à jour CI et dépendances : CICD passe de v4.4.3 à v4.5.0 ([#245](https://github.com/mairie360/Elearning_Web_Service/pull/245)) puis à v4.12.0 ([#250](https://github.com/mairie360/Elearning_Web_Service/pull/250)) ; jsdom 30.1.3 et playwright-core 1.64.1 ([#246](https://github.com/mairie360/Elearning_Web_Service/pull/246)).
- Checklist RGPD des PR (`gdpr-pr.yml`, appel de mairie360/CICD v4.12.2) et règle Renovate associée. (MAIR-295, [#175](https://github.com/mairie360/Elearning_Web_Service/pull/175))
- Tests et outillage : nouveaux tests de politique CI, de backport Zod et de provenance de la baseline de performance (`scripts/prepare-performance-baseline.cjs`, `productionBrowserSourceMaps` activé seulement dans la CI avec `MAIRIE360_BUNDLE_PROVENANCE`), et tests Vitest co-localisés. ([#248](https://github.com/mairie360/Elearning_Web_Service/pull/248), [#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-02 18:21 UTC | dev | — | `eab212c` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/41470529217) |
| 2026-10-23 13:05 UTC | dev | — | `a57e4bd` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39957326316) |
| 2026-10-21 18:00 UTC | dev | — | `3a65d6f` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39647858939) |
| 2026-10-21 11:18 UTC | prod | v0.4.0 | `01faf1c` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39590823142) |
| 2026-10-21 11:16 UTC | staging | — | `01faf1c` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/39590225259) |
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
