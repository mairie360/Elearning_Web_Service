import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CatalogFilters } from './CatalogFilters';

describe('CatalogFilters', () => {
  it('reports the search and offers the category and status filters', async () => {
    const onSearchChange = vi.fn();
    render(<CatalogFilters search="" category="all" status="all" categories={[{ value: 'all', label: 'Toutes les catégories' }]} statuses={[{ value: 'all', label: 'Tous les statuts' }]} onSearchChange={onSearchChange} onCategoryChange={vi.fn()} onStatusChange={vi.fn()} />);
    await userEvent.type(screen.getByRole('searchbox'), 'R'); expect(onSearchChange).toHaveBeenCalledWith('R');
    expect(screen.getByRole('button', { name: 'Toutes les catégories' })).toBeVisible();
  });
});
