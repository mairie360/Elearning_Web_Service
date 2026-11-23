import React from 'react';
import { Button, ConfirmModal, DataTable, DeleteIconButton, Drawer, StatusPill, Text } from '@mairie360/lib-components/primitives';

import { AgentPicker } from './components/AgentPicker';
import { agentName, appendPage, type AgentIdentity, type CourseLearner, type LearnersPage, type Page } from '@/features/elearning/enrolmentActions';
import { frenchDate } from '../../catalog-model';

/** What the drawer asks of the page (`createEnrolmentActions`, bound to the course). */
export interface CourseLearnersPort {
  loadLearners: (courseId: string, offset?: number, init?: RequestInit) => Promise<LearnersPage | null>;
  searchAgents: (courseId: string, search: string, offset?: number, init?: RequestInit) => Promise<Page<AgentIdentity> | null>;
  enrol: (courseId: string, userIds: string[]) => Promise<boolean>;
  remove: (courseId: string, learner: CourseLearner) => Promise<boolean>;
}

export interface CourseLearnersDrawerProps {
  course: { id: string; title: string };
  port: CourseLearnersPort;
  onClose: () => void;
  /** The learners changed: the page reads the indicators again. */
  onChanged?: () => void;
}

const STATUS: Record<CourseLearner['status'], { label: string; tone: 'success' | 'info' | 'neutral' }> = {
  completed: { label: 'Terminée', tone: 'success' },
  'in-progress': { label: 'En cours', tone: 'info' },
  'not-started': { label: 'Non commencée', tone: 'neutral' },
};

/** « 1 agent inscrit », « 12 agents inscrits ». */
const learnersLabel = (total: number) => (total ? `${total} agent${total > 1 ? 's' : ''} inscrit${total > 1 ? 's' : ''}` : 'Aucun agent inscrit');

/**
 * MAIR-817: « Agents inscrits » of a course, for the administrators: the learners and their progress, « Inscrire des
 * agents » (search among the agents who do not follow it) and « Désinscrire ».
 */
export const CourseLearnersDrawer = ({ course, port, onClose, onChanged }: CourseLearnersDrawerProps) => {
  const [learners, setLearners] = React.useState<CourseLearner[]>([]);
  const [total, setTotal] = React.useState(0);
  const [nextOffset, setNextOffset] = React.useState<number | null>(null);
  const [state, setState] = React.useState<'loading' | 'default' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [removing, setRemoving] = React.useState<CourseLearner | null>(null);
  const [revision, setRevision] = React.useState(0);
  const busyRef = React.useRef(false);

  React.useEffect(() => {
    const controller = new AbortController();
    port.loadLearners(course.id, 0, { signal: controller.signal }).then((page) => {
      if (controller.signal.aborted) return;
      if (!page) { setState('error'); return; }
      setLearners(page.items);
      setTotal(page.total);
      setNextOffset(page.nextOffset);
      setState('default');
    }, () => { /* Closed or read again meanwhile. */ });
    return () => controller.abort();
  }, [course.id, port, revision]);

  /** Reads the learners again from the first page. */
  const reload = () => { setState('loading'); setRevision((value) => value + 1); };

  const more = async () => {
    if (nextOffset === null || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await port.loadLearners(course.id, nextOffset);
      if (page) { setLearners((shown) => appendPage(shown, page.items)); setTotal(page.total); setNextOffset(page.nextOffset); }
    } finally {
      setLoadingMore(false);
    }
  };

  const run = async (action: () => Promise<boolean>) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    try {
      const done = await action();
      reload();
      onChanged?.();
      return done;
    } catch {
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const enrol = async () => {
    if (!selected.length) return;
    if (await run(() => port.enrol(course.id, selected))) { setSelected([]); setAdding(false); }
  };

  const remove = async () => {
    if (!removing) return;
    const learner = removing;
    await run(() => port.remove(course.id, learner));
    setRemoving(null);
  };

  const close = () => { if (!busyRef.current) onClose(); };
  const searchAgents = React.useCallback(
    (search: string, offset: number, init?: RequestInit) => port.searchAgents(course.id, search, offset, init),
    [course.id, port],
  );

  const footer = adding ? (
    <div className="flex flex-wrap justify-end gap-2">
      <Button variant="outline" tone="neutral" label="Retour aux inscrits" disabled={busy} onClick={() => { setSelected([]); setAdding(false); }} />
      <Button
        label={selected.length > 1 ? `Inscrire les ${selected.length} agents` : 'Inscrire l’agent'}
        disabled={!selected.length}
        loading={busy}
        onClick={() => void enrol()}
      />
    </div>
  ) : (
    <Button label="Inscrire des agents" onClick={() => setAdding(true)} disabled={busy} />
  );

  return (
    <>
      <Drawer
        open
        size="l"
        title={adding ? `Inscrire des agents à « ${course.title} »` : `Agents inscrits à « ${course.title} »`}
        closeLabel="Fermer la liste des agents inscrits"
        onClose={close}
        footer={footer}
      >
        {adding ? (
          <AgentPicker searchAgents={searchAgents} selected={selected} onSelectedChange={setSelected} disabled={busy} />
        ) : (
          <div className="flex flex-col gap-4">
            {state === 'default' ? <Text tone="muted" size="s">{learnersLabel(total)}</Text> : null}
            <DataTable<CourseLearner>
              label="Agents inscrits"
              rows={learners}
              rowKey={(learner) => learner.userId}
              state={state === 'loading' ? 'loading' : state === 'error' ? 'error' : learners.length ? 'default' : 'empty'}
              stateProps={state === 'error'
                ? { title: 'Les agents inscrits n’ont pas pu être chargés.', onRetry: reload }
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
                    <DeleteIconButton size="s" label={`Désinscrire ${agentName(learner)}`} disabled={busy} onClick={() => setRemoving(learner)} />
                  ),
                },
              ]}
            />
            {state === 'default' && nextOffset !== null ? (
              <Button variant="ghost" label="Afficher plus d’agents inscrits" loading={loadingMore} onClick={() => void more()} />
            ) : null}
          </div>
        )}
      </Drawer>
      <ConfirmModal
        open={removing !== null}
        title="Désinscrire l’agent ?"
        message={removing ? `${agentName(removing)} ne verra plus « ${course.title} » et sa progression sur cette formation sera effacée.` : ''}
        confirmLabel="Désinscrire"
        busy={busy}
        initialFocus="cancel"
        onCancel={() => { if (!busyRef.current) setRemoving(null); }}
        onConfirm={() => void remove()}
      />
    </>
  );
};
