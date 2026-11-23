import { CirclePlay } from 'lucide-react';
import { Button, Card, Icon, Overline, ProgressMeter, Text } from '@mairie360/lib-components/primitives';

import { frenchDate, type ResumeSuggestion } from '../../catalog-model';
import type { ElearningCourse } from '../../catalog-types';

export interface ResumeCardProps {
  suggestion: ResumeSuggestion;
  /** The course of the suggestion is starting (« Commencer »). */
  busy: boolean;
  /** « Reprendre » / « Commencer »: open the course screen at its current chapter. */
  onResume: (course: ElearningCourse) => void;
  /** « Voir la fiche ». */
  onShowDetails: (course: ElearningCourse) => void;
}

/**
 * MAIR-1143: « Reprendre où vous en étiez » at the top of the agent's page, or, with nothing in progress,
 * « À commencer en priorité » (the next mandatory course not started, nearest deadline first).
 */
export const ResumeCard = ({ suggestion, busy, onResume, onShowDetails }: ResumeCardProps) => {
  const { course, kind, chapterIndex, chapterCount, chapterTitle, completedChapters, progress, lastActivity } = suggestion;
  const resume = kind === 'resume';
  return (
    <Card aria-labelledby="elearning-resume-title" className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="flex min-h-24 items-center justify-center rounded-[var(--mairie-radius-m)] bg-[var(--mairie-accent-surface)] p-4 text-[var(--mairie-accent)] md:w-48 md:self-stretch">
        <Icon icon={CirclePlay} size="xl" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Overline className="text-[var(--mairie-accent)]">{resume ? 'Reprendre où vous en étiez' : 'À commencer en priorité'}</Overline>
        <h2 id="elearning-resume-title" className="text-lg font-semibold leading-7">{course.title}</h2>
        <Text size="s" tone="muted">
          {[course.category, course.deadline ? `Avant le ${frenchDate(course.deadline)}` : 'Sans échéance', lastActivity ? `Dernière activité ${lastActivity}` : undefined].filter(Boolean).join(' · ')}
        </Text>
        {chapterTitle ? <Text size="s">Chapitre {chapterIndex} sur {chapterCount} · <strong>{chapterTitle}</strong></Text> : null}
        {resume ? (
          <ProgressMeter label={`${completedChapters} / ${chapterCount} chapitres`} value={progress} className="max-w-md" />
        ) : null}
      </div>
      <div className="flex flex-col gap-2 md:items-stretch">
        <Button size="l" label={resume ? 'Reprendre' : 'Commencer'} loading={busy} onClick={() => onResume(course)} />
        <Button variant="ghost" label="Voir la fiche" onClick={() => onShowDetails(course)} disabled={busy} />
      </div>
    </Card>
  );
};
