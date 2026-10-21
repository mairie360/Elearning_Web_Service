import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CatalogHeader } from './CatalogHeader';

describe('CatalogHeader', () => {
  it('shows the create action only when allowed', async () => {
    const onCreate = vi.fn();
    const { rerender } = render(<CatalogHeader title="Centre" subtitle="Compétences" />);
    expect(screen.getByRole('heading', { name: 'Centre' })).toBeVisible(); expect(screen.queryByRole('button')).toBeNull();
    rerender(<CatalogHeader title="Centre" subtitle="Compétences" onCreate={onCreate} />);
    await userEvent.click(screen.getByRole('button', { name: 'Nouvelle formation' })); expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
