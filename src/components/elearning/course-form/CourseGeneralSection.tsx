import { TextField } from '@mairie360/lib-components/primitives';

import type { ElearningCourseFormValues } from './course-form-values';
import { TextAreaField } from './TextAreaField';

export interface CourseGeneralSectionProps {
  values: ElearningCourseFormValues;
  onChange: <Key extends keyof ElearningCourseFormValues>(key: Key, value: ElearningCourseFormValues[Key]) => void;
}

/** Title, subtitle, description, category, instructor, duration and deadline. */
export const CourseGeneralSection = ({ values, onChange }: CourseGeneralSectionProps) => (
  <section aria-labelledby="course-general-heading">
    <h3 id="course-general-heading" className="text-base font-bold text-[var(--mairie-text)]">Informations générales</h3>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <TextField id="elearning-course-title" label="Titre" placeholder="Accueil des nouveaux agents" required value={values.title} onChange={(event) => onChange('title', event.target.value)} />
      <TextField id="elearning-course-subtitle" label="Sous-titre" placeholder="Parcours d’intégration" value={values.subtitle} onChange={(event) => onChange('subtitle', event.target.value)} />
      <TextAreaField id="elearning-course-description" className="sm:col-span-2" label="Description" placeholder="Objectifs, public concerné et contenu de la formation" required value={values.description} onChange={(value) => onChange('description', value)} />
      <TextField id="elearning-course-category" label="Catégorie" placeholder="Sécurité, RH, Administration..." required value={values.category} onChange={(event) => onChange('category', event.target.value)} />
      <TextField id="elearning-course-instructor" label="Instructeur" placeholder="Direction ou nom du formateur" value={values.instructor} onChange={(event) => onChange('instructor', event.target.value)} />
      <TextField id="elearning-course-duration" label="Durée totale" placeholder="2 h 30" required value={values.duration} onChange={(event) => onChange('duration', event.target.value)} />
      <TextField id="elearning-course-deadline" label="Échéance" placeholder="30 juin 2026" value={values.deadline} onChange={(event) => onChange('deadline', event.target.value)} />
    </div>
  </section>
);
