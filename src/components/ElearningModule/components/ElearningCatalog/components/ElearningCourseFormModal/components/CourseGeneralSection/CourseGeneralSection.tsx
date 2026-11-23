import { FormSection, SelectField, TextArea, TextField } from '@mairie360/lib-components/primitives';

import type { CourseFormErrors, ElearningCourseFormValues } from '../../course-form-values';

export interface CourseGeneralSectionProps {
  values: ElearningCourseFormValues;
  errors: CourseFormErrors;
  /** Categories of the catalogue (MAIR-932 C2); without any, the category is typed. */
  categories: string[];
  onChange: <Key extends keyof ElearningCourseFormValues>(key: Key, value: ElearningCourseFormValues[Key]) => void;
}

/** MAIR-932: « Informations générales » on the lib FormSection, with the error of each required field under it. */
export const CourseGeneralSection = ({ values, errors, categories, onChange }: CourseGeneralSectionProps) => {
  const categoryOptions = [...new Set([...categories, values.category].filter(Boolean))].map(value => ({ value, label: value }));
  return (
    <FormSection title="Informations générales" description="Titre, présentation et repères de la formation.">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="elearning-course-title" label="Titre" placeholder="Accueil des nouveaux agents" required error={errors.title} value={values.title} onChange={(event) => onChange('title', event.target.value)} />
        <TextField id="elearning-course-subtitle" label="Sous-titre" placeholder="Parcours d’intégration" value={values.subtitle} onChange={(event) => onChange('subtitle', event.target.value)} />
        <TextArea id="elearning-course-description" className="sm:col-span-2" label="Description" placeholder="Objectifs, public concerné et contenu de la formation" required error={errors.description} value={values.description} onChange={(event) => onChange('description', event.target.value)} />
        {categoryOptions.length ? (
          <SelectField id="elearning-course-category" label="Catégorie" placeholder="Choisir une catégorie" options={categoryOptions} value={values.category} onChange={(value) => onChange('category', value)} />
        ) : (
          <TextField id="elearning-course-category" label="Catégorie" placeholder="Sécurité, RH, Administration..." value={values.category} onChange={(event) => onChange('category', event.target.value)} />
        )}
        <TextField id="elearning-course-instructor" label="Instructeur" placeholder="Direction ou nom du formateur" value={values.instructor} onChange={(event) => onChange('instructor', event.target.value)} />
        <TextField id="elearning-course-duration" label="Durée totale" placeholder="2 h 30" required error={errors.duration} value={values.duration} onChange={(event) => onChange('duration', event.target.value)} />
        <TextField id="elearning-course-deadline" label="Échéance" placeholder="30 juin 2026" value={values.deadline} onChange={(event) => onChange('deadline', event.target.value)} />
      </div>
    </FormSection>
  );
};
