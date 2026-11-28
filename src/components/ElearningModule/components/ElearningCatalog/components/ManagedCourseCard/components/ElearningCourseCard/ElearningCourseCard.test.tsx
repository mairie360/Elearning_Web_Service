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
  // MAIR-1257 (design-match): the tile of the Figma F1 frame — inner padding, short days, uppercase category.
  it('MAIR-1257 pads the tile and shows short days like the mockup', () => {
    const { container, rerender } = render(<ElearningCourseCard course={{ id: '2', title: 'Accueil du public', description: '', category: 'Relation usager', deadline: '2026-12-15', statusValue: 'in-progress', progress: 20 }} />);
    expect(container.querySelector('section')).toHaveClass('p-5');
    expect(screen.getByText('Avant le 15 déc.')).toBeVisible();
    expect(screen.getByText('Relation usager').parentElement).toHaveClass('uppercase');
    rerender(<ElearningCourseCard course={{ id: '2', title: 'Accueil du public', description: '', statusValue: 'completed', progress: 100, completedAt: '2026-11-08T09:00:00Z' }} />);
    expect(screen.getByText('Terminée le 8 nov.')).toBeVisible();
    expect(screen.queryByText('Formation terminée')).not.toBeInTheDocument();
  });
});
