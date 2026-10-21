import React from 'react';
import { BookOpenCheck, ChartNoAxesCombined, CircleCheckBig, FileStack, Star, Users } from 'lucide-react';

import { ElearningStatCard } from './ElearningStatCard';

export interface ElearningAdminStatsData {
  totalCourses: number;
  totalLearners: number;
  mandatoryCourses: number;
  totalContents: number;
  averageRating: number;
  completionRate: number;
}

export interface ElearningAdminStatsProps extends React.HTMLAttributes<HTMLElement> {
  stats: ElearningAdminStatsData;
}

export const ElearningAdminStats = ({ stats, className = '', ...props }: ElearningAdminStatsProps) => {
  const cards = [
    { label: 'Formations publiées', value: stats.totalCourses, icon: BookOpenCheck, iconColor: 'var(--mairie-accent)' },
    { label: 'Apprenants inscrits', value: stats.totalLearners, icon: Users, iconColor: 'var(--mairie-success-text)' },
    { label: 'Progression moyenne', value: `${stats.completionRate}%`, icon: ChartNoAxesCombined, iconColor: 'var(--mairie-purple-text)' },
    { label: 'Note moyenne', value: `${stats.averageRating}/5`, icon: Star, iconColor: 'var(--mairie-warning-text)' },
    { label: 'Formations obligatoires', value: stats.mandatoryCourses, icon: CircleCheckBig, iconColor: 'var(--mairie-error-text)' },
    { label: 'Ressources pédagogiques', value: stats.totalContents, icon: FileStack, iconColor: 'var(--mairie-teal-text)' },
  ];

  return (
    <section
      aria-labelledby="elearning-admin-stats-title"
      className={`mt-6 rounded-xl border border-[var(--mairie-border)] bg-[var(--mairie-surface-raised)] p-5 shadow-sm ${className}`}
      {...props}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--mairie-accent)]">Vue administrateur</p>
        <h3 id="elearning-admin-stats-title" className="mt-1 text-lg font-bold text-[var(--mairie-text)]">
          Statistiques des formations
        </h3>
        <p className="mt-1 text-sm text-[var(--mairie-muted)]">
          Suivi global du catalogue, des inscriptions et de l’engagement pédagogique.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <ElearningStatCard key={card.label} {...card} className="min-h-[88px]" />
        ))}
      </div>
    </section>
  );
};
