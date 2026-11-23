import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CourseRatingCard } from './CourseRatingCard';

describe('CourseRatingCard', () => {
  it('keeps « Envoyer la note » disabled until a star is chosen, then thanks the agent', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<CourseRatingCard onSubmit={onSubmit} />);
    expect(screen.getByRole('button', { name: 'Envoyer la note' })).toBeDisabled();
    await userEvent.click(screen.getByRole('radio', { name: '4 étoiles sur 5' }));
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer la note' }));
    expect(onSubmit).toHaveBeenCalledWith(4);
    expect(await screen.findByText('Merci pour votre avis · Votre note : 4/5')).toBeVisible();
  });

  it('keeps the choice after a refusal', async () => {
    const onSubmit = vi.fn().mockResolvedValue(false);
    render(<CourseRatingCard onSubmit={onSubmit} initialValue={3} />);
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer la note' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Votre choix est conservé');
    expect(screen.getByRole('button', { name: 'Envoyer la note' })).toBeEnabled();
  });
});
