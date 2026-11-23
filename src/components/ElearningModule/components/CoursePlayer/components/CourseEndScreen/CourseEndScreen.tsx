import type React from 'react';
import { CircleCheckBig } from 'lucide-react';
import { Body, Button, Icon, PageTitle } from '@mairie360/lib-components/primitives';

import { CourseRatingCard } from './components/CourseRatingCard';
import type { ElearningCourseCompletionRating, ElearningLearnerActionResult } from '../../../ElearningCatalog';

export interface CourseEndScreenProps {
  title: string;
  chapterCount: number;
  rating?: ElearningCourseCompletionRating;
  onRatingSubmit?: (rating: number) => ElearningLearnerActionResult;
  /** Written reviews, when the service offers them. */
  review?: React.ReactNode;
  onBackToCatalog: () => void;
}

/** MAIR-1149: the end of a course: congratulations, the rating, and the way back to the catalogue. */
export const CourseEndScreen = ({ title, chapterCount, rating, onRatingSubmit, review, onBackToCatalog }: CourseEndScreenProps) => (
  <article className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5 p-4 text-center sm:p-8">
    <Icon icon={CircleCheckBig} size="xl" className="text-[var(--mairie-success-text)]" />
    <PageTitle as="h2">Formation terminée</PageTitle>
    <Body>Bravo ! Vous avez suivi les {chapterCount} chapitre{chapterCount > 1 ? 's' : ''} de « {title} ».</Body>
    <div className="flex w-full flex-col gap-4 text-left">
      {onRatingSubmit ? <CourseRatingCard initialValue={rating?.initialValue} submitted={rating?.submitted} onSubmit={onRatingSubmit} /> : null}
      {review}
    </div>
    <Button label="Retour au catalogue" onClick={onBackToCatalog} />
  </article>
);
