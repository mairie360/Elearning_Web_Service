import { CircleCheck, Circle, CirclePlay } from 'lucide-react';
import { Icon, SectionTitle, Text } from '@mairie360/lib-components/primitives';

import type { ElearningCourseChapter } from '../../../../course-types';

export interface CourseChapterOutlineProps {
  chapters: ElearningCourseChapter[];
  /** The next chapter to follow, highlighted. */
  nextId?: string;
}

/** MAIR-1147: the chapters of the course, the completed ones ticked, the next one highlighted. */
export const CourseChapterOutline = ({ chapters, nextId }: CourseChapterOutlineProps) => (
  <section aria-labelledby="course-chapters-title" className="flex flex-col gap-2">
    <SectionTitle as="h3" id="course-chapters-title">Chapitres</SectionTitle>
    {chapters.length === 0 ? <Text tone="muted" size="s">Aucun chapitre disponible.</Text> : (
      <ol className="flex flex-col gap-1">
        {chapters.map((chapter, index) => {
          const next = chapter.id === nextId;
          return (
            <li key={chapter.id} aria-current={next ? 'step' : undefined}
              className={`flex items-start gap-2 rounded-[var(--mairie-radius-m)] px-2 py-1.5 ${next ? 'bg-[var(--mairie-accent-surface)]' : ''}`}>
              <Icon icon={chapter.completed ? CircleCheck : next ? CirclePlay : Circle} size="s"
                label={chapter.completed ? 'Terminé' : next ? 'Prochain chapitre' : undefined}
                className={chapter.completed ? 'text-[var(--mairie-success-text)]' : 'text-[var(--mairie-muted)]'} />
              <Text size="s" weight={next ? 'semibold' : undefined} className="min-w-0 break-words">
                {index + 1}. {chapter.title}{chapter.duration ? ` · ${chapter.duration}` : ''}
              </Text>
            </li>
          );
        })}
      </ol>
    )}
  </section>
);
