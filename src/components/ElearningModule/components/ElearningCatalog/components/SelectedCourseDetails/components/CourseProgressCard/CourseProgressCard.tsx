import { Alert, Body, Card, ProgressMeter, StatusPill, Text } from '@mairie360/lib-components/primitives';

import { frenchDate, statusDisplay } from '../../../../catalog-model';
import type { ElearningCourseChapter } from '../../../../course-types';

export interface CourseProgressCardProps {
  statusValue: string;
  progress: number;
  chapters: ElearningCourseChapter[];
  next?: ElearningCourseChapter;
  deadline?: string;
  /** A finished course the agent has not rated yet. */
  unrated: boolean;
}

/** MAIR-1147: « Votre avancement », whatever the state of the course (not started, in progress, finished). */
export const CourseProgressCard = ({ statusValue, progress, chapters, next, deadline, unrated }: CourseProgressCardProps) => {
  const status = statusDisplay(statusValue);
  const done = chapters.filter(chapter => chapter.completed).length;
  return (
    <Card title="Votre avancement" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusPill size="s" dot label={status.label} tone={status.tone} />
        <Text size="s" tone="muted">{done} / {chapters.length} chapitres</Text>
      </div>
      <ProgressMeter label="Progression du cours" value={progress} />
      {statusValue === 'not-started' ? (
        <Body>Vous n’avez pas encore commencé cette formation. Lancez-la quand vous le souhaitez, votre progression sera enregistrée.</Body>
      ) : null}
      {next && statusValue !== 'not-started' ? (
        <div className="rounded-[var(--mairie-radius-m)] bg-[var(--mairie-accent-surface)] p-3">
          <Text size="xs" tone="muted" uppercase>Prochain chapitre</Text>
          <Text size="s" weight="semibold">{next.title}</Text>
        </div>
      ) : null}
      {statusValue === 'completed' ? <Text size="s">Formation terminée</Text> : (
        <Text size="s" tone="muted">{deadline ? `À terminer avant le ${frenchDate(deadline)}` : 'Sans échéance'}</Text>
      )}
      {unrated ? <Alert tone="info" title="Formation non notée" description="Donnez votre avis depuis l’écran de fin de la formation." /> : null}
    </Card>
  );
};
