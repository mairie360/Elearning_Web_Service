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
    await userEvent.click(screen.getByRole('button', { name: /Tous les statuts/ }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'En cours' }));
    expect(handlers.onStatusChange).toHaveBeenCalledWith('in-progress');
    await userEvent.click(screen.getByRole('button', { name: /Obligatoires et facultatives/ }));
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

  it('MAIR-1257 reads « Toutes les catégories » with its accent even when the options carry an unaccented label', () => {
    render(<CatalogFilters {...props()} categories={[{ value: 'all', label: 'Toutes les categories' }, { value: 'Juridique', label: 'Juridique' }]} />);
    expect(screen.getByRole('button', { name: /Toutes les catégories/ })).toBeInTheDocument();
    expect(screen.queryByText(/Toutes les categories/)).toBeNull();
  });

  it('MAIR-1257 lays the filters out in the artifact order, without the funnel, the count on the same row', () => {
    const { container } = render(<CatalogFilters {...props()} source="all" sources={[{ value: 'internal', label: 'Formations internes' }]} onSourceChange={vi.fn()} />);
    const filters = screen.getAllByRole('button').filter(button => button.getAttribute('aria-haspopup') === 'menu');
    expect(filters.map(button => button.textContent)).toEqual(['Toutes les catégories', 'Tous les statuts', 'Toutes les origines', 'Obligatoires et facultatives']);
    for (const filter of filters) expect(filter.querySelectorAll('svg')).toHaveLength(1);
    const row = container.firstElementChild as HTMLElement;
    const count = screen.getByText('2 formations');
    expect(count.parentElement).toBe(row);
    expect(row.lastElementChild).toBe(count);
    expect(count).toHaveClass('ml-auto');
  });
});
