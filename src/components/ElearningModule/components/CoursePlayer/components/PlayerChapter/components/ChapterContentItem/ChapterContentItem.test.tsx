import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChapterContentItem } from './ChapterContentItem';

describe('ChapterContentItem', () => {
  it('opens an https link in a new tab and names its domain (MAIR-703)', () => {
    render(<ul><ChapterContentItem busy={false} canComplete content={{ id: 'l', title: 'Guide', type: 'link', href: 'https://www.cnil.fr/guide' }} /></ul>);
    const link = screen.getByRole('link', { name: /Ouvrir \(www.cnil.fr\)/ });
    expect(link).toHaveAttribute('href', 'https://www.cnil.fr/guide');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it.each(['javascript:alert(1)', 'data:text/html,x', 'http://example.test/', '//evil.test/x'])('never links %s', (href) => {
    render(<ul><ChapterContentItem busy={false} canComplete content={{ id: 'l', title: 'Guide', type: 'link', href }} /></ul>);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText(/Lien non sécurisé/)).toBeVisible();
  });

  it('opens a stored file through the service and completes the content (MAIR-817)', async () => {
    const onDownload = vi.fn(); const onComplete = vi.fn();
    render(<ul><ChapterContentItem busy={false} canComplete onDownload={onDownload} onComplete={onComplete}
      content={{ id: 'p', title: 'Support', type: 'pdf', href: '/documents/support.pdf', fileName: 'support.pdf' }} /></ul>);
    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir le support Support dans un nouvel onglet' }));
    await userEvent.click(screen.getByRole('button', { name: 'Marquer Support comme terminé' }));
    expect(onDownload).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('keeps a link resource a link when the service downloads supports', () => {
    render(<ul><ChapterContentItem busy={false} canComplete onDownload={vi.fn()} content={{ id: 'l', title: 'Guide', type: 'link', href: 'https://www.cnil.fr/guide' }} /></ul>);
    expect(screen.getByRole('link', { name: /Ouvrir \(www.cnil.fr\)/ })).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.queryByRole('button', { name: /Ouvrir le support/ })).not.toBeInTheDocument();
  });

  it.each(['quiz', 'other'] as const)('offers no file to open for a %s, which has none', (type) => {
    render(<ul><ChapterContentItem busy={false} canComplete onDownload={vi.fn()} content={{ id: 'q', title: 'Quiz', type }} /></ul>);
    expect(screen.queryByRole('button', { name: /Ouvrir le support/ })).not.toBeInTheDocument();
  });
});
