import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ElearningAdminStats } from './ElearningAdminStats';

const stats = { totalCourses: 12, totalLearners: 45, mandatoryCourses: 3, totalContents: 25, averageRating: 4.5, completionRate: 80 };

describe('ElearningAdminStats', () => {
  it('renders the administrator indicators in a Panel with « Actualiser »', async () => {
    const onRefresh = vi.fn();
    render(<ElearningAdminStats stats={stats} onRefresh={onRefresh} />);
    expect(screen.getByRole('heading', { name: 'Indicateurs du centre de formation' })).toBeVisible();
    expect(screen.getByText('12')).toBeVisible();
    expect(screen.getByText('4.5/5')).toBeVisible();
    expect(screen.getByText('80 %')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Actualiser' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('says the indicators are unavailable without hiding the panel', () => {
    render(<ElearningAdminStats stats={stats} state="unavailable" onRefresh={vi.fn()} />);
    expect(screen.getByText('Indicateurs temporairement indisponibles.')).toBeVisible();
    expect(screen.queryByText('Apprenants inscrits')).not.toBeInTheDocument();
  });
});
