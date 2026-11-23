import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CourseEndScreen } from './CourseEndScreen';

describe('CourseEndScreen', () => {
  it('congratulates the agent, offers the rating and the way back', async () => {
    const onBackToCatalog = vi.fn();
    render(<CourseEndScreen title="RGPD" chapterCount={3} onRatingSubmit={vi.fn()} onBackToCatalog={onBackToCatalog} />);
    expect(screen.getByRole('heading', { name: 'Formation terminée' })).toBeVisible();
    expect(screen.getByText(/les 3 chapitres de « RGPD »/)).toBeVisible();
    expect(screen.getByText('Notez cette formation')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Retour au catalogue' }));
    expect(onBackToCatalog).toHaveBeenCalled();
  });

  it('has no rating without the service', () => {
    render(<CourseEndScreen title="RGPD" chapterCount={1} onBackToCatalog={vi.fn()} />);
    expect(screen.queryByText('Notez cette formation')).not.toBeInTheDocument();
  });
});
