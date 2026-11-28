import React from 'react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { BodySmall, Caption, Icon, IconChip, Metric } from '@mairie360/lib-components/primitives';

export interface IndicatorCardProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'value'> {
  label: string;
  /** Already formatted value (« 12 », « 79,2 % », « 2 h 15 »). */
  value: React.ReactNode;
  icon: LucideIcon;
  caption?: React.ReactNode;
  /** 0–100: a gauge under the caption (the value already says it, so the gauge is decorative). */
  gauge?: number;
  /** The action the card leads to, shown as a link under it (« Voir la liste »). */
  linkLabel: string;
  /** A value that needs attention (overdue mandatory courses) is shown in the danger colour. */
  alert?: boolean;
  /** A card applying a filter is a toggle: `aria-pressed` follows it. */
  active?: boolean;
}

/**
 * A clickable indicator as the artifact draws it: label in plain case, module icon chip, value, caption, an optional
 * gauge and the link to the detail. The lib MetricCard has no link line, gauge or alert value and writes its label as
 * an overline, hence this composition of lib primitives.
 */
export const IndicatorCard = ({ label, value, icon, caption, gauge, linkLabel, alert = false, active, className = '', ...props }: IndicatorCardProps) => {
  const percent = gauge === undefined ? undefined : Math.round(Math.min(100, Math.max(0, gauge)));
  return (
    <button
      type="button"
      aria-pressed={active}
      data-alert={alert || undefined}
      className={[
        'flex h-full min-h-11 w-full cursor-pointer flex-col gap-2 rounded-[var(--mairie-radius-l)] border p-4 text-left text-[var(--mairie-text)] shadow-[var(--mairie-shadow)] transition',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mairie-accent)] hover:shadow-md',
        active ? 'border-[var(--mairie-accent)] bg-[var(--mairie-accent-surface)]' : 'border-[var(--mairie-border)] bg-[var(--mairie-surface)] hover:border-[var(--mairie-control-border)]',
        className,
      ].join(' ').trim()}
      {...props}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <BodySmall as="span" tone="muted">{label}</BodySmall>
        {/* MAIR-1257 (artifact `.metric .accent`): 28 px chip. */}
        <IconChip icon={icon} tone="module" color="training" size="s" />
      </span>
      <Metric as="span" tone={alert ? 'danger' : 'default'}>{value}</Metric>
      {caption ? <Caption as="span" tone="muted">{caption}</Caption> : null}
      {percent !== undefined ? (
        <span aria-hidden="true" data-gauge={percent} className="block h-1.5 w-full overflow-hidden rounded-full bg-[var(--mairie-surface-raised)]">
          <span className="block h-full rounded-full bg-[var(--mairie-action-background)]" style={{ width: `${percent}%` }} />
        </span>
      ) : null}
      <span className="mt-auto inline-flex items-center gap-1 pt-1.5 text-[13px] font-medium text-[var(--mairie-accent)]">
        {linkLabel}
        <Icon icon={ArrowRight} size="xs" />
      </span>
    </button>
  );
};
