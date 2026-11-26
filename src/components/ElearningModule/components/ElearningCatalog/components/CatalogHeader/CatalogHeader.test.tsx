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

  it('MAIR-1224 shows « Inscrire des agents » before « Nouvelle formation », disabled while the catalogue is empty', async () => {
    const onEnrol = vi.fn();
    const { rerender } = render(<CatalogHeader title="E-learning" subtitle="Pilotez" onCreate={vi.fn()} onEnrol={onEnrol} enrolDisabled />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['Inscrire des agents', 'Nouvelle formation']);
    expect(screen.getByRole('button', { name: 'Inscrire des agents' })).toBeDisabled();
    rerender(<CatalogHeader title="E-learning" subtitle="Pilotez" onCreate={vi.fn()} onEnrol={onEnrol} />);
    await userEvent.click(screen.getByRole('button', { name: 'Inscrire des agents' }));
    expect(onEnrol).toHaveBeenCalledTimes(1);
  });
});
