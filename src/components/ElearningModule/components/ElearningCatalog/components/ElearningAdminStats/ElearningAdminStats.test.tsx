import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { adminStatsResponse } from '@tests/support/elearning-fixtures';
import { ElearningAdminStats, type ElearningAdminStatsData } from './ElearningAdminStats';

const stats = adminStatsResponse() as ElearningAdminStatsData;

describe('ElearningAdminStats', () => {
  it('renders the indicators of the instance in a Panel with « Actualiser »', async () => {
    const onRefresh = vi.fn();
    render(<ElearningAdminStats stats={stats} onRefresh={onRefresh} />);
    expect(screen.getByRole('heading', { name: 'Indicateurs du centre de formation' })).toBeVisible();
    expect(screen.getByText('créées par la commune · 2 obligatoires')).toBeVisible();
    expect(screen.getByText('fournies par Mairie360')).toBeVisible();
    expect(screen.getByText('79,2 %')).toBeVisible();
    expect(screen.getByText('61,4 %')).toBeVisible();
    expect(screen.getByText('3 agents à relancer')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Actualiser' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('sets and removes the origin filter from the internal and platform indicators', async () => {
    const onSourceChange = vi.fn();
    const { rerender } = render(<ElearningAdminStats stats={stats} onSourceChange={onSourceChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Formations internes/ }));
    expect(onSourceChange).toHaveBeenLastCalledWith('internal');
    rerender(<ElearningAdminStats stats={stats} source="platform" onSourceChange={onSourceChange} />);
    const platform = screen.getByRole('button', { name: /Formations de l’outil/ });
    expect(platform).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(platform);
    expect(onSourceChange).toHaveBeenLastCalledWith('all');
  });

  it('opens the participation, completion and late agents drawers', async () => {
    const onRemind = vi.fn(async () => true);
    render(<ElearningAdminStats stats={stats} onRemind={onRemind} />);
    await userEvent.click(screen.getByRole('button', { name: /Taux de participation/ }));
    expect(screen.getByRole('dialog', { name: 'Participation par service' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Fermer la participation par service' }));
    await userEvent.click(screen.getByRole('button', { name: /Complétion moyenne/ }));
    expect(screen.getByRole('dialog', { name: 'Complétion par formation' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Fermer la complétion par formation' }));
    await userEvent.click(screen.getByRole('button', { name: /Obligatoires en retard/ }));
    const late = screen.getByRole('dialog', { name: 'Agents en retard' });
    await userEvent.click(within(late).getByRole('button', { name: 'Relancer les 3 agents' }));
    expect(onRemind).toHaveBeenCalledWith(stats.lateAgents);
  });

  it('says the indicators are unavailable without blocking, and loads without figures', () => {
    const { rerender } = render(<ElearningAdminStats state="unavailable" onRefresh={vi.fn()} />);
    expect(screen.getByText('Indicateurs temporairement indisponibles.')).toBeVisible();
    expect(screen.queryByText('Formations internes')).not.toBeInTheDocument();
    rerender(<ElearningAdminStats state="loading" />);
    expect(screen.queryByText('Formations internes')).not.toBeInTheDocument();
    rerender(<ElearningAdminStats />);
    expect(screen.queryByText('Formations internes')).not.toBeInTheDocument();
  });
});
