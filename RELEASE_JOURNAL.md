# Journal des releases — Elearning_Web_Service

<!-- release-journal-state {"dev": "8a76bd65038140c8366a953a6ce35c3ed7841038", "prod": "01faf1c8a991cbd6b64478c8b17e8e79a5a27e0b", "prod_tag": "v0.4.0", "staging": "8a76bd65038140c8366a953a6ce35c3ed7841038", "updated": {"dev": "2026-11-12 17:08 UTC", "prod": "2026-10-21 11:18 UTC", "staging": "2026-11-12 20:50 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v0.4.0 | `01faf1c` | 2026-10-21 11:18 UTC |
| staging | — | `8a76bd6` | 2026-11-12 20:50 UTC |
| dev | — | `8a76bd6` | 2026-11-12 17:08 UTC |

## Ajouté sur main depuis la dernière release prod (v0.4.0)

- fix: MAIR-816 Release dev: align internal versions and deploy ([#269](https://github.com/mairie360/Elearning_Web_Service/pull/269))
- chore(deps): update dependency mairie360/cicd to v5.6.0 (#267) ([#267](https://github.com/mairie360/Elearning_Web_Service/pull/267))
- feat: MAIR-603 E2E - Parcours utilisateurs Playwright des fronts (#244) ([#244](https://github.com/mairie360/Elearning_Web_Service/pull/244))
- fix: MAIR-743 [Audit 30/10] Login, Calendars, Elearning, Projects: branch Gitleaks fingerprints invalid after squash, main likely red (N1) (#265) ([#265](https://github.com/mairie360/Elearning_Web_Service/pull/265))
- fix: MAIR-497 GDPR - Usage simulation and AI review of logs and database before prod ([#263](https://github.com/mairie360/Elearning_Web_Service/pull/263))
- feat: MAIR-497 RGPD - Simulation d'usage et revue IA des logs et de la base avant la prod ([#262](https://github.com/mairie360/Elearning_Web_Service/pull/262))
- ci: MAIR-771 APIs, BFFs, Database : monter CICD en v5.2.2 pour activer les contrôles RGPD (#260) ([#260](https://github.com/mairie360/Elearning_Web_Service/pull/260))
- fix: MAIR-744 [Audit 30/10] Login, Calendars, Elearning, Projects : le postinstall interroge le service d'avis npm, npm ci dépend du réseau (N2) (#259) ([#259](https://github.com/mairie360/Elearning_Web_Service/pull/259))
- fix(deps): bump follow-redirects to 1.16.2 (GHSA-mrwp-f3q8-3g9p) ([#256](https://github.com/mairie360/Elearning_Web_Service/pull/256))
- fix: MAIR-768 RGAA - Aligner les stacks d'accessibilité des fronts mergés en premier ([#254](https://github.com/mairie360/Elearning_Web_Service/pull/254))
- feat: MAIR-316 RGAA - Périmètre et états des pages par front (#168) ([#168](https://github.com/mairie360/Elearning_Web_Service/pull/168))
- ci: MAIR-295 Ajouter une checklist RGPD aux PR et des rappels d'échéances automatiques (#175) ([#175](https://github.com/mairie360/Elearning_Web_Service/pull/175))
- chore(deps): update dependency mairie360/cicd to v4.12.0 (#250) ([#250](https://github.com/mairie360/Elearning_Web_Service/pull/250))
- fix(security): repair dependency locks and bound Zod validation (#248) ([#248](https://github.com/mairie360/Elearning_Web_Service/pull/248))
- chore(deps): update dependency mairie360/cicd to v4.5.0 (#245) ([#245](https://github.com/mairie360/Elearning_Web_Service/pull/245))
- chore(deps): update typescript dependencies (#246) ([#246](https://github.com/mairie360/Elearning_Web_Service/pull/246))
- fix(security): patch Node.js and Next.js (#247) ([#247](https://github.com/mairie360/Elearning_Web_Service/pull/247))
- feat!: MAIR-608 Lib UI - Normaliser la charte, les tailles et les composants partagés des fronts ([#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

## Différence dev → staging (en dev, pas encore en staging)

_Rien._

## Différence staging → prod (en staging, pas encore en prod)

- fix: MAIR-816 Release dev: align internal versions and deploy ([#269](https://github.com/mairie360/Elearning_Web_Service/pull/269))
- chore(deps): update dependency mairie360/cicd to v5.6.0 (#267) ([#267](https://github.com/mairie360/Elearning_Web_Service/pull/267))
- feat: MAIR-603 E2E - Parcours utilisateurs Playwright des fronts (#244) ([#244](https://github.com/mairie360/Elearning_Web_Service/pull/244))
- fix: MAIR-743 [Audit 30/10] Login, Calendars, Elearning, Projects: branch Gitleaks fingerprints invalid after squash, main likely red (N1) (#265) ([#265](https://github.com/mairie360/Elearning_Web_Service/pull/265))
- fix: MAIR-497 GDPR - Usage simulation and AI review of logs and database before prod ([#263](https://github.com/mairie360/Elearning_Web_Service/pull/263))
- feat: MAIR-497 RGPD - Simulation d'usage et revue IA des logs et de la base avant la prod ([#262](https://github.com/mairie360/Elearning_Web_Service/pull/262))
- ci: MAIR-771 APIs, BFFs, Database : monter CICD en v5.2.2 pour activer les contrôles RGPD (#260) ([#260](https://github.com/mairie360/Elearning_Web_Service/pull/260))
- fix: MAIR-744 [Audit 30/10] Login, Calendars, Elearning, Projects : le postinstall interroge le service d'avis npm, npm ci dépend du réseau (N2) (#259) ([#259](https://github.com/mairie360/Elearning_Web_Service/pull/259))
- fix(deps): bump follow-redirects to 1.16.2 (GHSA-mrwp-f3q8-3g9p) ([#256](https://github.com/mairie360/Elearning_Web_Service/pull/256))
- fix: MAIR-768 RGAA - Aligner les stacks d'accessibilité des fronts mergés en premier ([#254](https://github.com/mairie360/Elearning_Web_Service/pull/254))
- feat: MAIR-316 RGAA - Périmètre et états des pages par front (#168) ([#168](https://github.com/mairie360/Elearning_Web_Service/pull/168))
- ci: MAIR-295 Ajouter une checklist RGPD aux PR et des rappels d'échéances automatiques (#175) ([#175](https://github.com/mairie360/Elearning_Web_Service/pull/175))
- chore(deps): update dependency mairie360/cicd to v4.12.0 (#250) ([#250](https://github.com/mairie360/Elearning_Web_Service/pull/250))
- fix(security): repair dependency locks and bound Zod validation (#248) ([#248](https://github.com/mairie360/Elearning_Web_Service/pull/248))
- chore(deps): update dependency mairie360/cicd to v4.5.0 (#245) ([#245](https://github.com/mairie360/Elearning_Web_Service/pull/245))
- chore(deps): update typescript dependencies (#246) ([#246](https://github.com/mairie360/Elearning_Web_Service/pull/246))
- fix(security): patch Node.js and Next.js (#247) ([#247](https://github.com/mairie360/Elearning_Web_Service/pull/247))
- feat!: MAIR-608 Lib UI - Normaliser la charte, les tailles et les composants partagés des fronts ([#239](https://github.com/mairie360/Elearning_Web_Service/pull/239))

> Résumé Claude indisponible pour ce passage : listes brutes des commits.

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-12 20:50 UTC | staging | — | `8a76bd6` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/43285915354) |
| 2026-11-12 17:08 UTC | dev | — | `8a76bd6` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/43264229565) |
| 2026-11-04 21:28 UTC | dev | — | `0586513` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/41915169326) |
| 2026-11-04 18:29 UTC | dev | — | `44be9c8` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/41884403650) |
| 2026-11-04 18:23 UTC | dev | — | `d9bf625` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/41882982754) |
| 2026-11-03 14:57 UTC | dev | — | `5ab732c` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/41656764278) |
| 2026-11-02 22:59 UTC | dev | — | `8105939` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/41540142814) |
| 2026-11-02 19:53 UTC | dev | — | `718ab46` | [run](https://github.com/mairie360/Elearning_Web_Service/actions/runs/41513014827) |
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
