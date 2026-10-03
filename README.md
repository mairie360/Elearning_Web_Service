# Elearning_Web_Service

Present the training catalogue and let staff track their learning. The interface consumes BFF Elearning routes and exposes administrator functions according to context.

Présenter le catalogue de formations et permettre aux agents de suivre leur apprentissage. L’interface consomme les routes de BFF Elearning et expose les fonctions administrateur selon le contexte.

## Documentation

| Language / Langue | Module | Technical / Technique |
| --- | --- | --- |
| English | [Module overview](docs/en/module.md) | [Technical documentation](docs/en/technical.md) |
| Français | [Présentation du module](docs/fr/module.md) | [Documentation technique](docs/fr/technical.md) |

The guides describe the implemented module, its current limitations, local setup, routes, data, verification and CI/CD.

Les guides décrivent le module implémenté, ses limites actuelles, le démarrage local, les routes, les données, les vérifications et la CI/CD.

## Confirmed catalog changes (MAIR-452)

Administrator creation and updates retain the course returned by the existing service. Deletion removes a course only after a matching positive confirmation. If the subsequent catalog read fails, these confirmed changes remain visible while the existing refresh error and GET-only retry remain available. Earlier reads cannot overwrite a newer confirmation; unrelated courses, profile data and official statistics are retained until a successful catalog response replaces them. Submitted drafts and fabricated statistics are never used as confirmation.

`tests/catalog-admin-confirmation.test.cjs` exercises the real consumer actions through the unchanged contract-bound HTTP path, including refused writes, refused refreshes, late reads, duplicate IDs and unconfirmed deletion. This frontend behavior does not implement the separate upload/key or resource/download requirements, change API/BFF contracts, or approve a deployment.

Read recovery remains available when another write is refused: both failures share a single feedback stack instead of overlapping or hiding Retry. A pending retry retains the previous read failure and confirmed courses, disables the button and announces the refresh. Only a successful latest catalogue read clears its own error; it neither clears the refused-write message nor repeats that write. HTML consumer regressions cover these independent recovery states.

Repeated deletion of the same course shares the existing in-flight operation, including its subsequent catalogue read. It sends only one DELETE, does not remove a pending or refused course, and releases the guard after settlement so an explicit retry remains possible. Different course identifiers remain independent. The current public library still displays the Delete button while pending; the frontend action prevents duplicate requests rather than claiming a disabled-control state. Contract-backed action and rendered-consumer regressions cover these paths without changing the network contract or shared library.

La suppression répétée d’une même formation partage l’opération déjà en attente, relecture du catalogue comprise. Un seul DELETE est envoyé ; une réponse en attente ou refusée ne supprime pas la formation. Après règlement, une tentative explicite reste possible, et les autres identifiants restent indépendants. Le bouton de la bibliothèque reste visible pendant l’attente : la protection est portée par l’action frontend, sans prétendre désactiver ce contrôle. Aucun BFF/API, contrat ou bibliothèque partagée n’est modifié.

## Contracts and background / Contrats et compléments

- [BFF.md](BFF.md)
- [BACKEND.md](BACKEND.md)
- [contracts/openapi.json](contracts/openapi.json)

`BACKEND.md`, when present, includes proposed backend requirements; use the guides and versioned OpenAPI contract to identify current behavior.

`BACKEND.md`, lorsqu’il est présent, contient des besoins backend proposés; consulter les guides et le contrat OpenAPI versionné pour identifier le comportement actuel.
