import { Field } from '@mairie360/lib-components/primitives';

export interface TextAreaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

/** Multi-line text under the lib Field label (the lib has no text area preset). */
export const TextAreaField = ({ id, label, value, onChange, placeholder, required, className }: TextAreaFieldProps) => (
  <Field htmlFor={id} label={label} required={required} className={className}>
    <textarea
      id={id}
      className="min-h-24 w-full resize-y rounded-md border border-[var(--mairie-control-border)] bg-[var(--mairie-surface)] px-3 py-2 text-sm text-[var(--mairie-text)] outline-none transition placeholder:text-[var(--mairie-muted)] focus:border-[var(--mairie-accent)] focus:ring-2 focus:ring-[var(--mairie-accent)]/20"
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      required={required}
      value={value}
    />
  </Field>
);
