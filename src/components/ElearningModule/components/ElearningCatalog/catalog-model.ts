import { Award, BookOpen, Percent, Users } from 'lucide-react';

import type { ElearningAdminStatsData } from './components/ElearningAdminStats';
import type { ElearningBadgeVariant } from './components/ManagedCourseCard/components/ElearningCourseCard/components/ElearningBadge';
import type { ElearningLearnerActionResult } from './components/SelectedCourseDetails/components/ElearningCourseDetailsModal/components/ElearningCourseRating';
import type { ElearningFilterOption } from './components/ElearningFilterSelect';
import type { ElearningStatCardProps } from './components/ElearningStatCard';
import type { ElearningCourseDetails } from './course-types';
import {
  createEmptyCourseChapter,
  type ElearningCourseFormValues,
  type ElearningCourseLevel,
  type ElearningCourseRequirement,
} from './components/ElearningCourseFormModal';
import type { ElearningCourse } from './catalog-types';

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

const levelMeta: Record<Exclude<ElearningCourseLevel, 'none'>, { label: string; variant: ElearningBadgeVariant }> = {
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

const parseNumberValue = (value?: number | string) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

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

const hasCourseProgress = (course: ElearningCourse) =>
  typeof course.progress === 'number' || typeof course.details?.progress === 'number';

export const getStatusBadge = (statusValue: string, fallback?: ElearningCourse['statusBadge']) => ({
  ...fallback,
  label: statusMeta[statusValue]?.label ?? fallback?.label ?? 'Non commencé',
  variant: statusMeta[statusValue]?.variant ?? fallback?.variant ?? 'notStarted',
});

export const getRequirement = (course?: ElearningCourse): ElearningCourseRequirement => {
  if (course?.titleBadge?.variant === 'mandatory' || normalize(course?.titleBadge?.label ?? '').includes('obligatoire')) {
    return 'mandatory';
  }
  if (normalize(course?.titleBadge?.label ?? '').includes('recommande')) return 'recommended';
  return 'none';
};

export const getLevel = (course?: ElearningCourse): ElearningCourseLevel => {
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

const getPercentage = (value: number, total: number) => `${total === 0 ? 0 : Math.round((value / total) * 100)}%`;

const averageProgress = (courses: ElearningCourse[]) => {
  const withProgress = courses.filter(hasCourseProgress);
  return withProgress.length
    ? Math.round(withProgress.reduce((total, course) => total + getCourseProgress(course), 0) / withProgress.length)
    : 0;
};

export const buildDefaultStats = (courses: ElearningCourse[], certificationCount = 0): ElearningStatCardProps[] => {
  const totalCourses = courses.length;
  const participatingCourses = courses.filter((course) => inferStatusValue(course) !== 'not-started' || getCourseProgress(course) > 0).length;

  return [
    { label: 'Formations disponibles', value: totalCourses, icon: BookOpen, iconColor: 'var(--mairie-accent)' },
    { label: 'Participation', value: getPercentage(participatingCourses, totalCourses), icon: Users, iconColor: 'var(--mairie-success-text)' },
    { label: 'Complétion', value: `${averageProgress(courses)}%`, icon: Percent, iconColor: 'var(--mairie-purple-text)' },
    { label: 'Certifications', value: certificationCount, icon: Award, iconColor: 'var(--mairie-warning-text)' },
  ];
};

export const buildAdminStats = (courses: ElearningCourse[]): ElearningAdminStatsData => {
  const ratings = courses.map((course) => Number(course.rating)).filter((rating) => Number.isFinite(rating));
  return {
    totalCourses: courses.length,
    totalLearners: courses.reduce((total, course) => total + parseNumberValue(course.learners), 0),
    mandatoryCourses: courses.filter((course) => getRequirement(course) === 'mandatory').length,
    totalContents: courses.reduce(
      (total, course) =>
        total + (course.details?.chapters ?? []).reduce((chapterTotal, chapter) => chapterTotal + (chapter.contents?.length ?? 0), 0),
      0
    ),
    averageRating: ratings.length ? Math.round((ratings.reduce((total, rating) => total + rating, 0) / ratings.length) * 10) / 10 : 0,
    completionRate: averageProgress(courses),
  };
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
    deadline: course?.deadline ?? '',
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

/** Courses matching the search (title, description, instructor), the category and the status. */
export const filterCourses = (courses: ElearningCourse[], search: string, category: string, status: string) => {
  const normalizedSearch = normalize(search.trim());
  return courses.filter((course) => {
    const matchesSearch = !normalizedSearch || normalize(`${course.title} ${course.description} ${course.instructor ?? ''}`).includes(normalizedSearch);
    return matchesSearch && (category === 'all' || course.category === category) && (status === 'all' || inferStatusValue(course) === status);
  });
};

/** Close the form once the save is confirmed; `false` (sync or async) keeps the draft open. */
export const closeWhenSaved = (result: void | boolean | Promise<void | boolean>, close: () => void) => {
  if (result && typeof result === 'object' && typeof result.then === 'function') {
    return result.then((confirmed) => {
      if (confirmed !== false) close();
      return confirmed;
    });
  }
  // Existing synchronous callbacks remain supported. Hosts with remote persistence
  // must return their promise and false when the mutation is refused.
  if (result !== false) close();
  return result;
};
