# Elearning_Web_Service — Présentation du module

## Identité des reçus apprenant (MAIR-350)

Le reçu de démarrage confirme uniquement l’identifiant non vide demandé. Le reçu
de complétion doit reprendre le chapitre, le contenu et l’état completed demandés,
avec une seule entrée correspondante dans la liste de chapitres et contenus.
Un reçu étranger, négatif ou ambigu conserve les dernières données confirmées et
renvoie un refus au lecteur publié, sans actualisation ou écriture automatique.
Une reprise cohérente reste explicitement possible. Les pourcentages et compteurs
viennent du serveur, sans recalcul local ; la récupération après refus de lecture
est GET seule. Le DTO de complétion ne contient pas d’identifiant de formation :
cette vérification ne l’invente pas et ne prouve aucune persistance durable.

## Retour des actions d’administration confirmées (MAIR-452)

Une édition capture l’identifiant demandé avant d’attendre PATCH. Seul un reçu
avec cette même identité non vide remplace la formation et annonce sa réussite.
Un reçu étranger ou blanc conserve le catalogue et les champs du vrai formulaire
(formation, chapitres, ressources), renvoie un refus et ne déclenche aucune lecture
ou écriture automatique. Une reprise cohérente explicite reste possible ; ses
données canoniques restent après GET refusé et la récupération est GET seule.
Un reçu non corrélé ne prouve pas l’absence d’écriture côté service. La création
peut recevoir un nouvel ID canonique : la règle d’identité d’édition ne lui est
volontairement pas appliquée.

Création et modification annoncent leur réussite avec le titre canonique renvoyé
par le POST/PATCH existant. La suppression n’annonce la réussite que si `deleted`
est vrai et que l’identifiant reçu correspond à la formation demandée. Une attente
ou un refus n’affiche aucun succès. Un refus ultérieur de lecture du catalogue
conserve cette confirmation à côté de son erreur distincte ; Réessayer fait
seulement GET. La mutation suivante efface l’ancienne réussite ; Fermer retire
le message sans requête ni minuterie. Le retour accessible au clavier ne couvre
pas les commandes de reprise/annulation du formulaire auteur.

Le retour visible du prototype est rétabli, pas sa confirmation optimiste avant
réponse serveur. Aucun contenu, compteur métier, opération backend, bibliothèque,
dépendance ou environnement n’est inventé ou modifié. Téléchargements, avis écrits,
uploads, clés et persistance déployée restent des périmètres distincts.

## Présentation de la sidebar de référence (MAIR-180)

La navigation partagée conserve les cibles de 44px minimum et l'ombre mesurées
dans le prototype, sans copie locale de navigation. Dans le tiroir mobile, la
sidebar reste sous la commande Fermer publiée ; clic, clavier et retour de focus
doivent être vérifiés avec le catalogue, les filtres et le lecteur. Les données
publiées, droits et actions apprenant ne changent pas. La requête détail/avis
non publiée et la version statique du footer ancien ne sont pas réintroduites.
Cette tranche ne valide ni les téléchargements ni la persistance déployée.

## Session cookie courante (MAIR-410)

Les lectures catalogue et actions apprenant/administrateur utilisent la session
cookie courante via le proxy same-origin inchangé, sans lire ni migrer les anciens
JWT du navigateur (MAIR-410). Les valeurs localStorage principale ou héritée ne
peuvent plus la remplacer. Un refus réel provoque toujours la déconnexion ; seules
les clés de jeton connues sont retirées, sans perdre les préférences sans rapport.
Si un appel reçoit plutôt une redirection middleware, la page protégée courante
se recharge une fois, chemin/query conservés pour Login. Une requête annulée ne
navigue pas et une mutation refusée n'est jamais rejouée. Les erreurs400/403/503
restent distinctes. Révocation serveur, déconnexion en GET et persistance durable
restent des constats d'audit non résolus ; les contrôles locaux ne prouvent pas
l'intégration ni la validation de session déployée.

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

### Modification d’une note numérique confirmée (MAIR-350)

Après confirmation d’une note numérique, **Modifier ma note** ouvre explicitement
la modification. Choisir les étoiles puis **Enregistrer ma note** envoie le POST
de notation existant. Pendant la requête, étoiles, enregistrement et annulation
sont verrouillés. Un refus conserve le brouillon pour une nouvelle tentative
explicite ; seul un succès confirme la modification. **Annuler la modification**
restaure la dernière note personnelle confirmée, sans écriture. Celle-ci reste
distincte de la moyenne renvoyée par le serveur ; le front n’incrémente pas le
nombre de votes et ne remplace pas la distribution officielle des notes.
Le succès HTTP seul ne confirme rien : la réponse de notation existante doit avoir
`submitted: true`. Un acquittement négatif conserve tous les champs confirmés et
transmet le refus au lecteur, sans GET automatique ni nouveau POST. Le brouillon
sélectionné reste disponible pour une reprise explicite ou une annulation.
Ce parcours n’implémente ni avis écrit attribué ni sa modification : le contrat
publié ne fournit toujours que l’opération de notation numérique.

### Confirmation des actions apprenant (MAIR-350)

Le lecteur installé `0.6.10` conserve un chapitre fourni vide sans créer de vidéo
de remplacement, de lien, de bouton de complétion ni de pourcentage. Les détails
ou chapitres absents affichent également un état vide honnête. Cinq régressions
HTTP/HTML vérifient ces quatre absences et la sélection réelle d'un chapitre,
puis sa complétion confirmée suivie d'un GET refusé : le chapitre sélectionné et
le pourcentage renvoyé restent affichés, sans calcul local de remplacement.
Ce contrôle ne certifie ni éligibilité au téléchargement, avis écrit, lecture
média, rendu natif ni persistance intersession.

Les callbacks de démarrage, de complétion et de note numérique transmettent leur
résultat complet à la bibliothèque publiée `0.6.10`. Les commandes du lecteur et
des cartes se bloquent pendant l’écriture et l’actualisation du catalogue ; des
demandes répétées partagent la même requête. Une complétion en attente affiche
« Enregistrement… » en gris, pas l’état vert terminé. Un refus conserve la
progression confirmée et les étoiles choisies, avec un message et une reprise.
Seule une réponse réussie confirme la complétion ou la note. Son DTO officiel est
conservé même si le GET suivant échoue ; la reprise recharge uniquement ce GET.
Aucun avis écrit ni acquittement de téléchargement n’est simulé ; cette tranche
ne valide pas les critères restants de persistance et de changement de session.

### Statistiques après un démarrage confirmé (MAIR-382)

Le démarrage conserve immédiatement le cours confirmé par le serveur, puis lit
le catalogue avec `no-store` pour afficher ses statistiques officielles. Aucun
rechargement complet ni calcul de compteur métier côté front n’est nécessaire.
Un démarrage refusé ne change rien et ne relit pas le catalogue. Si seule cette
lecture échoue, le cours confirmé et le lecteur restent visibles ; Réessayer fait
uniquement GET, jamais un second POST de démarrage. Recherche, catégorie et statut
restent sélectionnés. Déconnexion sur 401 et protection contre les réponses
anciennes restent actives ; aucun contrat ou backend n’est modifié.

### Confirmation du formulaire de formation (MAIR-378)

Les actions de création/modification retournent `false` après un refus et `true`
après une mutation confirmée, indépendamment d’un échec ultérieur d’actualisation.
Le composant transmet cette promesse au catalogue partagé sans l’ignorer.
La version publiée exacte `@mairie360/lib-components@0.6.10` est épinglée pour
conserver champs/chapitres/ressources après un refus et bloquer saisies/annulation
pendant l’attente. Une mutation confirmée ferme le formulaire ; la reprise d’une
actualisation refusée recharge uniquement le catalogue, sans répéter la mutation.
Lorsqu’un formulaire auteur est ouvert, son alerte remplace les messages globaux
du catalogue pour laisser accessibles reprise/annulation ; les retours du lecteur
apprenant sont inchangés. Routes et DTOs
existants restent inchangés ; upload/clés et avis écrits sont des travaux distincts.

### Réinitialisation du filtre de catégorie (MAIR-379)

Le catalogue propose toujours un seul choix neutre `all` utilisable. Si la liste
reçue ne le contient pas (y compris une liste vide), le front ajoute uniquement
« Toutes les catégories », sans données métier. Le libellé et la position d’un
choix neutre existant sont conservés, ses doublons retirés ; les catégories métier
désactivées le restent. En l’absence de liste, le composant partagé dérive les
choix des formations reçues comme auparavant. La réinitialisation conserve la
recherche et le statut, sans nouvel appel réseau. Bibliothèque publiée, contrat
BFF et environnement restent inchangés.

### Retour à tous les statuts et confirmations administrateur (MAIR-458 / MAIR-452)

Le sélecteur de statut propose exactement un choix neutre `all` utilisable, même
si la liste reçue est vide, sans ce choix, avec ce choix désactivé ou dupliqué.
Libellés, ordre et droits des statuts métier sont conservés, sans en inventer.
Le retour reste local et conserve recherche/catégorie, y compris après un refus
de lecture. Création/modification utilisent seulement le cours retourné ; une
suppression exige une confirmation positive correspondante. Ces confirmations
survivent au refus du GET ; le filtre ne restaure pas une suppression ni ne rejoue
une écriture. Réessayer fait seulement GET et efface uniquement son erreur après
la dernière réponse confirmée, conservant refus d'écriture et filtres indépendants.
Les compteurs officiels attendent un nouveau GET. Téléchargements protégés, avis
écrits, upload et clés d'accès restent des besoins distincts non fournis ici.

## Pour développer ou exploiter ce module

### Présentation conservée du catalogue et du lecteur (MAIR-384)

Le catalogue reprend la typographie système de 17 px du prototype, sa pleine largeur
et ses espacements de référence (1,5 rem horizontaux / 2 rem verticaux, soit
25,5 px / 34 px à l’échelle de 17 px), les ombres des cartes et la couleur des vignettes. Le lecteur
conserve ses colonnes de chapitres sur ordinateur et leur empilement sur mobile ;
son titre et sa fermeture restent visibles pendant le défilement de son contenu.
Son padding mobile est de 16 px. Le CSS cible uniquement la structure du lecteur
publié contenant les chapitres, pas les formulaires auteur. Aucun écouteur de
défilement ni appel réseau n’est ajouté. Recherche, filtres et actions existantes
restent inchangés. Téléchargements autorisés, progression persistée et avis écrits
restent des travaux non résolus indépendants sous MAIR-350.

Le [guide technique](technical.md) détaille architecture, configuration, routes, session, persistance, tests et CI/CD. Il décrit les sources de vérité et les étapes de synchronisation des contrats avec les dépôts associés.
