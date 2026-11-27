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
    expect(screen.getByRole('heading', { name: 'Indicateurs de la commune' })).toBeVisible();
    expect(screen.getByText('créées par la commune · dont 2 obligatoires')).toBeVisible();
    expect(screen.getByText('fournies par Mairie360, à jour avec l’outil')).toBeVisible();
    expect(screen.getByText('79,2 %')).toBeVisible();
    expect(screen.getByText('61,4 %')).toBeVisible();
    expect(screen.getByText('agents ayant dépassé une échéance')).toBeVisible();
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
  it('MAIR-1257 each indicator names where it leads, with plain-case labels, gauges and the time of the last read', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 27, 9, 5));
    try {
      render(<ElearningAdminStats stats={stats} onSourceChange={vi.fn()} />);
    } finally {
      vi.useRealTimers();
    }
    expect(screen.getByText('Toutes formations et tous agents confondus · mis à jour à 9 h 05')).toBeVisible();
    const links = [
      ['Formations internes', 'Voir la liste'],
      ['Formations de l’outil', 'Voir la liste'],
      ['Taux de participation', 'Détail par service'],
      ['Complétion moyenne', 'Détail par formation'],
      ['Obligatoires en retard', 'Voir les agents'],
    ];
    for (const [label, link] of links) {
      const card = screen.getByRole('button', { name: new RegExp(label) });
      expect(within(card).getByText(link)).toBeVisible();
      // The label is written as the artifact does, not as an uppercase overline.
      expect(within(card).getByText(label).className).not.toMatch(/uppercase/);
    }
    expect(screen.getByText('38 agents inscrits sur 48')).toBeVisible();
    const participation = screen.getByRole('button', { name: /Taux de participation/ });
    expect(participation.querySelector('[data-gauge]')).toHaveAttribute('data-gauge', '79');
    expect(screen.getByRole('button', { name: /Complétion moyenne/ }).querySelector('[data-gauge]')).toHaveAttribute('data-gauge', '61');
    expect(screen.getByRole('button', { name: /Formations internes/ }).querySelector('[data-gauge]')).toBeNull();
  });

  it('MAIR-1257 overdue mandatory courses are shown in the danger colour, never when there are none', () => {
    const { rerender } = render(<ElearningAdminStats stats={stats} />);
    expect(screen.getByRole('button', { name: /Obligatoires en retard/ })).toHaveAttribute('data-alert', 'true');
    expect(screen.getByRole('button', { name: /Taux de participation/ })).not.toHaveAttribute('data-alert');
    rerender(<ElearningAdminStats stats={{ ...stats, lateMandatory: 0, lateAgents: [] }} />);
    expect(screen.getByRole('button', { name: /Obligatoires en retard/ })).not.toHaveAttribute('data-alert');
  });
});
