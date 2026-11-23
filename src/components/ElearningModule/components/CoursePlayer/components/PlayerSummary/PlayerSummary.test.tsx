import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PlayerSummary } from './PlayerSummary';

describe('PlayerSummary', () => {
  it('lists the chapters and goes to the one clicked', async () => {
    const onSelect = vi.fn();
    render(<PlayerSummary busy={false} currentId="a" onSelect={onSelect} chapters={[
      { id: 'a', title: 'Introduction', duration: '5 min', completed: true, contents: [{ id: 'v', title: 'V', type: 'video' }] },
      { id: 'b', title: 'Cas pratiques', duration: '10 min' },
    ]} />);
    expect(screen.getByRole('button', { name: /Introduction/ })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Vidéo · 5 min')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: /Cas pratiques/ }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });
});
