import { Alert, Body, Button, DescriptionList, Modal, Rating, StatusPill, Tag } from '@mairie360/lib-components/primitives';

import { CourseChapterOutline } from './components/CourseChapterOutline';
import { CourseProgressCard } from './components/CourseProgressCard';
import { getElearningRatingAverage } from '../../course-rating';
import { getInitialChapter, normalizeChaptersForProgress } from '../../course-progress';
import { getCourseProgress, getRequirement, inferStatusValue } from '../../catalog-model';
import type { ElearningCourse } from '../../catalog-types';
import type { ElearningCourseDetails } from '../../course-types';

export interface SelectedCourseDetailsProps {
  course: ElearningCourse;
  details: ElearningCourseDetails;
  /** « Commencer » is pending: the dialog cannot be closed meanwhile. */
  starting: boolean;
  startError: string | null;
  onClose: () => void;
  /** « Commencer »: start the course (then open the course screen). */
  onStart?: (course: ElearningCourse) => void;
  /** « Continuer » / « Revoir »: open the course screen at its current chapter. */
  onPlay?: (course: ElearningCourse) => void;
}

const primaryAction = (statusValue: string) => (
  statusValue === 'completed' ? { label: 'Revoir', variant: 'outline' as const }
    : statusValue === 'in-progress' ? { label: 'Continuer', variant: 'solid' as const }
      : { label: 'Commencer', variant: 'solid' as const }
);

/**
 * MAIR-1147: the course sheet presents the course and the agent's progress; reading happens on the course screen.
 * Base facts on the left (trainer, duration, average rating, deadline, chapters), « Votre avancement » on the right.
 */
export const SelectedCourseDetails = ({ course, details, starting, startError, onClose, onStart, onPlay }: SelectedCourseDetailsProps) => {
  const chapters = normalizeChaptersForProgress(details.chapters);
  const statusValue = inferStatusValue(course);
  const mandatory = getRequirement(course) === 'mandatory';
  const average = getElearningRatingAverage(details.ratingDistribution ?? course.ratingDistribution) ?? Number(details.rating ?? course.rating);
  const next = statusValue === 'completed' ? undefined : getInitialChapter(chapters);
  const action = primaryAction(statusValue);
  const run = statusValue === 'not-started' ? onStart : onPlay ?? onStart;
  const close = () => { if (!starting) onClose(); };

  return (
    <Modal
      open
      size="l"
      title={details.title || course.title}
      onClose={close}
      closeLabel="Fermer le détail du cours"
      closeOnBackdrop={!starting}
      aria-busy={starting}
      footer={(
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" tone="neutral" label="Fermer" onClick={close} disabled={starting} />
          {run ? <Button variant={action.variant} label={action.label} loading={starting} onClick={() => run(course)} /> : null}
        </div>
      )}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <StatusPill size="s" label={mandatory ? 'Obligatoire' : 'Facultative'} tone={mandatory ? 'danger' : 'neutral'} />
          {course.levelBadge ? <Tag size="s" label={course.levelBadge.label} /> : null}
          {course.category ? <Tag size="s" label={course.category} /> : null}
        </div>
        {startError ? <Alert tone="danger" role="alert" title="Impossible de commencer" description={startError} /> : null}
        <Body>{details.description || course.description}</Body>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="flex min-w-0 flex-col gap-5">
            <DescriptionList
              labelWidth={140}
              items={[
                { id: 'trainer', label: 'Formateur', value: details.instructor ?? course.instructor ?? 'Non renseigné' },
                { id: 'duration', label: 'Durée', value: details.duration ?? course.duration ?? 'Non renseignée' },
                {
                  id: 'rating', label: 'Note moyenne',
                  value: Number.isFinite(average) && average > 0 ? <Rating label="Note moyenne" value={average} readOnly size="s" /> : 'Pas encore de note',
                },
                { id: 'deadline', label: 'Échéance', value: course.deadline ?? 'Sans échéance' },
              ]}
            />
            <CourseChapterOutline chapters={chapters} nextId={next?.id} />
          </div>
          <CourseProgressCard
            statusValue={statusValue}
            progress={getCourseProgress(course)}
            chapters={chapters}
            next={next}
            deadline={course.deadline}
            unrated={statusValue === 'completed' && details.completionRating?.submitted === false}
          />
        </div>
      </div>
    </Modal>
  );
};
