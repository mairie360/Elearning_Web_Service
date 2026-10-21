import { Circle, CircleCheck } from 'lucide-react';

import { joinClasses } from '@/components/ElearningModule/components/ElearningCatalog/elearning-style';
import { contentCountLabel } from '../../content-types';
import { getChapterContents } from '../../course-progress';
import type { ElearningCourseChapter } from '@/components/ElearningModule/components/ElearningCatalog/course-types';

export interface ChapterListProps {
  chapters: ElearningCourseChapter[];
  selectedId?: string;
  onSelect: (chapterId: string) => void;
}

/** Chapter navigation: the pressed button is the chapter shown on the left. */
export const ChapterList = ({ chapters, selectedId, onSelect }: ChapterListProps) => (
  <>
    <h3 className="text-base font-bold leading-6 text-[var(--mairie-text)]">Chapitres</h3>
    <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
      {chapters.length === 0 ? <p className="text-sm text-[var(--mairie-muted)]">Aucun chapitre disponible.</p> : null}
      {chapters.map((chapter) => {
        const Icon = chapter.completed ? CircleCheck : Circle;
        const selected = chapter.id === selectedId;

        return (
          <button
            key={chapter.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(chapter.id)}
            className={joinClasses(
              'flex min-h-[58px] w-full items-start gap-3 rounded-md border px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[var(--mairie-accent)]/30',
              selected
                ? 'border-[var(--mairie-accent)] bg-[var(--mairie-accent-surface)] shadow-sm'
                : chapter.active
                  ? 'border-[var(--mairie-accent)]/25 bg-[var(--mairie-accent-surface)] hover:border-[var(--mairie-accent)]/50'
                  : 'border-[var(--mairie-success-text)] bg-[var(--mairie-success-surface)] hover:border-[var(--mairie-success-text)]'
            )}
          >
            <Icon
              aria-hidden="true"
              className={joinClasses(
                'mt-0.5 size-5 shrink-0',
                chapter.completed ? 'text-[var(--mairie-success-text)]' : selected ? 'text-[var(--mairie-accent)]' : 'text-[var(--mairie-muted)]'
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-semibold leading-5 text-[var(--mairie-text)]">{chapter.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-4 text-[var(--mairie-muted)]">
                <span>{chapter.duration}</span>
                <span>{contentCountLabel(getChapterContents(chapter).length)}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </>
);
