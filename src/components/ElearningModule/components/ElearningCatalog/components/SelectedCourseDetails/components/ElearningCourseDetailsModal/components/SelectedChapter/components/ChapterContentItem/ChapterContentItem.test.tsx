import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const video = { id: 'v', title: 'Introduction', type: 'video' as const, duration: '5 min' };
const pdf = { id: 'p', title: 'Support', type: 'pdf' as const, required: false, href: 'https://example.test/support.pdf', fileName: 'support.pdf' };

import { ChapterContentItem } from './ChapterContentItem';

describe('ChapterContentItem', () => {
  it('labels optional contents, opens links and completes once allowed', async () => {
    const onComplete = vi.fn();
    const { rerender } = render(<ChapterContentItem content={pdf} busy={false} canComplete onComplete={onComplete} />);
    expect(screen.getByText('Optionnel')).toBeVisible(); expect(screen.getByRole('link', { name: 'Ouvrir' })).toHaveAttribute('href', pdf.href); expect(screen.getByText('support.pdf')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Marquer Support comme terminé' })); expect(onComplete).toHaveBeenCalledWith(pdf);
    rerender(<ChapterContentItem content={{ ...pdf, completed: true }} busy={false} canComplete onComplete={onComplete} />);
    expect(screen.getByRole('button', { name: 'Support terminé' })).toBeDisabled();
    rerender(<ChapterContentItem content={video} busy={false} canComplete={false} onComplete={onComplete} />);
    expect(screen.getByRole('button', { name: 'Marquer Introduction comme terminé' })).toBeDisabled();
  });
  it('downloads through the host and shows the pending label', async () => {
    const onDownload = vi.fn();
    const { rerender } = render(<ChapterContentItem content={pdf} busy={false} canComplete onDownload={onDownload} />);
    expect(screen.queryByRole('link')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Télécharger le support' })); expect(onDownload).toHaveBeenCalledWith(pdf);
    rerender(<ChapterContentItem content={pdf} busy canComplete onDownload={onDownload} />);
    expect(screen.getByRole('button', { name: 'Téléchargement…' })).toBeDisabled();
  });
});
