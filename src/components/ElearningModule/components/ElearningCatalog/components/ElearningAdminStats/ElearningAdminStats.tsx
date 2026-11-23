import React from 'react';
import { BookOpenCheck, ChartNoAxesCombined, CircleCheckBig, FileStack, Star, Users } from 'lucide-react';
import { MetricCard, Panel, RefreshButton } from '@mairie360/lib-components/primitives';

export interface ElearningAdminStatsData {
  totalCourses: number;
  totalLearners: number;
  mandatoryCourses: number;
  totalContents: number;
  averageRating: number;
  completionRate: number;
}

export interface ElearningAdminStatsProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  stats: ElearningAdminStatsData;
  /** `loading` while « Actualiser » runs, `unavailable` when the last read failed (the courses stay readable). */
  state?: 'default' | 'loading' | 'unavailable';
  onRefresh?: () => void;
}

/** MAIR-887 / MAIR-1150: the administrator indicators on the lib Panel, with « Actualiser ». */
export const ElearningAdminStats = ({ stats, state = 'default', onRefresh, className = '', ...props }: ElearningAdminStatsProps) => {
  const cards = [
    { label: 'Formations publiées', value: stats.totalCourses, icon: BookOpenCheck },
    { label: 'Apprenants inscrits', value: stats.totalLearners, icon: Users },
    { label: 'Progression moyenne', value: `${stats.completionRate} %`, icon: ChartNoAxesCombined },
    { label: 'Note moyenne', value: `${stats.averageRating}/5`, icon: Star },
    { label: 'Formations obligatoires', value: stats.mandatoryCourses, icon: CircleCheckBig },
    { label: 'Ressources pédagogiques', value: stats.totalContents, icon: FileStack },
  ];

  return (
    <Panel
      title="Indicateurs du centre de formation"
      description="Suivi des formations publiées, des apprenants et des contenus."
      state={state}
      stateProps={state === 'unavailable' ? { title: 'Indicateurs temporairement indisponibles.', onRetry: onRefresh } : undefined}
      action={onRefresh ? <RefreshButton size="s" label="Actualiser" loading={state === 'loading'} onClick={onRefresh} /> : undefined}
      className={className}
      {...props}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => <MetricCard key={card.label} label={card.label} value={card.value} icon={card.icon} size="m" />)}
      </div>
    </Panel>
  );
};
