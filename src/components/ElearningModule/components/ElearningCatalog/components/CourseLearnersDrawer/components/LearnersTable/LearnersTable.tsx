import { Button, DataTable, DeleteIconButton, StatusPill, Text } from '@mairie360/lib-components/primitives';

import { agentName, type CourseLearner } from '@/features/elearning/enrolmentActions';
import { frenchDate } from '../../../../catalog-model';

export interface LearnersTableProps {
  learners: CourseLearner[];
  total: number;
  state: 'loading' | 'default' | 'error';
  /** More learners are left to read (« Afficher plus »). */
  hasMore: boolean;
  loadingMore: boolean;
  /** An enrolment or unenrolment is running: the row actions wait. */
  busy: boolean;
  onMore: () => void;
  onRetry: () => void;
  onRemove: (learner: CourseLearner) => void;
}

const STATUS: Record<CourseLearner['status'], { label: string; tone: 'success' | 'info' | 'neutral' }> = {
  completed: { label: 'Terminée', tone: 'success' },
  'in-progress': { label: 'En cours', tone: 'info' },
  'not-started': { label: 'Non commencée', tone: 'neutral' },
};

/** « 1 agent inscrit », « 12 agents inscrits ». */
const learnersLabel = (total: number) => (total ? `${total} agent${total > 1 ? 's' : ''} inscrit${total > 1 ? 's' : ''}` : 'Aucun agent inscrit');

/** MAIR-817: the learners of a course, their progress and « Désinscrire ». */
export const LearnersTable = ({ learners, total, state, hasMore, loadingMore, busy, onMore, onRetry, onRemove }: LearnersTableProps) => (
  <div className="flex flex-col gap-4">
    {state === 'default' ? <Text tone="muted" size="s">{learnersLabel(total)}</Text> : null}
    <DataTable<CourseLearner>
      label="Agents inscrits"
      rows={learners}
      rowKey={(learner) => learner.userId}
      state={state === 'loading' ? 'loading' : state === 'error' ? 'error' : learners.length ? 'default' : 'empty'}
      stateProps={state === 'error'
        ? { title: 'Les agents inscrits n’ont pas pu être chargés.', onRetry }
        : state === 'loading' ? { title: 'Chargement des agents inscrits…' }
          : { title: 'Aucun agent ne suit encore cette formation.', description: 'Inscrivez des agents pour qu’ils la retrouvent dans leur catalogue.' }}
      columns={[
        { key: 'agent', header: 'Agent', kind: 'strong', cell: (learner) => agentName(learner) },
        { key: 'status', header: 'Statut', kind: 'content', cell: (learner) => <StatusPill size="s" label={STATUS[learner.status].label} tone={STATUS[learner.status].tone} /> },
        { key: 'progress', header: 'Progression', align: 'end', cell: (learner) => `${learner.progress} %` },
        { key: 'lastActivityAt', header: 'Dernière activité', cell: (learner) => frenchDate(learner.lastActivityAt) ?? 'Aucune' },
        { key: 'lastReminderAt', header: 'Dernière relance', cell: (learner) => frenchDate(learner.lastReminderAt) ?? 'Jamais' },
        {
          key: 'actions', header: 'Actions', hideHeader: true, kind: 'actions',
          cell: (learner) => (
            <DeleteIconButton size="s" label={`Désinscrire ${agentName(learner)}`} disabled={busy} onClick={() => onRemove(learner)} />
          ),
        },
      ]}
    />
    {state === 'default' && hasMore ? (
      <Button variant="ghost" label="Afficher plus d’agents inscrits" loading={loadingMore} onClick={onMore} />
    ) : null}
  </div>
);
