import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { trainingTimeResponse } from '@tests/support/elearning-fixtures';
import { LearnerMetrics, type ElearningTrainingTime } from './LearnerMetrics';

const metrics = { inProgress: 2, mandatoryToFinish: 3, nextDeadline: '30 novembre 2026', completed: 4, completedInYear: 1, year: 2026, available: 9 };
const trainingTime = trainingTimeResponse(2026) as ElearningTrainingTime;

describe('LearnerMetrics', () => {
  it('shows the agent indicators and filters the list from a metric', async () => {
    const onSelect = vi.fn();
    render(<LearnerMetrics metrics={metrics} active={{ status: 'all', requirement: 'all' }} onSelect={onSelect} trainingTime={trainingTime} trainingTimeState="default" />);
    expect(screen.getByRole('heading', { name: 'Mon suivi' })).toBeVisible();
    expect(screen.getByText('Prochaine échéance : 30 novembre 2026')).toBeVisible();
    expect(screen.getByRole('button', { name: /Terminées en 2026\s*1/ })).toBeVisible();
    expect(screen.getByText('objectif annuel : 10 h')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: /Obligatoires à terminer\s*3/ }));
    expect(onSelect).toHaveBeenCalledWith({ status: 'to-finish', requirement: 'mandatory' });
  });

  it('marks the metric of the applied filter as pressed and removes the filter on a new click', async () => {
    const onSelect = vi.fn();
    render(<LearnerMetrics metrics={metrics} active={{ status: 'in-progress', requirement: 'all' }} onSelect={onSelect} />);
    const current = screen.getByRole('button', { name: /Formations en cours\s*2/ });
    expect(current).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(current);
    expect(onSelect).toHaveBeenCalledWith({ status: 'all', requirement: 'all' });
  });

  it('opens « Mon temps de formation » from the training time, which reads unavailable without data', async () => {
    const { rerender } = render(<LearnerMetrics metrics={metrics} active={{ status: 'all', requirement: 'all' }} onSelect={vi.fn()} trainingTimeState="loading" />);
    expect(screen.getByRole('button', { name: /Temps de formation en 2026\s*…/ })).toBeVisible();
    rerender(<LearnerMetrics metrics={metrics} active={{ status: 'all', requirement: 'all' }} onSelect={vi.fn()} trainingTimeState="unavailable" />);
    expect(screen.getByText('temporairement indisponible')).toBeVisible();
    rerender(<LearnerMetrics metrics={metrics} active={{ status: 'all', requirement: 'all' }} onSelect={vi.fn()} trainingTime={trainingTime} trainingTimeState="default" onDownloadCertificates={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /Temps de formation en 2026\s*2 h 15/ }));
    expect(screen.getByRole('dialog', { name: 'Mon temps de formation' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Fermer mon temps de formation' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
