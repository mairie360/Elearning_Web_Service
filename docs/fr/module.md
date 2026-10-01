# Elearning_Web_Service — Présentation du module

## Navigation des modules actifs

Les menus ordinateur et mobile ne proposent plus les modules archivés E-mails
et Fichiers, comme dans la version locale. L'ordre des autres modules et la
visibilité réservée aux administrateurs restent inchangés ; Paramètres reste
accessible via l’AppShell partagé. Les pièces jointes et documents métier des
modules actifs ne sont pas supprimés.

## Un seul espace compte

Le profil est désormais ouvert dans **Paramètres (Settings)**. Les anciens liens
`/profile` et leurs sous-chemins redirigent vers le front Settings configuré
pour les visiteurs authentifiés. La sidebar conserve Paramètres sans doublon
Profil. Si Settings n’est pas configuré correctement, ces anciens liens renvoient
une erreur 503 non mise en cache ; aucune donnée personnelle de démonstration
ni fausse sauvegarde n’est affichée.

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

### Échec d’actualisation et ordre des réponses (MAIR-350)

Si l’actualisation du catalogue échoue après une progression, une note ou une
action administrateur, la dernière version chargée reste visible avec une erreur
et un bouton de reprise. Réessayer recharge seulement le catalogue, sans renvoyer
la mutation. Une ancienne réponse ou erreur du catalogue ne peut remplacer une
actualisation plus récente ni un démarrage confirmé par le serveur. Le front
n’invente aucun succès optimiste de progression ou de notation.
Les erreurs restent visibles au-dessus du dialogue de formation. Un 401 déclenche
toujours la déconnexion, même pour une requête dépassée : l’ordre des réponses ne
réduit pas le contrôle d’authentification.

Cette tranche concerne uniquement la fiabilité frontend. Les téléchargements
autorisés, les avis écrits et la progression durable entre sessions restent des
dépendances non validées de MAIR-350 ; ce changement ne termine pas le ticket et
n’ajoute aucune route non publiée.

### Confirmation du formulaire de formation (MAIR-378)

Les actions de création/modification retournent `false` après un refus et `true`
après une mutation confirmée, indépendamment d’un échec ultérieur d’actualisation.
Le composant transmet cette promesse au catalogue partagé sans l’ignorer.
L’adoption de la version publiée de la bibliothèque MAIR-378 reste nécessaire pour
conserver champs/chapitres/ressources après un refus et bloquer saisies/annulation
pendant l’attente. Ne pas considérer l’intégration comme terminée avant vérification
de cette version exacte et du parcours de reprise desktop/mobile. Routes et DTOs
existants restent inchangés ; upload/clés et avis écrits sont des travaux distincts.

## Pour développer ou exploiter ce module

Le [guide technique](technical.md) détaille architecture, configuration, routes, session, persistance, tests et CI/CD. Il décrit les sources de vérité et les étapes de synchronisation des contrats avec les dépôts associés.
