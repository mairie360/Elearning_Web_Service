import type { ElearningCourseDetails, ElearningCourseRatingDistribution } from './course-types';

export type ElearningBadgeVariant =
  | 'default' | 'beginner' | 'intermediate' | 'advanced' | 'inProgress' | 'completed' | 'mandatory' | 'notStarted';

export interface ElearningCourseBadge {
  label: string;
  variant?: ElearningBadgeVariant;
}

/** A course as the BFF catalogue sends it (`ElearningCourse` of the contract). */
export interface ElearningCourse {
  id: string;
  title: string;
  description: string;
  category?: string;
  statusValue?: string;
  instructor?: string;
  rating?: number | string;
  /** Number of ratings behind `rating`. */
  ratingCount?: number;
  duration?: string;
  durationSeconds?: number;
  chapters?: number | string;
  learners?: number | string;
  titleBadge?: ElearningCourseBadge;
  levelBadge?: ElearningCourseBadge;
  statusBadge?: ElearningCourseBadge;
  progress?: number;
  /** ISO `YYYY-MM-DD` since E-learning V2 (older catalogues sent French text). */
  deadline?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  mandatory?: boolean;
  /** `internal`: created by the commune; `platform`: provided with Mairie360 (MAIR-1150). */
  source?: 'internal' | 'platform';
  startedAt?: string;
  completedAt?: string;
  lastActivityAt?: string;
  /** Last reminder an administrator sent the agent about this course. */
  lastReminderAt?: string;
  ratingDistribution?: ElearningCourseRatingDistribution;
  details?: ElearningCourseDetails;
  onAction?: () => void;
}

export interface ElearningFilterOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export type ElearningUserRole = 'user' | 'administrator';

/** MAIR-932: the BFF refused named fields (400): the form shows each message under its input. */
export interface ElearningCourseSaveRefusal {
  fieldErrors: Array<{ path?: string; message: string }>;
}

export type ElearningCourseSaveOutcome = void | boolean | ElearningCourseSaveRefusal;
export type ElearningCourseSaveResult = ElearningCourseSaveOutcome | Promise<ElearningCourseSaveOutcome>;

export const isSaveRefusal = (value: unknown): value is ElearningCourseSaveRefusal =>
  Boolean(value) && typeof value === 'object' && Array.isArray((value as ElearningCourseSaveRefusal).fieldErrors);
