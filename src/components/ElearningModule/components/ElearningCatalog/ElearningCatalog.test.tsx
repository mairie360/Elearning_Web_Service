import { it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ElearningCatalog } from './ElearningCatalog';
it('filters received courses independently of French accents', async () => { const user = userEvent.setup(); render(<ElearningCatalog courses={[{ id: 'a', title: 'Écologie', description: 'Agir' }, { id: 'b', title: 'Budget', description: 'Préparer' }]} />); await user.type(screen.getByPlaceholderText('Rechercher une formation...'), 'ecologie'); expect(screen.getByRole('heading', { name: 'Écologie' })).toBeVisible(); expect(screen.queryByRole('heading', { name: 'Budget' })).not.toBeInTheDocument(); });

it('names the confirmed-empty catalogue without offering a meaningless filter reset', () => {
  render(<ElearningCatalog courses={[]} emptyLabel="Aucune formation publiée" />);
  const empty = screen.getByRole('region', { name: 'Aucune formation publiée' });
  expect(within(empty).getByRole('heading', { name: 'Aucune formation publiée' })).toBeVisible();
  expect(within(empty).queryByRole('button')).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText('Rechercher une formation...')).toBeVisible();
});

it('resets a filtered empty catalogue through its shared empty-state action without starting a course', async () => {
  const user = userEvent.setup();
  const onCourseAction = vi.fn();
  render(<ElearningCatalog courses={[{ id: 'a', title: 'Écologie', description: 'Agir' }]}
    emptyLabel="Aucune formation pour ces filtres" onCourseAction={onCourseAction} />);
  const search = screen.getByPlaceholderText('Rechercher une formation...');
  await user.type(search, 'budget');
  const empty = screen.getByRole('region', { name: 'Aucune formation pour ces filtres' });
  await user.click(within(empty).getByRole('button', { name: 'Réinitialiser les filtres' }));
  expect(search).toHaveValue('');
  expect(screen.getByRole('heading', { name: 'Écologie' })).toBeVisible();
  expect(screen.queryByRole('region', { name: 'Aucune formation pour ces filtres' })).not.toBeInTheDocument();
  expect(onCourseAction).not.toHaveBeenCalled();
});
