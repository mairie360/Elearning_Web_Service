import React from 'react';
import { BookOpenCheck, ChartNoAxesCombined, Clock3, Sparkles, Users } from 'lucide-react';
import { MetricCard, Panel, RefreshButton } from '@mairie360/lib-components/primitives';

import { CompletionDrawer } from './components/CompletionDrawer';
import { LateAgentsDrawer } from './components/LateAgentsDrawer';
import { ParticipationDrawer } from './components/ParticipationDrawer';
import { agentsLabel, formatPercent, type ElearningAdminStatsData, type ElearningLateAgent } from './admin-stats-model';
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
 * MAIR-887 / MAIR-1150: the indicators of the instance on the lib Panel, with « Actualiser ». The origin indicators
 * filter the list in place; participation, completion and late agents open their detail in a Drawer.
 */
export const ElearningAdminStats = ({ stats, state = 'default', onRefresh, source = 'all', onSourceChange, onRemind, className = '', ...props }: ElearningAdminStatsProps) => {
  const [drawer, setDrawer] = React.useState<DrawerName | null>(null);
  const shown = stats && state !== 'unavailable' ? state : state === 'default' ? 'loading' : state;
  const toggleSource = (value: string) => onSourceChange?.(source === value ? 'all' : value);
  const mandatory = stats?.mandatoryInternalCourses ?? 0;

  return (
    <Panel
      title="Indicateurs du centre de formation"
      description="Formations, participation des agents et échéances obligatoires de la commune."
      state={shown}
      stateProps={shown === 'unavailable' ? { title: 'Indicateurs temporairement indisponibles.', onRetry: onRefresh } : undefined}
      action={onRefresh ? <RefreshButton size="s" label="Actualiser" loading={state === 'loading'} onClick={onRefresh} /> : undefined}
      className={className}
      {...props}
    >
      {stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Formations internes" value={stats.internalCourses} icon={BookOpenCheck} size="m" trend="none"
              trendLabel={`créées par la commune · ${mandatory} obligatoire${mandatory > 1 ? 's' : ''}`}
              active={source === 'internal'} onClick={onSourceChange ? () => toggleSource('internal') : undefined} className="h-full" />
            <MetricCard label="Formations de l’outil" value={stats.platformCourses} icon={Sparkles} size="m" trend="none"
              trendLabel="fournies par Mairie360"
              active={source === 'platform'} onClick={onSourceChange ? () => toggleSource('platform') : undefined} className="h-full" />
            <MetricCard label="Taux de participation" value={formatPercent(stats.participationRate)} icon={Users} size="m" trend="none"
              trendLabel={`${stats.participants} sur ${agentsLabel(stats.agents)}`} onClick={() => setDrawer('participation')} className="h-full" />
            <MetricCard label="Complétion moyenne" value={formatPercent(stats.averageCompletion)} icon={ChartNoAxesCombined} size="m" trend="none"
              trendLabel="toutes formations confondues" onClick={() => setDrawer('completion')} className="h-full" />
            <MetricCard label="Obligatoires en retard" value={stats.lateMandatory} icon={Clock3} size="m" trend="none"
              trendLabel={`${agentsLabel(stats.lateAgents.length)} à relancer`} onClick={() => setDrawer('late')} className="h-full" />
          </div>
          <ParticipationDrawer open={drawer === 'participation'} services={stats.byService} participationRate={stats.participationRate} onClose={() => setDrawer(null)} />
          <CompletionDrawer open={drawer === 'completion'} courses={stats.byCourse} averageCompletion={stats.averageCompletion} onClose={() => setDrawer(null)} />
          <LateAgentsDrawer open={drawer === 'late'} agents={stats.lateAgents} onClose={() => setDrawer(null)} onRemind={onRemind} />
        </>
      ) : null}
    </Panel>
  );
};
