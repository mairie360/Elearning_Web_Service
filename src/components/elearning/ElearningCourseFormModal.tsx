import React from 'react';
import { CancelButton, Modal, SaveButton } from '@mairie360/lib-components/primitives';

import type { ElearningFilterOption } from './ElearningFilterSelect';
import { CourseGeneralSection } from './course-form/CourseGeneralSection';
import { CoursePresentationSection } from './course-form/CoursePresentationSection';
import { CourseProgramSection } from './course-form/CourseProgramSection';
import {
  createEmptyCourseChapter,
  createEmptyCourseContent,
  normalizeCourseFormValues,
  patchChapter,
  patchContent,
  removeChapter,
  removeContent,
  type ElearningCourseFormValues,
} from './course-form/course-form-values';

export type {
  ElearningCourseChapterFormValues,
  ElearningCourseFormValues,
  ElearningCourseLevel,
  ElearningCourseRequirement,
} from './course-form/course-form-values';
export { createEmptyCourseChapter, createEmptyCourseContent } from './course-form/course-form-values';

export interface ElearningCourseFormModalProps {
  isOpen: boolean;
  title: string;
  submitLabel: string;
  initialValues: ElearningCourseFormValues;
  statusOptions: ElearningFilterOption[];
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
  onCancel,
  onSubmit,
}: ElearningCourseFormModalProps) => {
  const [values, setValues] = React.useState(initialValues);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submissionError, setSubmissionError] = React.useState<string | null>(null);
  const submittingRef = React.useRef(false);
  const wasOpenRef = React.useRef(false);
  const formId = React.useId();

  React.useEffect(() => {
    // A catalogue refresh may replace initialValues while a save is pending or
    // refused. Only a newly opened form may replace the administrator's draft.
    if (isOpen && !wasOpenRef.current) {
      setValues(initialValues);
      setSubmissionError(null);
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
        {submissionError ? <p role="alert" className="mr-auto self-center text-sm text-[var(--mairie-error-text)]">{submissionError}</p> : null}
        <CancelButton onClick={close} disabled={isSubmitting} />
        <SaveButton
          type="submit"
          form={formId}
          label={isSubmitting ? 'Enregistrement…' : submitLabel}
          disabled={isSubmitting || values.chapters.length === 0}
        />
      </>}
    >
      <form id={formId} aria-busy={isSubmitting} onSubmit={handleSubmit}>
        <fieldset disabled={isSubmitting} className="m-0 min-w-0 space-y-6 border-0 p-0">
          <CourseGeneralSection values={values} onChange={updateValue} />
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
            onAddChapter={() => updateChapters((chapters) => [...chapters, createEmptyCourseChapter()])}
            onChapterChange={(chapterId, patch) => updateChapters((chapters) => patchChapter(chapters, chapterId, patch))}
            onChapterRemove={(chapterId) => updateChapters((chapters) => removeChapter(chapters, chapterId))}
            onAddContent={(chapter) => updateChapters((chapters) => patchChapter(chapters, chapter.id, { contents: [...chapter.contents, createEmptyCourseContent()] }))}
            onContentChange={(chapterId, contentId, patch) => updateChapters((chapters) => patchContent(chapters, chapterId, contentId, patch))}
            onContentRemove={(chapterId, contentId) => updateChapters((chapters) => removeContent(chapters, chapterId, contentId))}
          />
        </fieldset>
      </form>
    </Modal>
  );
};
