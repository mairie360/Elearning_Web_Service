import React from 'react';
import { CircleCheckBig, Clock3, Hourglass, TriangleAlert } from 'lucide-react';
import { Overline } from '@mairie360/lib-components/primitives';

import { TrainingTimeDrawer } from './components/TrainingTimeDrawer';
import { IndicatorCard } from '../IndicatorCard';
import { formatDurationSeconds, type LearnerMetrics as Metrics } from '../../catalog-model';
import type { ElearningLearnerActionResult } from '../../course-types';
import type { ElearningTrainingTime } from './training-time-model';

export * from './training-time-model';

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
  /** `GET /elearning/training-time` of the current year; absent while loading or unavailable. */
  trainingTime?: ElearningTrainingTime;
  trainingTimeState?: 'default' | 'loading' | 'unavailable';
  onTrainingTimeRetry?: () => void;
  onDownloadCertificates?: () => ElearningLearnerActionResult;
}

const NONE: MetricFilter = { status: 'all', requirement: 'all' };

/** « 4 h 30 », else a dash while the training time is not known. */
const timeValue = (trainingTime: ElearningTrainingTime | undefined, state: string) =>
  trainingTime ? formatDurationSeconds(trainingTime.timeSpentSeconds) : state === 'loading' ? '…' : '—';

/**
 * MAIR-882 / MAIR-1144: « Mon suivi », the agent's own indicators. The first three filter the list in place
 * (MAIR-1140); the training time opens « Mon temps de formation » in a Drawer. Each card names where it leads.
 */
export const LearnerMetrics = ({
  metrics, active, onSelect, trainingTime, trainingTimeState = 'loading', onTrainingTimeRetry, onDownloadCertificates,
}: LearnerMetricsProps) => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const cards = [
    {
      label: 'Formations en cours', value: metrics.inProgress, icon: Clock3, linkLabel: 'Voir mes formations en cours',
      caption: metrics.inProgress ? 'reprenez là où vous vous êtes arrêté' : 'aucune formation commencée',
      filter: { status: 'in-progress', requirement: 'all' },
    },
    {
      label: 'Obligatoires à terminer', value: metrics.mandatoryToFinish, icon: TriangleAlert, linkLabel: 'Voir les obligatoires',
      caption: metrics.nextDeadline ? `Prochaine échéance : ${metrics.nextDeadline}` : 'aucune échéance à venir',
      filter: { status: 'to-finish', requirement: 'mandatory' },
    },
    {
      label: `Terminées en ${metrics.year}`, value: metrics.completedInYear, icon: CircleCheckBig, linkLabel: 'Voir mes formations terminées',
      caption: undefined, filter: { status: 'completed', requirement: 'all' },
    },
  ];
  const goal = trainingTime ? `objectif annuel : ${formatDurationSeconds(trainingTime.goalMinutes * 60)}` : trainingTimeState === 'unavailable' ? 'temporairement indisponible' : undefined;
  const goalShare = trainingTime && trainingTime.goalMinutes > 0 ? (100 * trainingTime.timeSpentSeconds) / (trainingTime.goalMinutes * 60) : undefined;
  return (
    <section aria-labelledby="elearning-learner-metrics" className="flex flex-col gap-3">
      <Overline as="h2" id="elearning-learner-metrics">Mon suivi</Overline>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => {
          const pressed = card.filter.status === active.status && card.filter.requirement === active.requirement;
          return (
            <IndicatorCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              caption={card.caption}
              linkLabel={card.linkLabel}
              active={pressed}
              onClick={() => onSelect(pressed ? NONE : card.filter)}
            />
          );
        })}
        <IndicatorCard
          label={`Temps de formation en ${metrics.year}`}
          value={timeValue(trainingTime, trainingTimeState)}
          icon={Hourglass}
          caption={goal}
          gauge={goalShare}
          linkLabel="Voir mon historique"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
        />
      </div>
      <TrainingTimeDrawer
        open={drawerOpen}
        year={metrics.year}
        trainingTime={trainingTime}
        state={trainingTimeState}
        onClose={() => setDrawerOpen(false)}
        onRetry={onTrainingTimeRetry}
        onDownloadCertificates={onDownloadCertificates}
      />
    </section>
  );
};
