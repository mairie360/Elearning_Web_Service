import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CourseChapterOutline } from './CourseChapterOutline';

describe('CourseChapterOutline', () => {
  it('ticks the completed chapters and highlights the next one', () => {
    render(<CourseChapterOutline nextId="b" chapters={[{ id: 'a', title: 'A', duration: '5 min', completed: true }, { id: 'b', title: 'B', duration: '' }]} />);
    expect(screen.getByLabelText('Terminé')).toBeInTheDocument();
    expect(screen.getByText('2. B').closest('li')).toHaveAttribute('aria-current', 'step');
  });

  it('says when the course has no chapter', () => {
    render(<CourseChapterOutline chapters={[]} />);
    expect(screen.getByText('Aucun chapitre disponible.')).toBeVisible();
  });
});
