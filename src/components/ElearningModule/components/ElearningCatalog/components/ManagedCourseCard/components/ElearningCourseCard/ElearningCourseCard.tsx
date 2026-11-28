import { BookOpen } from 'lucide-react';
import { Caption, Card, Icon, ProgressMeter, StatusPill, Text } from '@mairie360/lib-components/primitives';

import type { ElearningCourse } from '../../../../catalog-types';
import { getCourseProgress, getRequirement, inferStatusValue, isDeadlineSoon, shortFrenchDate, statusDisplay } from '../../../../catalog-model';

export interface ElearningCourseCardProps {
  course: ElearningCourse;
  /** Opens the course sheet; the whole tile is the command (MAIR-1146). */
  onOpen?: () => void;
  /** Only the tile whose course is starting shows it (MAIR-908 C4). */
  busy?: boolean;
  /** Administrator commands rendered above the tile command. */
  actions?: React.ReactNode;
}

const facts = (course: ElearningCourse) => [
  course.duration,
  course.levelBadge?.label,
  course.chapters !== undefined && course.chapters !== '' ? `${course.chapters} chapitre${Number(course.chapters) > 1 ? 's' : ''}` : undefined,
].filter(Boolean).join(' · ');

const deadlineLine = (course: ElearningCourse, completed: boolean) => {
  if (completed) return course.completedAt ? `Terminée le ${shortFrenchDate(course.completedAt)}` : 'Formation terminée';
  return course.deadline ? `Avant le ${shortFrenchDate(course.deadline)}` : 'Sans échéance';
};

/**
 * MAIR-908 / MAIR-1146: a light course tile on the lib Card, the same fields in the same order for every course, so
 * that every tile of a row has the same height. The title is the single command: its button stretches over the tile.
 */
export const ElearningCourseCard = ({ course, onOpen, busy = false, actions }: ElearningCourseCardProps) => {
  const statusValue = inferStatusValue(course);
  const status = statusDisplay(statusValue);
  const mandatory = getRequirement(course) === 'mandatory';
  const progress = getCourseProgress(course);
  const completed = statusValue === 'completed';
  const soon = !completed && isDeadlineSoon(course.deadline);
  return (
    <Card className="relative flex h-full flex-col gap-3 p-5 transition-shadow hover:shadow-md focus-within:shadow-md" aria-busy={busy || undefined} data-course-id={course.id}>
      <div className="flex items-center justify-between gap-2">
        <Caption className="inline-flex min-w-0 items-center gap-1.5 uppercase tracking-wide">
          <Icon icon={BookOpen} size="s" />
          <span className="truncate">{course.category ?? 'Formation'}</span>
        </Caption>
        <StatusPill size="s" label={mandatory ? 'Obligatoire' : 'Facultative'} tone={mandatory ? 'danger' : 'neutral'} />
      </div>
      <h3 className="min-h-12 text-base font-semibold leading-6">
        {onOpen ? (
          <button type="button" onClick={onOpen} disabled={busy}
            className="line-clamp-2 text-left after:absolute after:inset-0 after:rounded-[inherit] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[var(--mairie-accent)]">
            {course.title}
          </button>
        ) : <span className="line-clamp-2">{course.title}</span>}
      </h3>
      <Text tone="muted" size="s">{facts(course) || ' '}</Text>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <StatusPill size="s" dot label={status.label} tone={status.tone} />
        <Text size="s" tone={soon ? 'warning' : 'muted'} weight={soon ? 'semibold' : undefined}>{deadlineLine(course, completed)}</Text>
      </div>
      <ProgressMeter label="Progression" value={progress} size="s" />
      {actions ? <div className="relative z-10 flex justify-end gap-2">{actions}</div> : null}
    </Card>
  );
};
