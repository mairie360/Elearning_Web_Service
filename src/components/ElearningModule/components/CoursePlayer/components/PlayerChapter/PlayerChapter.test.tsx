import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PlayerChapter } from './PlayerChapter';

describe('PlayerChapter', () => {
  it('reads the chapter: main content, position, title and contents', async () => {
    const onComplete = vi.fn();
    render(<PlayerChapter index={1} count={3} busy={false} onComplete={onComplete} chapter={{
      id: 'b', title: 'Cas pratiques', duration: '10 min', description: 'Mise en situation',
      contents: [{ id: 'v', title: 'Vidéo du cas', type: 'video' }, { id: 'p', title: 'Fiche', type: 'pdf', required: false }],
    }} />);
    expect(screen.getByText('Chapitre 2 sur 3 · 10 min')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Cas pratiques' })).toBeVisible();
    expect(screen.getByText('PDF · Optionnel')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Marquer Vidéo du cas comme terminé' }));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ id: 'v' }));
  });

  it('says when a chapter has no content and shows a completed chapter', () => {
    render(<PlayerChapter index={0} count={1} busy={false} chapter={{ id: 'a', title: 'Vide', duration: '', completed: true }} />);
    expect(screen.getByText('Aucun contenu disponible pour ce chapitre.')).toBeVisible();
    expect(screen.getByText('Chapitre terminé')).toBeVisible();
  });
});
