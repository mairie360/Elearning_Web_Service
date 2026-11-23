import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ResumeCard } from './ResumeCard';

const course = { id: 'c', title: 'RGPD', description: '', category: 'Juridique', deadline: '30 juin 2026' };

describe('ResumeCard', () => {
  it('offers to resume the course in progress at its chapter', async () => {
    const onResume = vi.fn(); const onShowDetails = vi.fn();
    render(<ResumeCard busy={false} onResume={onResume} onShowDetails={onShowDetails}
      suggestion={{ course, kind: 'resume', chapterIndex: 2, chapterCount: 3, chapterTitle: 'Cas pratiques', completedChapters: 1, progress: 33 }} />);
    expect(screen.getByText('Reprendre où vous en étiez')).toBeVisible();
    expect(screen.getByText('Juridique · Avant le 30 juin 2026')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Reprendre' }));
    await userEvent.click(screen.getByRole('button', { name: 'Voir la fiche' }));
    expect(onResume).toHaveBeenCalledWith(course);
    expect(onShowDetails).toHaveBeenCalledWith(course);
  });

  it('suggests the next mandatory course to start', () => {
    render(<ResumeCard busy onResume={vi.fn()} onShowDetails={vi.fn()}
      suggestion={{ course, kind: 'priority', chapterIndex: 1, chapterCount: 0, completedChapters: 0, progress: 0 }} />);
    expect(screen.getByText('À commencer en priorité')).toBeVisible();
    expect(screen.getByRole('button', { name: /Commencer/ })).toHaveAttribute('aria-busy', 'true');
  });
});
