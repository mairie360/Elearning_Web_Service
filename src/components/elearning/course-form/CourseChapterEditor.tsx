import { FilePlus2, Trash2 } from 'lucide-react';
import { TextField } from '@mairie360/lib-components/primitives';

import type { ElearningCourseContentItem } from '../course-details/types';
import { ChapterContentEditor } from './ChapterContentEditor';
import type { ElearningCourseChapterFormValues } from './course-form-values';
import { TextAreaField } from './TextAreaField';

export interface CourseChapterEditorProps {
  chapter: ElearningCourseChapterFormValues;
  chapterIndex: number;
  removable: boolean;
  onChange: (patch: Partial<ElearningCourseChapterFormValues>) => void;
  onRemove: () => void;
  onAddContent: () => void;
  onContentChange: (contentId: string, patch: Partial<ElearningCourseContentItem>) => void;
  onContentRemove: (contentId: string) => void;
}

/** A chapter card with its fields and its resources. */
export const CourseChapterEditor = ({
  chapter, chapterIndex, removable, onChange, onRemove, onAddContent, onContentChange, onContentRemove,
}: CourseChapterEditorProps) => (
  <article className="rounded-lg border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-4 shadow-sm sm:p-5">
    <div className="flex items-center justify-between gap-3">
      <h4 className="font-bold text-[var(--mairie-text)]">Chapitre {chapterIndex + 1}</h4>
      <button
        aria-label={`Supprimer le chapitre ${chapterIndex + 1}`}
        className="inline-flex size-8 items-center justify-center rounded-md text-[var(--mairie-error-text)] hover:bg-[var(--mairie-error-surface)] disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!removable}
        onClick={onRemove}
        type="button"
      >
        <Trash2 className="size-4" />
      </button>
    </div>

    <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
      <TextField id={`chapter-title-${chapter.id}`} label="Titre du chapitre" required value={chapter.title} onChange={(event) => onChange({ title: event.target.value })} />
      <TextField id={`chapter-duration-${chapter.id}`} label="Durée" placeholder="30 min" required value={chapter.duration} onChange={(event) => onChange({ duration: event.target.value })} />
      <TextAreaField id={`chapter-description-${chapter.id}`} className="sm:col-span-2" label="Description du chapitre" value={chapter.description ?? ''} onChange={(description) => onChange({ description })} />
    </div>

    <div className="mt-4 rounded-md bg-[var(--mairie-surface-raised)] p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <h5 className="text-sm font-bold text-[var(--mairie-text)]">Ressources du chapitre</h5>
        <button
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-[var(--mairie-accent)] hover:bg-[var(--mairie-accent-surface)]"
          onClick={onAddContent}
          type="button"
        >
          <FilePlus2 className="size-4" /> Ajouter une ressource
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {chapter.contents.map((content, contentIndex) => (
          <ChapterContentEditor
            key={content.id}
            content={content}
            contentIndex={contentIndex}
            chapterIndex={chapterIndex}
            removable={chapter.contents.length > 1}
            onChange={(patch) => onContentChange(content.id, patch)}
            onRemove={() => onContentRemove(content.id)}
          />
        ))}
      </div>
    </div>
  </article>
);
