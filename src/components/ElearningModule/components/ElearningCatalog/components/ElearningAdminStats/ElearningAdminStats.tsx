import React from 'react';
import { BookOpenCheck, ChartNoAxesCombined, Clock3, Sparkles, Users } from 'lucide-react';
import { Panel, RefreshButton } from '@mairie360/lib-components/primitives';

import { IndicatorCard } from '../IndicatorCard';

import { CompletionDrawer } from './components/CompletionDrawer';
import { LateAgentsDrawer } from './components/LateAgentsDrawer';
import { ParticipationDrawer } from './components/ParticipationDrawer';
import { formatPercent, participantsLabel, updatedAtLabel, type ElearningAdminStatsData, type ElearningLateAgent } from './admin-stats-model';
import type { ElearningLearnerActionResult } from '../../course-types';

export * from './admin-stats-model';

export interface ElearningAdminStatsProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** `GET /elearning/admin/stats`; absent while loading or when the read failed. */
  stats?: ElearningAdminStatsData;
  /** `loading` while « Actualiser » runs, `unavailable` when the last read failed (the courses stay readable). */
  state?: 'default' | 'loading' | 'unavailable';
  onRefresh?: () => void;
  /** « Origine » filter of the catalogue: the internal / platform indicators set it in place. */
  source?: string;
  onSourceChange?: (source: string) => void;
  onRemind?: (agents: ElearningLateAgent[]) => ElearningLearnerActionResult;
}

type DrawerName = 'participation' | 'completion' | 'late';

/**
 * MAIR-887 / MAIR-1150: the indicators of the instance on the lib Panel, with « Actualiser » and the time of the last
 * read. The origin indicators filter the list in place; participation, completion and late agents open their detail
 * in a Drawer. Each card names where it leads under its figures.
 */
export const ElearningAdminStats = ({ stats, state = 'default', onRefresh, source = 'all', onSourceChange, onRemind, className = '', ...props }: ElearningAdminStatsProps) => {
  const [drawer, setDrawer] = React.useState<DrawerName | null>(null);
  const shown = stats && state !== 'unavailable' ? state : state === 'default' ? 'loading' : state;
  const toggleSource = (value: string) => onSourceChange?.(source === value ? 'all' : value);
  const mandatory = stats?.mandatoryInternalCourses ?? 0;
  // The BFF gives no timestamp: the indicators are as fresh as their last successful read.
  const updatedAt = React.useMemo(() => (stats ? new Date() : undefined), [stats]);

  return (
    <Panel
      title="Indicateurs de la commune"
      description={`Toutes formations et tous agents confondus${updatedAt ? ` · ${updatedAtLabel(updatedAt)}` : '.'}`}
      state={shown}
      stateProps={shown === 'unavailable' ? { title: 'Indicateurs temporairement indisponibles.', onRetry: onRefresh } : undefined}
      action={onRefresh ? <RefreshButton size="s" label="Actualiser" loading={state === 'loading'} onClick={onRefresh} /> : undefined}
      className={className}
      {...props}
    >
      {stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <IndicatorCard label="Formations internes" value={stats.internalCourses} icon={BookOpenCheck}
              caption={`créées par la commune · dont ${mandatory} obligatoire${mandatory > 1 ? 's' : ''}`} linkLabel="Voir la liste"
              active={source === 'internal'} onClick={onSourceChange ? () => toggleSource('internal') : undefined} />
            <IndicatorCard label="Formations de l’outil" value={stats.platformCourses} icon={Sparkles}
              caption="fournies par Mairie360, à jour avec l’outil" linkLabel="Voir la liste"
              active={source === 'platform'} onClick={onSourceChange ? () => toggleSource('platform') : undefined} />
            <IndicatorCard label="Taux de participation" value={formatPercent(stats.participationRate)} icon={Users}
              caption={participantsLabel(stats.participants, stats.agents)} gauge={stats.participationRate} linkLabel="Détail par service"
              aria-haspopup="dialog" onClick={() => setDrawer('participation')} />
            <IndicatorCard label="Complétion moyenne" value={formatPercent(stats.averageCompletion)} icon={ChartNoAxesCombined}
              caption="toutes formations confondues" gauge={stats.averageCompletion} linkLabel="Détail par formation"
              aria-haspopup="dialog" onClick={() => setDrawer('completion')} />
            {/* MAIR-1257: `lateMandatory` counts overdue enrolments (an agent can have several), so the caption names enrolments. */}
            <IndicatorCard label="Obligatoires en retard" value={stats.lateMandatory} icon={Clock3}
              caption="inscriptions ayant dépassé leur échéance" alert={stats.lateMandatory > 0} linkLabel="Voir les agents"
              aria-haspopup="dialog" onClick={() => setDrawer('late')} />
          </div>
          <ParticipationDrawer open={drawer === 'participation'} services={stats.byService} participationRate={stats.participationRate} onClose={() => setDrawer(null)} />
          <CompletionDrawer open={drawer === 'completion'} courses={stats.byCourse} averageCompletion={stats.averageCompletion} onClose={() => setDrawer(null)} />
          <LateAgentsDrawer open={drawer === 'late'} agents={stats.lateAgents} onClose={() => setDrawer(null)} onRemind={onRemind} />
        </>
      ) : null}
    </Panel>
  );
};
