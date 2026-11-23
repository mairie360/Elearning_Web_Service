import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ManagedCourseCard } from './ManagedCourseCard';

const course = { id: '4', title: 'RGPD', description: 'Données' };

describe('ManagedCourseCard', () => {
  it('opens the course from its tile and hides administration without callbacks', async () => {
    const onOpen = vi.fn();
    render(<ManagedCourseCard course={course} busy={false} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button', { name: 'RGPD' }));
    expect(onOpen).toHaveBeenCalledWith(course);
    expect(screen.queryByRole('button', { name: 'Modifier RGPD' })).not.toBeInTheDocument();
  });

  it('offers « Modifier » and « Supprimer » to administrators', async () => {
    const onEdit = vi.fn(); const onDelete = vi.fn();
    render(<ManagedCourseCard course={course} busy={false} onOpen={vi.fn()} onEdit={onEdit} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: 'Modifier RGPD' }));
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer RGPD' }));
    expect(onEdit).toHaveBeenCalledWith(course);
    expect(onDelete).toHaveBeenCalledWith(course);
  });

  it('opens « Agents inscrits » of the course (MAIR-817)', async () => {
    const onLearners = vi.fn(); const onOpen = vi.fn();
    render(<ManagedCourseCard course={course} busy={false} onOpen={onOpen} onLearners={onLearners} />);
    await userEvent.click(screen.getByRole('button', { name: 'Agents inscrits à RGPD' }));
    expect(onLearners).toHaveBeenCalledWith(course);
    expect(onOpen).not.toHaveBeenCalled();
  });
});
