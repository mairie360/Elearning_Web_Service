import { DeleteButton, EditButton } from '@mairie360/lib-components/primitives';

import { ElearningCourseCard } from './components/ElearningCourseCard';
import type { ElearningCourse } from '../../catalog-types';

export interface ManagedCourseCardProps {
  course: ElearningCourse;
  /** This course is starting: only its tile is busy. */
  busy: boolean;
  onOpen: (course: ElearningCourse) => void;
  /** Administrator actions; each is shown only when given. */
  onEdit?: (course: ElearningCourse) => void;
  onDelete?: (course: ElearningCourse) => void;
}

/** A course tile, with the administrator's « Modifier » and « Supprimer » (MAIR-908 C5). */
export const ManagedCourseCard = ({ course, busy, onOpen, onEdit, onDelete }: ManagedCourseCardProps) => (
  <ElearningCourseCard
    course={course}
    busy={busy}
    onOpen={() => onOpen(course)}
    actions={onEdit || onDelete ? (
      <>
        {onEdit ? <EditButton size="s" aria-label={`Modifier ${course.title}`} onClick={() => onEdit(course)} /> : null}
        {onDelete ? <DeleteButton size="s" aria-label={`Supprimer ${course.title}`} onClick={() => onDelete(course)} /> : null}
      </>
    ) : undefined}
  />
);
