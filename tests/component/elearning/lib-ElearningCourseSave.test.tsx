import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { ElearningCatalog, type ElearningCourse } from '@/components/ElearningModule/components/ElearningCatalog';

const course: ElearningCourse = {
  id: 'server-course', title: 'Formation existante', description: 'Description serveur',
  category: 'Accueil', duration: '20 min', statusValue: 'not-started',
};

const deferred = () => {
  let resolve!: (value: boolean) => void;
  const promise = new Promise<boolean>((done) => { resolve = done; });
  return { promise, resolve };
};

function openAndFill(mode: 'create' | 'update') {
  fireEvent.click(screen.getByRole('button', { name: mode === 'create' ? 'Nouvelle formation' : 'Modifier Formation existante' }));
  const dialog = screen.getByRole('dialog', { name: mode === 'create' ? 'Nouvelle formation' : 'Modifier la formation' });
  const fields: Array<[string, string, string | undefined]> = [
    ['Titre', 'Saisie conservée', '#elearning-course-title'],
    ['Sous-titre', 'Présentation conservée', undefined],
    ['Description', 'Description conservée', '#elearning-course-description'],
    ['Catégorie', 'Accueil', undefined],
    ['Instructeur', 'Service formation', undefined],
    ['Durée totale', '20 min', undefined],
    ['Échéance', '30 septembre', undefined],
    ['Titre du chapitre', 'Chapitre conservé', undefined],
    ['Description du chapitre', 'Objectif conservé', undefined],
    ['Durée', '20 min', 'input[id^="chapter-duration-"]'],
    ['Titre', 'Ressource conservée', 'input[id^="content-title-"]'],
    ['Lien ou fichier', 'https://example.org/support', undefined],
  ];
  for (const [label, value, selector] of fields) {
    fireEvent.change(within(dialog).getByLabelText(label, { selector }), { target: { value } });
  }
  return dialog;
}

function expectDraft(dialog: HTMLElement) {
  expect(within(dialog).getByLabelText('Titre', { selector: '#elearning-course-title' })).toHaveValue('Saisie conservée');
  expect(within(dialog).getByLabelText('Sous-titre')).toHaveValue('Présentation conservée');
  expect(within(dialog).getByLabelText('Description', { selector: '#elearning-course-description' })).toHaveValue('Description conservée');
  expect(within(dialog).getByLabelText('Instructeur')).toHaveValue('Service formation');
  expect(within(dialog).getByLabelText('Échéance')).toHaveValue('30 septembre');
  expect(within(dialog).getByLabelText('Titre du chapitre')).toHaveValue('Chapitre conservé');
  expect(within(dialog).getByLabelText('Description du chapitre')).toHaveValue('Objectif conservé');
  expect(within(dialog).getByLabelText('Titre', { selector: 'input[id^="content-title-"]' })).toHaveValue('Ressource conservée');
  expect(within(dialog).getByLabelText('Lien ou fichier')).toHaveValue('https://example.org/support');
}

describe.each(['create', 'update'] as const)('confirmed Elearning %s', (mode) => {
  const submitLabel = mode === 'create' ? 'Créer' : 'Enregistrer';

  it.each(['false', 'rejection', 'throw'] as const)('retains every draft value after %s and retries before closing', async (failure) => {
    const save = vi.fn().mockImplementationOnce(() => {
      if (failure === 'throw') throw new Error('Refused');
      if (failure === 'rejection') return Promise.reject(new Error('Refused'));
      return Promise.resolve(false);
    }).mockResolvedValue(true);
    render(<ElearningCatalog courses={[course]} currentUserRole="administrator" onCreateCourse={save} onUpdateCourse={save} />);
    const dialog = openAndFill(mode);
    // MAIR-608: lib Modal layout, only the body scrolls and the actions stay in its footer.
    const form = dialog.querySelector('form');
    const fieldset = dialog.querySelector('fieldset');
    expect(form?.parentElement).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto');
    expect(fieldset?.parentElement).toBe(form);
    expect(fieldset).not.toHaveClass('flex-1', 'overflow-y-auto');
    const footer = within(dialog).getByRole('button', { name: 'Annuler' }).closest('footer');
    expect(footer?.parentElement).toBe(dialog);
    expect(within(footer!).getByRole('button', { name: submitLabel })).toHaveAttribute('form', form?.id);
    fireEvent.click(within(dialog).getByRole('button', { name: submitLabel }));
    await waitFor(() => expect(within(dialog).getByRole('alert')).toHaveTextContent('Vos saisies sont conservées'));
    expectDraft(dialog);
    expect(save).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialog).getByRole('button', { name: submitLabel }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1][1]).toEqual(save.mock.calls[0][1]);
    if (mode === 'update') expect(save.mock.calls[1][0].id).toBe(course.id);
    if (mode === 'create') {
      fireEvent.click(screen.getByRole('button', { name: 'Nouvelle formation' }));
      expect(screen.getByLabelText('Titre', { selector: '#elearning-course-title' })).toHaveValue('');
    }
  });

  it('freezes controls and cancellation while pending, ignores duplicates and preserves edits across refreshed props', async () => {
    const request = deferred();
    const save = vi.fn(() => request.promise);
    const props = { currentUserRole: 'administrator' as const, onCreateCourse: save, onUpdateCourse: save };
    const { rerender } = render(<ElearningCatalog courses={[course]} {...props} />);
    const dialog = openAndFill(mode);
    fireEvent.submit(dialog.querySelector('form')!);
    expect(dialog).toHaveAttribute('aria-busy', 'true');
    expect(within(dialog).getByRole('button', { name: 'Enregistrement…' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Annuler' })).toBeDisabled();
    // The lib Modal keeps its close button enabled; a pending save ignores it (lib ConfirmModal rule).
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fermer' }));
    expect(within(dialog).getByLabelText('Titre', { selector: '#elearning-course-title' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Ajouter un chapitre' })).toBeDisabled();
    fireEvent.submit(dialog.querySelector('form')!);
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(save).toHaveBeenCalledTimes(1);
    expect(dialog).toBeInTheDocument();
    rerender(<ElearningCatalog courses={[{ ...course, description: 'Catalogue actualisé' }]} {...props} />);
    expectDraft(dialog);
    await act(async () => request.resolve(false));
    expectDraft(dialog);
    expect(within(dialog).getByRole('button', { name: submitLabel })).toBeEnabled();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.each([true, undefined])('supports synchronous callback confirmation %s', (confirmed) => {
    const save = vi.fn(() => confirmed);
    render(<ElearningCatalog courses={[course]} currentUserRole="administrator" onCreateCourse={save} onUpdateCourse={save} />);
    const dialog = openAndFill(mode);
    fireEvent.click(within(dialog).getByRole('button', { name: submitLabel }));
    expect(save).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
