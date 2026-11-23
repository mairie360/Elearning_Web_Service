import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, within } from '@testing-library/react';

import { CompletionDrawer } from './CompletionDrawer';

const courses = [
  { id: '4', title: 'RGPD et collectivités', source: 'internal' as const, mandatory: true, enrolled: 30, completed: 20, averageProgress: 75.5 },
  { id: '9', title: 'Prise en main de Mairie360', source: 'platform' as const, mandatory: false, enrolled: 25, completed: 5, averageProgress: 32 },
];

describe('CompletionDrawer', () => {
  it('lists the completion of every course with its origin', () => {
    render(<CompletionDrawer open courses={courses} averageCompletion={61.4} onClose={vi.fn()} />);
    const drawer = screen.getByRole('dialog', { name: 'Complétion par formation' });
    expect(within(drawer).getByText('Complétion moyenne : 61,4 %')).toBeVisible();
    expect(within(drawer).getByText('RGPD et collectivités')).toBeVisible();
    expect(within(drawer).getByText('Interne')).toBeVisible();
    expect(within(drawer).getByText('Outil')).toBeVisible();
    expect(within(drawer).getByText('75,5 %')).toBeVisible();
  });

  it('says when no course has learners yet', () => {
    render(<CompletionDrawer open courses={[]} averageCompletion={0} onClose={vi.fn()} />);
    expect(screen.getByText('Aucune formation à afficher.')).toBeVisible();
  });
});
