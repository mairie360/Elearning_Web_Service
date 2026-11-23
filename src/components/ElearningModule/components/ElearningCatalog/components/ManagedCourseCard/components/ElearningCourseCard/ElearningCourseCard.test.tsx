import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ElearningCourseCard } from './ElearningCourseCard';

describe('ElearningCourseCard', () => {
  it('shows the same fields for every course and opens it from its title', async () => {
    const onOpen = vi.fn();
    render(<ElearningCourseCard onOpen={onOpen} course={{
      id: '4', title: 'RGPD et collectivités', description: 'Données', category: 'Juridique', duration: '1 h', chapters: 3,
      levelBadge: { label: 'Débutant' }, titleBadge: { label: 'Obligatoire', variant: 'mandatory' }, statusValue: 'in-progress', progress: 40,
      deadline: '30 juin 2026',
    }} />);
    expect(screen.getByText('Juridique')).toBeVisible();
    expect(screen.getByText('Obligatoire')).toBeVisible();
    expect(screen.getByText('1 h · Débutant · 3 chapitres')).toBeVisible();
    expect(screen.getByText('En cours')).toBeVisible();
    expect(screen.getByText('Avant le 30 juin 2026')).toBeVisible();
    expect(screen.getByRole('progressbar', { name: 'Progression' })).toHaveAttribute('aria-valuenow', '40');
    await userEvent.click(screen.getByRole('button', { name: 'RGPD et collectivités' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('keeps the deadline line on a course without deadline or finished, and disables a busy tile', () => {
    const { rerender } = render(<ElearningCourseCard onOpen={vi.fn()} course={{ id: '1', title: 'Accueil', description: '' }} busy />);
    expect(screen.getByText('Sans échéance')).toBeVisible();
    expect(screen.getByText('Facultative')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Accueil' })).toBeDisabled();
    rerender(<ElearningCourseCard course={{ id: '1', title: 'Accueil', description: '', statusValue: 'completed', progress: 100 }} />);
    expect(screen.getByText('Formation terminée')).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
