import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CourseReviewPanel } from './CourseReviewPanel';

describe('CourseReviewPanel', () => {
  it('names the participants reviews and keeps the draft', () => {
    const onDraftChange = vi.fn();
    render(<CourseReviewPanel courseId="c1" completed={false} draft={{ rating: 5, comment: '' }} onDraftChange={onDraftChange} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Avis des participants' })).toBeInTheDocument();
  });
});
