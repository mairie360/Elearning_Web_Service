import { SelectField } from '@mairie360/lib-components/primitives';

import type { ElearningFilterOption } from '../ElearningFilterSelect';
import {
  currentStatusLabel,
  levelOptions,
  requirementOptions,
  type ElearningCourseFormValues,
  type ElearningCourseLevel,
  type ElearningCourseRequirement,
} from './course-form-values';

export interface CoursePresentationSectionProps {
  values: ElearningCourseFormValues;
  statusOptions: ElearningFilterOption[];
  /** Only an offered, enabled status may replace the draft one. */
  onStatusChange: (status: string) => void;
  onRequirementChange: (value: ElearningCourseRequirement) => void;
  onLevelChange: (value: ElearningCourseLevel) => void;
}

/** Author statuses without the "all" filter; a draft status outside them stays shown, disabled. */
export const authorStatusOptions = (statusOptions: ElearningFilterOption[], current: string) => {
  const options = statusOptions
    .filter((option) => option.value !== 'all')
    .map((option) => ({ value: option.value, label: option.label, disabled: option.disabled }));
  return options.some((option) => option.value === current)
    ? options
    : [{ value: current, label: currentStatusLabel(current), disabled: true }, ...options];
};

export const CoursePresentationSection = ({ values, statusOptions, onStatusChange, onRequirementChange, onLevelChange }: CoursePresentationSectionProps) => (
  <section aria-labelledby="course-presentation-heading" className="border-t border-[var(--mairie-border)] pt-5">
    <h3 id="course-presentation-heading" className="text-base font-bold text-[var(--mairie-text)]">Présentation</h3>
    <div className="mt-4 grid gap-4 sm:grid-cols-3">
      <SelectField id="elearning-course-status" label="Statut" placeholder={null} options={authorStatusOptions(statusOptions, values.statusValue)} value={values.statusValue} onChange={onStatusChange} />
      <SelectField id="elearning-course-requirement" label="Type de parcours" placeholder={null} options={requirementOptions} value={values.requirement} onChange={onRequirementChange} />
      <SelectField id="elearning-course-level" label="Niveau" placeholder={null} options={levelOptions} value={values.level} onChange={onLevelChange} />
    </div>
  </section>
);
