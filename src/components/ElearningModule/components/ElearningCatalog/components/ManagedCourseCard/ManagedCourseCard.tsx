import { Pencil, Trash2 } from 'lucide-react';

import { ElearningCourseCard } from './components/ElearningCourseCard';
import { getElearningRatingAverage } from '../SelectedCourseDetails/components/ElearningCourseDetailsModal';
import type { ElearningCourse } from '../../catalog-types';

export interface ManagedCourseCardProps {
  course: ElearningCourse;
  actionDisabled: boolean;
  onOpen: (course: ElearningCourse) => void;
  /** Administrator actions; each is shown only when given. */
  onEdit?: (course: ElearningCourse) => void;
  onDelete?: (course: ElearningCourse) => void;
}

/** A course card, with edit and delete shortcuts over it for administrators. */
export const ManagedCourseCard = ({ course, actionDisabled, onOpen, onEdit, onDelete }: ManagedCourseCardProps) => {
  const { id: _id, category: _category, statusValue: _statusValue, details, onAction: _onAction, ratingDistribution, ...cardProps } = course;
  return (
    <div className="relative h-full">
      {onEdit || onDelete ? (
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          {onEdit ? <button type="button" aria-label={`Modifier ${course.title}`} className="inline-flex size-8 items-center justify-center rounded-md bg-[var(--mairie-surface)]/95 text-[var(--mairie-accent)] shadow-sm hover:bg-[var(--mairie-accent-surface)]" onClick={() => onEdit(course)}>
            <Pencil className="size-4" />
          </button> : null}
          {onDelete ? <button type="button" aria-label={`Supprimer ${course.title}`} className="inline-flex size-8 items-center justify-center rounded-md bg-[var(--mairie-surface)]/95 text-[var(--mairie-error-text)] shadow-sm hover:bg-[var(--mairie-error-surface)]" onClick={() => onDelete(course)}>
            <Trash2 className="size-4" />
          </button> : null}
        </div>
      ) : null}
      <ElearningCourseCard
        {...cardProps}
        actionDisabled={actionDisabled}
        rating={getElearningRatingAverage(details?.ratingDistribution ?? ratingDistribution) ?? cardProps.rating}
        onAction={() => onOpen(course)}
      />
    </div>
  );
};
