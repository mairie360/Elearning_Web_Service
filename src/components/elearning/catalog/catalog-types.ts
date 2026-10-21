import type { ElearningCourseCardProps } from '../ElearningCourseCard';
import type { ElearningCourseDetails, ElearningCourseRatingDistribution } from '../course-details/types';

export interface ElearningCourse extends ElearningCourseCardProps {
  id: string;
  category?: string;
  statusValue?: string;
  ratingDistribution?: ElearningCourseRatingDistribution;
  details?: ElearningCourseDetails;
}

export type ElearningUserRole = 'user' | 'administrator';

export type ElearningCourseSaveResult = void | boolean | Promise<void | boolean>;
