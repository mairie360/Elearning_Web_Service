import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { ElearningCatalog, type ElearningCourse } from '@/components/elearning/ElearningCatalog';
import { ElearningCourseFormModal, type ElearningCourseFormValues } from '@/components/elearning/ElearningCourseFormModal';
import type { ElearningFilterOption } from '@/components/elearning/ElearningFilterSelect';

const course: ElearningCourse = {
  id: 'confirmed-course', title: 'Formation confirmée', description: 'Présentation',
  category: 'Accueil', duration: '20 min', statusValue: 'not-started',
};
const initialValues: ElearningCourseFormValues = {
  title: 'Formation confirmée', subtitle: '', description: 'Présentation', category: 'Accueil',
  statusValue: 'not-started', instructor: '', duration: '20 min', deadline: '',
  requirement: 'none', level: 'none', chapters: [{ id: 'chapter', title: 'Chapitre', duration: '20 min', contents: [] }],
};
const limitedOptions: ElearningFilterOption[] = [{ label: 'En cours reçu', value: 'in-progress' }];

const openForm = (mode: 'create' | 'update') => {
  fireEvent.click(screen.getByRole('button', {
    name: mode === 'create' ? 'Nouvelle formation' : 'Modifier Formation confirmée',
  }));
  const dialog = screen.getByRole('dialog', {
    name: mode === 'create' ? 'Nouvelle formation' : 'Modifier la formation',
  });
  return { dialog, status: within(dialog).getByLabelText<HTMLSelectElement>('Statut') };
};

describe.each(['create', 'update'] as const)('Elearning author status in %s mode', (mode) => {
  it.each([
    ['empty', []],
    ['filter reset only', [{ label: 'Tous les statuts', value: 'all' }]],
    ['missing current value', limitedOptions],
  ] as Array<[string, ElearningFilterOption[]]>)('displays the exact draft status with %s choices', async (_name, options) => {
    const save = vi.fn().mockResolvedValue(false);
    const original = options.map((option) => ({ ...option }));
    render(<ElearningCatalog courses={[course]} statuses={options} currentUserRole="administrator"
      onCreateCourse={save} onUpdateCourse={save} />);
    const { dialog, status } = openForm(mode);
    expect(status).toHaveValue('not-started');
    expect(status.selectedOptions[0]).toHaveTextContent('Non commencé');
    expect(status.selectedOptions[0]).toBeDisabled();
    expect(within(status).queryByRole('option', { name: 'Tous les statuts' })).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('Titre', { selector: '#elearning-course-title' }), {
      target: { value: 'Titre conservé' },
    });
    fireEvent.change(within(dialog).getByLabelText('Catégorie'), { target: { value: 'Accueil' } });
    fireEvent.change(within(dialog).getByLabelText('Durée totale'), { target: { value: '20 min' } });
    fireEvent.submit(dialog.querySelector('form')!);
    await waitFor(() => expect(within(dialog).getByRole('alert')).toBeInTheDocument());
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][1].statusValue).toBe('not-started');
    expect(status).toHaveValue('not-started');
    expect(options).toEqual(original);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tous les statuts' }));
    expect(screen.queryAllByRole('option').map((option) => option.textContent)).toEqual(original.map((option) => option.label));
  });
});

describe('Elearning author status choices', () => {
  const props = { isOpen: true, title: 'Modifier la formation', submitLabel: 'Enregistrer',
    initialValues, onCancel: vi.fn() };

  it('retains received labels, order and disabled state without adding a duplicate current choice', async () => {
    const options: ElearningFilterOption[] = [
      { label: 'Tous', value: 'all' },
      { label: 'Terminé reçu', value: 'completed', disabled: true },
      { label: 'À démarrer reçu', value: 'not-started' },
      ...limitedOptions,
    ];
    const save = vi.fn().mockResolvedValue(false);
    render(<ElearningCourseFormModal {...props} statusOptions={options} onSubmit={save} />);
    const status = screen.getByLabelText<HTMLSelectElement>('Statut');
    expect(Array.from(status.options).map((option) => [option.value, option.textContent, option.disabled])).toEqual([
      ['completed', 'Terminé reçu', true], ['not-started', 'À démarrer reçu', false],
      ['in-progress', 'En cours reçu', false],
    ]);
    fireEvent.change(status, { target: { value: 'completed' } });
    expect(status).toHaveValue('not-started');
    fireEvent.change(status, { target: { value: 'in-progress' } });
    expect(status).toHaveValue('in-progress');
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save.mock.calls[0][0].statusValue).toBe('in-progress');
  });

  it.each(['completed', 'custom<&status>', ''])('truthfully represents current value %j without an editable fallback', (statusValue) => {
    render(<ElearningCourseFormModal {...props} initialValues={{ ...initialValues, statusValue }}
      statusOptions={limitedOptions} onSubmit={vi.fn()} />);
    const status = screen.getByLabelText<HTMLSelectElement>('Statut');
    expect(status).toHaveValue(statusValue);
    expect(status.selectedOptions[0]).toBeDisabled();
    expect(status.selectedOptions[0].textContent?.trim()).not.toBe('');
    if (statusValue === 'custom<&status>') expect(status.selectedOptions[0]).toHaveTextContent(statusValue);
    expect(Array.from(status.options).filter((option) => !option.disabled).map((option) => option.value))
      .toEqual(['in-progress']);
  });

  it('keeps a received disabled current option selected and ignores unavailable status changes', () => {
    render(<ElearningCourseFormModal {...props} statusOptions={[
      { label: 'Valeur reçue indisponible', value: 'not-started', disabled: true },
      { label: 'Tous', value: 'all' },
      ...limitedOptions,
    ]} onSubmit={vi.fn()} />);
    const status = screen.getByLabelText<HTMLSelectElement>('Statut');
    expect(status).toHaveValue('not-started');
    expect(status.selectedOptions[0]).toHaveTextContent('Valeur reçue indisponible');
    expect(status.selectedOptions[0]).toBeDisabled();
    fireEvent.change(status, { target: { value: 'all' } });
    expect(status).toHaveValue('not-started');
    fireEvent.change(status, { target: { value: 'unknown' } });
    expect(status).toHaveValue('not-started');
  });

  it('preserves a selected draft across option refreshes, a pending refusal and an explicit retry', async () => {
    let resolve!: (confirmed: boolean) => void;
    const pending = new Promise<boolean>((done) => { resolve = done; });
    const save = vi.fn().mockReturnValueOnce(pending).mockResolvedValue(false);
    const { rerender } = render(<ElearningCourseFormModal {...props} statusOptions={limitedOptions} onSubmit={save} />);
    const status = screen.getByLabelText<HTMLSelectElement>('Statut');
    fireEvent.change(status, { target: { value: 'in-progress' } });
    fireEvent.change(screen.getByLabelText('Titre', { selector: '#elearning-course-title' }), {
      target: { value: 'Brouillon conservé' },
    });
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);
    expect(save).toHaveBeenCalledTimes(1);
    fireEvent.change(status, { target: { value: 'not-started' } });
    expect(status).toHaveValue('in-progress');
    rerender(<ElearningCourseFormModal {...props} initialValues={{ ...initialValues, statusValue: 'completed' }}
      statusOptions={[]} onSubmit={save} />);
    expect(status).toHaveValue('in-progress');
    expect(status).toBeDisabled();
    expect(status.selectedOptions[0]).toBeDisabled();
    await act(async () => resolve(false));
    expect(status).toHaveValue('in-progress');
    expect(screen.getByLabelText('Titre', { selector: '#elearning-course-title' })).toHaveValue('Brouillon conservé');
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(save.mock.calls[1][0]).toEqual(save.mock.calls[0][0]);
    rerender(<ElearningCourseFormModal {...props} statusOptions={limitedOptions} onSubmit={save} />);
    expect(Array.from(status.options).filter((option) => option.value === 'in-progress')).toHaveLength(1);
    expect(status.selectedOptions[0]).toHaveTextContent('En cours reçu');
    expect(status.selectedOptions[0]).not.toBeDisabled();
  });
});
