import { BookOpen, CircleCheckBig, Clock3, TriangleAlert } from 'lucide-react';
import { MetricCard, Overline } from '@mairie360/lib-components/primitives';

import type { LearnerMetrics as Metrics } from '../../catalog-model';

/** A filter a metric applies when clicked (MAIR-1144); clicking the active metric removes it. */
export interface MetricFilter {
  status: string;
  requirement: string;
}

export interface LearnerMetricsProps {
  metrics: Metrics;
  /** Filters currently applied: the metric they match is shown active. */
  active: MetricFilter;
  onSelect: (filter: MetricFilter) => void;
}

const NONE: MetricFilter = { status: 'all', requirement: 'all' };

/**
 * MAIR-882 / MAIR-1144: « Mon suivi », the agent's own indicators on the lib MetricCard. Each one filters the list
 * in place. The lib MetricCard is not clickable yet (MAIR-1140): a full-size button lies over it, named after the
 * metric and pressed while its filter is applied.
 */
export const LearnerMetrics = ({ metrics, active, onSelect }: LearnerMetricsProps) => {
  const cards = [
    { label: 'Formations en cours', value: metrics.inProgress, icon: Clock3, filter: { status: 'in-progress', requirement: 'all' } },
    {
      label: 'Obligatoires à terminer', value: metrics.mandatoryToFinish, icon: TriangleAlert,
      trendLabel: metrics.nextDeadline ? `Prochaine échéance : ${metrics.nextDeadline}` : undefined,
      filter: { status: 'to-finish', requirement: 'mandatory' },
    },
    { label: 'Formations terminées', value: metrics.completed, icon: CircleCheckBig, filter: { status: 'completed', requirement: 'all' } },
    { label: 'Formations disponibles', value: metrics.available, icon: BookOpen, filter: NONE },
  ];
  return (
    <section aria-labelledby="elearning-learner-metrics" className="flex flex-col gap-3">
      <Overline as="h2" id="elearning-learner-metrics">Mon suivi</Overline>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => {
          const pressed = card.filter !== NONE && card.filter.status === active.status && card.filter.requirement === active.requirement;
          return (
            <div key={card.label} className={`relative rounded-[var(--mairie-radius-l)] ${pressed ? 'outline outline-2 outline-offset-2 outline-[var(--mairie-accent)]' : ''}`}>
              <MetricCard label={card.label} value={card.value} icon={card.icon} size="m" trend="none" trendLabel={card.trendLabel} className="h-full" />
              <button
                type="button"
                aria-pressed={pressed}
                aria-label={`${card.label} : ${card.value}. ${pressed ? 'Retirer le filtre' : 'Afficher ces formations'}`}
                className="absolute inset-0 cursor-pointer rounded-[inherit] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mairie-accent)]"
                onClick={() => onSelect(pressed ? NONE : card.filter)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};
