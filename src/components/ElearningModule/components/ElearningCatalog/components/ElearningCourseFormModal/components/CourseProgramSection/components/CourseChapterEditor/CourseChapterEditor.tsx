import { FilePlus2 } from 'lucide-react';
import { Button, DeleteButton, TextArea, TextField } from '@mairie360/lib-components/primitives';

import type { ElearningCourseContentItem } from '@/components/ElearningModule/components/ElearningCatalog/course-types';
import { ChapterContentEditor } from './components/ChapterContentEditor';
import type { ElearningCourseChapterFormValues } from '@/components/ElearningModule/components/ElearningCatalog/components/ElearningCourseFormModal/course-form-values';

export interface CourseChapterEditorProps {
  chapter: ElearningCourseChapterFormValues;
  chapterIndex: number;
  removable: boolean;
  linkErrors: Record<string, string>;
  fieldErrors?: Record<string, string>;
  onChange: (patch: Partial<ElearningCourseChapterFormValues>) => void;
  onRemove: () => void;
  onAddContent: () => void;
  onContentChange: (contentId: string, patch: Partial<ElearningCourseContentItem>) => void;
  onContentRemove: (contentId: string) => void;
}

/** A chapter card with its fields and its resources. */
export const CourseChapterEditor = ({
  chapter, chapterIndex, removable, linkErrors, fieldErrors = {}, onChange, onRemove, onAddContent, onContentChange, onContentRemove,
}: CourseChapterEditorProps) => (
  <article className="rounded-lg border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-4 shadow-sm sm:p-5">
    <div className="flex items-center justify-between gap-3">
      <h3 className="font-bold text-[var(--mairie-text)]">Chapitre {chapterIndex + 1}</h3>
      <DeleteButton size="s" aria-label={`Supprimer le chapitre ${chapterIndex + 1}`} disabled={!removable} onClick={onRemove} />
    </div>

    <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
      <TextField id={`chapter-title-${chapter.id}`} label="Titre du chapitre" required error={fieldErrors[`chapter-title-${chapter.id}`]} value={chapter.title} onChange={(event) => onChange({ title: event.target.value })} />
      <TextField id={`chapter-duration-${chapter.id}`} label="Durée" placeholder="30 min" required value={chapter.duration} onChange={(event) => onChange({ duration: event.target.value })} />
      <TextArea id={`chapter-description-${chapter.id}`} className="sm:col-span-2" label="Description du chapitre" error={fieldErrors[`chapter-description-${chapter.id}`]} value={chapter.description ?? ''} onChange={(event) => onChange({ description: event.target.value })} />
    </div>

    <div className="mt-4 rounded-md bg-[var(--mairie-surface-raised)] p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-[var(--mairie-text)]">Ressources du chapitre</h4>
        <Button size="s" variant="ghost" icon={FilePlus2} label="Ajouter une ressource" onClick={onAddContent} />
      </div>

      <div className="mt-3 space-y-3">
        {chapter.contents.map((content, contentIndex) => (
          <ChapterContentEditor
            key={content.id}
            content={content}
            contentIndex={contentIndex}
            chapterIndex={chapterIndex}
            removable={chapter.contents.length > 1}
            linkError={linkErrors[content.id]}
            fieldErrors={fieldErrors}
            onChange={(patch) => onContentChange(content.id, patch)}
            onRemove={() => onContentRemove(content.id)}
          />
        ))}
      </div>
    </div>
  </article>
);
