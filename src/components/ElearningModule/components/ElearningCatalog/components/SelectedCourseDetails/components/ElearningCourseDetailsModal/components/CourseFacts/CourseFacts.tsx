import type React from 'react';

import { Star } from 'lucide-react';

import { formatElearningRating } from '../../course-rating';

export interface CourseFactsProps {
  description: string;
  instructor?: string;
  duration?: string;
  rating?: number | string;
  ratingLabel?: string;
}

const Fact = ({ term, children }: { term: string; children: React.ReactNode }) => (
  <div className="min-w-0">
    <dt className="font-semibold">{term}</dt>
    {children}
  </div>
);

/** Description, then instructor, duration and rating when known. */
export const CourseFacts = ({ description, instructor, duration, rating, ratingLabel }: CourseFactsProps) => (
  <>
    <section className="mt-5">
      <h3 className="text-base font-bold leading-6 text-[var(--mairie-text)]">Description</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--mairie-muted)]">{description}</p>
    </section>

    <dl className="mt-5 grid gap-4 text-sm leading-5 text-[var(--mairie-text)] sm:grid-cols-3">
      {instructor && <Fact term="Instructeur"><dd className="mt-1 break-words text-[var(--mairie-muted)]">{instructor}</dd></Fact>}
      {duration && <Fact term="Durée"><dd className="mt-1 break-words text-[var(--mairie-muted)]">{duration}</dd></Fact>}
      {rating !== undefined && (
        <Fact term="Note">
          <dd className="mt-1 flex items-start gap-1.5 text-[var(--mairie-muted)]">
            <Star aria-hidden="true" className="mt-0.5 size-4 shrink-0 fill-[var(--mairie-rating-active)] text-[var(--mairie-rating-active)]" />
            <span className="break-words">
              {formatElearningRating(rating)}
              {ratingLabel ? ` ${ratingLabel}` : ''}
            </span>
          </dd>
        </Fact>
      )}
    </dl>
  </>
);
