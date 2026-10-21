import React from 'react';

import { joinClasses } from './style';

export type ElearningBadgeVariant =
  | 'default'
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'inProgress'
  | 'completed'
  | 'mandatory'
  | 'notStarted';

export interface ElearningBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  variant?: ElearningBadgeVariant;
}

const badgeClasses: Record<ElearningBadgeVariant, string> = {
  default: 'border-[var(--mairie-border)] bg-[var(--mairie-surface)] text-[var(--mairie-text)]',
  beginner: 'border-[var(--mairie-success-text)] bg-[var(--mairie-surface)] text-[var(--mairie-success-text)]',
  intermediate: 'border-[var(--mairie-warning-text)] bg-[var(--mairie-surface)] text-[var(--mairie-warning-text)]',
  advanced: 'border-[var(--mairie-error-text)] bg-[var(--mairie-surface)] text-[var(--mairie-error-text)]',
  inProgress: 'border-[var(--mairie-accent)] bg-[var(--mairie-success-action-background)] text-[var(--mairie-on-action)]',
  completed: 'border-[var(--mairie-success-text)] bg-[var(--mairie-success-action-background)] text-[var(--mairie-on-action)]',
  mandatory: 'border-[var(--mairie-error-text)] bg-[var(--mairie-error-action-background)] text-[var(--mairie-on-action)]',
  notStarted: 'border-[var(--mairie-border)] bg-[var(--mairie-surface-raised)] text-[var(--mairie-muted)]',
};

export const ElearningBadge = ({
  label,
  variant = 'default',
  className = '',
  ...props
}: ElearningBadgeProps) => (
  <span
    className={joinClasses(
      'inline-flex h-[22px] items-center rounded-md border px-2 text-xs font-semibold leading-none',
      badgeClasses[variant],
      className
    )}
    {...props}
  >
    {label}
  </span>
);
