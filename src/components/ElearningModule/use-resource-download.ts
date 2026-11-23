'use client';

import { useCallback, useEffect, useRef } from "react";

import { prepareResourceDownload, type LearnerFeaturePort } from '../../features/elearning/learnerFeatures';
import type { CatalogCourse } from './module-model';

type Content = { id: string };

/** Chapter holding `contentId` in the course the screen shows. */
export const chapterOfContent = (course: CatalogCourse, contentId: string) =>
  course.details?.chapters.find(chapter => chapter.contents?.some(content => content.id === contentId))?.id;

/**
 * MAIR-817: one stored file at a time. A new opening (or closing the course) aborts the previous one; the signed URL
 * the BFF gives is opened in a new tab through a temporary link (the browser renders or saves it).
 */
export function useResourceDownload(learnerPort: LearnerFeaturePort) {
  const downloadRef = useRef<AbortController | null>(null);
  useEffect(() => () => downloadRef.current?.abort(), []);

  const download = async (course: CatalogCourse, content: Content) => {
    downloadRef.current?.abort(); const controller = new AbortController(); downloadRef.current = controller;
    try {
      const chapterId = chapterOfContent(course, content.id);
      if (!chapterId) throw new Error('Ce support n’appartient à aucun chapitre de la formation.');
      const file = await prepareResourceDownload(learnerPort, { courseId: course.id, chapterId, contentId: content.id }, controller.signal);
      if (controller.signal.aborted) return false;
      const link = document.createElement('a');
      link.href = file.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      document.body.append(link); link.click(); link.remove();
      return true;
    } finally { if (downloadRef.current === controller) downloadRef.current = null; }
  };

  // Stable, so a page effect can cancel the pending opening when the course screen closes.
  const abort = useCallback(() => downloadRef.current?.abort(), []);
  return { download: learnerPort.downloadResource ? download : undefined, abort };
}
