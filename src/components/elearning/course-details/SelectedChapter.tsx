import { ChapterContentItem, type ChapterContentItemProps } from './ChapterContentItem';
import { contentCountLabel } from './content-types';
import { getChapterContents } from './course-progress';
import type { ElearningCourseChapter, ElearningCourseContentItem } from './types';

export interface SelectedChapterProps extends Pick<ChapterContentItemProps, 'busy' | 'onDownload'> {
  chapter: ElearningCourseChapter;
  onComplete?: (chapter: ElearningCourseChapter, content: ElearningCourseContentItem) => void;
  canCompleteContent?: (content: ElearningCourseContentItem) => boolean;
}

/** Title, duration and contents of the chapter picked in the list. */
export const SelectedChapter = ({ chapter, busy, onDownload, onComplete, canCompleteContent }: SelectedChapterProps) => {
  const contents = getChapterContents(chapter);
  return (
    <section className="mt-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-base font-bold leading-6 text-[var(--mairie-text)]">{chapter.title}</h3>
          <p className="mt-1 text-sm leading-5 text-[var(--mairie-muted)]">{chapter.duration}</p>
        </div>
        <span className="shrink-0 rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface)] px-2 py-1 text-xs font-semibold text-[var(--mairie-muted)]">
          {contentCountLabel(contents.length)}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {contents.map((content) => (
          <ChapterContentItem
            key={content.id}
            content={content}
            busy={busy}
            onDownload={onDownload}
            onComplete={onComplete ? (item) => onComplete(chapter, item) : undefined}
            canComplete={!canCompleteContent || canCompleteContent(content)}
          />
        ))}
      </div>
    </section>
  );
};
