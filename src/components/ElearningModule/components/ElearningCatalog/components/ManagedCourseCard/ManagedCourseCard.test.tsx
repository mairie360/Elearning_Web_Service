import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const course = { id: 'c', title: 'RGPD', description: 'Données personnelles', ratingDistribution: { 5: 1, 3: 1 } };

import { ManagedCourseCard } from './ManagedCourseCard';

describe('ManagedCourseCard', () => {
  it('averages the ratings and shows administrator shortcuts only when given', async () => {
    const onEdit = vi.fn(); const onDelete = vi.fn(); const onOpen = vi.fn();
    const { rerender } = render(<ManagedCourseCard course={course} actionDisabled={false} onOpen={onOpen} />);
    expect(screen.queryByRole('button', { name: 'Modifier RGPD' })).toBeNull(); expect(screen.getByText(/^4$/)).toBeVisible();
    rerender(<ManagedCourseCard course={course} actionDisabled={false} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: 'Modifier RGPD' })); await userEvent.click(screen.getByRole('button', { name: 'Supprimer RGPD' }));
    expect(onEdit).toHaveBeenCalledWith(course); expect(onDelete).toHaveBeenCalledWith(course);
  });
});
