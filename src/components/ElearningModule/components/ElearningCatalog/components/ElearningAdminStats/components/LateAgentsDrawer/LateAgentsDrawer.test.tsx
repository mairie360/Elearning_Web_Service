import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LateAgentsDrawer } from './LateAgentsDrawer';

const agents = [
  { userId: '42', firstName: 'Alice', lastName: 'Martin', courseId: '4', courseTitle: 'RGPD', deadline: '2026-06-30', progress: 50, lastReminderAt: null },
  { userId: '43', firstName: 'Bruno', lastName: 'Petit', courseId: '4', courseTitle: 'RGPD', deadline: '2026-06-30', progress: 0, lastReminderAt: '2026-10-02T08:00:00Z' },
];

describe('LateAgentsDrawer', () => {
  it('lists the late agents and reminds them all, spinning while the reminders are sent', async () => {
    let release: (value: boolean) => void = () => {};
    const onRemind = vi.fn(() => new Promise<boolean>(resolve => { release = resolve; }));
    const onClose = vi.fn();
    render(<LateAgentsDrawer open agents={agents} onClose={onClose} onRemind={onRemind} />);
    const drawer = screen.getByRole('dialog', { name: 'Agents en retard' });
    expect(within(drawer).getByText('Alice Martin')).toBeVisible();
    expect(within(drawer).getAllByText('30 juin 2026')).toHaveLength(2);
    expect(within(drawer).getByText('Jamais')).toBeVisible();
    expect(within(drawer).getByText('2 octobre 2026')).toBeVisible();
    const remind = within(drawer).getByRole('button', { name: 'Relancer les 2 agents' });
    await userEvent.click(remind);
    expect(onRemind).toHaveBeenCalledWith(agents);
    expect(remind).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(within(drawer).getByRole('button', { name: 'Fermer la liste des agents en retard' }));
    expect(onClose).not.toHaveBeenCalled();
    release(true);
    await waitFor(() => expect(remind).not.toHaveAttribute('aria-busy', 'true'));
    await userEvent.click(within(drawer).getByRole('button', { name: 'Fermer la liste des agents en retard' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('names the single agent, survives a rejected reminder and has no button without agents', async () => {
    const onRemind = vi.fn(async () => { throw new Error('refused'); });
    const { rerender } = render(<LateAgentsDrawer open agents={[agents[0]]} onClose={vi.fn()} onRemind={onRemind} />);
    await userEvent.click(screen.getByRole('button', { name: 'Relancer l’agent' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Relancer l’agent' })).not.toHaveAttribute('aria-busy', 'true'));
    rerender(<LateAgentsDrawer open agents={[]} onClose={vi.fn()} onRemind={onRemind} />);
    expect(screen.getByText('Aucun agent en retard.')).toBeVisible();
    expect(screen.queryByRole('button', { name: /Relancer/ })).not.toBeInTheDocument();
  });
});
