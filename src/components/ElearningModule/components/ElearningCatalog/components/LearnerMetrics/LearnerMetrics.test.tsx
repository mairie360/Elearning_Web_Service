import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LearnerMetrics } from './LearnerMetrics';

const metrics = { inProgress: 2, mandatoryToFinish: 3, nextDeadline: '30 nov. 2026', completed: 4, available: 9 };

describe('LearnerMetrics', () => {
  it('shows the agent indicators and filters the list from a metric', async () => {
    const onSelect = vi.fn();
    render(<LearnerMetrics metrics={metrics} active={{ status: 'all', requirement: 'all' }} onSelect={onSelect} />);
    expect(screen.getByRole('heading', { name: 'Mon suivi' })).toBeVisible();
    expect(screen.getByText('Prochaine échéance : 30 nov. 2026')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: /Obligatoires à terminer : 3/ }));
    expect(onSelect).toHaveBeenCalledWith({ status: 'to-finish', requirement: 'mandatory' });
  });

  it('marks the metric of the applied filter as pressed and removes the filter on a new click', async () => {
    const onSelect = vi.fn();
    render(<LearnerMetrics metrics={metrics} active={{ status: 'in-progress', requirement: 'all' }} onSelect={onSelect} />);
    const current = screen.getByRole('button', { name: /Formations en cours : 2/ });
    expect(current).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(current);
    expect(onSelect).toHaveBeenCalledWith({ status: 'all', requirement: 'all' });
  });
});
