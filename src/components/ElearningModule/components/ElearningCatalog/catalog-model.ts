import { formatDateTime, formatRelative, parseDateValue } from '@mairie360/lib-components/primitives';

import type { ElearningCourseDetails, ElearningLearnerActionResult } from './course-types';
import { normalizeChaptersForProgress } from './course-progress';
import {
  createEmptyCourseChapter,
  type ElearningCourseFormValues,
  type ElearningCourseLevel,
  type ElearningCourseRequirement,
} from './components/ElearningCourseFormModal';
import { isSaveRefusal, type ElearningBadgeVariant, type ElearningCourse, type ElearningCourseSaveOutcome, type ElearningCourseSaveResult, type ElearningFilterOption } from './catalog-types';

export const defaultStatuses: ElearningFilterOption[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Non commencé', value: 'not-started' },
  { label: 'En cours', value: 'in-progress' },
  { label: 'Terminé', value: 'completed' },
];

const statusMeta: Record<string, { label: string; variant: ElearningBadgeVariant }> = {
  'not-started': { label: 'Non commencé', variant: 'notStarted' },
  'in-progress': { label: 'En cours', variant: 'inProgress' },
  completed: { label: 'Terminé', variant: 'completed' },
};

export const levelMeta: Record<Exclude<ElearningCourseLevel, 'none'>, { label: string; variant: ElearningBadgeVariant }> = {
  beginner: { label: 'Débutant', variant: 'beginner' },
  intermediate: { label: 'Intermédiaire', variant: 'intermediate' },
  advanced: { label: 'Avancé', variant: 'advanced' },
};

export const normalize = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Run `next` only once the first action is confirmed; synchronous hosts stay synchronous. */
export const afterLearnerAction = (result: ElearningLearnerActionResult, next: () => ElearningLearnerActionResult): ElearningLearnerActionResult => {
  const proceed = (confirmed: void | boolean) => confirmed === false ? false : next();
  return result && typeof result === 'object' ? result.then(proceed) : proceed(result);
};

const clampProgress = (value: number) => Math.min(100, Math.max(0, Math.round(value)));


/** The explicit status, else the one the badge label implies. */
export const inferStatusValue = (course: ElearningCourse) => {
  if (course.statusValue) return course.statusValue;
  const statusLabel = normalize(course.statusBadge?.label ?? '');
  if (statusLabel.includes('termine')) return 'completed';
  if (statusLabel.includes('cours')) return 'in-progress';
  return 'not-started';
};

export const getCourseProgress = (course: ElearningCourse) => {
  if (typeof course.progress === 'number') return clampProgress(course.progress);
  if (typeof course.details?.progress === 'number') return clampProgress(course.details.progress);
  return 0;
};


export const getStatusBadge = (statusValue: string, fallback?: ElearningCourse['statusBadge']) => ({
  ...fallback,
  label: statusMeta[statusValue]?.label ?? fallback?.label ?? 'Non commencé',
  variant: statusMeta[statusValue]?.variant ?? fallback?.variant ?? 'notStarted',
});

export const getRequirement = (course?: ElearningCourse): ElearningCourseRequirement => {
  if (course?.mandatory === true) return 'mandatory';
  if (course?.titleBadge?.variant === 'mandatory' || normalize(course?.titleBadge?.label ?? '').includes('obligatoire')) {
    return 'mandatory';
  }
  if (normalize(course?.titleBadge?.label ?? '').includes('recommande')) return 'recommended';
  return 'none';
};

export const getLevel = (course?: ElearningCourse): ElearningCourseLevel => {
  if (course?.level) return course.level;
  const variant = course?.levelBadge?.variant;
  if (variant === 'beginner' || variant === 'intermediate' || variant === 'advanced') return variant;
  return 'none';
};

export const getTitleBadge = (requirement: ElearningCourseRequirement): ElearningCourse['titleBadge'] => {
  if (requirement === 'mandatory') return { label: 'Obligatoire', variant: 'mandatory' };
  if (requirement === 'recommended') return { label: 'Recommandé', variant: 'default' };
  return undefined;
};

export const getLevelBadge = (level: ElearningCourseLevel): ElearningCourse['levelBadge'] =>
  level === 'none' ? undefined : levelMeta[level];

export const buildCategories = (courses: ElearningCourse[]) => {
  const uniqueCategories = Array.from(new Set(courses.map((course) => course.category).filter(Boolean)));
  return [
    { label: 'Toutes les catégories', value: 'all' },
    ...uniqueCategories.map((category) => ({ label: category as string, value: category as string })),
  ];
};

export const getCourseDetails = (course: ElearningCourse): ElearningCourseDetails => course.details ?? {
  title: course.title,
  description: course.description,
  instructor: course.instructor,
  duration: course.duration,
  rating: course.rating,
  progress: course.progress,
  chapters: [],
};

export const getCourseFormValues = (course?: ElearningCourse): ElearningCourseFormValues => {
  const details = course ? getCourseDetails(course) : undefined;
  return {
    title: course?.title ?? '',
    subtitle: details?.subtitle ?? '',
    description: course?.description ?? '',
    category: course?.category ?? '',
    statusValue: course ? inferStatusValue(course) : 'not-started',
    instructor: course?.instructor ?? '',
    duration: course?.duration ?? '',
    // The BFF reads a French date as well as an ISO one: the administrator edits « 30 juin 2026 ».
    deadline: frenchDate(course?.deadline) ?? '',
    requirement: getRequirement(course),
    level: getLevel(course),
    chapters: details?.chapters.length
      ? details.chapters.map((chapter) => ({
          ...chapter,
          description: chapter.description ?? '',
          contents: (chapter.contents ?? []).map((content) => ({ ...content })),
        }))
      : [createEmptyCourseChapter()],
  };
};

/** A draft id the BFF ignores (the E-learning API allocates the id of a new course). */
const createCourseId = (title: string) => {
  const slug = normalize(title).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${slug || 'formation'}-${Date.now().toString(36)}`;
};

export const buildCourseFromFormValues = (values: ElearningCourseFormValues, existingCourse?: ElearningCourse): ElearningCourse => {
  const chapters = values.chapters.map((chapter) => ({
    ...chapter,
    contents: chapter.contents.map((content) => ({ ...content })),
  }));
  const statusValue = values.statusValue;

  return {
    ...existingCourse,
    id: existingCourse?.id ?? createCourseId(values.title),
    title: values.title,
    description: values.description,
    category: values.category || undefined,
    statusValue,
    instructor: values.instructor || undefined,
    duration: values.duration || undefined,
    deadline: values.deadline || undefined,
    chapters: chapters.length,
    learners: existingCourse?.learners ?? 0,
    progress: existingCourse?.progress,
    // MAIR-1150: what the E-learning API stores. A course the commune creates is `internal`.
    mandatory: values.requirement === 'mandatory',
    level: values.level === 'none' ? undefined : values.level,
    source: existingCourse?.source ?? 'internal',
    titleBadge: getTitleBadge(values.requirement),
    levelBadge: getLevelBadge(values.level),
    statusBadge: getStatusBadge(statusValue, existingCourse?.statusBadge),
    details: {
      ...existingCourse?.details,
      title: values.title,
      subtitle: values.subtitle || undefined,
      description: values.description,
      instructor: values.instructor || undefined,
      duration: values.duration || undefined,
      progress: existingCourse?.details?.progress,
      completed: existingCourse?.details?.completed,
      chapters,
      completionRating: existingCourse?.details?.completionRating ?? { title: 'Noter cette formation' },
    },
  };
};

/** MAIR-1145: status filter of the catalogue; `to-finish` gathers the courses not started and in progress. */
export const statusFilterOptions: ElearningFilterOption[] = [
  { label: 'À terminer', value: 'to-finish' },
  { label: 'Non commencée', value: 'not-started' },
  { label: 'En cours', value: 'in-progress' },
  { label: 'Terminée', value: 'completed' },
];

/** MAIR-1145: « Caractère » filter, on the mandatory badge of the course. */
export const requirementFilterOptions: ElearningFilterOption[] = [
  { label: 'Obligatoires', value: 'mandatory' },
  { label: 'Facultatives', value: 'optional' },
];

const matchesStatus = (course: ElearningCourse, status: string) => {
  if (status === 'all') return true;
  const value = inferStatusValue(course);
  return status === 'to-finish' ? value !== 'completed' : value === status;
};

/** MAIR-1150: « Origine » filter of the administrator (`internal` / `platform`). */
export const sourceFilterOptions: ElearningFilterOption[] = [
  { label: 'Formations internes', value: 'internal' },
  { label: 'Formations de l’outil', value: 'platform' },
];

const matchesSource = (course: ElearningCourse, source: string) =>
  source === 'all' || (course.source ?? 'internal') === source;

const matchesRequirement = (course: ElearningCourse, requirement: string) => {
  if (requirement === 'all') return true;
  const mandatory = getRequirement(course) === 'mandatory';
  return requirement === 'mandatory' ? mandatory : !mandatory;
};

/** Courses matching the search (title, description, instructor), the category, the status and the requirement. */
export const filterCourses = (courses: ElearningCourse[], search: string, category: string, status: string, requirement = 'all', source = 'all') => {
  const normalizedSearch = normalize(search.trim());
  const matching = courses.filter((course) => {
    const matchesSearch = !normalizedSearch || normalize(`${course.title} ${course.description} ${course.instructor ?? ''}`).includes(normalizedSearch);
    return matchesSearch && (category === 'all' || course.category === category) && matchesStatus(course, status) &&
      matchesRequirement(course, requirement) && matchesSource(course, source);
  });
  // Mandatory courses to finish are read by deadline, the nearest first (MAIR-1144).
  if (requirement !== 'mandatory') return matching;
  return [...matching].sort((left, right) => (deadlineTime(left.deadline) ?? Infinity) - (deadlineTime(right.deadline) ?? Infinity));
};

/** « 2 formations en cours », « 1 formation correspond à votre recherche »: the result counter of the list (MAIR-897). */
export const resultCountLabel = (count: number, filtered: boolean) => {
  const noun = count > 1 ? 'formations' : 'formation';
  if (!filtered) return `${count} ${noun}`;
  return `${count} ${noun} ${count > 1 ? 'correspondent' : 'correspond'} à votre recherche`;
};

const FRENCH_MONTHS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];

/** The deadline the BFF sends is free text (« 30 juin 2026 ») or an ISO date; its time, when it can be read. */
export const deadlineTime = (deadline?: string) => {
  if (!deadline) return undefined;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(deadline);
  if (iso) return Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const french = /(\d{1,2})(?:er)?\s+([a-zà-ÿ]+)\.?\s+(\d{4})/i.exec(deadline);
  if (!french) return undefined;
  const month = FRENCH_MONTHS.findIndex(name => normalize(french[2]).startsWith(name.slice(0, 3)));
  return month < 0 ? undefined : Date.UTC(Number(french[3]), month, Number(french[1]));
};

const DAY = 24 * 60 * 60 * 1000;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * « 30 juin 2026 » for an ISO day or date-time of the BFF; any other text (older catalogues) is shown as it came.
 * A bare day is read in UTC so that it never moves to the day before.
 */
export const frenchDate = (value?: string | null) => {
  if (!value?.trim()) return undefined;
  const text = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(text)) return text;
  return formatDateTime(text, 'dateOnly', ISO_DAY.test(text) ? 'UTC' : undefined) ?? text;
};

/** « aujourd’hui », « hier », « il y a 3 jours », then the date (« le 12 mars 2026 ») past a week (MAIR-1143). */
export const lastActivityLabel = (value?: string | null, now = new Date()) => {
  const date = parseDateValue(value);
  if (!date) return undefined;
  const days = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())) / DAY);
  if (days <= 0) return date.getTime() > now.getTime() ? 'aujourd’hui' : formatRelative(date, now);
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} jours`;
  return `le ${frenchDate(value ?? undefined)}`;
};

/** « 2 h 15 », « 45 min », « 0 min » for a number of seconds. */
export const formatDurationSeconds = (seconds: number) => {
  const minutes = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${String(rest).padStart(2, '0')}` : `${hours} h`;
};

/** The calendar year of an ISO date (UTC for a bare day). */
export const yearOf = (value?: string | null) => {
  const date = parseDateValue(value);
  if (!date) return undefined;
  return value && ISO_DAY.test(value.trim()) ? date.getUTCFullYear() : date.getFullYear();
};

/** MAIR-1146: a deadline within 15 days is shown in the warning tone. */
export const isDeadlineSoon = (deadline: string | undefined, now = Date.now()) => {
  const time = deadlineTime(deadline);
  return time !== undefined && time - now <= 15 * DAY;
};

/** MAIR-1144: the agent's own indicators, computed on the courses of the catalogue. */
export interface LearnerMetrics {
  inProgress: number;
  mandatoryToFinish: number;
  nextDeadline?: string;
  completed: number;
  /** Courses completed during `year` (from their `completedAt`). */
  completedInYear: number;
  year: number;
  available: number;
}

export const buildLearnerMetrics = (courses: ElearningCourse[], year = new Date().getFullYear()): LearnerMetrics => {
  const mandatory = courses.filter(course => getRequirement(course) === 'mandatory' && inferStatusValue(course) !== 'completed');
  const next = [...mandatory]
    .filter(course => deadlineTime(course.deadline) !== undefined)
    .sort((left, right) => deadlineTime(left.deadline)! - deadlineTime(right.deadline)!)[0];
  return {
    inProgress: courses.filter(course => inferStatusValue(course) === 'in-progress').length,
    mandatoryToFinish: mandatory.length,
    nextDeadline: frenchDate(next?.deadline),
    completed: courses.filter(course => inferStatusValue(course) === 'completed').length,
    completedInYear: courses.filter(course => inferStatusValue(course) === 'completed' && yearOf(course.completedAt) === year).length,
    year,
    available: courses.length,
  };
};

/** Display of a course status (MAIR-908: info, warning, success). */
export const statusDisplay = (statusValue: string) => (
  statusValue === 'completed' ? { label: 'Terminée', tone: 'success' as const }
    : statusValue === 'in-progress' ? { label: 'En cours', tone: 'warning' as const }
      : { label: 'Non commencée', tone: 'info' as const }
);

/** Close the form once the save is confirmed; `false` (sync or async) keeps the draft open. */
export const closeWhenSaved = (result: ElearningCourseSaveResult, close: () => void): ElearningCourseSaveResult => {
  const saved = (confirmed: ElearningCourseSaveOutcome) => confirmed !== false && !isSaveRefusal(confirmed);
  if (result && typeof result === 'object' && 'then' in result && typeof result.then === 'function') {
    return result.then((confirmed) => {
      if (saved(confirmed)) close();
      return confirmed;
    });
  }
  // Existing synchronous callbacks remain supported. Hosts with remote persistence
  // must return their promise and false when the mutation is refused.
  const outcome = result as ElearningCourseSaveOutcome;
  if (saved(outcome)) close();
  return outcome;
};

/** MAIR-1143: the course the top of the agent's page suggests. */
export interface ResumeSuggestion {
  course: ElearningCourse;
  kind: 'resume' | 'priority';
  chapterIndex: number;
  chapterCount: number;
  chapterTitle?: string;
  completedChapters: number;
  progress: number;
  /** « il y a 2 jours »: the last activity of the agent on the course, when the BFF knows it. */
  lastActivity?: string;
}

const activityTime = (course: ElearningCourse) => parseDateValue(course.lastActivityAt)?.getTime();

/**
 * The course in progress the agent touched last (`lastActivityAt`, else the most advanced one), else the next mandatory
 * course not started (nearest deadline first), else nothing.
 */
export const resumeSuggestion = (courses: ElearningCourse[], now = new Date()): ResumeSuggestion | undefined => {
  const inProgress = courses
    .filter(course => inferStatusValue(course) === 'in-progress')
    .sort((left, right) => ((activityTime(right) ?? -Infinity) - (activityTime(left) ?? -Infinity)) || getCourseProgress(right) - getCourseProgress(left));
  const priority = courses
    .filter(course => inferStatusValue(course) === 'not-started' && getRequirement(course) === 'mandatory')
    .sort((left, right) => (deadlineTime(left.deadline) ?? Infinity) - (deadlineTime(right.deadline) ?? Infinity));
  const course = inProgress[0] ?? priority[0];
  if (!course) return undefined;
  // Same inference as the course screen: a chapter whose required contents are all done is done.
  const chapters = normalizeChaptersForProgress(course.details?.chapters ?? []);
  const index = Math.max(0, chapters.findIndex(chapter => !chapter.completed));
  return {
    course,
    kind: inProgress[0] ? 'resume' : 'priority',
    chapterIndex: index + 1,
    chapterCount: chapters.length,
    chapterTitle: chapters[index]?.title,
    completedChapters: chapters.filter(chapter => chapter.completed).length,
    progress: getCourseProgress(course),
    lastActivity: inProgress[0] ? lastActivityLabel(course.lastActivityAt, now) : undefined,
  };
};
