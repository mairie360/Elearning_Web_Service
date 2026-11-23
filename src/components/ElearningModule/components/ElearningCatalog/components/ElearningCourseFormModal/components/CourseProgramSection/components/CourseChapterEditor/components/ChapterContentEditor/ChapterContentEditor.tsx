import { Checkbox, DeleteButton, SelectField, TextField } from '@mairie360/lib-components/primitives';

import type { ElearningCourseContentItem, ElearningCourseContentType } from '@/components/ElearningModule/components/ElearningCatalog/course-types';
import { contentTypeOptions, resourcePatch } from '@/components/ElearningModule/components/ElearningCatalog/components/ElearningCourseFormModal/course-form-values';

export interface ChapterContentEditorProps {
  content: ElearningCourseContentItem;
  contentIndex: number;
  chapterIndex: number;
  removable: boolean;
  /** Unsafe address of a link (MAIR-703). */
  linkError?: string;
  onChange: (patch: Partial<ElearningCourseContentItem>) => void;
  onRemove: () => void;
}

/** One resource of a chapter: title, type, duration, link or file, description, required flag. */
export const ChapterContentEditor = ({ content, contentIndex, chapterIndex, removable, linkError, onChange, onRemove }: ChapterContentEditorProps) => (
  <div className="rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-3">
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--mairie-muted)]">Ressource {contentIndex + 1}</p>
      <DeleteButton size="xs" aria-label={`Supprimer la ressource ${contentIndex + 1} du chapitre ${chapterIndex + 1}`} disabled={!removable} onClick={onRemove} />
    </div>
    <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <TextField id={`content-title-${content.id}`} className="lg:col-span-2" label="Titre" required value={content.title} onChange={(event) => onChange({ title: event.target.value })} />
      <SelectField<ElearningCourseContentType> id={`content-type-${content.id}`} label="Type" placeholder={null} options={contentTypeOptions} value={content.type} onChange={(type) => onChange({ type })} />
      <TextField id={`content-duration-${content.id}`} label="Durée" placeholder="12 min" value={content.duration ?? ''} onChange={(event) => onChange({ duration: event.target.value })} />
      <TextField id={`content-resource-${content.id}`} className="sm:col-span-2" label="Lien ou fichier" placeholder="https://… ou support.pdf" error={linkError} value={content.href ?? content.fileName ?? ''} onChange={(event) => onChange(resourcePatch(content.type, event.target.value))} />
      <TextField id={`content-description-${content.id}`} className="sm:col-span-2" label="Description" value={content.description ?? ''} onChange={(event) => onChange({ description: event.target.value })} />
    </div>
    <Checkbox
      className="mt-3"
      label="Ressource obligatoire pour terminer la formation"
      checked={content.required !== false}
      onChange={(event) => onChange({ required: event.target.checked })}
    />
  </div>
);
