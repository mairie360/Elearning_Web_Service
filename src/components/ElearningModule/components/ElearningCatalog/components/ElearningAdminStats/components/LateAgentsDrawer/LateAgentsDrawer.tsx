import React from 'react';
import { Button, DataTable, Drawer, Text } from '@mairie360/lib-components/primitives';

import { agentsLabel, formatPercent, type ElearningLateAgent } from '../../admin-stats-model';
import { frenchDate } from '../../../../catalog-model';
import type { ElearningLearnerActionResult } from '../../../../course-types';

export interface LateAgentsDrawerProps {
  open: boolean;
  agents: ElearningLateAgent[];
  onClose: () => void;
  /** « Relancer les n agents »: one reminder per course concerned; `false` when nothing was confirmed. */
  onRemind?: (agents: ElearningLateAgent[]) => ElearningLearnerActionResult;
}

/** MAIR-1150: « Agents en retard » on a mandatory course, and their reminder. */
export const LateAgentsDrawer = ({ open, agents, onClose, onRemind }: LateAgentsDrawerProps) => {
  const [sending, setSending] = React.useState(false);
  const pending = React.useRef(false);
  const remind = async () => {
    if (!onRemind || pending.current) return;
    pending.current = true;
    setSending(true);
    try { await onRemind(agents); } catch { /* The page reports the failure as a toast. */ } finally {
      pending.current = false;
      setSending(false);
    }
  };
  const close = () => { if (!pending.current) onClose(); };
  return (
    <Drawer
      open={open}
      title="Agents en retard"
      size="l"
      closeLabel="Fermer la liste des agents en retard"
      onClose={close}
      footer={onRemind && agents.length ? (
        <Button label={`Relancer ${agents.length > 1 ? `les ${agents.length} agents` : 'l’agent'}`} loading={sending} onClick={() => void remind()} />
      ) : undefined}
    >
      <div className="flex flex-col gap-4">
        <Text tone="muted" size="s">{agentsLabel(agents.length)} n’{agents.length > 1 ? 'ont' : 'a'} pas terminé une formation obligatoire dont l’échéance est passée.</Text>
        <DataTable<ElearningLateAgent>
          label="Agents en retard"
          rows={agents}
          rowKey={agent => `${agent.userId}:${agent.courseId}`}
          sortable
          state={agents.length ? 'default' : 'empty'}
          stateProps={{ title: 'Aucun agent en retard.' }}
          columns={[
            { key: 'agent', header: 'Agent', kind: 'strong', cell: agent => `${agent.firstName} ${agent.lastName}`.trim(), sortValue: agent => `${agent.lastName} ${agent.firstName}` },
            { key: 'courseTitle', header: 'Formation' },
            { key: 'deadline', header: 'Échéance', cell: agent => frenchDate(agent.deadline) ?? '' },
            { key: 'progress', header: 'Progression', align: 'end', cell: agent => formatPercent(agent.progress) },
            { key: 'lastReminderAt', header: 'Dernière relance', cell: agent => frenchDate(agent.lastReminderAt) ?? 'Jamais' },
          ]}
        />
      </div>
    </Drawer>
  );
};
