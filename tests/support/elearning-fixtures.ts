// Réponses BFF E-learning conformes au contrat publié (validées dans tests/bff-contracts.test.cjs)
// et jetons de session du navigateur.

export function content(id: string, overrides: Record<string, unknown> = {}) {
  return { id, title: `Contenu ${id}`, type: 'video', duration: '5 min', completed: false, required: true, ...overrides };
}

export function chapter(id: string, contents = [content(`${id}1`)]) {
  return { id, title: `Chapitre ${id}`, duration: '10 min', completed: false, active: false, contents };
}

// Identifiers are the numeric E-learning API ids (contract patterns ^[1-9]\d{0,14}$ on courses, chapters and contents).
export function course(id = '4', overrides: Record<string, unknown> = {}) {
  const chapters = [chapter(`${id}1`)];
  return {
    id,
    title: 'RGPD et collectivités',
    description: 'Protéger les données personnelles des administrés.',
    instructor: 'DPO Mairie',
    rating: 4.5,
    duration: '1 h',
    chapters: chapters.length,
    learners: 12,
    category: 'Juridique',
    statusValue: 'not-started',
    statusBadge: { label: 'Non commencé', variant: 'notStarted' },
    progress: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 1, 4: 3, 5: 8 },
    details: { title: 'RGPD et collectivités', description: 'Parcours RGPD', instructor: 'DPO Mairie', progress: 0, completed: false, chapters },
    ...overrides,
  };
}

export function currentUser(overrides: Record<string, unknown> = {}) {
  return { id: 'agent-42', name: 'Alice Martin', initials: 'AM', email: 'alice.martin@mairie.test', role: 'User', isAdmin: false, ...overrides };
}

export const footer = { productName: 'Mairie360', version: '1.0.0', links: [{ label: 'Aide', href: '/aide' }] };

export function catalogResponse(courses = [course()], user = currentUser()) {
  return {
    user,
    notifications: { unreadCount: 0 },
    catalog: {
      title: 'Formations',
      subtitle: 'Catalogue des agents',
      certificationCount: 1,
      emptyLabel: 'Aucune formation',
      statuses: [{ label: 'Tous', value: 'all' }, { label: 'En cours', value: 'in-progress' }],
      categories: [{ label: 'Juridique', value: 'Juridique' }],
      stats: [{ label: 'Formations', value: courses.length }],
      courses,
    },
    footer,
  };
}

export function profileResponse(user = currentUser()) {
  return { user, footer };
}

export function contentCompleteResponse() {
  const chapters = [chapter('41', [content('411', { completed: true })])];
  return {
    progress: 100, completedRequiredContents: 1, totalRequiredContents: 1, completedChapters: 1, totalChapters: 1, completed: true,
    chapters, chapter: chapters[0], content: chapters[0].contents[0],
  };
}

export function ratingResponse(rating = 4) {
  return { rating, ratingCount: 13, ratingLabel: `${String(rating).replace('.', ',')} (13 avis)`, myRating: Math.round(rating), ratingDistribution: { 1: 0, 2: 0, 3: 1, 4: 4, 5: 8 }, submitted: true };
}

/** `AdminCourseResponse` of a create or an update: the id the E-learning API gave and the saved course. */
export function adminCourseResponse(saved: { id: string } & Record<string, unknown>) {
  return { id: saved.id, course: saved };
}

/** `TrainingTimeResponse` (MAIR-1144). */
export function trainingTimeResponse(year = new Date().getFullYear(), overrides: Record<string, unknown> = {}) {
  return {
    year, goalMinutes: 600, timeSpentSeconds: 8100, completedCount: 1,
    courses: [
      { id: '4', title: 'RGPD et collectivités', status: 'completed', timeSpentSeconds: 5400, completedAt: `${year}-03-12T09:30:00Z` },
      { id: '5', title: 'Accueil du public', status: 'in-progress', timeSpentSeconds: 2700, completedAt: null },
    ],
    ...overrides,
  };
}

/** `AdminStatsResponse` (MAIR-1150). */
export function adminStatsResponse(overrides: Record<string, unknown> = {}) {
  return {
    internalCourses: 6, platformCourses: 3, mandatoryInternalCourses: 2, agents: 48, participants: 38,
    participationRate: 79.2, averageCompletion: 61.4, lateMandatory: 3,
    byService: [
      { serviceId: '1', serviceName: 'État civil', agents: 12, participants: 10, participationRate: 83.3 },
      { serviceId: null, serviceName: null, agents: 4, participants: 1, participationRate: 25 },
    ],
    byCourse: [
      { id: '4', title: 'RGPD et collectivités', source: 'internal', mandatory: true, enrolled: 30, completed: 20, averageProgress: 75.5 },
      { id: '9', title: 'Prise en main de Mairie360', source: 'platform', mandatory: false, enrolled: 25, completed: 5, averageProgress: 32 },
    ],
    lateAgents: [
      { userId: '42', firstName: 'Alice', lastName: 'Martin', courseId: '4', courseTitle: 'RGPD et collectivités', deadline: '2026-06-30', progress: 50, lastReminderAt: null },
      { userId: '43', firstName: 'Bruno', lastName: 'Petit', courseId: '4', courseTitle: 'RGPD et collectivités', deadline: '2026-06-30', progress: 0, lastReminderAt: '2026-10-02T08:00:00Z' },
      { userId: '44', firstName: 'Chloé', lastName: 'Roux', courseId: '7', courseTitle: 'Sécurité incendie', deadline: '2026-09-15', progress: 20, lastReminderAt: null },
    ],
    ...overrides,
  };
}

/** Codes publiés par ErrorResponseErrorCode (enveloppe d'erreur commune des BFFs, MAIR-234). */
const ERROR_CODES = new Set(['BAD_REQUEST', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'CONFLICT', 'PAYLOAD_TOO_LARGE', 'UNPROCESSABLE_ENTITY', 'TOO_MANY_REQUESTS', 'INTERNAL_ERROR', 'BAD_GATEWAY', 'SERVICE_UNAVAILABLE', 'GATEWAY_TIMEOUT']);
/** Codes de scénario historiques des tests, ramenés au code publié correspondant. */
const LEGACY_CODES: Record<string, string> = {
  UNAVAILABLE: 'SERVICE_UNAVAILABLE', BFF_UNAVAILABLE: 'SERVICE_UNAVAILABLE', USER_SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  REFUSED: 'FORBIDDEN', READ_REFUSED: 'FORBIDDEN', COURSE_ALREADY_EXISTS: 'CONFLICT', COURSE_NOT_FOUND: 'NOT_FOUND', NOT_IMPLEMENTED: 'INTERNAL_ERROR',
};

/** Format d'erreur commun des BFFs (`ErrorResponse` : { error: { code, message, details } }), le code dans l'enum publié. */
export function courseLearner(userId: string, firstName: string, lastName: string, overrides: Record<string, unknown> = {}) {
  return {
    userId, name: `${firstName} ${lastName}`, firstName, lastName, status: 'not-started', progress: 0,
    startedAt: null, completedAt: null, lastActivityAt: null, lastReminderAt: null, ...overrides,
  };
}

export function agent(userId: string, firstName: string, lastName: string) {
  return { userId, name: `${firstName} ${lastName}`, firstName, lastName };
}

export function apiError(code: string, message: string, details: Array<{ path?: string; message: string }> = []) {
  return { error: { code: ERROR_CODES.has(code) ? code : (LEGACY_CODES[code] ?? 'INTERNAL_ERROR'), message, details } };
}

/** Jeton au format JWT : le middleware du front ne lit que `exp`, la signature est vérifiée par les BFFs. */
export function accessToken(sub: string | number = 2, exp = 4_102_444_800): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: String(sub), exp })}.signature`;
}
