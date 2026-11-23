'use client';

import React from 'react';
import { AppShell } from '@mairie360/lib-components/shell';
import { Button, Caption, ProgressMeter, StatusPill, Text, useToast } from '@mairie360/lib-components/primitives';

import { CourseEndScreen } from './components/CourseEndScreen';
import { PlayerChapter } from './components/PlayerChapter';
import { PlayerSummary } from './components/PlayerSummary';
import {
  completeContent,
  getChapterContents,
  getDisplayedProgress,
  getElearningCourseProgressSummary,
  getInitialChapter,
  isRequiredContent,
  normalizeChaptersForProgress,
  type ElearningCourse,
  type ElearningCourseChapter,
  type ElearningCourseContentCompletePayload,
  type ElearningCourseContentItem,
  type ElearningLearnerActionResult,
} from '../ElearningCatalog';

export interface CoursePlayerProps {
  course: ElearningCourse;
  /** « Quitter la formation » / « Retour au catalogue ». */
  onExit: () => void;
  onContentComplete?: (course: ElearningCourse, payload: ElearningCourseContentCompletePayload) => ElearningLearnerActionResult;
  onContentDownload?: (course: ElearningCourse, content: ElearningCourseContentItem) => ElearningLearnerActionResult;
  canCompleteContent?: (course: ElearningCourse, content: ElearningCourseContentItem) => boolean;
  onRatingSubmit?: (course: ElearningCourse, rating: number) => ElearningLearnerActionResult;
  review?: React.ReactNode;
}

const confirmedResult = async (result: ElearningLearnerActionResult) => (await result) !== false;

/**
 * MAIR-1148: the course screen, without the application shell (lib AppShell `layout="focus"`): bar with « Quitter la
 * formation » and the progress, « Sommaire », the current chapter, and the chapter actions in the footer. Progress only
 * moves on the service's confirmation (the course props); a refused action changes nothing.
 */
export const CoursePlayer = ({ course, onExit, onContentComplete, onContentDownload, canCompleteContent, onRatingSubmit, review }: CoursePlayerProps) => {
  const toast = useToast();
  const chapters: ElearningCourseChapter[] = React.useMemo(() => normalizeChaptersForProgress(course.details?.chapters ?? []), [course.details?.chapters]);
  const [currentId, setCurrentId] = React.useState(() => getInitialChapter(chapters)?.id);
  const [busy, setBusy] = React.useState(false);
  const [downloadingId, setDownloadingId] = React.useState<string>();
  const [finished, setFinished] = React.useState(false);
  const pending = React.useRef(false);
  const index = Math.max(0, chapters.findIndex(chapter => chapter.id === currentId));
  const chapter = chapters[index];
  const summary = getElearningCourseProgressSummary(chapters);
  const last = index === chapters.length - 1;
  // The confirmed progress of the service wins over the one the chapters imply.
  const progress = getDisplayedProgress(course.details?.progress ?? course.progress, chapters) ?? 0;
  const remaining = chapter ? getChapterContents(chapter).filter(item => !item.completed && isRequiredContent(item)) : [];

  React.useEffect(() => {
    if (typeof document === 'undefined' || typeof document.title !== 'string') return;
    const previous = document.title;
    document.title = `${course.title} | Formation`;
    return () => { document.title = previous; };
  }, [course.title]);

  // One learner request at a time: a pending one locks every action of the screen.
  const run = async (action: () => Promise<boolean>) => {
    if (pending.current) return false;
    pending.current = true;
    setBusy(true);
    try { return await action(); } finally { pending.current = false; setBusy(false); }
  };

  const completeOne = async (working: ElearningCourseChapter[], chapterId: string, content: ElearningCourseContentItem) => {
    const completion = completeContent(working, chapterId, content.id);
    if (!completion.chapter || !completion.content || completion.wasAlreadyCompleted || !onContentComplete) return { ok: true, chapters: completion.chapters };
    const payload = { ...getElearningCourseProgressSummary(completion.chapters), chapter: completion.chapter, content: completion.content };
    try {
      return { ok: await confirmedResult(onContentComplete(course, payload)), chapters: completion.chapters };
    } catch {
      return { ok: false, chapters: working };
    }
  };

  const completeContentItem = (content: ElearningCourseContentItem) => {
    if (!chapter) return;
    void run(async () => (await completeOne(chapters, chapter.id, content)).ok);
  };

  /** « Marquer comme terminé »: every content of the chapter still to do, one after the other (MAIR-925). */
  const completeChapter = () => {
    if (!chapter) return;
    void run(async () => {
      let working = chapters;
      for (const content of remaining) {
        if (canCompleteContent && !canCompleteContent(course, content)) continue;
        // Sequential on purpose: each completion is confirmed before the next one is sent.
        const result = await completeOne(working, chapter.id, content); // eslint-disable-line no-await-in-loop
        if (!result.ok) return false;
        working = result.chapters;
      }
      return true;
    });
  };

  const download = (content: ElearningCourseContentItem) => {
    if (!onContentDownload) return;
    setDownloadingId(content.id);
    void run(async () => {
      try {
        const ok = await confirmedResult(onContentDownload(course, content));
        if (ok) toast.success('Le support est enregistré sur votre appareil.', { title: 'Support téléchargé' });
        else toast.error('Le téléchargement n’a pas été confirmé.', { title: 'Téléchargement impossible' });
        return ok;
      } catch (reason) {
        toast.error(reason instanceof Error ? reason.message : 'Le téléchargement a échoué.', { title: 'Téléchargement impossible' });
        return false;
      } finally { setDownloadingId(undefined); }
    });
  };

  const exit = () => { if (!pending.current) onExit(); };

  const bar = (
    <div className="flex w-full flex-wrap items-center gap-3 px-4 py-2">
      <Button variant="ghost" tone="neutral" label="Quitter la formation" onClick={exit} disabled={busy} />
      <div className="flex min-w-0 flex-1 flex-col">
        {course.category ? <Caption>{course.category}</Caption> : null}
        <h1 className="truncate text-base font-semibold leading-6">{course.title}</h1>
      </div>
      <ProgressMeter label={`${summary.completedChapters} / ${chapters.length} chapitres`} value={progress} size="s" className="w-full sm:w-56" />
    </div>
  );

  if (finished || !chapter) {
    return (
      <AppShell layout="focus" hrefs={{}} bar={bar}>
        {finished ? (
          <CourseEndScreen
            title={course.title}
            chapterCount={chapters.length}
            rating={course.details?.completionRating}
            onRatingSubmit={onRatingSubmit ? rating => onRatingSubmit(course, rating) : undefined}
            review={review}
            onBackToCatalog={onExit}
          />
        ) : <Text className="p-6">Aucun chapitre disponible pour cette formation.</Text>}
      </AppShell>
    );
  }

  const footer = (
    <div className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3">
      <Button variant="outline" tone="neutral" label="Précédent" disabled={index === 0 || busy} onClick={() => setCurrentId(chapters[index - 1]?.id)} />
      {chapter.completed ? <StatusPill dot tone="success" label="Chapitre terminé" /> : (
        <Button tone="success" label="Marquer comme terminé" loading={busy && !downloadingId} disabled={!onContentComplete || busy || remaining.length === 0} onClick={completeChapter} />
      )}
      {last ? (
        <Button label="Terminer" disabled={!summary.completed || busy} onClick={() => setFinished(true)} />
      ) : (
        <Button label="Suivant" disabled={busy} onClick={() => setCurrentId(chapters[index + 1]?.id)} />
      )}
    </div>
  );

  return (
    <AppShell
      layout="focus"
      hrefs={{}}
      bar={bar}
      aside={<PlayerSummary chapters={chapters} currentId={chapter.id} busy={busy} onSelect={setCurrentId} />}
      footer={footer}
    >
      <PlayerChapter
        chapter={chapter}
        index={index}
        count={chapters.length}
        busy={busy}
        downloadingId={downloadingId}
        onDownload={onContentDownload ? download : undefined}
        onComplete={onContentComplete ? completeContentItem : undefined}
        canCompleteContent={canCompleteContent ? content => canCompleteContent(course, content) : undefined}
      />
    </AppShell>
  );
};
