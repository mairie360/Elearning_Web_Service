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
  duration?: string;
  chapters?: number | string;
  learners?: number | string;
  titleBadge?: ElearningCourseBadge;
  levelBadge?: ElearningCourseBadge;
  statusBadge?: ElearningCourseBadge;
  progress?: number;
  deadline?: string;
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

export type ElearningCourseSaveResult = void | boolean | Promise<void | boolean>;
