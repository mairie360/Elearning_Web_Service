import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const video = { id: 'v', title: 'Introduction', type: 'video' as const, duration: '5 min' };
const pdf = { id: 'p', title: 'Support', type: 'pdf' as const, required: false, href: 'https://example.test/support.pdf', fileName: 'support.pdf' };

import { ChapterList } from './ChapterList';

describe('ChapterList', () => {
  it('presses the selected chapter and selects another', async () => {
    const onSelect = vi.fn();
    const { rerender } = render(<ChapterList chapters={[{ id: 'a', title: 'A', duration: '5 min', contents: [video] }, { id: 'b', title: 'B', duration: '', completed: true }]} selectedId="a" onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: /A/ })).toHaveAttribute('aria-pressed', 'true'); expect(screen.getByText('1 contenu')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: /B/ })); expect(onSelect).toHaveBeenCalledWith('b');
    rerender(<ChapterList chapters={[]} onSelect={onSelect} />); expect(screen.getByText('Aucun chapitre disponible.')).toBeVisible();
  });
});
