import type React from 'react';

import { ElearningCourseDetailsModal } from './components/ElearningCourseDetailsModal';
import type { ElearningLearnerActionResult } from './components/ElearningCourseDetailsModal/components/ElearningCourseRating';
import { getElearningRatingAverage, incrementElearningRatingDistribution } from './components/ElearningCourseDetailsModal';
import type {
  ElearningCourseContentCompletePayload,
  ElearningCourseContentItem,
  ElearningCourseDetails,
  ElearningCourseRatingSummary,
} from '../../course-types';
import { afterLearnerAction } from '../../catalog-model';
import type { ElearningCourse } from '../../catalog-types';

export interface SelectedCourseDetailsProps {
  course: ElearningCourse;
  details: ElearningCourseDetails;
  starting: boolean;
  startError: string | null;
  allowRatingEdits: boolean;
  review?: React.ReactNode;
  onClose: () => void;
  onRatingSubmit?: (course: ElearningCourse, rating: number, summary: ElearningCourseRatingSummary) => ElearningLearnerActionResult;
  onContentComplete?: (course: ElearningCourse, payload: ElearningCourseContentCompletePayload) => ElearningLearnerActionResult;
  onContentDownload?: (course: ElearningCourse, content: ElearningCourseContentItem) => ElearningLearnerActionResult;
  canCompleteContent?: (course: ElearningCourse, content: ElearningCourseContentItem) => boolean;
}

/** The opened course: the detail callbacks run first, then the catalogue host once they are confirmed. */
export const SelectedCourseDetails = ({
  course, details, starting, startError, allowRatingEdits, review, onClose,
  onRatingSubmit, onContentComplete, onContentDownload, canCompleteContent,
}: SelectedCourseDetailsProps) => {
  const ratingDistribution = details.ratingDistribution ?? course.ratingDistribution;
  return (
    <ElearningCourseDetailsModal
      {...details}
      rating={getElearningRatingAverage(ratingDistribution) ?? details.rating}
      ratingDistribution={ratingDistribution}
      onContentDownload={onContentDownload ? content => onContentDownload(course, content) : undefined}
      canCompleteContent={canCompleteContent ? content => canCompleteContent(course, content) : undefined}
      reviewContent={review}
      optimisticUpdates={false}
      busy={starting}
      actionError={startError}
      completionRating={onRatingSubmit || details.completionRating?.onSubmit ? {
        ...details.completionRating,
        allowEditingSubmitted: allowRatingEdits,
        onSubmit: (rating) => {
          const summary = incrementElearningRatingDistribution(ratingDistribution, rating);
          const detailResult = details.completionRating?.onSubmit?.(rating);
          return onRatingSubmit ? afterLearnerAction(detailResult, () => onRatingSubmit(course, rating, summary)) : detailResult;
        },
      } : undefined}
      onContentComplete={onContentComplete || details.onContentComplete ? (payload) => {
        const detailResult = details.onContentComplete?.(payload);
        return onContentComplete ? afterLearnerAction(detailResult, () => onContentComplete(course, payload)) : detailResult;
      } : undefined}
      open
      onClose={onClose}
    />
  );
};
