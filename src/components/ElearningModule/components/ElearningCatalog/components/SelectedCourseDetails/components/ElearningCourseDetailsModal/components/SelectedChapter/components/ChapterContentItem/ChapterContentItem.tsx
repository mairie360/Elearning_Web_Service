import { CircleCheck, ExternalLink } from 'lucide-react';

import { joinClasses } from '@/components/ElearningModule/components/ElearningCatalog/elearning-style';
import { contentTypeIcons, contentTypeLabels } from '@/components/ElearningModule/components/ElearningCatalog/components/SelectedCourseDetails/components/ElearningCourseDetailsModal/content-types';
import { isRequiredContent } from '@/components/ElearningModule/components/ElearningCatalog/components/SelectedCourseDetails/components/ElearningCourseDetailsModal/course-progress';
import type { ElearningCourseContentItem } from '@/components/ElearningModule/components/ElearningCatalog/course-types';

export interface ChapterContentItemProps {
  content: ElearningCourseContentItem;
  busy: boolean;
  /** Download through the BFF; without it a content with an address gets an "Ouvrir" link. */
  onDownload?: (content: ElearningCourseContentItem) => void;
  /** Undefined hides the completion button. */
  onComplete?: (content: ElearningCourseContentItem) => void;
  canComplete: boolean;
}

/** One content of a chapter: type, duration, optional flag, download/open and completion. */
export const ChapterContentItem = ({ content, busy, onDownload, onComplete, canComplete }: ChapterContentItemProps) => {
  const ContentIcon = contentTypeIcons[content.type];
  const completed = Boolean(content.completed);

  return (
    <div
      className={joinClasses(
        'flex items-start gap-3 rounded-md border bg-[var(--mairie-surface)] p-3',
        completed ? 'border-[var(--mairie-success-text)]' : 'border-[var(--mairie-border)]'
      )}
    >
      <div
        className={joinClasses(
          'flex size-10 shrink-0 items-center justify-center rounded-md',
          completed ? 'bg-[var(--mairie-success-surface)] text-[var(--mairie-success-text)]' : 'bg-[var(--mairie-accent-surface)] text-[var(--mairie-accent)]'
        )}
      >
        {completed ? <CircleCheck aria-hidden="true" className="size-5" /> : <ContentIcon aria-hidden="true" className="size-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold leading-5 text-[var(--mairie-text)]">{content.title}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase leading-4 text-[var(--mairie-teal-text)]">
              <span>
                {contentTypeLabels[content.type]}
                {content.duration ? ` - ${content.duration}` : ''}
              </span>
              {!isRequiredContent(content) && <span className="text-[var(--mairie-muted)]">Optionnel</span>}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {onDownload ? (
              <button type="button" disabled={busy} className="rounded-md border px-2 py-1 text-xs font-semibold text-[var(--mairie-accent)] disabled:opacity-50" onClick={() => onDownload(content)}>
                {busy ? 'Téléchargement…' : 'Télécharger le support'}
              </button>
            ) : content.href && (
              <a
                href={content.href}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[var(--mairie-accent)] transition hover:bg-[var(--mairie-accent-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--mairie-accent)]/30"
              >
                Ouvrir
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </a>
            )}
            {onComplete ? (
              <button
                type="button"
                aria-label={completed ? `${content.title} terminé` : `Marquer ${content.title} comme terminé`}
                disabled={completed || busy || !canComplete}
                onClick={() => onComplete(content)}
                className={joinClasses(
                  'inline-flex items-center gap-1 rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface)] px-2 py-1 text-xs font-semibold text-[var(--mairie-text)] transition hover:border-[var(--mairie-accent)] hover:bg-[var(--mairie-accent-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--mairie-accent)]/30 disabled:cursor-not-allowed',
                  completed
                    ? 'disabled:border-[var(--mairie-success-text)] disabled:bg-[var(--mairie-success-surface)] disabled:text-[var(--mairie-success-text)]'
                    : 'disabled:border-[var(--mairie-border)] disabled:bg-[var(--mairie-surface-raised)] disabled:text-[var(--mairie-muted)]',
                )}
              >
                {completed ? 'Terminé' : busy ? 'Enregistrement…' : 'Marquer comme terminé'}
              </button>
            ) : null}
          </div>
        </div>
        {content.description && <p className="mt-2 break-words text-sm leading-5 text-[var(--mairie-muted)]">{content.description}</p>}
        {content.fileName && <p className="mt-2 break-words text-xs leading-4 text-[var(--mairie-muted)]">{content.fileName}</p>}
      </div>
    </div>
  );
};
