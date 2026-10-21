import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const content = { id: 'r1', title: 'Vidéo', type: 'video' as const, required: true };
const chapter = { id: 'c1', title: 'Chapitre', duration: '10 min', description: '', contents: [content] };

import { CourseProgramSection } from './CourseProgramSection';

describe('CourseProgramSection', () => {
  it('keeps the last chapter and adds chapters', async () => {
    const props = { onAddChapter: vi.fn(), onChapterChange: vi.fn(), onChapterRemove: vi.fn(), onAddContent: vi.fn(), onContentChange: vi.fn(), onContentRemove: vi.fn() };
    render(<CourseProgramSection chapters={[chapter]} {...props} />);
    expect(screen.getByRole('button', { name: 'Supprimer le chapitre 1' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter un chapitre' })); expect(props.onAddChapter).toHaveBeenCalledTimes(1);
  });
});
