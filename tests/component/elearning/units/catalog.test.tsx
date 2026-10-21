import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CatalogEmptyState } from '@/components/elearning/catalog/CatalogEmptyState';
import { CatalogFilters } from '@/components/elearning/catalog/CatalogFilters';
import { CatalogHeader } from '@/components/elearning/catalog/CatalogHeader';
import { ManagedCourseCard } from '@/components/elearning/catalog/ManagedCourseCard';
import { SelectedCourseDetails } from '@/components/elearning/catalog/SelectedCourseDetails';

const course = { id: 'c', title: 'RGPD', description: 'Données personnelles', ratingDistribution: { 5: 1, 3: 1 } };

describe('MAIR-608 catalog sub-components', () => {
  it('CatalogHeader shows the create action only when allowed', async () => {
    const onCreate = vi.fn();
    const { rerender } = render(<CatalogHeader title="Centre" subtitle="Compétences" />);
    expect(screen.getByRole('heading', { name: 'Centre' })).toBeVisible();
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<CatalogHeader title="Centre" subtitle="Compétences" onCreate={onCreate} />);
    await userEvent.click(screen.getByRole('button', { name: 'Nouvelle formation' }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('CatalogFilters reports the search', async () => {
    const onSearchChange = vi.fn();
    render(<CatalogFilters search="" category="all" status="all" categories={[{ value: 'all', label: 'Toutes les catégories' }]} statuses={[{ value: 'all', label: 'Tous les statuts' }]}
      onSearchChange={onSearchChange} onCategoryChange={vi.fn()} onStatusChange={vi.fn()} />);
    await userEvent.type(screen.getByRole('searchbox'), 'R');
    expect(onSearchChange).toHaveBeenCalledWith('R');
    expect(screen.getByRole('button', { name: 'Toutes les catégories' })).toBeVisible();
  });

  it('ManagedCourseCard averages the ratings and shows administrator shortcuts only when given', async () => {
    const onEdit = vi.fn(); const onDelete = vi.fn(); const onOpen = vi.fn();
    const { rerender } = render(<ManagedCourseCard course={course} actionDisabled={false} onOpen={onOpen} />);
    expect(screen.queryByRole('button', { name: 'Modifier RGPD' })).toBeNull();
    expect(screen.getByText(/^4$/)).toBeVisible();
    rerender(<ManagedCourseCard course={course} actionDisabled={false} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: 'Modifier RGPD' }));
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer RGPD' }));
    expect(onEdit).toHaveBeenCalledWith(course);
    expect(onDelete).toHaveBeenCalledWith(course);
  });

  it('CatalogEmptyState offers the reset only while filtering', async () => {
    const onResetFilters = vi.fn();
    const { rerender } = render(<CatalogEmptyState label="Aucune formation" />);
    expect(screen.getByText('Aucune formation')).toBeVisible();
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<CatalogEmptyState label="Aucune formation" onResetFilters={onResetFilters} />);
    await userEvent.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }));
    expect(onResetFilters).toHaveBeenCalledTimes(1);
  });

  it('SelectedCourseDetails runs the detail callback first, then the catalogue host', async () => {
    const order: string[] = [];
    const details = { title: 'RGPD', description: 'Données', completed: true, chapters: [],
      completionRating: { title: 'Noter cette formation', onSubmit: () => { order.push('detail'); return true; } } };
    const onRatingSubmit = vi.fn(() => { order.push('host'); return true; });
    render(<SelectedCourseDetails course={course} details={details} starting={false} startError={null} allowRatingEdits={false} onClose={vi.fn()} onRatingSubmit={onRatingSubmit} />);
    expect(screen.getByRole('dialog', { name: 'RGPD' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Donner la note 4 sur 5' }));
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer la note' }));
    expect(order).toEqual(['detail', 'host']);
    expect(onRatingSubmit.mock.calls[0][0]).toBe(course);
  });
});
