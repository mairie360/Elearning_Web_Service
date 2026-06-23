# BFF E-learning - besoins du frontend

Ce document décrit les données dont le frontend E-learning a besoin pour remplacer les mocks présents dans `src/features/elearning/ElearningModule.tsx`.

Le frontend affiche aujourd'hui un catalogue de formations via `ElearningCatalog` de `@mairie360/lib-components`. Le BFF doit donc fournir une réponse déjà adaptée à cet écran: utilisateur connecté, compteur de notifications, filtres, statistiques et liste des formations avec leur détail.

## Etat actuel du contrat

Le package `@mairie360/bff-elearning-openapi@0.2.1` est installé, mais le contrat généré ne contient actuellement que:

- `GET /health`
- `GET /check_apis`

Il manque donc les endpoints fonctionnels nécessaires au catalogue E-learning.

## Vue à alimenter

L'écran principal contient:

- une barre supérieure avec recherche globale, compteur de notifications et identité utilisateur;
- une sidebar avec l'item `training` actif et un affichage admin;
- un catalogue `Centre de Formation`;
- des filtres par statut, et potentiellement par catégorie;
- des cartes de formation;
- une modale de détail de formation avec chapitres, contenus, progression et notation;
- un footer affichant le nom produit, la version et des liens.

## Endpoint de lecture recommandé

### `GET /elearning/catalog`

Retourne tout le modèle nécessaire au premier rendu du catalogue.

Query params optionnels si le filtrage est fait côté BFF:

| Paramètre | Type | Exemple | Description |
| --- | --- | --- | --- |
| `search` | `string` | `rgpd` | Recherche dans le titre, la description, l'instructeur ou la catégorie. |
| `category` | `string` | `Conformite` | Filtre par catégorie. |
| `status` | `all \| not-started \| in-progress \| completed` | `in-progress` | Filtre par statut utilisateur. |
| `page` | `number` | `1` | Pagination si nécessaire. |
| `pageSize` | `number` | `20` | Taille de page si nécessaire. |

Réponse attendue:

```ts
type ElearningCatalogResponse = {
  user: CurrentUser;
  notifications: NotificationSummary;
  catalog: ElearningCatalogView;
  footer?: FooterConfig;
};

type CurrentUser = {
  id: string;
  name: string;
  initials: string;
  email?: string;
  role?: string;
  isAdmin: boolean;
  avatarUrl?: string;
};

type NotificationSummary = {
  unreadCount: number;
};

type ElearningCatalogView = {
  title: string;
  subtitle?: string;
  certificationCount: number;
  emptyLabel: string;
  statuses: FilterOption[];
  categories?: FilterOption[];
  stats?: StatCard[];
  courses: ElearningCourse[];
};

type FooterConfig = {
  productName: string;
  version: string;
  links: FooterLink[];
};
```

Exemple:

```json
{
  "user": {
    "id": "user-123",
    "name": "Admin Système",
    "initials": "AS",
    "email": "admin@mairie360.fr",
    "role": "Administrateur",
    "isAdmin": true
  },
  "notifications": {
    "unreadCount": 3
  },
  "catalog": {
    "title": "Centre de Formation",
    "subtitle": "Développez vos compétences professionnelles",
    "certificationCount": 14,
    "emptyLabel": "Aucune formation ne correspond à votre recherche.",
    "statuses": [
      { "label": "Tous les statuts", "value": "all" },
      { "label": "Non commencé", "value": "not-started" },
      { "label": "En cours", "value": "in-progress" },
      { "label": "Terminé", "value": "completed" }
    ],
    "courses": [
      {
        "id": "accueil-agents",
        "title": "Accueil des nouveaux agents",
        "description": "Un parcours court pour comprendre l'organisation municipale.",
        "instructor": "Direction des ressources humaines",
        "rating": 4.8,
        "duration": "2 h 15",
        "chapters": 4,
        "learners": 128,
        "category": "Intégration",
        "statusValue": "in-progress",
        "titleBadge": { "label": "Obligatoire", "variant": "mandatory" },
        "levelBadge": { "label": "Débutant", "variant": "beginner" },
        "statusBadge": { "label": "En cours", "variant": "inProgress" },
        "progress": 50,
        "deadline": "30 juin 2026",
        "ratingDistribution": { "1": 0, "2": 1, "3": 4, "4": 35, "5": 88 },
        "details": {
          "title": "Accueil des nouveaux agents",
          "subtitle": "Parcours d'intégration",
          "description": "Cette formation accompagne les agents dans leurs premières semaines.",
          "instructor": "Direction des ressources humaines",
          "duration": "2 h 15",
          "progress": 50,
          "ratingDistribution": { "1": 0, "2": 1, "3": 4, "4": 35, "5": 88 },
          "chapters": [
            {
              "id": "accueil-1",
              "title": "Comprendre l'organisation municipale",
              "duration": "25 min",
              "completed": true,
              "contents": [
                {
                  "id": "accueil-1-video",
                  "title": "Présentation des directions et services",
                  "type": "video",
                  "duration": "12 min",
                  "completed": true
                }
              ]
            }
          ],
          "completionRating": {
            "title": "Évaluer ce parcours",
            "helperText": "Votre retour aide à améliorer l'accueil des prochains agents.",
            "submitted": false
          }
        }
      }
    ]
  },
  "footer": {
    "productName": "Mairie360",
    "version": "2.1.0",
    "links": [
      { "label": "Support technique", "href": "/support" },
      { "label": "Documentation", "href": "/documentation" },
      { "label": "Conditions d'utilisation", "href": "/conditions" }
    ]
  }
}
```

## Modèles de données attendus

### Formation

```ts
type ElearningCourse = {
  id: string;
  title: string;
  description: string;
  instructor?: string;
  rating?: number | string;
  duration?: string;
  chapters?: number | string;
  learners?: number | string;
  category?: string;
  statusValue?: CourseStatus;
  titleBadge?: CourseBadge;
  levelBadge?: CourseBadge;
  statusBadge?: CourseBadge;
  progress?: number;
  deadline?: string;
  ratingDistribution?: RatingDistribution;
  details?: ElearningCourseDetails;
};
```

Notes:

- `duration` et `deadline` sont des libellés prêts à afficher pour le frontend.
- `progress` est un pourcentage entre `0` et `100`.
- `chapters` est le nombre total de chapitres affiché sur la carte.
- `learners` est le nombre total d'apprenants inscrits ou affectés.
- `ratingDistribution` est un objet JSON dont les clés sont `"1"` à `"5"`.

### Détail de formation

```ts
type ElearningCourseDetails = {
  title: string;
  subtitle?: string;
  description: string;
  instructor?: string;
  duration?: string;
  rating?: number | string;
  ratingLabel?: string;
  ratingDistribution?: RatingDistribution;
  progress?: number;
  completed?: boolean;
  completionRating?: CompletionRating;
  chapters: CourseChapter[];
};

type CourseChapter = {
  id: string;
  title: string;
  duration: string;
  completed?: boolean;
  active?: boolean;
  contents?: CourseContent[];
};

type CourseContent = {
  id: string;
  title: string;
  type: ContentType;
  description?: string;
  duration?: string;
  fileName?: string;
  href?: string;
  completed?: boolean;
  required?: boolean;
};
```

### Enums à respecter

```ts
type CourseStatus = "not-started" | "in-progress" | "completed";

type BadgeVariant =
  | "default"
  | "beginner"
  | "intermediate"
  | "advanced"
  | "inProgress"
  | "completed"
  | "mandatory"
  | "notStarted";

type ContentType =
  | "video"
  | "pdf"
  | "document"
  | "link"
  | "quiz"
  | "audio"
  | "other";

type RatingDistribution = Partial<Record<1 | 2 | 3 | 4 | 5, number>>;

type CompletionRating = {
  initialValue?: number;
  max?: number;
  submitted?: boolean;
  disabled?: boolean;
  title?: string;
  helperText?: string;
  submitLabel?: string;
  submittedLabel?: string;
};

type FilterOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type StatCard = {
  label: string;
  value: string | number;
  iconColor?: string;
};

type CourseBadge = {
  label: string;
  variant?: BadgeVariant;
};

type FooterLink = {
  label: string;
  href: string;
};
```

## Données envoyées par le frontend

### Marquer un contenu comme terminé

Endpoint recommandé:

`POST /elearning/courses/{courseId}/contents/{contentId}/complete`

Body:

```json
{
  "chapterId": "accueil-1",
  "completed": true
}
```

Réponse attendue:

```ts
type ContentCompleteResponse = {
  progress: number;
  completedRequiredContents: number;
  totalRequiredContents: number;
  completedChapters: number;
  totalChapters: number;
  completed: boolean;
  chapters: CourseChapter[];
  chapter: CourseChapter;
  content: CourseContent;
};
```

Le frontend utilise cette réponse pour mettre à jour la progression, les chapitres et l'état du contenu sans recharger toute la page.

### Noter une formation

Endpoint recommandé:

`POST /elearning/courses/{courseId}/rating`

Body:

```json
{
  "rating": 5
}
```

Réponse attendue:

```ts
type RatingSubmitResponse = {
  rating: number;
  ratingCount: number;
  ratingDistribution: RatingDistribution;
  submitted: boolean;
};
```

Contraintes:

- `rating` doit être un entier entre `1` et `5`;
- l'utilisateur ne doit pas pouvoir envoyer une note pour une formation non accessible;
- si une seule note par utilisateur est autorisée, retourner `409` ou mettre à jour la note existante selon la règle produit choisie.

### Démarrer ou reprendre une formation

Endpoint optionnel, utile si le bouton d'action des cartes est activé:

`POST /elearning/courses/{courseId}/start`

Body:

```json
{
  "source": "catalog"
}
```

Réponse attendue:

```ts
type CourseActionResponse = {
  course: ElearningCourse;
  nextContentId?: string;
  redirectUrl?: string;
};
```

## Codes d'erreur attendus

| Code | Cas |
| --- | --- |
| `400` | Payload invalide, enum inconnu, note hors bornes. |
| `401` | Utilisateur non authentifié. |
| `403` | Formation non accessible pour cet utilisateur. |
| `404` | Formation, chapitre ou contenu introuvable. |
| `409` | Action impossible dans l'état actuel, par exemple note déjà envoyée si non modifiable. |
| `422` | Données valides syntaxiquement mais incohérentes métier. |
| `500` | Erreur serveur non prévue. |
| `502` | API Core ou API E-learning amont indisponible. |

Format d'erreur recommandé:

```json
{
  "code": "COURSE_NOT_FOUND",
  "message": "Formation introuvable.",
  "details": {
    "courseId": "accueil-agents"
  }
}
```

## Authentification et sécurité

- Le BFF doit déduire l'utilisateur depuis le contexte d'authentification, pas depuis un `userId` envoyé dans les bodies.
- Les réponses doivent être filtrées selon les droits de l'utilisateur.
- `isAdmin` sert à afficher les entrées admin de la sidebar.
- Les liens `href` des contenus doivent être déjà autorisés et signés si nécessaire.
- Les données personnelles inutiles ne doivent pas être renvoyées dans le catalogue.
