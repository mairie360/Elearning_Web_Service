import React from 'react';
import { FilePlus2, Layers3, Plus, Trash2, X } from 'lucide-react';

import type {
  ElearningCourseChapter,
  ElearningCourseContentItem,
  ElearningCourseContentType,
} from './ElearningCourseDetailsModal';
import type { ElearningFilterOption } from './ElearningFilterSelect';

export type ElearningCourseRequirement = 'none' | 'mandatory' | 'recommended';
export type ElearningCourseLevel = 'none' | 'beginner' | 'intermediate' | 'advanced';

export interface ElearningCourseChapterFormValues extends Omit<ElearningCourseChapter, 'contents'> {
  description?: string;
  contents: ElearningCourseContentItem[];
}

export interface ElearningCourseFormValues {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  statusValue: string;
  instructor: string;
  duration: string;
  deadline: string;
  requirement: ElearningCourseRequirement;
  level: ElearningCourseLevel;
  chapters: ElearningCourseChapterFormValues[];
}

export interface ElearningCourseFormModalProps {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  initialValues: ElearningCourseFormValues;
  statusOptions: ElearningFilterOption[];
  onCancel: () => void;
  onSubmit: (values: ElearningCourseFormValues) => void | boolean | Promise<void | boolean>;
}

const fieldClassName =
  'h-10 w-full rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface)] px-3 text-sm text-[var(--mairie-text)] shadow-sm outline-none transition placeholder:text-[var(--mairie-muted)] focus:border-[var(--mairie-accent)] focus:ring-2 focus:ring-[var(--mairie-accent)]/20';
const textareaClassName =
  'min-h-24 w-full resize-y rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface)] px-3 py-2 text-sm text-[var(--mairie-text)] shadow-sm outline-none transition placeholder:text-[var(--mairie-muted)] focus:border-[var(--mairie-accent)] focus:ring-2 focus:ring-[var(--mairie-accent)]/20';
const labelClassName = 'mb-1.5 block text-sm font-semibold text-[var(--mairie-text)]';

const currentStatusLabel = (statusValue: string) => {
  switch (statusValue) {
    case 'not-started': return 'Non commencé (statut actuel)';
    case 'in-progress': return 'En cours (statut actuel)';
    case 'completed': return 'Terminé (statut actuel)';
    default: return statusValue.trim() ? `Statut actuel : ${statusValue}` : 'Statut non renseigné';
  }
};

const contentTypes: Array<{ label: string; value: ElearningCourseContentType }> = [
  { label: 'Vidéo', value: 'video' },
  { label: 'PDF', value: 'pdf' },
  { label: 'Document', value: 'document' },
  { label: 'Lien', value: 'link' },
  { label: 'Quiz', value: 'quiz' },
  { label: 'Audio', value: 'audio' },
  { label: 'Autre', value: 'other' },
];

const createId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const createEmptyCourseContent = (): ElearningCourseContentItem => ({
  id: createId('content'),
  title: '',
  type: 'video',
  description: '',
  duration: '',
  required: true,
});

export const createEmptyCourseChapter = (): ElearningCourseChapterFormValues => ({
  id: createId('chapter'),
  title: '',
  description: '',
  duration: '',
  contents: [createEmptyCourseContent()],
});

const normalizeValues = (values: ElearningCourseFormValues): ElearningCourseFormValues => ({
  ...values,
  title: values.title.trim(),
  subtitle: values.subtitle.trim(),
  description: values.description.trim(),
  category: values.category.trim(),
  instructor: values.instructor.trim(),
  duration: values.duration.trim(),
  deadline: values.deadline.trim(),
  chapters: values.chapters.map((chapter) => ({
    ...chapter,
    title: chapter.title.trim(),
    description: chapter.description?.trim(),
    duration: chapter.duration.trim(),
    contents: chapter.contents.map((content) => ({
      ...content,
      title: content.title.trim(),
      description: content.description?.trim(),
      duration: content.duration?.trim(),
      fileName: content.fileName?.trim() || undefined,
      href: content.href?.trim() || undefined,
    })),
  })),
});

export const ElearningCourseFormModal = ({
  isOpen,
  title,
  submitLabel,
  initialValues,
  statusOptions,
  onCancel,
  onSubmit,
}: ElearningCourseFormModalProps) => {
  const [values, setValues] = React.useState(initialValues);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submissionError, setSubmissionError] = React.useState<string | null>(null);
  const submittingRef = React.useRef(false);
  const wasOpenRef = React.useRef(false);
  const titleId = React.useId();

  React.useEffect(() => {
    // A catalogue refresh may replace initialValues while a save is pending or
    // refused. Only a newly opened form may replace the administrator's draft.
    if (isOpen && !wasOpenRef.current) {
      setValues(initialValues);
      setSubmissionError(null);
    }
    wasOpenRef.current = isOpen;
  }, [initialValues, isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submittingRef.current) onCancel();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  // Catalogue filter choices need not include the current author draft. Keep
  // that exact value visible without inventing another editable transition.
  const authorStatuses = statusOptions.filter((option) => option.value !== 'all');
  const hasCurrentStatus = authorStatuses.some((option) => option.value === values.statusValue);

  const updateValue = <Key extends keyof ElearningCourseFormValues>(
    key: Key,
    value: ElearningCourseFormValues[Key]
  ) => {
    setValues((currentValues) => ({ ...currentValues, [key]: value }));
  };

  const updateChapter = (chapterId: string, patch: Partial<ElearningCourseChapterFormValues>) => {
    setValues((currentValues) => ({
      ...currentValues,
      chapters: currentValues.chapters.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, ...patch } : chapter
      ),
    }));
  };

  const updateContent = (
    chapterId: string,
    contentId: string,
    patch: Partial<ElearningCourseContentItem>
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      chapters: currentValues.chapters.map((chapter) =>
        chapter.id === chapterId
          ? {
              ...chapter,
              contents: chapter.contents.map((content) =>
                content.id === contentId ? { ...content, ...patch } : content
              ),
            }
          : chapter
      ),
    }));
  };

  const removeChapter = (chapterId: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      chapters: currentValues.chapters.filter((chapter) => chapter.id !== chapterId),
    }));
  };

  const removeContent = (chapterId: string, contentId: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      chapters: currentValues.chapters.map((chapter) =>
        chapter.id === chapterId
          ? { ...chapter, contents: chapter.contents.filter((content) => content.id !== contentId) }
          : chapter
      ),
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (submittingRef.current || values.chapters.length === 0) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmissionError(null);
    const refused = () => setSubmissionError('L’enregistrement n’a pas été confirmé. Vos saisies sont conservées ; vous pouvez réessayer.');
    const settled = () => {
      submittingRef.current = false;
      setIsSubmitting(false);
    };
    try {
      const result = onSubmit(normalizeValues(values));
      if (result && typeof result === 'object' && typeof result.then === 'function') {
        void result.then((confirmed) => {
          if (confirmed === false) refused();
        }).catch(refused).finally(settled);
      } else {
        if (result === false) refused();
        settled();
      }
    } catch {
      refused();
      settled();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--mairie-overlay-background)]/35 p-3 sm:p-5"
      role="dialog"
      aria-labelledby={titleId}
      aria-modal="true"
      aria-busy={isSubmitting}
      onSubmit={handleSubmit}
    >
      <form
        aria-busy={isSubmitting}
        className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-[980px] flex-col overflow-hidden rounded-xl bg-[var(--mairie-surface-raised)] text-[var(--mairie-text)] shadow-2xl sm:max-h-[calc(100vh-2.5rem)]"
      >
        <div className="flex min-h-16 shrink-0 items-center justify-between gap-4 bg-[var(--mairie-navigation-background)] px-5 py-3 text-[var(--mairie-on-action)] sm:px-7">
          <div>
            <h2 id={titleId} className="text-base font-semibold leading-6 sm:text-lg">
              {title}
            </h2>
            <p className="text-xs text-[var(--mairie-on-action)]/65">Informations, présentation et contenu pédagogique</p>
          </div>
          <button
            aria-label="Fermer"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-[var(--mairie-on-action)]/75 transition hover:bg-[var(--mairie-surface)]/10 hover:text-[var(--mairie-on-action)] focus:outline-none focus:ring-2 focus:ring-[var(--mairie-surface)]/35"
            onClick={onCancel}
            disabled={isSubmitting}
            type="button"
          >
            <X className="size-5" strokeWidth={1.8} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6" data-elearning-form-scroll>
        <fieldset disabled={isSubmitting} className="m-0 min-w-0 space-y-6 border-0 p-0">
          <section aria-labelledby="course-general-heading">
            <h3 id="course-general-heading" className="text-base font-bold text-[var(--mairie-text)]">
              Informations générales
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="elearning-course-title" className={labelClassName}>Titre</label>
                <input
                  id="elearning-course-title"
                  className={fieldClassName}
                  onChange={(event) => updateValue('title', event.target.value)}
                  placeholder="Accueil des nouveaux agents"
                  required
                  type="text"
                  value={values.title}
                />
              </div>
              <div>
                <label htmlFor="elearning-course-subtitle" className={labelClassName}>Sous-titre</label>
                <input
                  id="elearning-course-subtitle"
                  className={fieldClassName}
                  onChange={(event) => updateValue('subtitle', event.target.value)}
                  placeholder="Parcours d’intégration"
                  type="text"
                  value={values.subtitle}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="elearning-course-description" className={labelClassName}>Description</label>
                <textarea
                  id="elearning-course-description"
                  className={textareaClassName}
                  onChange={(event) => updateValue('description', event.target.value)}
                  placeholder="Objectifs, public concerné et contenu de la formation"
                  required
                  value={values.description}
                />
              </div>
              <div>
                <label htmlFor="elearning-course-category" className={labelClassName}>Catégorie</label>
                <input
                  id="elearning-course-category"
                  className={fieldClassName}
                  onChange={(event) => updateValue('category', event.target.value)}
                  placeholder="Sécurité, RH, Administration..."
                  required
                  type="text"
                  value={values.category}
                />
              </div>
              <div>
                <label htmlFor="elearning-course-instructor" className={labelClassName}>Instructeur</label>
                <input
                  id="elearning-course-instructor"
                  className={fieldClassName}
                  onChange={(event) => updateValue('instructor', event.target.value)}
                  placeholder="Direction ou nom du formateur"
                  type="text"
                  value={values.instructor}
                />
              </div>
              <div>
                <label htmlFor="elearning-course-duration" className={labelClassName}>Durée totale</label>
                <input
                  id="elearning-course-duration"
                  className={fieldClassName}
                  onChange={(event) => updateValue('duration', event.target.value)}
                  placeholder="2 h 30"
                  required
                  type="text"
                  value={values.duration}
                />
              </div>
              <div>
                <label htmlFor="elearning-course-deadline" className={labelClassName}>Échéance</label>
                <input
                  id="elearning-course-deadline"
                  className={fieldClassName}
                  onChange={(event) => updateValue('deadline', event.target.value)}
                  placeholder="30 juin 2026"
                  type="text"
                  value={values.deadline}
                />
              </div>
            </div>
          </section>

          <section aria-labelledby="course-presentation-heading" className="border-t border-[var(--mairie-border)] pt-5">
            <h3 id="course-presentation-heading" className="text-base font-bold text-[var(--mairie-text)]">Présentation</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="elearning-course-status" className={labelClassName}>Statut</label>
                <select
                  id="elearning-course-status"
                  className={fieldClassName}
                  onChange={(event) => {
                    const nextStatus = event.target.value;
                    if (!submittingRef.current && authorStatuses.some((option) => option.value === nextStatus && !option.disabled)) {
                      updateValue('statusValue', nextStatus);
                    }
                  }}
                  value={values.statusValue}
                >
                  {!hasCurrentStatus ? (
                    <option disabled value={values.statusValue}>{currentStatusLabel(values.statusValue)}</option>
                  ) : null}
                  {authorStatuses.map((option) => (
                    <option disabled={option.disabled} key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="elearning-course-requirement" className={labelClassName}>Type de parcours</label>
                <select
                  id="elearning-course-requirement"
                  className={fieldClassName}
                  onChange={(event) => updateValue('requirement', event.target.value as ElearningCourseRequirement)}
                  value={values.requirement}
                >
                  <option value="none">Standard</option>
                  <option value="mandatory">Obligatoire</option>
                  <option value="recommended">Recommandé</option>
                </select>
              </div>
              <div>
                <label htmlFor="elearning-course-level" className={labelClassName}>Niveau</label>
                <select
                  id="elearning-course-level"
                  className={fieldClassName}
                  onChange={(event) => updateValue('level', event.target.value as ElearningCourseLevel)}
                  value={values.level}
                >
                  <option value="none">Non renseigné</option>
                  <option value="beginner">Débutant</option>
                  <option value="intermediate">Intermédiaire</option>
                  <option value="advanced">Avancé</option>
                </select>
              </div>
            </div>
          </section>

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
                onClick={() => updateValue('chapters', [...values.chapters, createEmptyCourseChapter()])}
                type="button"
              >
                <Plus className="size-4" /> Ajouter un chapitre
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {values.chapters.map((chapter, chapterIndex) => (
                <article key={chapter.id} className="rounded-lg border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-4 shadow-sm sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-bold text-[var(--mairie-text)]">Chapitre {chapterIndex + 1}</h4>
                    <button
                      aria-label={`Supprimer le chapitre ${chapterIndex + 1}`}
                      className="inline-flex size-8 items-center justify-center rounded-md text-[var(--mairie-error-text)] hover:bg-[var(--mairie-error-surface)] disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={values.chapters.length === 1}
                      onClick={() => removeChapter(chapter.id)}
                      type="button"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
                    <div>
                      <label htmlFor={`chapter-title-${chapter.id}`} className={labelClassName}>Titre du chapitre</label>
                      <input
                        id={`chapter-title-${chapter.id}`}
                        className={fieldClassName}
                        onChange={(event) => updateChapter(chapter.id, { title: event.target.value })}
                        required
                        type="text"
                        value={chapter.title}
                      />
                    </div>
                    <div>
                      <label htmlFor={`chapter-duration-${chapter.id}`} className={labelClassName}>Durée</label>
                      <input
                        id={`chapter-duration-${chapter.id}`}
                        className={fieldClassName}
                        onChange={(event) => updateChapter(chapter.id, { duration: event.target.value })}
                        placeholder="30 min"
                        required
                        type="text"
                        value={chapter.duration}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor={`chapter-description-${chapter.id}`} className={labelClassName}>Description du chapitre</label>
                      <textarea
                        id={`chapter-description-${chapter.id}`}
                        className={`${textareaClassName} min-h-20`}
                        onChange={(event) => updateChapter(chapter.id, { description: event.target.value })}
                        value={chapter.description ?? ''}
                      />
                    </div>
                  </div>

                  <div className="mt-4 rounded-md bg-[var(--mairie-surface-raised)] p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h5 className="text-sm font-bold text-[var(--mairie-text)]">Ressources du chapitre</h5>
                      <button
                        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-[var(--mairie-accent)] hover:bg-[var(--mairie-accent-surface)]"
                        onClick={() => updateChapter(chapter.id, { contents: [...chapter.contents, createEmptyCourseContent()] })}
                        type="button"
                      >
                        <FilePlus2 className="size-4" /> Ajouter une ressource
                      </button>
                    </div>

                    <div className="mt-3 space-y-3">
                      {chapter.contents.map((content, contentIndex) => {
                        const resourceValue = content.href ?? content.fileName ?? '';
                        return (
                          <div key={content.id} className="rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs font-bold uppercase tracking-wide text-[var(--mairie-muted)]">Ressource {contentIndex + 1}</p>
                              <button
                                aria-label={`Supprimer la ressource ${contentIndex + 1} du chapitre ${chapterIndex + 1}`}
                                className="inline-flex size-7 items-center justify-center rounded text-[var(--mairie-error-text)] hover:bg-[var(--mairie-error-surface)] disabled:opacity-40"
                                disabled={chapter.contents.length === 1}
                                onClick={() => removeContent(chapter.id, content.id)}
                                type="button"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              <div className="lg:col-span-2">
                                <label htmlFor={`content-title-${content.id}`} className={labelClassName}>Titre</label>
                                <input
                                  id={`content-title-${content.id}`}
                                  className={fieldClassName}
                                  onChange={(event) => updateContent(chapter.id, content.id, { title: event.target.value })}
                                  required
                                  type="text"
                                  value={content.title}
                                />
                              </div>
                              <div>
                                <label htmlFor={`content-type-${content.id}`} className={labelClassName}>Type</label>
                                <select
                                  id={`content-type-${content.id}`}
                                  className={fieldClassName}
                                  onChange={(event) =>
                                    updateContent(chapter.id, content.id, { type: event.target.value as ElearningCourseContentType })
                                  }
                                  value={content.type}
                                >
                                  {contentTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                              </div>
                              <div>
                                <label htmlFor={`content-duration-${content.id}`} className={labelClassName}>Durée</label>
                                <input
                                  id={`content-duration-${content.id}`}
                                  className={fieldClassName}
                                  onChange={(event) => updateContent(chapter.id, content.id, { duration: event.target.value })}
                                  placeholder="12 min"
                                  type="text"
                                  value={content.duration ?? ''}
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label htmlFor={`content-resource-${content.id}`} className={labelClassName}>Lien ou fichier</label>
                                <input
                                  id={`content-resource-${content.id}`}
                                  className={fieldClassName}
                                  onChange={(event) =>
                                    updateContent(chapter.id, content.id, content.type === 'link'
                                      ? { href: event.target.value, fileName: undefined }
                                      : { fileName: event.target.value, href: undefined })
                                  }
                                  placeholder="https://… ou support.pdf"
                                  type="text"
                                  value={resourceValue}
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label htmlFor={`content-description-${content.id}`} className={labelClassName}>Description</label>
                                <input
                                  id={`content-description-${content.id}`}
                                  className={fieldClassName}
                                  onChange={(event) => updateContent(chapter.id, content.id, { description: event.target.value })}
                                  type="text"
                                  value={content.description ?? ''}
                                />
                              </div>
                            </div>
                            <label className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--mairie-muted)]">
                              <input
                                checked={content.required !== false}
                                className="size-4 rounded border-[var(--mairie-border)] text-[var(--mairie-accent)]"
                                onChange={(event) => updateContent(chapter.id, content.id, { required: event.target.checked })}
                                type="checkbox"
                              />
                              Ressource obligatoire pour terminer la formation
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </fieldset>
        </div>

        {submissionError ? <p role="alert" className="shrink-0 px-5 py-2 text-sm text-[var(--mairie-error-text)] sm:px-7">{submissionError}</p> : null}
        <div className="flex shrink-0 justify-end gap-3 border-t border-[var(--mairie-border)] bg-[var(--mairie-surface-raised)] px-5 py-4 sm:px-7">
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface)] px-4 text-sm font-semibold text-[var(--mairie-text)] transition hover:bg-[var(--mairie-surface-raised)]"
            onClick={onCancel}
            disabled={isSubmitting}
            type="button"
          >
            Annuler
          </button>
          <button
            className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--mairie-action-background)] px-5 text-sm font-semibold text-[var(--mairie-on-action)] transition hover:bg-[var(--mairie-action-hover-background)] disabled:cursor-not-allowed disabled:bg-[var(--mairie-border)]"
            disabled={isSubmitting || values.chapters.length === 0}
            type="submit"
          >
            {isSubmitting ? 'Enregistrement…' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
};
