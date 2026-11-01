import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
const content = { id: 'r1', title: 'Vidéo', type: 'video' as const, required: true };
const chapter = { id: 'c1', title: 'Chapitre', duration: '10 min', description: '', contents: [content] };
const values = { title: 'Accueil', subtitle: '', description: 'Présentation', category: 'RH', statusValue: 'not-started', instructor: '', duration: '1 h', deadline: '', requirement: 'none' as const, level: 'none' as const, chapters: [chapter] };

import { CoursePresentationSection, authorStatusOptions } from './CoursePresentationSection';

describe('CoursePresentationSection', () => {
  it('drops « all » and shows an unknown draft status disabled first', () => {
    expect(authorStatusOptions([{ value: 'all', label: 'Tous' }, { value: 'in-progress', label: 'En cours' }], 'in-progress')).toEqual([{ value: 'in-progress', label: 'En cours', disabled: undefined }]);
    expect(authorStatusOptions([], 'completed')).toEqual([{ value: 'completed', label: 'Terminé (statut actuel)', disabled: true }]);
  });
  it('reports status, requirement and level', () => {
    const handlers = { onStatusChange: vi.fn(), onRequirementChange: vi.fn(), onLevelChange: vi.fn() };
    render(<CoursePresentationSection values={values} statusOptions={[{ value: 'not-started', label: 'Non commencé' }, { value: 'completed', label: 'Terminé' }]} {...handlers} />);
    fireEvent.change(screen.getByLabelText('Statut'), { target: { value: 'completed' } }); fireEvent.change(screen.getByLabelText('Type de parcours'), { target: { value: 'mandatory' } }); fireEvent.change(screen.getByLabelText('Niveau'), { target: { value: 'advanced' } });
    expect(handlers.onStatusChange).toHaveBeenCalledWith('completed'); expect(handlers.onRequirementChange).toHaveBeenCalledWith('mandatory'); expect(handlers.onLevelChange).toHaveBeenCalledWith('advanced');
  });
});
