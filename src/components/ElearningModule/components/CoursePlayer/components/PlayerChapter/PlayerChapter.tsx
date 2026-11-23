import { Play } from 'lucide-react';
import { Body, Icon, PageTitle, StatusPill, Text } from '@mairie360/lib-components/primitives';

import { ChapterContentItem } from './components/ChapterContentItem';
import {
  contentTypeIcons,
  contentTypeLabels,
  getChapterContents,
  type ElearningCourseChapter,
  type ElearningCourseContentItem,
} from '../../../ElearningCatalog';

export interface PlayerChapterProps {
  chapter: ElearningCourseChapter;
  index: number;
  count: number;
  busy: boolean;
  downloadingId?: string;
  onDownload?: (content: ElearningCourseContentItem) => void;
  onComplete?: (content: ElearningCourseContentItem) => void;
  canCompleteContent?: (content: ElearningCourseContentItem) => boolean;
}

/** MAIR-1148: the reader of the current chapter (its main content), « Chapitre x sur y », its contents and supports. */
export const PlayerChapter = ({ chapter, index, count, busy, downloadingId, onDownload, onComplete, canCompleteContent }: PlayerChapterProps) => {
  const contents = getChapterContents(chapter);
  const primary = contents.find(content => content.type === 'video') ?? contents[0];
  return (
    <article className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-4 sm:p-6">
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-[var(--mairie-radius-l)] bg-[var(--mairie-neutral-action)] p-5 text-center text-[var(--mairie-on-neutral)]">
        <Icon icon={primary ? contentTypeIcons[primary.type] : Play} size="xl" />
        {primary ? (
          <div>
            <p className="text-sm font-semibold">{contentTypeLabels[primary.type]}</p>
            <p className="break-words text-base font-semibold">{primary.title}</p>
          </div>
        ) : <p className="text-sm">Aucun contenu disponible pour ce chapitre.</p>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Text size="s" tone="muted">Chapitre {index + 1} sur {count}{chapter.duration ? ` · ${chapter.duration}` : ''}</Text>
        {chapter.completed ? <StatusPill size="s" dot tone="success" label="Chapitre terminé" /> : null}
      </div>
      <PageTitle as="h2" className="break-words">{chapter.title}</PageTitle>
      {chapter.description ? <Body>{chapter.description}</Body> : null}
      {contents.length ? (
        <section aria-label="Contenus et supports du chapitre">
          <ul className="flex flex-col gap-2">
            {contents.map(content => (
              <ChapterContentItem
                key={content.id}
                content={content}
                busy={busy}
                downloading={downloadingId === content.id}
                onDownload={onDownload}
                onComplete={onComplete}
                canComplete={!canCompleteContent || canCompleteContent(content)}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
};
