# Première lecture Formation

La page serveur appelle une fois `getElearningCatalog` du SDK publié, via l’adaptateur Axios et le proxy contractuel existants. L’origine provient de `ELEARNING_FRONT_URL` validée ; le transport conserve `no-store`. Le rendu lit uniquement le cookie d’accès, sans transmettre de cookie de renouvellement ni écrire de cookie.

Le client reçoit le DTO projeté par `catalog-response.ts` et les filtres URL validés. La projection compacte est dérivée du schéma publié ; sa provenance et son empreinte sont vérifiées par les tests. Chaque nouvelle lecture RSC reçoit une clé opaque indépendante de la session. Un reçu confirmé alimente le premier HTML et désactive le bootstrap client initial. Les retours au premier plan conservent les brouillons d’avis.

Une session absente ou expirée, un refus BFF, une panne ou un DTO incohérent produit un état explicite avec une reprise par la route de même origine. Cette reprise peut utiliser les cookies `/api` du navigateur et la coordination de session existante. Les props contiennent uniquement les champs DTO sélectionnés et des messages locaux.

Les tests de rendu serveur utilisent le vrai SDK et le vrai proxy devant un serveur HTTP piloté par le contrat. Les tests DOM historiques montent le composant client d’interactions ; les tests de page asynchrone vérifient séparément le HTML avant les effets et l’absence de seconde lecture lors du montage.
