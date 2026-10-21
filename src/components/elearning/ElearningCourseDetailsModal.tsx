import React from 'react';
import {
  Circle,
  CircleCheck,
  ClipboardCheck,
  ExternalLink,
  FileDown,
  FileText,
  Link as LinkIcon,
  Play,
  Star,
  Volume2,
  X,
  type LucideIcon,
} from 'lucide-react';

import { joinClasses } from './style';
import { ElearningCourseRating, type ElearningCourseRatingProps, type ElearningLearnerActionResult } from './ElearningCourseRating';

export type ElearningCourseContentType = 'video' | 'pdf' | 'document' | 'link' | 'quiz' | 'audio' | 'other';

export interface ElearningCourseContentItem {
  id: string;
  title: string;
  type: ElearningCourseContentType;
  description?: string;
  duration?: string;
  fileName?: string;
  href?: string;
  completed?: boolean;
  required?: boolean;
}

export interface ElearningCourseChapter {
  id: string;
  title: string;
  description?: string;
  duration: string;
  completed?: boolean;
  active?: boolean;
  contents?: ElearningCourseContentItem[];
}

export type ElearningCourseRatingValue = 1 | 2 | 3 | 4 | 5;

export type ElearningCourseRatingDistribution = Partial<Record<ElearningCourseRatingValue, number>>;

export interface ElearningCourseRatingSummary {
  rating: number;
  ratingCount: number;
  ratingDistribution: ElearningCourseRatingDistribution;
}

export interface ElearningCourseProgressSummary {
  progress: number;
  completedRequiredContents: number;
  totalRequiredContents: number;
  completedChapters: number;
  totalChapters: number;
  completed: boolean;
  chapters: ElearningCourseChapter[];
}

export interface ElearningCourseContentCompletePayload extends ElearningCourseProgressSummary {
  chapter: ElearningCourseChapter;
  content: ElearningCourseContentItem;
}

export interface ElearningCourseDetails {
  title: string;
  subtitle?: string;
  description: string;
  instructor?: string;
  duration?: string;
  rating?: number | string;
  ratingLabel?: string;
  ratingDistribution?: ElearningCourseRatingDistribution;
  progress?: number;
  completed?: boolean;
  completionRating?: ElearningCourseRatingProps;
  chapters: ElearningCourseChapter[];
  actionLabel?: string;
  onAction?: () => void;
  onContentComplete?: (payload: ElearningCourseContentCompletePayload) => ElearningLearnerActionResult;
}

export interface ElearningCourseDetailsModalProps
  extends ElearningCourseDetails,
    Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  open: boolean;
  onClose?: () => void;
  closeLabel?: string;
  closeOnOutsideClick?: boolean;
  optimisticUpdates?: boolean;
  busy?: boolean;
  actionError?: string | null;
  onContentDownload?: (content: ElearningCourseContentItem) => ElearningLearnerActionResult;
  canCompleteContent?: (content: ElearningCourseContentItem) => boolean;
  reviewContent?: React.ReactNode;
}

const clampProgress = (value: number) => Math.min(100, Math.max(0, value));

const ratingValues = [1, 2, 3, 4, 5] as const;

export const getElearningRatingCount = (ratingDistribution?: ElearningCourseRatingDistribution) =>
  ratingValues.reduce((total, ratingValue) => total + Math.max(0, ratingDistribution?.[ratingValue] ?? 0), 0);

export const getElearningRatingAverage = (ratingDistribution?: ElearningCourseRatingDistribution) => {
  const ratingCount = getElearningRatingCount(ratingDistribution);
  if (ratingCount === 0) return undefined;

  const weightedTotal = ratingValues.reduce(
    (total, ratingValue) => total + ratingValue * Math.max(0, ratingDistribution?.[ratingValue] ?? 0),
    0
  );

  return Math.round((weightedTotal / ratingCount) * 10) / 10;
};

const formatElearningRating = (rating: number | string) => {
  if (typeof rating === 'string') return rating;

  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
};

const getRatingLabel = (ratingCount: number, fallbackLabel?: string) => {
  if (ratingCount === 0) return fallbackLabel;

  return `(${ratingCount} note${ratingCount > 1 ? 's' : ''})`;
};

export const incrementElearningRatingDistribution = (
  ratingDistribution: ElearningCourseRatingDistribution | undefined,
  rating: number
): ElearningCourseRatingSummary => {
  const safeRating = Math.min(5, Math.max(1, Math.round(rating))) as ElearningCourseRatingValue;
  const nextRatingDistribution = ratingValues.reduce<Required<ElearningCourseRatingDistribution>>(
    (distribution, ratingValue) => ({
      ...distribution,
      [ratingValue]: Math.max(0, ratingDistribution?.[ratingValue] ?? 0),
    }),
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  );

  nextRatingDistribution[safeRating] += 1;

  return {
    rating: getElearningRatingAverage(nextRatingDistribution) ?? safeRating,
    ratingCount: getElearningRatingCount(nextRatingDistribution),
    ratingDistribution: nextRatingDistribution,
  };
};

const contentTypeLabels: Record<ElearningCourseContentType, string> = {
  video: 'Vidéo',
  pdf: 'PDF',
  document: 'Document',
  link: 'Lien',
  quiz: 'Quiz',
  audio: 'Audio',
  other: 'Ressource',
};

const contentTypeIcons: Record<ElearningCourseContentType, LucideIcon> = {
  video: Play,
  pdf: FileDown,
  document: FileText,
  link: LinkIcon,
  quiz: ClipboardCheck,
  audio: Volume2,
  other: FileText,
};

const getInitialChapter = (chapters: ElearningCourseChapter[]) =>
  chapters.find((chapter) => chapter.active) ?? chapters.find((chapter) => !chapter.completed) ?? chapters[0];

const getChapterContents = (chapter: ElearningCourseChapter): ElearningCourseContentItem[] =>
  chapter.contents ?? [];

const isRequiredContent = (content: ElearningCourseContentItem) => content.required !== false;

const getChapterCompleted = (chapter: ElearningCourseChapter, contents: ElearningCourseContentItem[]) => {
  const requiredContents = contents.filter(isRequiredContent);

  if (requiredContents.length === 0) return Boolean(chapter.completed);

  return requiredContents.every((content) => content.completed);
};

const normalizeChaptersForProgress = (chapters: ElearningCourseChapter[]) =>
  chapters.map((chapter) => {
    const contents = getChapterContents(chapter).map((content) => ({
      ...content,
      completed: content.completed ?? chapter.completed ?? false,
      required: content.required ?? true,
    }));
    const completed = getChapterCompleted(chapter, contents);

    return {
      ...chapter,
      completed,
      active: completed ? false : chapter.active,
      contents,
    };
  });

const getDisplayedProgress = (progress: number | undefined, chapters: ElearningCourseChapter[]) => {
  if (typeof progress === 'number') return clampProgress(progress);
  if (!chapters.some((chapter) => getChapterContents(chapter).some(isRequiredContent))) return undefined;
  return getElearningCourseProgressSummary(chapters).progress;
};

export const getElearningCourseProgressSummary = (
  chapters: ElearningCourseChapter[]
): ElearningCourseProgressSummary => {
  const requiredContents = chapters.flatMap((chapter) => getChapterContents(chapter).filter(isRequiredContent));
  const completedRequiredContents = requiredContents.filter((content) => content.completed).length;
  const totalRequiredContents = requiredContents.length;
  const progress =
    totalRequiredContents === 0 ? 0 : Math.round((completedRequiredContents / totalRequiredContents) * 100);
  const completedChapters = chapters.filter((chapter) => getChapterCompleted(chapter, getChapterContents(chapter))).length;

  return {
    progress,
    completedRequiredContents,
    totalRequiredContents,
    completedChapters,
    totalChapters: chapters.length,
    completed: totalRequiredContents > 0 && completedRequiredContents === totalRequiredContents,
    chapters,
  };
};

const isCourseCompleted = (
  completed: boolean | undefined,
  normalizedProgress: number | undefined,
  chapters: ElearningCourseChapter[]
) => {
  if (completed !== undefined) return completed;

  return normalizedProgress === 100 || (chapters.length > 0 && chapters.every((chapter) => chapter.completed));
};

export const ElearningCourseDetailsModal = ({
  open,
  onClose,
  closeLabel = 'Fermer le détail du cours',
  closeOnOutsideClick = true,
  optimisticUpdates = true,
  busy = false,
  actionError,
  title,
  subtitle = 'Détails et contenu du cours',
  description,
  instructor,
  duration,
  rating,
  ratingLabel,
  ratingDistribution,
  progress,
  completed,
  completionRating,
  chapters,
  actionLabel: _actionLabel,
  onAction: _onAction,
  onContentComplete,
  onContentDownload,
  canCompleteContent,
  reviewContent,
  className = '',
  ...props
}: ElearningCourseDetailsModalProps) => {
  const initialChapters = React.useMemo(() => normalizeChaptersForProgress(chapters), [chapters]);
  const initialProgress = getDisplayedProgress(progress, initialChapters);
  const [localChapters, setLocalChapters] = React.useState<ElearningCourseChapter[]>(initialChapters);
  const [localProgress, setLocalProgress] = React.useState(initialProgress);
  const initialChapter = getInitialChapter(localChapters);
  const canRateCourse = isCourseCompleted(completed, localProgress, localChapters);
  const [selectedChapterId, setSelectedChapterId] = React.useState(() => getInitialChapter(initialChapters)?.id ?? '');
  const [localRatingDistribution, setLocalRatingDistribution] = React.useState(ratingDistribution);
  const [submitting, setSubmitting] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const pending = React.useRef(false);
  const isBusy = busy || submitting;
  const titleId = React.useId();
  const subtitleId = React.useId();
  const averageRating = getElearningRatingAverage(localRatingDistribution);
  const ratingCount = getElearningRatingCount(localRatingDistribution);
  const displayedRating = averageRating ?? rating;
  const displayedRatingLabel = getRatingLabel(ratingCount, ratingLabel);

  const chaptersStateKey = chapters
    .map((chapter) =>
      [
        chapter.id,
        chapter.completed ? 'completed' : 'pending',
        getChapterContents(chapter)
          .map((content) => `${content.id}:${content.completed ? 'completed' : 'pending'}:${content.required === false ? 'optional' : 'required'}`)
          .join(','),
      ].join(':')
    )
    .join('|');

  React.useEffect(() => {
    if (!open) return;

    const nextChapters = normalizeChaptersForProgress(chapters);
    const nextProgress = getDisplayedProgress(progress, nextChapters);

    setLocalChapters(nextChapters);
    setLocalProgress(nextProgress);
    setSelectedChapterId((currentId) => {
      if (nextChapters.some((chapter) => chapter.id === currentId)) {
        return currentId;
      }

      return getInitialChapter(nextChapters)?.id ?? '';
    });
  }, [chaptersStateKey, open, progress]);

  React.useEffect(() => {
    setLocalRatingDistribution(ratingDistribution);
  }, [ratingDistribution, title]);

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy && !pending.current) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [busy, onClose, open]);

  if (!open) return null;

  const runLearnerAction = (run: () => ElearningLearnerActionResult, onConfirmed: () => void): ElearningLearnerActionResult => {
    if (busy || pending.current) return false;
    pending.current = true;
    setSubmitting(true);
    setError(null);
    const finish = (confirmed: void | boolean) => {
      if (confirmed === false) {
        setError('L’enregistrement a été refusé. Votre progression est conservée ; réessayez.');
      } else {
        onConfirmed();
      }
      return confirmed;
    };
    const fail = () => {
      setError('L’enregistrement a échoué. Votre progression est conservée ; réessayez.');
      return false;
    };
    const unlock = () => { pending.current = false; setSubmitting(false); };
    try {
      const result = run();
      if (result && typeof result === 'object') return result.then(finish, fail).finally(unlock);
      const confirmed = finish(result);
      unlock();
      return confirmed;
    } catch {
      unlock();
      return fail();
    }
  };

  const handleRatingSubmit = (newRating: number) => runLearnerAction(
    () => completionRating?.onSubmit?.(newRating),
    () => {
      if (optimisticUpdates) {
        const nextRatingSummary = incrementElearningRatingDistribution(localRatingDistribution, newRating);
        setLocalRatingDistribution(nextRatingSummary.ratingDistribution);
      }
    },
  );

  const handleContentComplete = (chapterId: string, contentId: string) => {
    if (busy || pending.current) return;
    const original = localChapters.find(chapter => chapter.id === chapterId)?.contents?.find(content => content.id === contentId);
    if (original && canCompleteContent && !canCompleteContent(original)) return;
    let completedChapter: ElearningCourseChapter | undefined;
    let completedContent: ElearningCourseContentItem | undefined;
    let wasAlreadyCompleted = false;

    const nextChapters = localChapters.map((chapter) => {
      if (chapter.id !== chapterId) return chapter;

      const contents = getChapterContents(chapter).map((content) => {
        if (content.id !== contentId) return content;

        wasAlreadyCompleted = Boolean(content.completed);
        completedContent = {
          ...content,
          completed: true,
        };

        return completedContent;
      });
      const chapterCompleted = getChapterCompleted(chapter, contents);

      completedChapter = {
        ...chapter,
        active: chapterCompleted ? false : chapter.active,
        completed: chapterCompleted,
        contents,
      };

      return completedChapter;
    });

    if (!completedChapter || !completedContent || wasAlreadyCompleted) {
      const progressSummary = getElearningCourseProgressSummary(nextChapters);

      if (optimisticUpdates) {
        setLocalChapters(nextChapters);
        setLocalProgress(progressSummary.progress);
      }
      return;
    }

    const progressSummary = getElearningCourseProgressSummary(nextChapters);
    const payload: ElearningCourseContentCompletePayload = {
      ...progressSummary,
      chapter: completedChapter,
      content: completedContent,
    };
    return runLearnerAction(() => onContentComplete?.(payload), () => {
      if (optimisticUpdates) {
        setLocalChapters(nextChapters);
        setLocalProgress(progressSummary.progress);
      }
    });
  };

  const handleBackdropMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (busy || pending.current || !closeOnOutsideClick || event.target !== event.currentTarget) return;

    onClose?.();
  };

  const selectedChapter = localChapters.find((chapter) => chapter.id === selectedChapterId) ?? initialChapter;
  const selectedContents = selectedChapter ? getChapterContents(selectedChapter) : [];
  const primaryContent = selectedContents.find((content) => content.type === 'video') ?? selectedContents[0];
  const PrimaryContentIcon = primaryContent ? contentTypeIcons[primaryContent.type] : Play;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--mairie-overlay-background)]/35 p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitleId}
        className={joinClasses(
          'max-h-[calc(100vh-2rem)] w-full max-w-[960px] overflow-y-auto rounded-lg border border-[var(--mairie-border)] bg-[var(--mairie-surface-raised)] p-6 text-[var(--mairie-text)] shadow-2xl',
          className
        )}
        {...props}
        aria-busy={isBusy}
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-bold leading-7 text-[var(--mairie-text)]">
              {title}
            </h2>
            <p id={subtitleId} className="mt-1 text-sm leading-5 text-[var(--mairie-muted)]">
              {subtitle}
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              aria-label={closeLabel}
              onClick={onClose}
              disabled={isBusy}
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--mairie-muted)] transition hover:bg-[var(--mairie-surface-raised)] hover:text-[var(--mairie-text)] focus:outline-none focus:ring-2 focus:ring-[var(--mairie-accent)]/30"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          )}
        </header>

        {isBusy ? <p role="status" className="mt-4 text-sm text-[var(--mairie-muted)]">Enregistrement en cours…</p> : null}
        {error || actionError ? <p role="alert" className="mt-4 text-sm text-[var(--mairie-error-text)]">{error || actionError}</p> : null}

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
          <div className="min-w-0">
            <div className="rounded-md bg-[var(--mairie-overlay-background)] p-5 text-[var(--mairie-on-action)]">
              <div className="flex aspect-video w-full items-center justify-center rounded">
                <div className="text-center">
                  <PrimaryContentIcon aria-hidden="true" className="mx-auto size-16" strokeWidth={2.4} />
                  {primaryContent ? (
                    <div className="mt-4 max-w-md">
                      <p className="text-sm font-semibold leading-5">{contentTypeLabels[primaryContent.type]}</p>
                      <p className="mt-1 break-words text-base font-semibold leading-6">{primaryContent.title}</p>
                    </div>
                  ) : <p className="mt-4 text-sm">Aucun contenu disponible pour cette formation.</p>}
                </div>
              </div>
            </div>

            {selectedChapter && (
              <section className="mt-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-bold leading-6 text-[var(--mairie-text)]">
                      {selectedChapter.title}
                    </h3>
                    <p className="mt-1 text-sm leading-5 text-[var(--mairie-muted)]">{selectedChapter.duration}</p>
                  </div>
                  <span className="shrink-0 rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface)] px-2 py-1 text-xs font-semibold text-[var(--mairie-muted)]">
                    {selectedContents.length} contenu{selectedContents.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {selectedContents.map((content) => {
                    const ContentIcon = contentTypeIcons[content.type];
                    const contentCompleted = Boolean(content.completed);
                    const requiredContent = isRequiredContent(content);

                    return (
                      <div
                        key={content.id}
                        className={joinClasses(
                          'flex items-start gap-3 rounded-md border bg-[var(--mairie-surface)] p-3',
                          contentCompleted ? 'border-[var(--mairie-success-text)]' : 'border-[var(--mairie-border)]'
                        )}
                      >
                        <div
                          className={joinClasses(
                            'flex size-10 shrink-0 items-center justify-center rounded-md',
                            contentCompleted ? 'bg-[var(--mairie-success-surface)] text-[var(--mairie-success-text)]' : 'bg-[var(--mairie-accent-surface)] text-[var(--mairie-accent)]'
                          )}
                        >
                          {contentCompleted ? (
                            <CircleCheck aria-hidden="true" className="size-5" />
                          ) : (
                            <ContentIcon aria-hidden="true" className="size-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="break-words text-sm font-semibold leading-5 text-[var(--mairie-text)]">
                                {content.title}
                              </p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase leading-4 text-[var(--mairie-teal-text)]">
                                <span>
                                  {contentTypeLabels[content.type]}
                                  {content.duration ? ` - ${content.duration}` : ''}
                                </span>
                                {!requiredContent && <span className="text-[var(--mairie-muted)]">Optionnel</span>}
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                              {onContentDownload ? <button type="button" disabled={isBusy} className="rounded-md border px-2 py-1 text-xs font-semibold text-[var(--mairie-accent)] disabled:opacity-50" onClick={async () => {
                                if (busy || pending.current) return;
                                pending.current = true; setSubmitting(true); setDownloadError('');
                                try { if (await onContentDownload(content) === false) throw new Error('Le téléchargement n’a pas été confirmé.'); }
                                catch (reason) { setDownloadError(reason instanceof Error ? reason.message : 'Le téléchargement a échoué.'); }
                                finally { pending.current = false; setSubmitting(false); }
                              }}>{isBusy ? 'Téléchargement…' : 'Télécharger le support'}</button> : content.href && (
                                <a
                                  href={content.href}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[var(--mairie-accent)] transition hover:bg-[var(--mairie-accent-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--mairie-accent)]/30"
                                >
                                  Ouvrir
                                  <ExternalLink aria-hidden="true" className="size-3.5" />
                                </a>
                              )}
                              {onContentComplete ? <button
                                type="button"
                                aria-label={
                                  contentCompleted
                                    ? `${content.title} terminé`
                                    : `Marquer ${content.title} comme terminé`
                                }
                                disabled={contentCompleted || isBusy || Boolean(canCompleteContent && !canCompleteContent(content))}
                                onClick={() => handleContentComplete(selectedChapter.id, content.id)}
                                className={joinClasses(
                                  'inline-flex items-center gap-1 rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface)] px-2 py-1 text-xs font-semibold text-[var(--mairie-text)] transition hover:border-[var(--mairie-accent)] hover:bg-[var(--mairie-accent-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--mairie-accent)]/30 disabled:cursor-not-allowed',
                                  contentCompleted
                                    ? 'disabled:border-[var(--mairie-success-text)] disabled:bg-[var(--mairie-success-surface)] disabled:text-[var(--mairie-success-text)]'
                                    : 'disabled:border-[var(--mairie-border)] disabled:bg-[var(--mairie-surface-raised)] disabled:text-[var(--mairie-muted)]',
                                )}
                              >
                                {contentCompleted ? 'Terminé' : isBusy ? 'Enregistrement…' : 'Marquer comme terminé'}
                              </button> : null}
                            </div>
                          </div>
                          {content.description && (
                            <p className="mt-2 break-words text-sm leading-5 text-[var(--mairie-muted)]">{content.description}</p>
                          )}
                          {content.fileName && (
                            <p className="mt-2 break-words text-xs leading-4 text-[var(--mairie-muted)]">{content.fileName}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="mt-5">
              <h3 className="text-base font-bold leading-6 text-[var(--mairie-text)]">Description</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--mairie-muted)]">{description}</p>
            </section>

            <dl className="mt-5 grid gap-4 text-sm leading-5 text-[var(--mairie-text)] sm:grid-cols-3">
              {instructor && (
                <div className="min-w-0">
                  <dt className="font-semibold">Instructeur</dt>
                  <dd className="mt-1 break-words text-[var(--mairie-muted)]">{instructor}</dd>
                </div>
              )}
              {duration && (
                <div className="min-w-0">
                  <dt className="font-semibold">Durée</dt>
                  <dd className="mt-1 break-words text-[var(--mairie-muted)]">{duration}</dd>
                </div>
              )}
              {displayedRating !== undefined && (
                <div className="min-w-0">
                  <dt className="font-semibold">Note</dt>
                  <dd className="mt-1 flex items-start gap-1.5 text-[var(--mairie-muted)]">
                    <Star aria-hidden="true" className="mt-0.5 size-4 shrink-0 fill-[var(--mairie-rating-active)] text-[var(--mairie-rating-active)]" />
                    <span className="break-words">
                      {formatElearningRating(displayedRating)}
                      {displayedRatingLabel ? ` ${displayedRatingLabel}` : ''}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <aside className="min-w-0">
            <h3 className="text-base font-bold leading-6 text-[var(--mairie-text)]">Chapitres</h3>
            <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {localChapters.length === 0 ? <p className="text-sm text-[var(--mairie-muted)]">Aucun chapitre disponible.</p> : null}
              {localChapters.map((chapter) => {
                const Icon = chapter.completed ? CircleCheck : Circle;
                const selected = chapter.id === selectedChapter?.id;

                return (
                  <button
                    key={chapter.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedChapterId(chapter.id)}
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
                        <span>
                          {getChapterContents(chapter).length} contenu
                          {getChapterContents(chapter).length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {localProgress !== undefined && (
              <div className="mt-4">
                <div className="mb-2 flex items-start justify-between gap-4 text-sm leading-5 text-[var(--mairie-text)]">
                  <span>Progression totale</span>
                  <span className="shrink-0">{localProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--mairie-surface-raised)]">
                  <div
                    className="h-full rounded-full bg-[var(--mairie-action-background)] transition-[width]"
                    style={{ width: `${localProgress}%` }}
                  />
                </div>
              </div>
            )}

            {downloadError && <p role="alert" className="mt-3 text-sm text-[var(--mairie-error-text)]">{downloadError}</p>}
            {reviewContent}
            {canRateCourse && completionRating?.onSubmit && (
              <ElearningCourseRating
                {...completionRating}
                className={joinClasses('mt-4', completionRating?.className ?? '')}
                confirmOnSubmit={optimisticUpdates}
                disabled={isBusy || completionRating.disabled}
                onSubmit={handleRatingSubmit}
              />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};
