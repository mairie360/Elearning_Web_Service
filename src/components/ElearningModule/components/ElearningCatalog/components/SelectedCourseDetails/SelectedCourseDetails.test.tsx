import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SelectedCourseDetails } from './SelectedCourseDetails';

const chapters = [
  { id: 'a', title: 'Introduction', duration: '5 min', contents: [{ id: 'a1', title: 'Vidéo', type: 'video' as const, completed: true }] },
  { id: 'b', title: 'Cas pratiques', duration: '10 min', contents: [{ id: 'b1', title: 'Quiz', type: 'quiz' as const }] },
];
const course = {
  id: 'c', title: 'RGPD', description: 'Données personnelles', instructor: 'DPO', duration: '15 min', deadline: '30 juin 2026',
  titleBadge: { label: 'Obligatoire', variant: 'mandatory' as const }, statusValue: 'in-progress', progress: 50,
  ratingDistribution: { 5: 1, 3: 1 },
};
const details = { title: 'RGPD', description: 'Données personnelles', chapters };

describe('SelectedCourseDetails', () => {
  it('presents the course, the progress and continues it from the footer', async () => {
    const onPlay = vi.fn();
    render(<SelectedCourseDetails course={course} details={details} starting={false} startError={null} onClose={vi.fn()} onPlay={onPlay} />);
    const dialog = screen.getByRole('dialog', { name: 'RGPD' });
    expect(within(dialog).getByText('Obligatoire')).toBeVisible();
    expect(within(dialog).getByText('DPO')).toBeVisible();
    expect(within(dialog).getByText('1 / 2 chapitres')).toBeVisible();
    expect(within(dialog).getByText('Prochain chapitre')).toBeVisible();
    expect(within(dialog).getByRole('progressbar', { name: 'Progression du cours' })).toHaveAttribute('aria-valuenow', '50');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Continuer' }));
    expect(onPlay).toHaveBeenCalledWith(course);
  });

  it('starts a course not started, cannot be closed while starting and shows a refused start', async () => {
    const onStart = vi.fn(); const onClose = vi.fn();
    const notStarted = { ...course, statusValue: 'not-started', progress: 0 };
    const { rerender } = render(<SelectedCourseDetails course={notStarted} details={details} starting={false} startError={null} onClose={onClose} onStart={onStart} />);
    expect(screen.getByText(/pas encore commencé/)).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Commencer' }));
    expect(onStart).toHaveBeenCalledWith(notStarted);
    rerender(<SelectedCourseDetails course={notStarted} details={details} starting startError={null} onClose={onClose} onStart={onStart} />);
    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onClose).not.toHaveBeenCalled();
    rerender(<SelectedCourseDetails course={notStarted} details={details} starting={false} startError="Refusé" onClose={onClose} onStart={onStart} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Refusé');
  });

  it('offers « Revoir » on a finished course and tells it is not rated yet', async () => {
    const onPlay = vi.fn();
    render(<SelectedCourseDetails course={{ ...course, statusValue: 'completed', progress: 100 }}
      details={{ ...details, completionRating: { submitted: false } }} starting={false} startError={null} onClose={vi.fn()} onPlay={onPlay} />);
    expect(screen.getByText('Formation non notée')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Revoir' }));
    expect(onPlay).toHaveBeenCalled();
  });

  it('MAIR-1224 offers « Agents inscrits » to the administrator only', async () => {
    const onLearners = vi.fn();
    const { rerender } = render(<SelectedCourseDetails course={course} details={details} starting={false} startError={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Agents inscrits' })).toBeNull();
    rerender(<SelectedCourseDetails course={course} details={details} starting={false} startError={null} onClose={vi.fn()} onLearners={onLearners} />);
    await userEvent.click(screen.getByRole('button', { name: 'Agents inscrits' }));
    expect(onLearners).toHaveBeenCalledWith(course);
  });
});
