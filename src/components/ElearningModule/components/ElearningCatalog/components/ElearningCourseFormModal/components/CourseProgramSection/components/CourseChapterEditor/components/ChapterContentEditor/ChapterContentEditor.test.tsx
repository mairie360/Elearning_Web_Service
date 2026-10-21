import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const content = { id: 'r1', title: 'Vidéo', type: 'video' as const, required: true };
const chapter = { id: 'c1', title: 'Chapitre', duration: '10 min', description: '', contents: [content] };

import { ChapterContentEditor } from './ChapterContentEditor';

describe('ChapterContentEditor', () => {
  it('stores a link as href, a file as fileName, and toggles the required flag', async () => {
    const onChange = vi.fn(); const onRemove = vi.fn();
    const { rerender } = render(<ChapterContentEditor content={content} contentIndex={0} chapterIndex={0} removable={false} onChange={onChange} onRemove={onRemove} />);
    expect(screen.getByRole('button', { name: 'Supprimer la ressource 1 du chapitre 1' })).toBeDisabled();
    fireEvent.change(document.getElementById('content-resource-r1')!, { target: { value: 'cours.pdf' } }); expect(onChange).toHaveBeenLastCalledWith({ fileName: 'cours.pdf', href: undefined });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Ressource obligatoire pour terminer la formation' })); expect(onChange).toHaveBeenLastCalledWith({ required: false });
    rerender(<ChapterContentEditor content={{ ...content, type: 'link' }} contentIndex={1} chapterIndex={0} removable onChange={onChange} onRemove={onRemove} />);
    fireEvent.change(document.getElementById('content-resource-r1')!, { target: { value: 'https://x.test' } }); expect(onChange).toHaveBeenLastCalledWith({ href: 'https://x.test', fileName: undefined });
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer la ressource 2 du chapitre 1' })); expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
