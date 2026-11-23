import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AgentPicker } from './AgentPicker';

describe('AgentPicker', () => {
  it('ticks and unticks agents', async () => {
    const onSelectedChange = vi.fn();
    const searchAgents = vi.fn(async () => ({ items: [{ userId: '50', name: 'Chloé Durand', firstName: 'Chloé', lastName: 'Durand' }], nextOffset: null }));
    const { rerender } = render(<AgentPicker searchAgents={searchAgents} selected={[]} onSelectedChange={onSelectedChange} />);
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Chloé Durand' }));
    expect(onSelectedChange).toHaveBeenLastCalledWith(['50']);
    rerender(<AgentPicker searchAgents={searchAgents} selected={['50']} onSelectedChange={onSelectedChange} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Chloé Durand' }));
    expect(onSelectedChange).toHaveBeenLastCalledWith([]);
  });

  it('says when every agent follows the course, when nobody matches and when the search fails', async () => {
    const searchAgents = vi.fn()
      .mockResolvedValueOnce({ items: [], nextOffset: null })
      .mockResolvedValueOnce({ items: [], nextOffset: null })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ items: [{ userId: '51', name: 'Zoé Roy', firstName: 'Zoé', lastName: 'Roy' }], nextOffset: null });
    render(<AgentPicker searchAgents={searchAgents} selected={[]} onSelectedChange={vi.fn()} />);
    expect(await screen.findByText('Tous les agents suivent déjà cette formation.')).toBeVisible();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Rechercher un agent' }), 'x');
    expect(await screen.findByText('Aucun agent ne correspond à cette recherche.', {}, { timeout: 2000 })).toBeVisible();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Rechercher un agent' }), 'y');
    expect(await screen.findByText('Les agents n’ont pas pu être chargés.', {}, { timeout: 2000 })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: /Réessayer/ }));
    expect(await screen.findByRole('checkbox', { name: 'Zoé Roy' }, { timeout: 2000 })).toBeVisible();
  });
});
