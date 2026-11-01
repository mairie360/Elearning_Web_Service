import { it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ElearningCourseCard } from './ElearningCourseCard';
import { axe } from 'jest-axe';
it.each([[0, 'Commencer'], [50, 'Continuer'], [100, 'Revoir']])('shows the appropriate learning action at %s percent and delegates it', async (progress, label) => { const onAction = vi.fn(); const { container } = render(<ElearningCourseCard title="Accueil" description="Découvrir les services" progress={progress as number} onAction={onAction} />); await userEvent.click(screen.getByRole('button', { name: label as string })); expect(onAction).toHaveBeenCalledTimes(1); expect((await axe(container)).violations).toEqual([]); });
