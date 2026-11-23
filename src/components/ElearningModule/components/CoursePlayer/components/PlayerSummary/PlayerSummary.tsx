import { Circle, CircleCheck } from 'lucide-react';
import { Icon, Text } from '@mairie360/lib-components/primitives';

import { contentTypeLabels, getChapterContents, type ElearningCourseChapter } from '../../../ElearningCatalog';

export interface PlayerSummaryProps {
  chapters: ElearningCourseChapter[];
  currentId?: string;
  busy: boolean;
  onSelect: (chapterId: string) => void;
}

/** MAIR-1148: « Sommaire » of the course screen; completed chapters ticked, the current one highlighted. */
export const PlayerSummary = ({ chapters, currentId, busy, onSelect }: PlayerSummaryProps) => (
  <ol className="flex flex-col gap-1 p-3">
    {chapters.map((chapter, index) => {
      const current = chapter.id === currentId;
      const main = getChapterContents(chapter)[0];
      return (
        <li key={chapter.id}>
          <button type="button" aria-pressed={current} aria-current={current ? 'step' : undefined} disabled={busy}
            onClick={() => onSelect(chapter.id)}
            className={`flex w-full items-start gap-2 rounded-[var(--mairie-radius-m)] px-3 py-2 text-left disabled:cursor-not-allowed ${current ? 'bg-[var(--mairie-accent-surface)]' : 'hover:bg-[var(--mairie-surface-raised)]'} focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--mairie-accent)]`}>
            <Icon icon={chapter.completed ? CircleCheck : Circle} size="s" label={chapter.completed ? 'Terminé' : undefined}
              className={`mt-0.5 ${chapter.completed ? 'text-[var(--mairie-success-text)]' : 'text-[var(--mairie-muted)]'}`} />
            <span className="flex min-w-0 flex-col">
              <Text size="s" weight={current ? 'semibold' : undefined} className="break-words">{index + 1}. {chapter.title}</Text>
              <Text size="xs" tone="muted">{[main ? contentTypeLabels[main.type] : undefined, chapter.duration].filter(Boolean).join(' · ')}</Text>
            </span>
          </button>
        </li>
      );
    })}
  </ol>
);
