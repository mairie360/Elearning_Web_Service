import React from 'react';
import { DataTable, DownloadButton, Drawer, StatusPill, Text } from '@mairie360/lib-components/primitives';

import { formatDurationSeconds, frenchDate, statusDisplay } from '../../../../catalog-model';
import type { ElearningLearnerActionResult } from '../../../../course-types';
import type { ElearningTrainingTime, ElearningTrainingTimeCourse } from '../../training-time-model';

export interface TrainingTimeDrawerProps {
  open: boolean;
  year: number;
  trainingTime?: ElearningTrainingTime;
  state: 'default' | 'loading' | 'unavailable';
  onClose: () => void;
  onRetry?: () => void;
  /** « Télécharger mes attestations »: every attestation of the year in one PDF (the page reports the outcome). */
  onDownloadCertificates?: () => ElearningLearnerActionResult;
}

/** MAIR-1144: « Mon temps de formation »: the time spent per course this year, its total and the attestations. */
export const TrainingTimeDrawer = ({ open, year, trainingTime, state, onClose, onRetry, onDownloadCertificates }: TrainingTimeDrawerProps) => {
  const [downloading, setDownloading] = React.useState(false);
  const pending = React.useRef(false);
  const download = async () => {
    if (!onDownloadCertificates || pending.current) return;
    pending.current = true;
    setDownloading(true);
    try { await onDownloadCertificates(); } catch { /* The page reports the failure as a toast. */ } finally {
      pending.current = false;
      setDownloading(false);
    }
  };
  const courses = trainingTime?.courses ?? [];
  const tableState = state === 'loading' ? 'loading' : state === 'unavailable' ? 'error' : courses.length ? 'default' : 'empty';
  return (
    <Drawer
      open={open}
      title="Mon temps de formation"
      size="l"
      closeLabel="Fermer mon temps de formation"
      onClose={onClose}
      footer={onDownloadCertificates ? <DownloadButton label="Télécharger mes attestations" loading={downloading} onClick={() => void download()} /> : undefined}
    >
      <div className="flex flex-col gap-4">
        {trainingTime ? (
          <Text size="s" tone="muted">
            Total {year} : <strong>{formatDurationSeconds(trainingTime.timeSpentSeconds)}</strong> · objectif annuel : {formatDurationSeconds(trainingTime.goalMinutes * 60)} ·
            {' '}{trainingTime.completedCount} formation{trainingTime.completedCount > 1 ? 's' : ''} terminée{trainingTime.completedCount > 1 ? 's' : ''}
          </Text>
        ) : null}
        <DataTable<ElearningTrainingTimeCourse>
          label={`Temps de formation ${year}`}
          rows={courses}
          rowKey={course => course.id}
          sortable
          state={tableState}
          stateProps={tableState === 'error'
            ? { title: 'Temps de formation temporairement indisponible.', onRetry }
            : { title: `Aucun temps de formation en ${year}.` }}
          columns={[
            { key: 'title', header: 'Formation', kind: 'strong' },
            { key: 'timeSpentSeconds', header: 'Temps', align: 'end', cell: course => formatDurationSeconds(course.timeSpentSeconds) },
            {
              key: 'status', header: 'Statut', kind: 'content',
              cell: course => {
                const status = statusDisplay(course.status);
                const done = course.completedAt ? ` le ${frenchDate(course.completedAt)}` : '';
                return <StatusPill size="s" dot tone={status.tone} label={`${status.label}${course.status === 'completed' ? done : ''}`} />;
              },
            },
          ]}
        />
      </div>
    </Drawer>
  );
};
