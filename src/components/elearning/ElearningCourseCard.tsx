import React from 'react';
import { BookOpen, Clock3, Play, Star, Users } from 'lucide-react';

import { joinClasses } from './style';
import { ElearningBadge, type ElearningBadgeVariant } from './ElearningBadge';

export interface ElearningCourseBadge {
  label: string;
  variant?: ElearningBadgeVariant;
}

export interface ElearningCourseCardProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  description: string;
  instructor?: string;
  rating?: number | string;
  duration?: string;
  chapters?: number | string;
  learners?: number | string;
  titleBadge?: ElearningCourseBadge;
  levelBadge?: ElearningCourseBadge;
  statusBadge?: ElearningCourseBadge;
  progress?: number;
  deadline?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}

const clampProgress = (value: number) => Math.min(100, Math.max(0, value));

const getProgressActionLabel = (progress: number | undefined, fallbackLabel: string) => {
  if (progress === undefined) return fallbackLabel;
  if (progress >= 100) return 'Revoir';
  if (progress > 0) return 'Continuer';

  return 'Commencer';
};

export const ElearningCourseCard = ({
  title,
  description,
  instructor,
  rating,
  duration,
  chapters,
  learners,
  titleBadge,
  levelBadge,
  statusBadge,
  progress,
  deadline,
  actionLabel = 'Continuer',
  onAction,
  actionDisabled = false,
  className = '',
  ...props
}: ElearningCourseCardProps) => {
  const normalizedProgress = typeof progress === 'number' ? clampProgress(progress) : undefined;
  const displayedActionLabel = getProgressActionLabel(normalizedProgress, actionLabel);
  const posterClassName = 'flex aspect-video w-full items-center justify-center rounded-md bg-[var(--mairie-surface-raised)]';
  const posterIcon = <Play aria-hidden="true" className="size-12 text-[var(--mairie-teal-text)]" strokeWidth={2.2} />;

  return (
    <article
      className={joinClasses(
        'flex h-full flex-col rounded-lg border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-6 text-[var(--mairie-text)] shadow-sm',
        className
      )}
      {...props}
    >
      {onAction ? (
        <button
          type="button"
          aria-label={`Ouvrir la formation ${title}`}
          onClick={onAction}
          disabled={actionDisabled}
          className={joinClasses(
            posterClassName,
            'cursor-pointer transition-colors hover:bg-[var(--mairie-surface-raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mairie-accent)]'
          )}
        >
          {posterIcon}
        </button>
      ) : (
        <div className={posterClassName}>{posterIcon}</div>
      )}

      <div className="mt-4 flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-base font-semibold leading-6 text-[var(--mairie-text)]">{title}</h3>
        {titleBadge && (
          <ElearningBadge
            label={titleBadge.label}
            variant={titleBadge.variant ?? 'mandatory'}
            className="mt-0.5 shrink-0"
          />
        )}
      </div>

      <p className="mt-3 min-h-12 text-sm leading-5 text-[var(--mairie-muted)]">{description}</p>

      <div className="mt-5 flex items-center justify-between gap-4 text-sm text-[var(--mairie-muted)]">
        {instructor ? <span className="truncate">Par {instructor}</span> : <span aria-hidden="true" />}
        {rating !== undefined && (
          <span className="flex shrink-0 items-center gap-1 text-[var(--mairie-text)]">
            <Star aria-hidden="true" className="size-4 fill-[var(--mairie-rating-active)] text-[var(--mairie-rating-active)]" />
            {rating}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-[var(--mairie-muted)]">
        {duration && (
          <span className="flex min-w-0 items-center gap-1.5">
            <Clock3 aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">{duration}</span>
          </span>
        )}
        {chapters !== undefined && (
          <span className="flex min-w-0 items-center gap-1.5">
            <BookOpen aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">{chapters} chapitres</span>
          </span>
        )}
        {learners !== undefined && (
          <span className="flex min-w-0 items-center justify-end gap-1.5">
            <Users aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">{learners}</span>
          </span>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        {levelBadge ? (
          <ElearningBadge label={levelBadge.label} variant={levelBadge.variant ?? 'default'} />
        ) : (
          <span aria-hidden="true" />
        )}
        {statusBadge && <ElearningBadge label={statusBadge.label} variant={statusBadge.variant ?? 'inProgress'} />}
      </div>

      {normalizedProgress !== undefined && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-sm text-[var(--mairie-text)]">
            <span>Progression</span>
            <span>{normalizedProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--mairie-surface-raised)]">
            <div
              className="h-full rounded-full bg-[var(--mairie-action-background)] transition-[width]"
              style={{ width: `${normalizedProgress}%` }}
            />
          </div>
        </div>
      )}

      {deadline && <p className="mt-4 text-sm text-[var(--mairie-error-text)]">Échéance : {deadline}</p>}

      <button
        type="button"
        onClick={onAction}
        disabled={actionDisabled}
        className="mt-4 h-9 w-full rounded-md bg-[var(--mairie-action-background)] px-4 text-sm font-semibold text-[var(--mairie-on-action)] transition hover:bg-[var(--mairie-action-hover-background)] focus:outline-none focus:ring-2 focus:ring-[var(--mairie-accent)]/30"
      >
        {displayedActionLabel}
      </button>
    </article>
  );
};
