import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const content = { id: 'r1', title: 'Vidéo', type: 'video' as const, required: true };
const chapter = { id: 'c1', title: 'Chapitre', duration: '10 min', description: '', contents: [content] };
const values = { title: 'Accueil', subtitle: '', description: 'Présentation', category: 'RH', statusValue: 'not-started', instructor: '', duration: '1 h', deadline: '', requirement: 'none' as const, level: 'none' as const, chapters: [chapter] };

import { CourseGeneralSection } from './CourseGeneralSection';

describe('CourseGeneralSection', () => {
  it('keeps the field ids and reports each change', () => {
    const onChange = vi.fn();
    render(<CourseGeneralSection values={values} onChange={onChange} />);
    expect(screen.getByRole('heading', { name: 'Informations générales' })).toBeVisible();
    fireEvent.change(document.getElementById('elearning-course-title')!, { target: { value: 'Nouveau' } });
    fireEvent.change(document.getElementById('elearning-course-deadline')!, { target: { value: '30 juin' } });
    fireEvent.change(document.getElementById('elearning-course-description')!, { target: { value: 'Texte' } });
    expect(onChange.mock.calls).toEqual([['title', 'Nouveau'], ['deadline', '30 juin'], ['description', 'Texte']]); expect(document.getElementById('elearning-course-category')).toBeRequired();
  });
});
