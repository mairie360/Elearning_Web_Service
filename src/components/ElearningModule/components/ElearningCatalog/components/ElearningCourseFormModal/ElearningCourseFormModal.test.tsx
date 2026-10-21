import { it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ElearningCourseFormModal, type ElearningCourseFormValues } from './ElearningCourseFormModal';
import { axe } from 'jest-axe';
const initialValues: ElearningCourseFormValues = { title: 'Accueil', subtitle: '', description: 'Description', category: 'Agents', statusValue: 'not-started', instructor: 'Anne', duration: '20min', deadline: '', requirement: 'none', level: 'beginner', chapters: [{ id: 'c1', title: 'Chapitre', duration: '20min', contents: [] }] };
it('preserves edited authoring values after a refused save and supports Escape cancellation', async () => { const user = userEvent.setup(); const onCancel = vi.fn(); const onSubmit = vi.fn().mockResolvedValue(false); const { container } = render(<ElearningCourseFormModal isOpen title="Modifier la formation" submitLabel="Enregistrer" initialValues={initialValues} statusOptions={[{ value: 'not-started', label: 'Non commencé' }]} onCancel={onCancel} onSubmit={onSubmit} />); fireEvent.change(screen.getByLabelText('Titre', { selector: '#elearning-course-title' }), { target: { value: 'Nouvel accueil' } }); await user.click(screen.getByRole('button', { name: 'Enregistrer' })); expect(await screen.findByRole('alert')).toBeVisible(); expect(screen.getByLabelText('Titre', { selector: '#elearning-course-title' })).toHaveValue('Nouvel accueil'); expect(onSubmit.mock.calls[0][0].title).toBe('Nouvel accueil'); await user.keyboard('{Escape}'); expect(onCancel).toHaveBeenCalledTimes(1); expect((await axe(container)).violations).toEqual([]); });
