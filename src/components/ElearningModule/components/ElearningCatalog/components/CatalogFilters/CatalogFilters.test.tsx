import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CatalogFilters } from './CatalogFilters';

const props = () => ({
  search: '', category: 'all', status: 'all', requirement: 'all',
  categories: [{ value: 'all', label: 'Toutes les catégories' }, { value: 'Juridique', label: 'Juridique' }],
  statuses: [{ value: 'all', label: 'Tous les statuts' }, { value: 'in-progress', label: 'En cours' }],
  requirements: [{ value: 'mandatory', label: 'Obligatoires' }, { value: 'optional', label: 'Facultatives' }],
  resultLabel: '2 formations',
  onSearchChange: vi.fn(), onCategoryChange: vi.fn(), onStatusChange: vi.fn(), onRequirementChange: vi.fn(),
});

describe('CatalogFilters', () => {
  it('sends every change up through its callback, never through the DOM', async () => {
    const handlers = props();
    render(<CatalogFilters {...handlers} />);
    fireEvent.change(screen.getByLabelText('Rechercher une formation'), { target: { value: 'RGPD' } });
    expect(handlers.onSearchChange).toHaveBeenCalledWith('RGPD');
    await userEvent.click(screen.getByRole('button', { name: /Statut/ }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'En cours' }));
    expect(handlers.onStatusChange).toHaveBeenCalledWith('in-progress');
    await userEvent.click(screen.getByRole('button', { name: /Caractère/ }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Obligatoires' }));
    expect(handlers.onRequirementChange).toHaveBeenCalledWith('mandatory');
  });

  it('maps the « all » choice of the lib (empty value) back to `all` and announces the counter', async () => {
    const handlers = props();
    render(<CatalogFilters {...handlers} category="Juridique" />);
    await userEvent.click(screen.getByRole('button', { name: /Catégorie/ }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Toutes les catégories' }));
    expect(handlers.onCategoryChange).toHaveBeenCalledWith('all');
    expect(screen.getByText('2 formations')).toHaveAttribute('aria-live', 'polite');
  });
});
