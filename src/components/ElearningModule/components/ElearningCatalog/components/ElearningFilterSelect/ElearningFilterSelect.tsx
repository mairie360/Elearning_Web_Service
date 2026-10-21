import React from 'react';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';

import { joinClasses } from '../../elearning-style';

export interface ElearningFilterOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface ElearningFilterSelectProps {
  options: ElearningFilterOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  leadingIcon?: LucideIcon;
  ariaLabel?: string;
  className?: string;
  menuClassName?: string;
  defaultOpen?: boolean;
}

export const ElearningFilterSelect = ({
  options,
  value: controlledValue,
  defaultValue,
  onValueChange,
  placeholder = 'Sélectionner',
  leadingIcon: LeadingIcon,
  ariaLabel,
  className = '',
  menuClassName = '',
  defaultOpen = false,
}: ElearningFilterSelectProps) => {
  const fallbackValue = defaultValue ?? options[0]?.value ?? '';
  const [internalValue, setInternalValue] = React.useState(fallbackValue);
  const [open, setOpen] = React.useState(defaultOpen);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const listboxId = React.useId();

  const value = controlledValue ?? internalValue;
  const selectedOption = options.find((option) => option.value === value);

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const selectValue = (nextValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className={joinClasses('relative inline-block w-full', className)}>
      <button
        type="button"
        aria-label={ariaLabel ?? placeholder}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 w-full items-center gap-3 rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface)] px-3 text-left text-sm text-[var(--mairie-text)] outline-none transition hover:border-[var(--mairie-border)] focus:border-[var(--mairie-accent)] focus:ring-2 focus:ring-[var(--mairie-accent)]/20"
      >
        {LeadingIcon && <LeadingIcon aria-hidden="true" className="size-4 shrink-0 text-[var(--mairie-muted)]" />}
        <span className="min-w-0 flex-1 truncate">{selectedOption?.label ?? placeholder}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-[var(--mairie-muted)]" />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          className={joinClasses(
            'absolute left-0 top-[calc(100%+6px)] z-50 w-full overflow-hidden rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-1 text-sm text-[var(--mairie-text)] shadow-lg',
            menuClassName
          )}
        >
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={option.disabled}
                onClick={() => selectValue(option.value)}
                className={joinClasses(
                  'flex h-9 w-full items-center justify-between gap-3 rounded px-2 text-left outline-none transition',
                  selected && 'bg-[var(--mairie-surface-raised)] text-[var(--mairie-teal-text)]',
                  !selected && !option.disabled && 'hover:bg-[var(--mairie-surface-raised)]',
                  option.disabled && 'cursor-not-allowed text-[var(--mairie-muted)]'
                )}
              >
                <span className="truncate">{option.label}</span>
                {selected && <Check aria-hidden="true" className="size-4 shrink-0 text-[var(--mairie-teal-text)]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
