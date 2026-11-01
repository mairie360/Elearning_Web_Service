import type { ElearningCourseRatingProps, ElearningLearnerActionResult } from './components/SelectedCourseDetails/components/ElearningCourseDetailsModal/components/ElearningCourseRating';

export type ElearningCourseContentType = 'video' | 'pdf' | 'document' | 'link' | 'quiz' | 'audio' | 'other';

export interface ElearningCourseContentItem {
  id: string;
  title: string;
  type: ElearningCourseContentType;
  description?: string;
  duration?: string;
  fileName?: string;
  href?: string;
  completed?: boolean;
  required?: boolean;
}

export interface ElearningCourseChapter {
  id: string;
  title: string;
  description?: string;
  duration: string;
  completed?: boolean;
  active?: boolean;
  contents?: ElearningCourseContentItem[];
}

export type ElearningCourseRatingValue = 1 | 2 | 3 | 4 | 5;

export type ElearningCourseRatingDistribution = Partial<Record<ElearningCourseRatingValue, number>>;

export interface ElearningCourseRatingSummary {
  rating: number;
  ratingCount: number;
  ratingDistribution: ElearningCourseRatingDistribution;
}

export interface ElearningCourseProgressSummary {
  progress: number;
  completedRequiredContents: number;
  totalRequiredContents: number;
  completedChapters: number;
  totalChapters: number;
  completed: boolean;
  chapters: ElearningCourseChapter[];
}

export interface ElearningCourseContentCompletePayload extends ElearningCourseProgressSummary {
  chapter: ElearningCourseChapter;
  content: ElearningCourseContentItem;
}

export interface ElearningCourseDetails {
  title: string;
  subtitle?: string;
  description: string;
  instructor?: string;
  duration?: string;
  rating?: number | string;
  ratingLabel?: string;
  ratingDistribution?: ElearningCourseRatingDistribution;
  progress?: number;
  completed?: boolean;
  completionRating?: ElearningCourseRatingProps;
  chapters: ElearningCourseChapter[];
  actionLabel?: string;
  onAction?: () => void;
  onContentComplete?: (payload: ElearningCourseContentCompletePayload) => ElearningLearnerActionResult;
}
