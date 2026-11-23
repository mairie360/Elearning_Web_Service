import { it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ElearningCourseFormModal, type ElearningCourseFormValues } from './ElearningCourseFormModal';
import { axe } from 'jest-axe';
const initialValues: ElearningCourseFormValues = { title: 'Accueil', subtitle: '', description: 'Description', category: 'Agents', statusValue: 'not-started', instructor: 'Anne', duration: '20min', deadline: '', requirement: 'none', level: 'beginner', chapters: [{ id: 'c1', title: 'Chapitre', duration: '20min', contents: [] }] };
it('preserves edited authoring values after a refused save and supports Escape cancellation', async () => { const user = userEvent.setup(); const onCancel = vi.fn(); const onSubmit = vi.fn().mockResolvedValue(false); const { container } = render(<ElearningCourseFormModal isOpen title="Modifier la formation" submitLabel="Enregistrer" initialValues={initialValues} statusOptions={[{ value: 'not-started', label: 'Non commencé' }]} onCancel={onCancel} onSubmit={onSubmit} />); fireEvent.change(screen.getByLabelText('Titre', { selector: '#elearning-course-title' }), { target: { value: 'Nouvel accueil' } }); await user.click(screen.getByRole('button', { name: 'Enregistrer' })); expect(await screen.findByRole('alert')).toBeVisible(); expect(screen.getByLabelText('Titre', { selector: '#elearning-course-title' })).toHaveValue('Nouvel accueil'); expect(onSubmit.mock.calls[0][0].title).toBe('Nouvel accueil'); await user.keyboard('{Escape}'); expect(onCancel).toHaveBeenCalledTimes(1); expect((await axe(container)).violations).toEqual([]); });

it('MAIR-932 shows the errors under the required fields, focuses the first one and sends nothing', async () => {
  const user = userEvent.setup(); const onSubmit = vi.fn();
  render(<ElearningCourseFormModal isOpen title="Nouvelle formation" submitLabel="Créer" initialValues={{ ...initialValues, title: '', description: '' }} statusOptions={[]} onCancel={vi.fn()} onSubmit={onSubmit} />);
  await user.click(screen.getByRole('button', { name: 'Créer' }));
  expect(screen.getByText('Saisissez le titre de la formation.')).toBeVisible();
  expect(screen.getByText('Saisissez la description de la formation.')).toBeVisible();
  expect(document.activeElement).toBe(document.getElementById('elearning-course-title'));
  expect(onSubmit).not.toHaveBeenCalled();
});

it('MAIR-703 refuses an unsafe link address before sending', async () => {
  const user = userEvent.setup(); const onSubmit = vi.fn();
  const values = { ...initialValues, chapters: [{ id: 'c1', title: 'Chapitre', duration: '5 min', contents: [{ id: 'l1', title: 'Guide', type: 'link' as const, href: 'javascript:alert(1)' }] }] };
  render(<ElearningCourseFormModal isOpen title="Nouvelle formation" submitLabel="Créer" initialValues={values} statusOptions={[]} onCancel={vi.fn()} onSubmit={onSubmit} />);
  await user.click(screen.getByRole('button', { name: 'Créer' }));
  expect(screen.getByText('Saisissez une adresse sécurisée commençant par https://.')).toBeVisible();
  expect(onSubmit).not.toHaveBeenCalled();
});

it('MAIR-932 confirms before removing a chapter; « Annuler » keeps it', async () => {
  const user = userEvent.setup(); const onChapterRemoved = vi.fn();
  const values = { ...initialValues, chapters: [initialValues.chapters[0], { id: 'c2', title: 'Second', duration: '5 min', contents: [] }] };
  render(<ElearningCourseFormModal isOpen title="Modifier la formation" submitLabel="Enregistrer" initialValues={values} statusOptions={[]} onCancel={vi.fn()} onSubmit={vi.fn()} onChapterRemoved={onChapterRemoved} />);
  await user.click(screen.getByRole('button', { name: 'Supprimer le chapitre 2' }));
  const confirm = screen.getByRole('alertdialog', { name: /Supprimer ce chapitre/ });
  expect(confirm).toHaveTextContent('« Second »');
  await user.click(within(confirm).getByRole('button', { name: 'Annuler' }));
  expect(screen.getByRole('heading', { name: 'Chapitre 2' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Supprimer le chapitre 2' }));
  await user.click(within(screen.getByRole('alertdialog', { name: /Supprimer ce chapitre/ })).getByRole('button', { name: 'Supprimer' }));
  expect(screen.queryByRole('heading', { name: 'Chapitre 2' })).not.toBeInTheDocument();
  expect(onChapterRemoved).toHaveBeenCalledTimes(1);
});
