import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ElearningCourseRating } from '@/components/elearning/ElearningCourseRating';
import { axe } from 'jest-axe';
it('retains a refused rating and waits for an accepted receipt before announcing success', async () => { const user = userEvent.setup(); const onSubmit = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true); const { container } = render(<ElearningCourseRating onSubmit={onSubmit} />); await user.click(screen.getByRole('button', { name: 'Donner la note 4 sur 5' })); await user.click(screen.getByRole('button', { name: 'Envoyer la note' })); expect(await screen.findByRole('alert')).toBeVisible(); expect(screen.getByRole('button', { name: 'Donner la note 4 sur 5' })).toHaveAttribute('aria-pressed', 'true'); await user.click(screen.getByRole('button', { name: 'Envoyer la note' })); expect(await screen.findByText('Merci, votre note a bien été enregistrée.')).toBeVisible(); expect(onSubmit).toHaveBeenCalledTimes(2); expect((await axe(container)).violations).toEqual([]); });
