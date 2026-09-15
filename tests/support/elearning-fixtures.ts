// Réponses BFF E-learning et BFF User conformes aux contrats (validées dans tests/bff-contracts.test.cjs)
// et jetons de session du navigateur.

type Overrides<T> = Partial<T> & Record<string, unknown>;

export function content(id: string, overrides: Record<string, unknown> = {}) {
  return { id, title: `Contenu ${id}`, type: 'video', duration: '5 min', completed: false, required: true, ...overrides };
}

export function chapter(id: string, contents = [content(`${id}-video`)]) {
  return { id, title: `Chapitre ${id}`, duration: '10 min', completed: false, active: false, contents };
}

export function course(id = 'rgpd-collectivites', overrides: Record<string, unknown> = {}) {
  const chapters = [chapter(`${id}-1`)];
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
  const chapters = [chapter('rgpd-collectivites-1', [content('rgpd-collectivites-1-video', { completed: true })])];
  return {
    progress: 100, completedRequiredContents: 1, totalRequiredContents: 1, completedChapters: 1, totalChapters: 1, completed: true,
    chapters, chapter: chapters[0], content: chapters[0].contents[0],
  };
}

export function ratingResponse(rating = 4) {
  return { rating, ratingCount: 13, ratingDistribution: { 1: 0, 2: 0, 3: 1, 4: 4, 5: 8 }, submitted: true };
}

/** Format d'erreur commun du BFF E-learning (`ApiError`). */
export function apiError(code: string, message: string, details: Record<string, unknown> = {}) {
  return { code, message, details };
}

export function group(id: number, name = `Groupe ${id}`) {
  return { id, name, owner_id: 1, description: null };
}

/** Corps de BFF User `GET /me` et `GET /session/me` (SessionResponse). */
export function sessionResponse(
  user: Overrides<{ first_name: string; last_name: string; email: string; phone: string | null; role: string }> = {},
  groups: Array<ReturnType<typeof group>> = [group(1, 'Service urbanisme')],
) {
  return {
    user: { id: 2, first_name: 'Alice', last_name: 'Martin', email: 'alice.martin@mairie.test', phone: '+33123456789', status: 'active', role: 'User', ...user },
    groups,
    roles: [{ id: 3, name: 'User' }],
  };
}

/** Jeton au format JWT : le middleware du front ne lit que `exp`, la signature est vérifiée par les BFFs. */
export function accessToken(sub: string | number = 2, exp = 4_102_444_800): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: String(sub), exp })}.signature`;
}
