import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CatalogEmptyState } from './CatalogEmptyState';

describe('CatalogEmptyState', () => {
  it('offers the reset only while filtering', async () => {
    const onResetFilters = vi.fn();
    const { rerender } = render(<CatalogEmptyState label="Aucune formation" />);
    expect(screen.getByText('Aucune formation')).toBeVisible(); expect(screen.queryByRole('button')).toBeNull();
    rerender(<CatalogEmptyState label="Aucune formation" onResetFilters={onResetFilters} />);
    await userEvent.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' })); expect(onResetFilters).toHaveBeenCalledTimes(1);
  });
});
