import { Users } from 'lucide-react';
import { Alert, Body, Button, DescriptionList, Modal, Rating, StatusPill, Tag, Text } from '@mairie360/lib-components/primitives';

import { CourseChapterOutline } from './components/CourseChapterOutline';
import { CourseProgressCard } from './components/CourseProgressCard';
import { getElearningRatingAverage } from '../../course-rating';
import { getInitialChapter, normalizeChaptersForProgress } from '../../course-progress';
import { frenchDate, getCourseProgress, getRequirement, inferStatusValue } from '../../catalog-model';
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
  /** Administrators: « Agents inscrits » opens the learners of the course. */
  onLearners?: (course: ElearningCourse) => void;
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
export const SelectedCourseDetails = ({ course, details, starting, startError, onClose, onStart, onPlay, onLearners }: SelectedCourseDetailsProps) => {
  const chapters = normalizeChaptersForProgress(details.chapters);
  const statusValue = inferStatusValue(course);
  const mandatory = getRequirement(course) === 'mandatory';
  const average = Number(details.rating ?? course.rating) || getElearningRatingAverage(details.ratingDistribution ?? course.ratingDistribution) || 0;
  // « 4,5 (12 avis) » as the BFF words it, else the number of ratings it counts.
  const ratingText = details.ratingLabel ?? (course.ratingCount ? `${course.ratingCount} avis` : undefined);
  const reminded = statusValue !== 'completed' ? frenchDate(course.lastReminderAt) : undefined;
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
        {onLearners ? (
          <div>
            <Button variant="outline" tone="neutral" icon={Users} label="Agents inscrits" disabled={starting} onClick={() => onLearners(course)} />
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <StatusPill size="s" label={mandatory ? 'Obligatoire' : 'Facultative'} tone={mandatory ? 'danger' : 'neutral'} />
          {course.levelBadge ? <Tag size="s" label={course.levelBadge.label} /> : null}
          {course.category ? <Tag size="s" label={course.category} /> : null}
          {course.source === 'platform' ? <Tag size="s" label="Fournie par Mairie360" /> : null}
        </div>
        {reminded ? (
          <Alert tone="info" title={`Relancé le ${reminded}`} description="Votre administrateur vous rappelle de terminer cette formation obligatoire." />
        ) : null}
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
                  value: Number.isFinite(average) && average > 0 ? (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <Rating label="Note moyenne" value={average} readOnly size="s" />
                      {ratingText ? <Text as="span" size="s" tone="muted">{ratingText}</Text> : null}
                    </span>
                  ) : 'Pas encore de note',
                },
                { id: 'deadline', label: 'Échéance', value: frenchDate(course.deadline) ?? 'Sans échéance' },
                ...(statusValue === 'completed' && course.completedAt ? [{ id: 'completed', label: 'Terminée le', value: frenchDate(course.completedAt) }] : []),
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
