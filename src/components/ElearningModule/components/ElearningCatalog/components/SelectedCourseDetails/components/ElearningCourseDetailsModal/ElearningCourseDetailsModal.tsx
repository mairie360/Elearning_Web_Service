import React from 'react';
import { Modal } from '@mairie360/lib-components/primitives';

import { ElearningCourseRating, type ElearningLearnerActionResult } from './components/ElearningCourseRating';
import { ChapterList } from './components/ChapterList';
import { CourseFacts } from './components/CourseFacts';
import { CourseMediaPreview } from './components/CourseMediaPreview';
import { CourseProgress } from './components/CourseProgress';
import { SelectedChapter } from './components/SelectedChapter';
import {
  chaptersStateKey,
  completeContent,
  getChapterContents,
  getDisplayedProgress,
  getElearningCourseProgressSummary,
  getInitialChapter,
  isCourseCompleted,
  normalizeChaptersForProgress,
} from './course-progress';
import {
  getElearningRatingAverage,
  getElearningRatingCount,
  getRatingLabel,
  incrementElearningRatingDistribution,
} from './course-rating';
import type {
  ElearningCourseChapter,
  ElearningCourseContentCompletePayload,
  ElearningCourseContentItem,
  ElearningCourseDetails,
} from '@/components/ElearningModule/components/ElearningCatalog/course-types';
import { joinClasses } from '@/components/ElearningModule/components/ElearningCatalog/elearning-style';

export type * from '@/components/ElearningModule/components/ElearningCatalog/course-types';
export { getElearningCourseProgressSummary } from './course-progress';
export {
  getElearningRatingAverage,
  getElearningRatingCount,
  incrementElearningRatingDistribution,
} from './course-rating';

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

/** Course details on the lib Modal (MAIR-608): the selected chapter on the left, chapters and progress on the right. */
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
  const [localChapters, setLocalChapters] = React.useState<ElearningCourseChapter[]>(initialChapters);
  const [localProgress, setLocalProgress] = React.useState(() => getDisplayedProgress(progress, initialChapters));
  const [selectedChapterId, setSelectedChapterId] = React.useState(() => getInitialChapter(initialChapters)?.id ?? '');
  const [localRatingDistribution, setLocalRatingDistribution] = React.useState(ratingDistribution);
  const [submitting, setSubmitting] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const pending = React.useRef(false);
  const isBusy = busy || submitting;
  const canRateCourse = isCourseCompleted(completed, localProgress, localChapters);
  const ratingCount = getElearningRatingCount(localRatingDistribution);
  const displayedRating = getElearningRatingAverage(localRatingDistribution) ?? rating;
  const stateKey = chaptersStateKey(chapters);

  React.useEffect(() => {
    if (!open) return;

    const nextChapters = normalizeChaptersForProgress(chapters);
    setLocalChapters(nextChapters);
    setLocalProgress(getDisplayedProgress(progress, nextChapters));
    setSelectedChapterId((currentId) =>
      nextChapters.some((chapter) => chapter.id === currentId) ? currentId : getInitialChapter(nextChapters)?.id ?? '');
  }, [stateKey, open, progress]);

  React.useEffect(() => {
    setLocalRatingDistribution(ratingDistribution);
  }, [ratingDistribution, title]);

  if (!open) return null;

  // One learner request at a time; a refusal keeps the local progress untouched.
  const runLearnerAction = (run: () => ElearningLearnerActionResult, onConfirmed: () => void): ElearningLearnerActionResult => {
    if (busy || pending.current) return false;
    pending.current = true;
    setSubmitting(true);
    setError(null);
    const finish = (confirmed: void | boolean) => {
      if (confirmed === false) setError('L’enregistrement a été refusé. Votre progression est conservée ; réessayez.');
      else onConfirmed();
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

  const applyChapters = (nextChapters: ElearningCourseChapter[]) => {
    if (!optimisticUpdates) return;
    setLocalChapters(nextChapters);
    setLocalProgress(getElearningCourseProgressSummary(nextChapters).progress);
  };

  const handleRatingSubmit = (newRating: number) => runLearnerAction(
    () => completionRating?.onSubmit?.(newRating),
    () => {
      if (optimisticUpdates) setLocalRatingDistribution(incrementElearningRatingDistribution(localRatingDistribution, newRating).ratingDistribution);
    },
  );

  const handleContentComplete = (chapter: ElearningCourseChapter, content: ElearningCourseContentItem) => {
    if (busy || pending.current) return;
    if (canCompleteContent && !canCompleteContent(content)) return;
    const completion = completeContent(localChapters, chapter.id, content.id);
    if (!completion.chapter || !completion.content || completion.wasAlreadyCompleted) {
      applyChapters(completion.chapters);
      return;
    }
    const payload: ElearningCourseContentCompletePayload = {
      ...getElearningCourseProgressSummary(completion.chapters),
      chapter: completion.chapter,
      content: completion.content,
    };
    return runLearnerAction(() => onContentComplete?.(payload), () => applyChapters(completion.chapters));
  };

  const handleDownload = async (content: ElearningCourseContentItem) => {
    if (!onContentDownload || busy || pending.current) return;
    pending.current = true; setSubmitting(true); setDownloadError('');
    try { if (await onContentDownload(content) === false) throw new Error('Le téléchargement n’a pas été confirmé.'); }
    catch (reason) { setDownloadError(reason instanceof Error ? reason.message : 'Le téléchargement a échoué.'); }
    finally { pending.current = false; setSubmitting(false); }
  };

  const selectedChapter = localChapters.find((chapter) => chapter.id === selectedChapterId) ?? getInitialChapter(localChapters);
  const selectedContents = selectedChapter ? getChapterContents(selectedChapter) : [];
  const primaryContent = selectedContents.find((content) => content.type === 'video') ?? selectedContents[0];
  // A pending request blocks every close path, like the lib ConfirmModal.
  const close = () => { if (!busy && !pending.current) onClose?.(); };

  return (
    <Modal
      open
      title={title}
      description={subtitle}
      size="xl"
      closeLabel={closeLabel}
      closeOnBackdrop={closeOnOutsideClick && !isBusy}
      onClose={close}
      className={className}
      {...props}
      aria-busy={isBusy}
    >
      {isBusy ? <p role="status" className="text-sm text-[var(--mairie-muted)]">Enregistrement en cours…</p> : null}
      {error || actionError ? <p role="alert" className="mt-4 text-sm text-[var(--mairie-error-text)]">{error || actionError}</p> : null}

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
        <div className="min-w-0">
          <CourseMediaPreview content={primaryContent} />
          {selectedChapter && (
            <SelectedChapter
              chapter={selectedChapter}
              busy={isBusy}
              onDownload={onContentDownload ? (content) => void handleDownload(content) : undefined}
              onComplete={onContentComplete ? handleContentComplete : undefined}
              canCompleteContent={canCompleteContent}
            />
          )}
          <CourseFacts
            description={description}
            instructor={instructor}
            duration={duration}
            rating={displayedRating}
            ratingLabel={getRatingLabel(ratingCount, ratingLabel)}
          />
        </div>

        <aside className="min-w-0">
          <ChapterList chapters={localChapters} selectedId={selectedChapter?.id} onSelect={setSelectedChapterId} />
          {localProgress !== undefined && <CourseProgress value={localProgress} />}
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
    </Modal>
  );
};
