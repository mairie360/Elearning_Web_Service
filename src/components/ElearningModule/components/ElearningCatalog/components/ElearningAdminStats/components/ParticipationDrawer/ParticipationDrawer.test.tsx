import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ParticipationDrawer } from './ParticipationDrawer';

const services = [
  { serviceId: '1', serviceName: 'État civil', agents: 12, participants: 10, participationRate: 83.3 },
  { serviceId: null, serviceName: null, agents: 4, participants: 1, participationRate: 25 },
];

describe('ParticipationDrawer', () => {
  it('lists the participation of every service, the agents without service last', async () => {
    const onClose = vi.fn();
    render(<ParticipationDrawer open services={services} participationRate={79.2} onClose={onClose} />);
    const drawer = screen.getByRole('dialog', { name: 'Participation par service' });
    expect(within(drawer).getByText('Taux de participation de la commune : 79,2 %')).toBeVisible();
    const table = within(drawer).getByRole('table', { name: 'Participation par service' });
    expect(within(table).getByText('État civil')).toBeVisible();
    expect(within(table).getByText('83,3 %')).toBeVisible();
    expect(within(table).getByText('Sans service')).toBeVisible();
    await userEvent.click(within(drawer).getByRole('button', { name: 'Fermer la participation par service' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('says when there is nothing to show and renders nothing closed', () => {
    const { rerender } = render(<ParticipationDrawer open services={[]} participationRate={0} onClose={vi.fn()} />);
    expect(screen.getByText('Aucun agent à afficher.')).toBeVisible();
    rerender(<ParticipationDrawer open={false} services={services} participationRate={0} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
