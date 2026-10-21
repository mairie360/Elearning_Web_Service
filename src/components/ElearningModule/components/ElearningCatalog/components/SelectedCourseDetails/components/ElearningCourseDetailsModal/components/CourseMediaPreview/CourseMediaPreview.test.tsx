import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const video = { id: 'v', title: 'Introduction', type: 'video' as const, duration: '5 min' };
const pdf = { id: 'p', title: 'Support', type: 'pdf' as const, required: false, href: 'https://example.test/support.pdf', fileName: 'support.pdf' };

import { CourseMediaPreview } from './CourseMediaPreview';

describe('CourseMediaPreview', () => {
  it('names the main content or says there is none', () => {
    const { rerender } = render(<CourseMediaPreview content={video} />);
    expect(screen.getByText('Vidéo')).toBeVisible(); expect(screen.getByText('Introduction')).toBeVisible();
    rerender(<CourseMediaPreview />); expect(screen.getByText('Aucun contenu disponible pour cette formation.')).toBeVisible();
  });
});
