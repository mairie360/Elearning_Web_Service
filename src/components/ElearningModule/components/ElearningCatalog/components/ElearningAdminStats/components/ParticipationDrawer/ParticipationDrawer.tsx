import { DataTable, Drawer, Text } from '@mairie360/lib-components/primitives';

import { formatPercent, type ElearningServiceStats } from '../../admin-stats-model';

export interface ParticipationDrawerProps {
  open: boolean;
  services: ElearningServiceStats[];
  participationRate: number;
  onClose: () => void;
}

/** MAIR-1150: « Participation par service », opened from the participation indicator. */
export const ParticipationDrawer = ({ open, services, participationRate, onClose }: ParticipationDrawerProps) => (
  <Drawer open={open} title="Participation par service" size="l" closeLabel="Fermer la participation par service" onClose={onClose}>
    <div className="flex flex-col gap-4">
      <Text tone="muted" size="s">Taux de participation de la commune : {formatPercent(participationRate)}</Text>
      <DataTable<ElearningServiceStats>
        label="Participation par service"
        rows={services}
        rowKey={service => service.serviceId ?? 'none'}
        sortable
        state={services.length ? 'default' : 'empty'}
        stateProps={{ title: 'Aucun agent à afficher.' }}
        columns={[
          { key: 'serviceName', header: 'Service', kind: 'strong', cell: service => service.serviceName ?? 'Sans service' },
          { key: 'agents', header: 'Agents', align: 'end' },
          { key: 'participants', header: 'Participants', align: 'end' },
          { key: 'participationRate', header: 'Participation', align: 'end', cell: service => formatPercent(service.participationRate) },
        ]}
      />
    </div>
  </Drawer>
);
