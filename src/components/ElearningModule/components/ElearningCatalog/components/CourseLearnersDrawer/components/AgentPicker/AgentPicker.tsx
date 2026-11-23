import React from 'react';
import { Button, Checkbox, DataState, SearchField, Text } from '@mairie360/lib-components/primitives';

import { agentName, appendPage, type AgentIdentity, type Page } from '@/features/elearning/enrolmentActions';

export interface AgentPickerProps {
  /** The agents not enrolled yet whose name or e-mail contains `search`; `null` when they could not be read. */
  searchAgents: (search: string, offset: number, init?: RequestInit) => Promise<Page<AgentIdentity> | null>;
  /** Ids of the agents ticked, kept by the drawer so that « Inscrire » can read them. */
  selected: string[];
  onSelectedChange: (userIds: string[]) => void;
  disabled?: boolean;
}

/** Wait after the last key before searching. */
const SEARCH_DELAY_MS = 300;

/** MAIR-817: « Inscrire des agents »: search the agents of the instance who do not follow the course and tick them. */
export const AgentPicker = ({ searchAgents, selected, onSelectedChange, disabled = false }: AgentPickerProps) => {
  const [search, setSearch] = React.useState('');
  const [agents, setAgents] = React.useState<AgentIdentity[]>([]);
  const [nextOffset, setNextOffset] = React.useState<number | null>(null);
  const [state, setState] = React.useState<'loading' | 'default' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);
  const current = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    current.current?.abort();
    current.current = controller;
    const timer = setTimeout(() => {
      searchAgents(search, 0, { signal: controller.signal }).then((page) => {
        if (controller.signal.aborted) return;
        if (!page) { setState('error'); return; }
        setAgents(page.items);
        setNextOffset(page.nextOffset);
        setState('default');
      }, () => { /* Aborted by a newer search. */ });
    }, search ? SEARCH_DELAY_MS : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, searchAgents, attempt]);

  const more = async () => {
    if (nextOffset === null || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await searchAgents(search, nextOffset, { signal: current.current?.signal });
      if (page) { setAgents((shown) => appendPage(shown, page.items)); setNextOffset(page.nextOffset); }
    } catch { /* Aborted by a newer search. */ } finally {
      setLoadingMore(false);
    }
  };

  const toggle = (userId: string, checked: boolean) => onSelectedChange(
    checked ? [...selected.filter((id) => id !== userId), userId] : selected.filter((id) => id !== userId),
  );

  return (
    <div className="flex flex-col gap-4">
      <SearchField
        label="Rechercher un agent"
        placeholder="Nom, prénom ou e-mail"
        value={search}
        maxLength={100}
        onChange={(event) => { setState('loading'); setSearch(event.target.value); }}
        onClear={() => { setState('loading'); setSearch(''); }}
      />
      {state === 'loading' ? <DataState state="loading" title="Recherche des agents…" size="s" /> : null}
      {state === 'error' ? (
        <DataState
          state="error"
          size="s"
          title="Les agents n’ont pas pu être chargés."
          onRetry={() => { setState('loading'); setAttempt((value) => value + 1); }}
        />
      ) : null}
      {state === 'default' && agents.length === 0 ? (
        <DataState state="empty" size="s" title={search.trim() ? 'Aucun agent ne correspond à cette recherche.' : 'Tous les agents suivent déjà cette formation.'} />
      ) : null}
      {state === 'default' && agents.length > 0 ? (
        <fieldset className="flex flex-col gap-2" disabled={disabled}>
          <legend className="sr-only">Agents à inscrire</legend>
          {agents.map((agent) => (
            <Checkbox
              key={agent.userId}
              label={agentName(agent)}
              checked={selected.includes(agent.userId)}
              onChange={(event) => toggle(agent.userId, event.target.checked)}
            />
          ))}
        </fieldset>
      ) : null}
      {state === 'default' && nextOffset !== null ? (
        <Button variant="ghost" label="Afficher plus d’agents" loading={loadingMore} onClick={() => void more()} />
      ) : null}
      {selected.length ? <Text size="s" tone="muted">{selected.length} agent{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}</Text> : null}
    </div>
  );
};
