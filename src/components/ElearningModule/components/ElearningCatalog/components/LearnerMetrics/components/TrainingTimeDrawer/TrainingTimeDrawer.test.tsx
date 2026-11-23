import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TrainingTimeDrawer } from './TrainingTimeDrawer';

const trainingTime = {
  year: 2026, goalMinutes: 600, timeSpentSeconds: 8100, completedCount: 1,
  courses: [
    { id: '4', title: 'RGPD et collectivités', status: 'completed' as const, timeSpentSeconds: 5400, completedAt: '2026-03-12' },
    { id: '5', title: 'Accueil du public', status: 'in-progress' as const, timeSpentSeconds: 2700, completedAt: null },
  ],
};

describe('TrainingTimeDrawer', () => {
  it('shows the time per course, the total, the goal, and downloads the attestations', async () => {
    let release: (value: boolean) => void = () => {};
    const onDownloadCertificates = vi.fn(() => new Promise<boolean>(resolve => { release = resolve; }));
    render(<TrainingTimeDrawer open year={2026} trainingTime={trainingTime} state="default" onClose={vi.fn()} onDownloadCertificates={onDownloadCertificates} />);
    const drawer = screen.getByRole('dialog', { name: 'Mon temps de formation' });
    expect(within(drawer).getByText(/Total 2026/)).toHaveTextContent('Total 2026 : 2 h 15 · objectif annuel : 10 h · 1 formation terminée');
    expect(within(drawer).getByText('1 h 30')).toBeVisible();
    expect(within(drawer).getByText('Terminée le 12 mars 2026')).toBeVisible();
    expect(within(drawer).getByText('En cours')).toBeVisible();
    const download = within(drawer).getByRole('button', { name: 'Télécharger mes attestations' });
    await userEvent.click(download);
    await userEvent.click(download);
    expect(onDownloadCertificates).toHaveBeenCalledTimes(1);
    release(true);
    await waitFor(() => expect(download).not.toHaveAttribute('aria-busy', 'true'));
  });

  it('shows the loading, unavailable and empty states', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<TrainingTimeDrawer open year={2026} state="unavailable" onClose={vi.fn()} onRetry={onRetry} />);
    expect(screen.getByText('Temps de formation temporairement indisponible.')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: /Réessayer/ }));
    expect(onRetry).toHaveBeenCalled();
    rerender(<TrainingTimeDrawer open year={2026} trainingTime={{ ...trainingTime, completedCount: 0, courses: [] }} state="default" onClose={vi.fn()} />);
    expect(screen.getByText('Aucun temps de formation en 2026.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Télécharger mes attestations' })).not.toBeInTheDocument();
  });

  it('keeps the button usable after a rejected download', async () => {
    const onDownloadCertificates = vi.fn(async () => { throw new Error('refused'); });
    render(<TrainingTimeDrawer open year={2026} trainingTime={trainingTime} state="default" onClose={vi.fn()} onDownloadCertificates={onDownloadCertificates} />);
    await userEvent.click(screen.getByRole('button', { name: 'Télécharger mes attestations' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Télécharger mes attestations' })).not.toHaveAttribute('aria-busy', 'true'));
  });
});
