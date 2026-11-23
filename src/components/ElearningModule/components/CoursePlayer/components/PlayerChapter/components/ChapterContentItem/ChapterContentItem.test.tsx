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

  it('downloads through the service and completes the content', async () => {
    const onDownload = vi.fn(); const onComplete = vi.fn();
    render(<ul><ChapterContentItem busy={false} canComplete onDownload={onDownload} onComplete={onComplete}
      content={{ id: 'p', title: 'Support', type: 'pdf', href: '/documents/support.pdf', fileName: 'support.pdf' }} /></ul>);
    await userEvent.click(screen.getByRole('button', { name: 'Télécharger le support' }));
    await userEvent.click(screen.getByRole('button', { name: 'Marquer Support comme terminé' }));
    expect(onDownload).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
