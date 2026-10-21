import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const video = { id: 'v', title: 'Introduction', type: 'video' as const, duration: '5 min' };
const pdf = { id: 'p', title: 'Support', type: 'pdf' as const, required: false, href: 'https://example.test/support.pdf', fileName: 'support.pdf' };

import { SelectedChapter } from './SelectedChapter';

describe('SelectedChapter', () => {
  it('counts its contents and completes one in its chapter', async () => {
    const onComplete = vi.fn();
    const chapter = { id: 'c1', title: 'Chapitre 1', duration: '10 min', contents: [video, pdf] };
    render(<SelectedChapter chapter={chapter} busy={false} onComplete={onComplete} canCompleteContent={(content) => content.id === 'v'} />);
    expect(screen.getByRole('heading', { name: 'Chapitre 1' })).toBeVisible(); expect(screen.getByText('2 contenus')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Marquer Support comme terminé' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Marquer Introduction comme terminé' })); expect(onComplete).toHaveBeenCalledWith(chapter, video);
  });
});
