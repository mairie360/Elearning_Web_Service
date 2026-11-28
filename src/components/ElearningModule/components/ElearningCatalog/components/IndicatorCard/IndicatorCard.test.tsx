import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Users } from 'lucide-react';

import { IndicatorCard } from './IndicatorCard';

describe('IndicatorCard', () => {
  it('MAIR-1257 reads label, value, caption and the link it leads to, and acts on a click', async () => {
    const onClick = vi.fn();
    render(<IndicatorCard label="Taux de participation" value="79,2 %" icon={Users} caption="38 agents inscrits sur 48" gauge={79.2} linkLabel="Détail par service" onClick={onClick} />);
    const card = screen.getByRole('button', { name: /^Taux de participation\s*79,2 %\s*38 agents inscrits sur 48\s*Détail par service$/ });
    expect(card).not.toHaveAttribute('aria-pressed');
    expect(card.querySelector('[data-gauge]')).toHaveAttribute('data-gauge', '79');
    expect(card.querySelector('[data-gauge]')).toHaveAttribute('aria-hidden', 'true');
    await userEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('MAIR-1257 is a toggle when it applies a filter, clamps its gauge and flags an alert value', () => {
    render(<IndicatorCard label="Obligatoires en retard" value={3} icon={Users} linkLabel="Voir les agents" gauge={140} active={false} alert />);
    const card = screen.getByRole('button', { name: /Obligatoires en retard/ });
    expect(card).toHaveAttribute('aria-pressed', 'false');
    expect(card).toHaveAttribute('data-alert', 'true');
    expect(card.querySelector('[data-gauge]')).toHaveAttribute('data-gauge', '100');
  });

  it('MAIR-1257 puts its icon on the 28 px training chip of the artifact', () => {
    const { container } = render(<IndicatorCard label="Formations suivies" value="4" icon={Users} linkLabel="Voir la liste" />);
    const chip = container.querySelector('[data-m360-component~="IconChip"]') as HTMLElement;
    expect(chip).toHaveAttribute('data-size', 's');
    expect(chip.style.width).toBe('28px');
    expect(chip.style.height).toBe('28px');
    expect(chip.style.background).toBe('var(--mairie-module-training)');
  });
});
