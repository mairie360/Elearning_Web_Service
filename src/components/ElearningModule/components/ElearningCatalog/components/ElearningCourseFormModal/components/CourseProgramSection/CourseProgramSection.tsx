import { Layers3, Plus } from 'lucide-react';

import type { ElearningCourseContentItem } from '@/components/ElearningModule/components/ElearningCatalog/course-types';
import { CourseChapterEditor } from './components/CourseChapterEditor';
import type { ElearningCourseChapterFormValues } from '../../course-form-values';

export interface CourseProgramSectionProps {
  chapters: ElearningCourseChapterFormValues[];
  onAddChapter: () => void;
  onChapterChange: (chapterId: string, patch: Partial<ElearningCourseChapterFormValues>) => void;
  onChapterRemove: (chapterId: string) => void;
  onAddContent: (chapter: ElearningCourseChapterFormValues) => void;
  onContentChange: (chapterId: string, contentId: string, patch: Partial<ElearningCourseContentItem>) => void;
  onContentRemove: (chapterId: string, contentId: string) => void;
}

/** "Programme de la formation": the chapters, at least one is kept. */
export const CourseProgramSection = ({
  chapters, onAddChapter, onChapterChange, onChapterRemove, onAddContent, onContentChange, onContentRemove,
}: CourseProgramSectionProps) => (
  <section aria-labelledby="course-structure-heading" className="border-t border-[var(--mairie-border)] pt-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 id="course-structure-heading" className="flex items-center gap-2 text-base font-bold text-[var(--mairie-text)]">
          <Layers3 className="size-5 text-[var(--mairie-accent)]" />
          Programme de la formation
        </h3>
        <p className="mt-1 text-sm text-[var(--mairie-muted)]">Ajoutez les chapitres et leurs ressources pédagogiques.</p>
      </div>
      <button
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--mairie-accent)] bg-[var(--mairie-surface)] px-3 text-sm font-semibold text-[var(--mairie-accent)] transition hover:bg-[var(--mairie-accent-surface)]"
        onClick={onAddChapter}
        type="button"
      >
        <Plus className="size-4" /> Ajouter un chapitre
      </button>
    </div>

    <div className="mt-4 space-y-4">
      {chapters.map((chapter, chapterIndex) => (
        <CourseChapterEditor
          key={chapter.id}
          chapter={chapter}
          chapterIndex={chapterIndex}
          removable={chapters.length > 1}
          onChange={(patch) => onChapterChange(chapter.id, patch)}
          onRemove={() => onChapterRemove(chapter.id)}
          onAddContent={() => onAddContent(chapter)}
          onContentChange={(contentId, patch) => onContentChange(chapter.id, contentId, patch)}
          onContentRemove={(contentId) => onContentRemove(chapter.id, contentId)}
        />
      ))}
    </div>
  </section>
);
