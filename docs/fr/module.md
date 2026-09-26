# Elearning_Web_Service — Présentation du module

## Navigation des modules actifs

Les menus ordinateur et mobile ne proposent plus les modules archivés E-mails
et Fichiers, comme dans la version locale. L'ordre des autres modules et la
visibilité réservée aux administrateurs restent inchangés ; Paramètres reste
accessible. Les pièces jointes et documents métier des modules actifs ne sont
pas supprimés. Ce lot ne constitue pas la migration AppShell complète.

## Un seul espace compte

Le profil est désormais ouvert dans **Paramètres (Settings)**. Les anciens liens
`/profile` et leurs sous-chemins redirigent vers le front Settings configuré.
La sidebar conserve Paramètres sans doublon Profil. Si Settings n'est pas configuré
correctement, une indisponibilité explicite remplace la redirection ; aucune donnée
personnelle de démonstration ni fausse sauvegarde n'est affichée.

[Documentation technique](technical.md) · [English](../en/module.md) · [README](../../README.md)

Présenter le catalogue de formations et permettre aux agents de suivre leur apprentissage. L’interface consomme les routes de BFF Elearning et expose les fonctions administrateur selon le contexte.

## Public et utilité

Les apprenants et administrateurs du catalogue de formation.

Domaine fonctionnel: Formation en ligne.

## Fonctions disponibles

- Catalogue, filtres et détails de formation.
- Démarrage, reprise, progression de contenu et notation.
- Accès au compte via Settings et gestion des formations pour les administrateurs.

## Parcours type

1. Valider la session auprès de BFF User et charger le catalogue.
2. Démarrer une formation, consulter son contenu et enregistrer la progression.
3. Retrouver la progression et les notes tant que le processus BFF conserve son état.

## Place dans Mairie360

Dépôts associés: [BFF_Elearning](https://github.com/mairie360/BFF_Elearning).

Ce dépôt contient l’interface navigateur et ses adaptateurs Next.js. Le BFF associé fournit les données métier et coordonne leurs sources.

## Données et état actuel

Le catalogue initial est défini dans `elearning_helpers.ts`. Les formations modifiées, progressions, notes et surcharges de profil sont gérées en mémoire, notamment dans des Map indexées par utilisateur. BFF User fournit l’identité. Le client Elearning API et les diagnostics présents ne rendent pas ce stockage persistant.

## Périmètre et limites

Un redémarrage réinitialise les données en mémoire; plusieurs instances ne partagent pas cet état. La validation du contrat ou un succès HTTP ne prouve pas un enregistrement durable dans Elearning API.

## Pour développer ou exploiter ce module

Le [guide technique](technical.md) détaille architecture, configuration, routes, session, persistance, tests et CI/CD. Il décrit les sources de vérité et les étapes de synchronisation des contrats avec les dépôts associés.
