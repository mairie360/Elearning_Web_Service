import { Play } from 'lucide-react';

import { contentTypeIcons, contentTypeLabels } from './content-types';
import type { ElearningCourseContentItem } from './types';

/** Dark player area naming the chapter's main content (the video first). */
export const CourseMediaPreview = ({ content }: { content?: ElearningCourseContentItem }) => {
  const Icon = content ? contentTypeIcons[content.type] : Play;
  return (
    <div className="rounded-md bg-[var(--mairie-overlay-background)] p-5 text-[var(--mairie-on-action)]">
      <div className="flex aspect-video w-full items-center justify-center rounded">
        <div className="text-center">
          <Icon aria-hidden="true" className="mx-auto size-16" strokeWidth={2.4} />
          {content ? (
            <div className="mt-4 max-w-md">
              <p className="text-sm font-semibold leading-5">{contentTypeLabels[content.type]}</p>
              <p className="mt-1 break-words text-base font-semibold leading-6">{content.title}</p>
            </div>
          ) : <p className="mt-4 text-sm">Aucun contenu disponible pour cette formation.</p>}
        </div>
      </div>
    </div>
  );
};
