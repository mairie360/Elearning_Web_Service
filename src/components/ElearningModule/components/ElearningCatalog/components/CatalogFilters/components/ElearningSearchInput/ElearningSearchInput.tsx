import React from 'react';
import { Search } from 'lucide-react';

import { joinClasses } from '@/components/ElearningModule/components/ElearningCatalog/elearning-style';

export interface ElearningSearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'defaultValue' | 'onChange' | 'type' | 'value'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export const ElearningSearchInput = ({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  placeholder = 'Rechercher une formation...',
  className = '',
  ...props
}: ElearningSearchInputProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const value = controlledValue ?? internalValue;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (controlledValue === undefined) {
      setInternalValue(event.target.value);
    }

    onValueChange?.(event.target.value);
  };

  return (
    <div className={joinClasses('relative w-full', className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--mairie-muted)]"
      />
      <input
        aria-label="Rechercher une formation"
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-[var(--mairie-border)] bg-[var(--mairie-surface)] px-10 text-sm text-[var(--mairie-text)] outline-none transition focus:border-[var(--mairie-accent)] focus:ring-2 focus:ring-[var(--mairie-accent)]/20"
        {...props}
      />
    </div>
  );
};
