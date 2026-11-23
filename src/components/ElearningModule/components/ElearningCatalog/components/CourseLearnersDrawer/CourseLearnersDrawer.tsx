import React from 'react';
import { Button, ConfirmModal, Drawer } from '@mairie360/lib-components/primitives';

import { AgentPicker } from './components/AgentPicker';
import { LearnersTable } from './components/LearnersTable';
import { agentName, appendPage, type AgentIdentity, type CourseLearner, type LearnersPage, type Page } from '@/features/elearning/enrolmentActions';

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
  // Bumped by every reload: a « Afficher plus » page requested before it is dropped.
  const generationRef = React.useRef(0);

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
  const reload = () => { generationRef.current += 1; setState('loading'); setRevision((value) => value + 1); };

  const more = async () => {
    if (nextOffset === null || loadingMore) return;
    const generation = generationRef.current;
    setLoadingMore(true);
    try {
      const page = await port.loadLearners(course.id, nextOffset);
      if (page && generation === generationRef.current) { setLearners((shown) => appendPage(shown, page.items)); setTotal(page.total); setNextOffset(page.nextOffset); }
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
          <LearnersTable
            learners={learners}
            total={total}
            state={state}
            hasMore={nextOffset !== null}
            loadingMore={loadingMore}
            busy={busy}
            onMore={() => void more()}
            onRetry={reload}
            onRemove={setRemoving}
          />
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
