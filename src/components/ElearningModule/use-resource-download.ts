'use client';

import { useEffect, useRef } from "react";

import { prepareResourceDownload, type LearnerFeaturePort } from '../../features/elearning/learnerFeatures';
import type { CatalogCourse } from './module-model';

type Content = { id: string };

/**
 * One resource download at a time: a new one (or closing the course) aborts the previous,
 * and the file is saved through a temporary link.
 */
export function useResourceDownload(learnerPort: LearnerFeaturePort) {
  const downloadRef = useRef<AbortController | null>(null);
  useEffect(() => () => downloadRef.current?.abort(), []);

  const download = async (course: CatalogCourse, content: Content) => {
    downloadRef.current?.abort(); const controller = new AbortController(); downloadRef.current = controller;
    try {
      const file = await prepareResourceDownload(learnerPort, course.id, content.id, controller.signal);
      if (controller.signal.aborted) return false;
      const url = URL.createObjectURL(file.blob); const link = document.createElement('a');
      link.href = url; link.download = file.fileName; document.body.append(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    } finally { if (downloadRef.current === controller) downloadRef.current = null; }
  };

  return { download: learnerPort.downloadResource ? download : undefined, abort: () => downloadRef.current?.abort() };
}
