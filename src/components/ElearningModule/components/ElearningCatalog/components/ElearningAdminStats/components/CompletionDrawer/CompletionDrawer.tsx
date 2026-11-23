import { DataTable, Drawer, StatusPill, Text } from '@mairie360/lib-components/primitives';

import { formatPercent, type ElearningCourseStats } from '../../admin-stats-model';

export interface CompletionDrawerProps {
  open: boolean;
  courses: ElearningCourseStats[];
  averageCompletion: number;
  onClose: () => void;
}

/** MAIR-1150: « Complétion par formation », opened from the average completion indicator. */
export const CompletionDrawer = ({ open, courses, averageCompletion, onClose }: CompletionDrawerProps) => (
  <Drawer open={open} title="Complétion par formation" size="l" closeLabel="Fermer la complétion par formation" onClose={onClose}>
    <div className="flex flex-col gap-4">
      <Text tone="muted" size="s">Complétion moyenne : {formatPercent(averageCompletion)}</Text>
      <DataTable<ElearningCourseStats>
        label="Complétion par formation"
        rows={courses}
        rowKey={course => course.id}
        sortable
        state={courses.length ? 'default' : 'empty'}
        stateProps={{ title: 'Aucune formation à afficher.' }}
        columns={[
          { key: 'title', header: 'Formation', kind: 'strong' },
          {
            key: 'source', header: 'Origine', kind: 'content',
            cell: course => <StatusPill size="s" tone={course.source === 'platform' ? 'info' : 'neutral'} label={course.source === 'platform' ? 'Outil' : 'Interne'} />,
          },
          { key: 'enrolled', header: 'Inscrits', align: 'end' },
          { key: 'completed', header: 'Terminées', align: 'end' },
          { key: 'averageProgress', header: 'Progression moyenne', align: 'end', cell: course => formatPercent(course.averageProgress) },
        ]}
      />
    </div>
  </Drawer>
);
