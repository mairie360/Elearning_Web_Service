import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@mairie360/lib-components/primitives';

import { CoursePlayer } from './CoursePlayer';

const course = (completed = false) => ({
  id: 'c', title: 'RGPD', description: '', category: 'Juridique', details: {
    title: 'RGPD', description: '', completionRating: { submitted: false },
    chapters: [
      { id: 'a', title: 'Introduction', duration: '5 min', contents: [{ id: 'a1', title: 'Vidéo', type: 'video' as const, completed: true }] },
      { id: 'b', title: 'Cas pratiques', duration: '10 min', contents: [
        { id: 'b1', title: 'Quiz', type: 'quiz' as const, completed },
        { id: 'b2', title: 'Fiche', type: 'pdf' as const, completed },
      ] },
    ],
  },
});
const renderPlayer = (props: Partial<React.ComponentProps<typeof CoursePlayer>> = {}) =>
  render(<ToastProvider regionLabel="Notifications"><CoursePlayer course={course()} onExit={vi.fn()} {...props} /></ToastProvider>);

describe('CoursePlayer', () => {
  it('opens at the first chapter to do, with the summary, the progress and the chapter actions', async () => {
    const onExit = vi.fn();
    renderPlayer({ onExit, onContentComplete: vi.fn() });
    expect(screen.getByRole('heading', { level: 1, name: 'RGPD' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Cas pratiques' })).toBeVisible();
    expect(screen.getByText('Chapitre 2 sur 2 · 10 min')).toBeVisible();
    expect(screen.getByRole('progressbar', { name: '1 / 2 chapitres' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Terminer' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Précédent' }));
    expect(screen.getByRole('heading', { name: 'Introduction' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Quitter la formation' }));
    expect(onExit).toHaveBeenCalled();
  });

  it('marks every content of the chapter done, one confirmation after the other, and stops on a refusal', async () => {
    const onContentComplete = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    renderPlayer({ onContentComplete });
    await userEvent.click(screen.getByRole('button', { name: 'Marquer comme terminé' }));
    await waitFor(() => expect(onContentComplete).toHaveBeenCalledTimes(2));
    expect(onContentComplete.mock.calls.map(([, payload]) => payload.content.id)).toEqual(['b1', 'b2']);
    expect(onContentComplete.mock.calls[1][1].completed).toBe(true);
  });

  it('shows the end screen once every chapter is done and returns to the catalogue', async () => {
    const onExit = vi.fn(); const onRatingSubmit = vi.fn().mockResolvedValue(true);
    render(<ToastProvider regionLabel="Notifications"><CoursePlayer course={course(true)} onExit={onExit} onRatingSubmit={onRatingSubmit} onContentComplete={vi.fn()} /></ToastProvider>);
    expect(screen.getAllByText('Chapitre terminé').length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    await userEvent.click(screen.getByRole('button', { name: 'Terminer' }));
    expect(screen.getByRole('heading', { name: 'Formation terminée' })).toBeVisible();
    await userEvent.click(screen.getByRole('radio', { name: '5 étoiles sur 5' }));
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer la note' }));
    expect(onRatingSubmit).toHaveBeenCalledWith(expect.objectContaining({ id: 'c' }), 5);
    await userEvent.click(screen.getByRole('button', { name: 'Retour au catalogue' }));
    expect(onExit).toHaveBeenCalled();
  });

  it('reports a download through a toast', async () => {
    const onContentDownload = vi.fn().mockRejectedValue(new Error('Support indisponible'));
    renderPlayer({ onContentDownload });
    await userEvent.click(screen.getAllByRole('button', { name: 'Télécharger le support' })[0]);
    const region = await screen.findByRole('region', { name: 'Notifications' });
    expect(within(region).getByText('Téléchargement impossible')).toBeVisible();
  });

  it('accepts the confirmed completion of the service even without required contents', async () => {
    const done = { id: 'c', title: 'RGPD', description: '', details: { title: 'RGPD', description: '', completed: true, progress: 100,
      chapters: [{ id: 'a', title: 'Seul chapitre', duration: '', completed: true, contents: [] }] } };
    render(<ToastProvider regionLabel="Notifications"><CoursePlayer course={done} onExit={vi.fn()} onContentComplete={vi.fn()} /></ToastProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Terminer' }));
    expect(screen.getByRole('heading', { name: 'Formation terminée' })).toBeVisible();
  });
});
