import React from 'react';
import { CircleCheck, Star } from 'lucide-react';

import { joinClasses } from '@/components/ElearningModule/components/ElearningCatalog/elearning-style';

export type ElearningLearnerActionResult = void | boolean | Promise<void | boolean>;

export interface ElearningCourseRatingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  initialValue?: number;
  max?: number;
  submitted?: boolean;
  confirmOnSubmit?: boolean;
  allowEditingSubmitted?: boolean;
  disabled?: boolean;
  title?: string;
  helperText?: string;
  submitLabel?: string;
  submittedLabel?: string;
  onValueChange?: (rating: number) => void;
  onSubmit?: (rating: number) => ElearningLearnerActionResult;
}

const clampRating = (value: number | undefined, max: number) => {
  if (value === undefined || Number.isNaN(value)) return undefined;

  return Math.min(max, Math.max(1, Math.round(value)));
};

export const ElearningCourseRating = ({
  initialValue,
  max = 5,
  submitted = false,
  confirmOnSubmit = true,
  allowEditingSubmitted = false,
  disabled = false,
  title = 'Noter cette formation',
  helperText = 'Votre retour aide à améliorer les prochaines sessions.',
  submitLabel = 'Envoyer la note',
  submittedLabel = 'Merci, votre note a bien été enregistrée.',
  onValueChange,
  onSubmit,
  className = '',
  ...props
}: ElearningCourseRatingProps) => {
  const safeMax = Math.max(1, Math.floor(max));
  const [value, setValue] = React.useState(() => clampRating(initialValue, safeMax));
  const [hoveredValue, setHoveredValue] = React.useState<number | undefined>();
  const [hasSubmitted, setHasSubmitted] = React.useState(submitted);
  const [editing, setEditing] = React.useState(false);
  const [confirmedValue, setConfirmedValue] = React.useState(() => clampRating(initialValue, safeMax));
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const pending = React.useRef(false);
  const displayValue = hoveredValue ?? value ?? 0;
  const isEditing = allowEditingSubmitted && editing;
  const isLocked = disabled || (hasSubmitted && !isEditing) || submitting;

  React.useEffect(() => {
    setValue(clampRating(initialValue, safeMax));
    setConfirmedValue(clampRating(initialValue, safeMax));
  }, [initialValue, safeMax]);

  React.useEffect(() => {
    setHasSubmitted(submitted);
  }, [submitted]);

  const handleSelect = (rating: number) => {
    if (isLocked) return;

    setValue(rating);
    onValueChange?.(rating);
  };

  const handleSubmit = async () => {
    if (!value || isLocked || pending.current) return;
    pending.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const result = onSubmit?.(value);
      const confirmed = result && typeof result === 'object' ? await result : result;
      if (confirmed === false) {
        setError('La note n’a pas été enregistrée. Votre sélection est conservée ; réessayez.');
      } else if (confirmOnSubmit || confirmed === true) {
        setHasSubmitted(true);
        setConfirmedValue(value);
        setEditing(false);
      }
    } catch {
      setError('La note n’a pas été enregistrée. Votre sélection est conservée ; réessayez.');
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  };

  return (
    <section
      className={joinClasses('rounded-lg border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-4 text-[var(--mairie-text)]', className)}
      {...props}
      aria-busy={submitting}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold leading-5 text-[var(--mairie-text)]">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--mairie-muted)]">{isEditing
            ? 'Choisissez une nouvelle note puis confirmez.'
            : hasSubmitted ? submittedLabel : helperText}</p>
        </div>
        {hasSubmitted && !isEditing && <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--mairie-success-text)]" />}
      </div>

      <div
        className="mt-3 grid grid-cols-5 gap-1"
        onMouseLeave={() => setHoveredValue(undefined)}
        aria-label="Note de la formation"
      >
        {Array.from({ length: safeMax }, (_, index) => {
          const rating = index + 1;
          const selected = rating <= displayValue;

          return (
            <button
              key={rating}
              type="button"
              aria-label={`Donner la note ${rating} sur ${safeMax}`}
              aria-pressed={value === rating}
              disabled={isLocked}
              onClick={() => handleSelect(rating)}
              onMouseEnter={() => {
                if (!isLocked) setHoveredValue(rating);
              }}
              className="flex h-9 items-center justify-center rounded-md text-[var(--mairie-muted)] transition hover:bg-[var(--mairie-warning-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--mairie-accent)]/40 disabled:cursor-default disabled:hover:bg-transparent"
            >
              <Star
                aria-hidden="true"
                className={joinClasses('size-5', selected ? 'fill-[var(--mairie-rating-active)] text-[var(--mairie-rating-active)]' : 'text-[var(--mairie-muted)]')}
              />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!value || isLocked}
        onClick={handleSubmit}
        className="mt-3 h-9 w-full rounded-md bg-[var(--mairie-action-background)] px-3 text-sm font-semibold text-[var(--mairie-on-action)] transition hover:bg-[var(--mairie-action-hover-background)] focus:outline-none focus:ring-2 focus:ring-[var(--mairie-accent)]/30 disabled:cursor-not-allowed disabled:bg-[var(--mairie-rating-inactive)]"
      >
        {submitting ? 'Enregistrement…' : isEditing ? 'Enregistrer ma note' : hasSubmitted ? 'Note envoyée' : submitLabel}
      </button>
      {allowEditingSubmitted && hasSubmitted ? (
        <button
          type="button"
          disabled={disabled || submitting}
          onClick={() => {
            setError(null);
            setHoveredValue(undefined);
            if (isEditing) setValue(confirmedValue);
            setEditing(!isEditing);
          }}
          className="mt-2 min-h-9 w-full rounded-md border border-[var(--mairie-accent)] px-3 py-2 text-sm font-semibold text-[var(--mairie-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--mairie-accent)]/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isEditing ? 'Annuler la modification' : 'Modifier ma note'}
        </button>
      ) : null}
      {error ? <p role="alert" className="mt-3 text-sm text-[var(--mairie-error-text)]">{error}</p> : null}
    </section>
  );
};
