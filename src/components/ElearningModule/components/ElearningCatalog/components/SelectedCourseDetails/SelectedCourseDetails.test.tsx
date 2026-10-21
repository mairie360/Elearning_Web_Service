import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const course = { id: 'c', title: 'RGPD', description: 'Données personnelles', ratingDistribution: { 5: 1, 3: 1 } };

import { SelectedCourseDetails } from './SelectedCourseDetails';

describe('SelectedCourseDetails', () => {
  it('runs the detail callback first, then the catalogue host', async () => {
    const order: string[] = [];
    const details = { title: 'RGPD', description: 'Données', completed: true, chapters: [], completionRating: { title: 'Noter cette formation', onSubmit: () => { order.push('detail'); return true; } } };
    const onRatingSubmit = vi.fn((_course: unknown, ..._rest: unknown[]) => { order.push('host'); return true; });
    render(<SelectedCourseDetails course={course} details={details} starting={false} startError={null} allowRatingEdits={false} onClose={vi.fn()} onRatingSubmit={onRatingSubmit} />);
    expect(screen.getByRole('dialog', { name: 'RGPD' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Donner la note 4 sur 5' })); await userEvent.click(screen.getByRole('button', { name: 'Envoyer la note' }));
    expect(order).toEqual(['detail', 'host']); expect(onRatingSubmit.mock.calls[0][0]).toBe(course);
  });
});
