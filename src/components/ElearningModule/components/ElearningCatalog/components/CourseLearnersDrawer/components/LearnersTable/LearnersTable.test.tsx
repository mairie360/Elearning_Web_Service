import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LearnersTable } from './LearnersTable';

const learner = {
  userId: '43', name: 'Bruno Petit', firstName: 'Bruno', lastName: 'Petit', status: 'completed' as const, progress: 100,
  startedAt: null, completedAt: '2026-10-04T08:00:00', lastActivityAt: null, lastReminderAt: null,
};
const props = { total: 1, hasMore: false, loadingMore: false, busy: false, onMore: vi.fn(), onRetry: vi.fn(), onRemove: vi.fn() };

describe('LearnersTable', () => {
  it('shows a learner with the words of its status and dates, and « Désinscrire »', async () => {
    const onRemove = vi.fn();
    render(<LearnersTable {...props} learners={[learner]} state="default" onRemove={onRemove} />);
    expect(screen.getByText('1 agent inscrit')).toBeVisible();
    expect(screen.getByText('Terminée')).toBeVisible();
    expect(screen.getByText('100 %')).toBeVisible();
    expect(screen.getByText('Aucune')).toBeVisible();
    expect(screen.getByText('Jamais')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Désinscrire Bruno Petit' }));
    expect(onRemove).toHaveBeenCalledWith(learner);
  });

  it('offers more learners, waits while busy and hides the count while loading', async () => {
    const onMore = vi.fn();
    const { rerender } = render(<LearnersTable {...props} learners={[learner]} total={60} state="default" hasMore onMore={onMore} />);
    await userEvent.click(screen.getByRole('button', { name: 'Afficher plus d’agents inscrits' }));
    expect(onMore).toHaveBeenCalled();
    rerender(<LearnersTable {...props} learners={[learner]} state="default" busy />);
    expect(screen.getByRole('button', { name: 'Désinscrire Bruno Petit' })).toBeDisabled();
    rerender(<LearnersTable {...props} learners={[]} state="loading" />);
    expect(screen.queryByText(/agent inscrit/)).not.toBeInTheDocument();
  });
});
