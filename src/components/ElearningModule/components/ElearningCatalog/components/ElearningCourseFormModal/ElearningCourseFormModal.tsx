import React from 'react';
import { Alert, CancelButton, ConfirmModal, Modal, SaveButton } from '@mairie360/lib-components/primitives';

import type { ElearningFilterOption } from '../../catalog-types';
import { CourseGeneralSection } from './components/CourseGeneralSection';
import { CoursePresentationSection } from './components/CoursePresentationSection';
import { CourseProgramSection } from './components/CourseProgramSection';
import {
  createEmptyCourseChapter,
  createEmptyCourseContent,
  firstErrorFieldId,
  hasCourseFormErrors,
  normalizeCourseFormValues,
  patchChapter,
  patchContent,
  removeChapter,
  removeContent,
  validateCourseForm,
  type CourseFormErrors,
  type ElearningCourseChapterFormValues,
  type ElearningCourseFormValues,
} from './course-form-values';

export type {
  ElearningCourseChapterFormValues,
  ElearningCourseFormValues,
  ElearningCourseLevel,
  ElearningCourseRequirement,
} from './course-form-values';
export { createEmptyCourseChapter, createEmptyCourseContent } from './course-form-values';

export interface ElearningCourseFormModalProps {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  initialValues: ElearningCourseFormValues;
  statusOptions: ElearningFilterOption[];
  /** Categories of the catalogue, offered in a list (MAIR-932 C2). */
  categories?: string[];
  /** Called once a chapter was removed after its confirmation (MAIR-932 C5: info toast). */
  onChapterRemoved?: () => void;
  onCancel: () => void;
  onSubmit: (values: ElearningCourseFormValues) => void | boolean | Promise<void | boolean>;
}

/** Course author form on the lib Modal (MAIR-608): general information, presentation, then the programme. */
export const ElearningCourseFormModal = ({
  isOpen,
  title,
  submitLabel,
  initialValues,
  statusOptions,
  categories = [],
  onChapterRemoved,
  onCancel,
  onSubmit,
}: ElearningCourseFormModalProps) => {
  const [values, setValues] = React.useState(initialValues);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submissionError, setSubmissionError] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<CourseFormErrors>({ links: {} });
  const [chapterToRemove, setChapterToRemove] = React.useState<{ chapter: ElearningCourseChapterFormValues; index: number } | null>(null);
  const submittingRef = React.useRef(false);
  const wasOpenRef = React.useRef(false);
  const formId = React.useId();

  React.useEffect(() => {
    // A catalogue refresh may replace initialValues while a save is pending or
    // refused. Only a newly opened form may replace the administrator's draft.
    if (isOpen && !wasOpenRef.current) {
      setValues(initialValues);
      setSubmissionError(null);
      setErrors({ links: {} });
      setChapterToRemove(null);
    }
    wasOpenRef.current = isOpen;
  }, [initialValues, isOpen]);

  if (!isOpen) return null;

  const updateValue = <Key extends keyof ElearningCourseFormValues>(key: Key, value: ElearningCourseFormValues[Key]) =>
    setValues((currentValues) => ({ ...currentValues, [key]: value }));
  const updateChapters = (update: (chapters: ElearningCourseFormValues['chapters']) => ElearningCourseFormValues['chapters']) =>
    setValues((currentValues) => ({ ...currentValues, chapters: update(currentValues.chapters) }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (submittingRef.current || values.chapters.length === 0) return;
    // MAIR-932 C3: required fields and safe links are checked here; nothing is sent while one is wrong.
    const found = validateCourseForm(values);
    setErrors(found);
    if (hasCourseFormErrors(found)) {
      const id = firstErrorFieldId(found);
      if (id && typeof document !== 'undefined') document.getElementById(id)?.focus();
      return;
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmissionError(null);
    const refused = () => setSubmissionError('L’enregistrement n’a pas été confirmé. Vos saisies sont conservées ; vous pouvez réessayer.');
    const settled = () => {
      submittingRef.current = false;
      setIsSubmitting(false);
    };
    try {
      const result = onSubmit(normalizeCourseFormValues(values));
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

  // A pending save blocks every close path, like the lib ConfirmModal.
  const close = () => { if (!submittingRef.current) onCancel(); };

  return (
    <Modal
      open
      title={title}
      description="Informations, présentation et contenu pédagogique"
      size="xl"
      closeLabel="Fermer"
      closeOnBackdrop={!isSubmitting}
      onClose={close}
      aria-busy={isSubmitting}
      footer={<>
        <CancelButton onClick={close} disabled={isSubmitting} />
        <SaveButton
          type="submit"
          form={formId}
          label={submitLabel}
          loading={isSubmitting}
          disabled={isSubmitting || values.chapters.length === 0}
        />
      </>}
    >
      {submissionError ? <Alert role="alert" tone="danger" title="Formation non enregistrée" description={submissionError} className="mb-4" /> : null}
      <form id={formId} aria-busy={isSubmitting} onSubmit={handleSubmit} noValidate>
        <fieldset disabled={isSubmitting} className="m-0 flex min-w-0 flex-col gap-6 border-0 p-0">
          <CourseGeneralSection values={values} errors={errors} categories={categories} onChange={updateValue} />
          <CoursePresentationSection
            values={values}
            statusOptions={statusOptions}
            onStatusChange={(status) => {
              const offered = statusOptions.some((option) => option.value === status && option.value !== 'all' && !option.disabled);
              if (!submittingRef.current && offered) updateValue('statusValue', status);
            }}
            onRequirementChange={(requirement) => updateValue('requirement', requirement)}
            onLevelChange={(level) => updateValue('level', level)}
          />
          <CourseProgramSection
            chapters={values.chapters}
            linkErrors={errors.links}
            onAddChapter={() => updateChapters((chapters) => [...chapters, createEmptyCourseChapter()])}
            onChapterChange={(chapterId, patch) => updateChapters((chapters) => patchChapter(chapters, chapterId, patch))}
            onChapterRemove={(chapter, index) => setChapterToRemove({ chapter, index })}
            onAddContent={(chapter) => updateChapters((chapters) => patchChapter(chapters, chapter.id, { contents: [...chapter.contents, createEmptyCourseContent()] }))}
            onContentChange={(chapterId, contentId, patch) => updateChapters((chapters) => patchContent(chapters, chapterId, contentId, patch))}
            onContentRemove={(chapterId, contentId) => updateChapters((chapters) => removeContent(chapters, chapterId, contentId))}
          />
        </fieldset>
      </form>
      <ConfirmModal
        open={chapterToRemove !== null}
        title="Supprimer ce chapitre ?"
        message={chapterToRemove ? `Le chapitre ${chapterToRemove.index + 1}${chapterToRemove.chapter.title.trim() ? ` « ${chapterToRemove.chapter.title.trim()} »` : ''} et ses ressources seront retirés de la formation.` : ''}
        confirmLabel="Supprimer"
        destructive
        role="alertdialog"
        initialFocus="cancel"
        onCancel={() => setChapterToRemove(null)}
        onConfirm={() => {
          if (chapterToRemove) updateChapters((chapters) => removeChapter(chapters, chapterToRemove.chapter.id));
          setChapterToRemove(null);
          onChapterRemoved?.();
        }}
      />
    </Modal>
  );
};
