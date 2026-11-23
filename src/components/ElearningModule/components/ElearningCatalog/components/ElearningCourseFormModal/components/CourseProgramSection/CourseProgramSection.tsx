import { Plus } from 'lucide-react';
import { Button, FormSection } from '@mairie360/lib-components/primitives';

import type { ElearningCourseContentItem } from '@/components/ElearningModule/components/ElearningCatalog/course-types';
import { CourseChapterEditor } from './components/CourseChapterEditor';
import type { ElearningCourseChapterFormValues } from '../../course-form-values';

export interface CourseProgramSectionProps {
  chapters: ElearningCourseChapterFormValues[];
  /** Unsafe link addresses, by content id (MAIR-703). */
  linkErrors: Record<string, string>;
  /** Other refused fields, by input id (MAIR-932). */
  fieldErrors?: Record<string, string>;
  onAddChapter: () => void;
  onChapterChange: (chapterId: string, patch: Partial<ElearningCourseChapterFormValues>) => void;
  /** Asks for a confirmation before removing (MAIR-932 C5). */
  onChapterRemove: (chapter: ElearningCourseChapterFormValues, index: number) => void;
  onAddContent: (chapter: ElearningCourseChapterFormValues) => void;
  onContentChange: (chapterId: string, contentId: string, patch: Partial<ElearningCourseContentItem>) => void;
  onContentRemove: (chapterId: string, contentId: string) => void;
}

/** MAIR-932: « Contenu pédagogique » on the lib FormSection: the chapters, at least one is kept. */
export const CourseProgramSection = ({
  chapters, linkErrors, fieldErrors = {}, onAddChapter, onChapterChange, onChapterRemove, onAddContent, onContentChange, onContentRemove,
}: CourseProgramSectionProps) => (
  <FormSection title="Contenu pédagogique" description="Ajoutez les chapitres et leurs ressources pédagogiques.">
    <div className="flex flex-col gap-4">
      {chapters.map((chapter, chapterIndex) => (
        <CourseChapterEditor
          key={chapter.id}
          chapter={chapter}
          chapterIndex={chapterIndex}
          removable={chapters.length > 1}
          linkErrors={linkErrors}
          fieldErrors={fieldErrors}
          onChange={(patch) => onChapterChange(chapter.id, patch)}
          onRemove={() => onChapterRemove(chapter, chapterIndex)}
          onAddContent={() => onAddContent(chapter)}
          onContentChange={(contentId, patch) => onContentChange(chapter.id, contentId, patch)}
          onContentRemove={(contentId) => onContentRemove(chapter.id, contentId)}
        />
      ))}
      <div><Button variant="outline" icon={Plus} label="Ajouter un chapitre" onClick={onAddChapter} /></div>
    </div>
  </FormSection>
);
