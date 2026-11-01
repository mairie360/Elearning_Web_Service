import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const content = { id: 'r1', title: 'Vidéo', type: 'video' as const, required: true };
const chapter = { id: 'c1', title: 'Chapitre', duration: '10 min', description: '', contents: [content] };

import { CourseChapterEditor } from './CourseChapterEditor';

describe('CourseChapterEditor', () => {
  it('edits its fields and adds a resource', async () => {
    const props = { onChange: vi.fn(), onRemove: vi.fn(), onAddContent: vi.fn(), onContentChange: vi.fn(), onContentRemove: vi.fn() };
    render(<CourseChapterEditor chapter={chapter} chapterIndex={1} removable {...props} />);
    expect(screen.getByRole('heading', { name: 'Chapitre 2' })).toBeVisible();
    fireEvent.change(document.getElementById('chapter-duration-c1')!, { target: { value: '20 min' } }); expect(props.onChange).toHaveBeenCalledWith({ duration: '20 min' });
    fireEvent.change(document.getElementById('content-title-r1')!, { target: { value: 'Nouveau titre' } }); expect(props.onContentChange).toHaveBeenCalledWith('r1', { title: 'Nouveau titre' });
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter une ressource' })); await userEvent.click(screen.getByRole('button', { name: 'Supprimer le chapitre 2' }));
    expect(props.onAddContent).toHaveBeenCalledTimes(1); expect(props.onRemove).toHaveBeenCalledTimes(1);
  });
});
