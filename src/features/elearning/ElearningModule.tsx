"use client";

import { ElearningCatalog } from "@mairie360/lib-components";
import type { ComponentProps } from "react";

const statusOptions = [
  { label: "Tous les statuts", value: "all" },
  { label: "Non commence", value: "not-started" },
  { label: "En cours", value: "in-progress" },
  { label: "Termine", value: "completed" },
] satisfies ComponentProps<typeof ElearningCatalog>["statuses"];

const courses = [
  {
    id: "accueil-agents",
    title: "Accueil des nouveaux agents",
    description:
      "Un parcours court pour comprendre l'organisation municipale, les outils internes et les premiers reflexes de service public.",
    instructor: "Direction des ressources humaines",
    rating: 4.8,
    duration: "2 h 15",
    chapters: 4,
    learners: 128,
    category: "Integration",
    statusValue: "in-progress",
    titleBadge: { label: "Obligatoire", variant: "mandatory" },
    levelBadge: { label: "Debutant", variant: "beginner" },
    statusBadge: { label: "En cours", variant: "inProgress" },
    progress: 50,
    deadline: "30 juin 2026",
    ratingDistribution: { 1: 0, 2: 1, 3: 4, 4: 35, 5: 88 },
    details: {
      title: "Accueil des nouveaux agents",
      subtitle: "Parcours d'integration",
      description:
        "Cette formation accompagne les agents dans leurs premieres semaines : cadre administratif, canaux de communication, securite des donnees et bonnes pratiques terrain.",
      instructor: "Direction des ressources humaines",
      duration: "2 h 15",
      progress: 50,
      ratingDistribution: { 1: 0, 2: 1, 3: 4, 4: 35, 5: 88 },
      chapters: [
        {
          id: "accueil-1",
          title: "Comprendre l'organisation municipale",
          duration: "25 min",
          completed: true,
          contents: [
            {
              id: "accueil-1-video",
              title: "Presentation des directions et services",
              type: "video",
              duration: "12 min",
              completed: true,
            },
            {
              id: "accueil-1-doc",
              title: "Organigramme et contacts utiles",
              type: "pdf",
              fileName: "organigramme-mairie360.pdf",
              completed: true,
            },
          ],
        },
        {
          id: "accueil-2",
          title: "Utiliser les outils internes",
          duration: "40 min",
          active: true,
          contents: [
            {
              id: "accueil-2-video",
              title: "Messagerie, agenda et portail RH",
              type: "video",
              duration: "18 min",
              completed: true,
            },
            {
              id: "accueil-2-quiz",
              title: "Verifier ses premiers acquis",
              type: "quiz",
              duration: "8 min",
              completed: false,
            },
          ],
        },
        {
          id: "accueil-3",
          title: "Adopter les reflexes de service public",
          duration: "35 min",
          contents: [
            {
              id: "accueil-3-video",
              title: "Accueil, impartialite et confidentialite",
              type: "video",
              duration: "16 min",
              completed: false,
            },
            {
              id: "accueil-3-support",
              title: "Charte de l'agent municipal",
              type: "document",
              fileName: "charte-agent.pdf",
              completed: false,
            },
          ],
        },
        {
          id: "accueil-4",
          title: "Finaliser son integration",
          duration: "35 min",
          contents: [
            {
              id: "accueil-4-check",
              title: "Checklist des demarches d'arrivee",
              type: "document",
              completed: false,
            },
            {
              id: "accueil-4-quiz",
              title: "Evaluation finale",
              type: "quiz",
              duration: "12 min",
              completed: false,
            },
          ],
        },
      ],
      completionRating: {
        title: "Evaluer ce parcours",
        helperText: "Votre retour aide a ameliorer l'accueil des prochains agents.",
      },
    },
  },
  {
    id: "rgpd-collectivites",
    title: "RGPD et donnees communales",
    description:
      "Identifier les donnees personnelles, appliquer les bonnes pratiques et reagir correctement en cas d'incident.",
    instructor: "Delegue a la protection des donnees",
    rating: 4.6,
    duration: "3 h",
    chapters: 5,
    learners: 86,
    category: "Conformite",
    statusValue: "not-started",
    titleBadge: { label: "Obligatoire", variant: "mandatory" },
    levelBadge: { label: "Intermediaire", variant: "intermediate" },
    statusBadge: { label: "Non commence", variant: "notStarted" },
    progress: 0,
    deadline: "15 juillet 2026",
    ratingDistribution: { 1: 1, 2: 2, 3: 8, 4: 31, 5: 44 },
    details: {
      title: "RGPD et donnees communales",
      subtitle: "Protection des donnees au quotidien",
      description:
        "Le parcours presente les obligations RGPD dans un contexte de mairie : demandes citoyennes, dossiers administratifs, conservation, partage et signalement.",
      instructor: "Delegue a la protection des donnees",
      duration: "3 h",
      progress: 0,
      ratingDistribution: { 1: 1, 2: 2, 3: 8, 4: 31, 5: 44 },
      chapters: [
        {
          id: "rgpd-1",
          title: "Reconnaitre une donnee personnelle",
          duration: "30 min",
          active: true,
          contents: [
            {
              id: "rgpd-1-video",
              title: "Donnees citoyennes et donnees sensibles",
              type: "video",
              duration: "15 min",
            },
            {
              id: "rgpd-1-quiz",
              title: "Cas pratiques de qualification",
              type: "quiz",
              duration: "10 min",
            },
          ],
        },
        {
          id: "rgpd-2",
          title: "Collecter le strict necessaire",
          duration: "35 min",
          contents: [
            {
              id: "rgpd-2-video",
              title: "Minimisation et information des usagers",
              type: "video",
              duration: "18 min",
            },
            {
              id: "rgpd-2-doc",
              title: "Modele de mention d'information",
              type: "pdf",
              fileName: "mention-information-rgpd.pdf",
            },
          ],
        },
        {
          id: "rgpd-3",
          title: "Partager et conserver les dossiers",
          duration: "45 min",
          contents: [
            {
              id: "rgpd-3-video",
              title: "Regles de conservation et habilitations",
              type: "video",
              duration: "20 min",
            },
            {
              id: "rgpd-3-link",
              title: "Referentiel interne des durees de conservation",
              type: "link",
              href: "#",
              required: false,
            },
          ],
        },
        {
          id: "rgpd-4",
          title: "Reagir a une violation de donnees",
          duration: "40 min",
          contents: [
            {
              id: "rgpd-4-audio",
              title: "Scenario commente d'incident",
              type: "audio",
              duration: "9 min",
            },
            {
              id: "rgpd-4-doc",
              title: "Fiche reflexe de signalement",
              type: "document",
            },
          ],
        },
        {
          id: "rgpd-5",
          title: "Evaluation RGPD",
          duration: "30 min",
          contents: [
            {
              id: "rgpd-5-quiz",
              title: "Evaluation finale",
              type: "quiz",
              duration: "20 min",
            },
          ],
        },
      ],
      completionRating: {
        title: "Noter la formation RGPD",
      },
    },
  },
  {
    id: "commande-publique",
    title: "Commande publique : fondamentaux",
    description:
      "Comprendre les seuils, les procedures et les controles essentiels avant de lancer un achat public.",
    instructor: "Service achats et finances",
    rating: 4.4,
    duration: "4 h 30",
    chapters: 6,
    learners: 54,
    category: "Finances",
    statusValue: "in-progress",
    levelBadge: { label: "Avance", variant: "advanced" },
    statusBadge: { label: "En cours", variant: "inProgress" },
    progress: 67,
    ratingDistribution: { 1: 1, 2: 2, 3: 5, 4: 21, 5: 25 },
    details: {
      title: "Commande publique : fondamentaux",
      subtitle: "Achats, seuils et pieces marche",
      description:
        "Une formation operationnelle pour securiser les demandes d'achat, choisir la bonne procedure et anticiper les pieces attendues.",
      instructor: "Service achats et finances",
      duration: "4 h 30",
      progress: 67,
      ratingDistribution: { 1: 1, 2: 2, 3: 5, 4: 21, 5: 25 },
      chapters: [
        {
          id: "commande-1",
          title: "Cadre et principes de l'achat public",
          duration: "45 min",
          completed: true,
          contents: [
            {
              id: "commande-1-video",
              title: "Liberte d'acces, egalite, transparence",
              type: "video",
              duration: "20 min",
              completed: true,
            },
            {
              id: "commande-1-quiz",
              title: "Quiz des principes",
              type: "quiz",
              duration: "10 min",
              completed: true,
            },
          ],
        },
        {
          id: "commande-2",
          title: "Seuils et procedures",
          duration: "55 min",
          completed: true,
          contents: [
            {
              id: "commande-2-video",
              title: "Choisir la procedure adaptee",
              type: "video",
              duration: "24 min",
              completed: true,
            },
            {
              id: "commande-2-pdf",
              title: "Tableau des seuils internes",
              type: "pdf",
              fileName: "seuils-achats-publics.pdf",
              completed: true,
            },
          ],
        },
        {
          id: "commande-3",
          title: "Expression du besoin",
          duration: "50 min",
          active: true,
          contents: [
            {
              id: "commande-3-video",
              title: "Rediger une demande exploitable",
              type: "video",
              duration: "22 min",
              completed: true,
            },
            {
              id: "commande-3-doc",
              title: "Modele de fiche besoin",
              type: "document",
              completed: false,
            },
          ],
        },
        {
          id: "commande-4",
          title: "Analyse des offres",
          duration: "50 min",
          contents: [
            {
              id: "commande-4-video",
              title: "Criteres, notation et tracabilite",
              type: "video",
              duration: "25 min",
            },
          ],
        },
        {
          id: "commande-5",
          title: "Execution et controle",
          duration: "45 min",
          contents: [
            {
              id: "commande-5-video",
              title: "Suivre la prestation et les factures",
              type: "video",
              duration: "20 min",
            },
            {
              id: "commande-5-quiz",
              title: "Cas de controle interne",
              type: "quiz",
              duration: "12 min",
            },
          ],
        },
        {
          id: "commande-6",
          title: "Synthese",
          duration: "25 min",
          contents: [
            {
              id: "commande-6-doc",
              title: "Memo commande publique",
              type: "pdf",
              fileName: "memo-commande-publique.pdf",
            },
          ],
        },
      ],
      completionRating: {
        title: "Noter ce parcours achats",
      },
    },
  },
  {
    id: "relation-usager",
    title: "Relation usager en situation sensible",
    description:
      "Des methodes concretes pour accueillir, apaiser et orienter un usager dans les situations de tension.",
    instructor: "Pole accueil citoyen",
    rating: 4.9,
    duration: "2 h 45",
    chapters: 4,
    learners: 211,
    category: "Relation usager",
    statusValue: "completed",
    levelBadge: { label: "Intermediaire", variant: "intermediate" },
    statusBadge: { label: "Termine", variant: "completed" },
    progress: 100,
    ratingDistribution: { 1: 0, 2: 1, 3: 3, 4: 39, 5: 168 },
    details: {
      title: "Relation usager en situation sensible",
      subtitle: "Accueil et posture professionnelle",
      description:
        "Le parcours combine apports courts, mises en situation et quiz pour renforcer les reflexes d'accueil dans les moments difficiles.",
      instructor: "Pole accueil citoyen",
      duration: "2 h 45",
      progress: 100,
      completed: true,
      ratingDistribution: { 1: 0, 2: 1, 3: 3, 4: 39, 5: 168 },
      chapters: [
        {
          id: "usager-1",
          title: "Installer un cadre d'echange clair",
          duration: "35 min",
          completed: true,
          contents: [
            {
              id: "usager-1-video",
              title: "Ecoute active et reformulation",
              type: "video",
              duration: "14 min",
              completed: true,
            },
            {
              id: "usager-1-quiz",
              title: "Identifier les signaux faibles",
              type: "quiz",
              duration: "8 min",
              completed: true,
            },
          ],
        },
        {
          id: "usager-2",
          title: "Desamorcer une tension",
          duration: "45 min",
          completed: true,
          contents: [
            {
              id: "usager-2-video",
              title: "Postures et mots utiles",
              type: "video",
              duration: "20 min",
              completed: true,
            },
            {
              id: "usager-2-audio",
              title: "Analyse d'un dialogue d'accueil",
              type: "audio",
              duration: "7 min",
              completed: true,
            },
          ],
        },
        {
          id: "usager-3",
          title: "Orienter vers le bon interlocuteur",
          duration: "35 min",
          completed: true,
          contents: [
            {
              id: "usager-3-doc",
              title: "Cartographie des relais internes",
              type: "document",
              completed: true,
            },
          ],
        },
        {
          id: "usager-4",
          title: "Evaluation finale",
          duration: "50 min",
          completed: true,
          contents: [
            {
              id: "usager-4-quiz",
              title: "Mise en situation finale",
              type: "quiz",
              duration: "25 min",
              completed: true,
            },
          ],
        },
      ],
      completionRating: {
        title: "Votre avis sur la formation",
        submitted: false,
      },
    },
  },
  {
    id: "cyber-hygiene",
    title: "Hygiene numerique des services",
    description:
      "Revoir les gestes essentiels pour proteger les postes, les comptes et les fichiers partages de la collectivite.",
    instructor: "Direction des systemes d'information",
    rating: 4.7,
    duration: "1 h 50",
    chapters: 3,
    learners: 174,
    category: "Numerique",
    statusValue: "not-started",
    titleBadge: { label: "Recommande", variant: "default" },
    levelBadge: { label: "Debutant", variant: "beginner" },
    statusBadge: { label: "Non commence", variant: "notStarted" },
    progress: 0,
    ratingDistribution: { 1: 0, 2: 1, 3: 6, 4: 45, 5: 122 },
    details: {
      title: "Hygiene numerique des services",
      subtitle: "Securite des usages quotidiens",
      description:
        "Un module accessible pour reduire les risques : mots de passe, hameconnage, partage de documents et verrouillage des postes.",
      instructor: "Direction des systemes d'information",
      duration: "1 h 50",
      progress: 0,
      ratingDistribution: { 1: 0, 2: 1, 3: 6, 4: 45, 5: 122 },
      chapters: [
        {
          id: "cyber-1",
          title: "Proteger ses acces",
          duration: "35 min",
          active: true,
          contents: [
            {
              id: "cyber-1-video",
              title: "Mots de passe et double authentification",
              type: "video",
              duration: "15 min",
            },
            {
              id: "cyber-1-quiz",
              title: "Verifier ses reflexes",
              type: "quiz",
              duration: "8 min",
            },
          ],
        },
        {
          id: "cyber-2",
          title: "Detecter l'hameconnage",
          duration: "45 min",
          contents: [
            {
              id: "cyber-2-video",
              title: "Signaux d'alerte dans un email",
              type: "video",
              duration: "18 min",
            },
            {
              id: "cyber-2-doc",
              title: "Fiche reflexe phishing",
              type: "pdf",
              fileName: "fiche-phishing.pdf",
            },
          ],
        },
        {
          id: "cyber-3",
          title: "Partager les documents sans risque",
          duration: "30 min",
          contents: [
            {
              id: "cyber-3-video",
              title: "Droits d'acces et espaces partages",
              type: "video",
              duration: "14 min",
            },
            {
              id: "cyber-3-quiz",
              title: "Evaluation finale",
              type: "quiz",
              duration: "10 min",
            },
          ],
        },
      ],
      completionRating: {
        title: "Noter ce module numerique",
      },
    },
  },
] satisfies ComponentProps<typeof ElearningCatalog>["courses"];

export function ElearningModule() {
  return (
    <main className="min-h-screen bg-[#f4f2ef]">
      <ElearningCatalog
        title="Module E-learning"
        subtitle="Suivez les formations obligatoires, reprenez les parcours en cours et validez vos acquis."
        certificationCount={14}
        courses={courses}
        statuses={statusOptions}
        emptyLabel="Aucune formation ne correspond a votre recherche."
        className="min-h-screen"
      />
    </main>
  );
}
