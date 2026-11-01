import { it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ElearningFilterSelect } from './ElearningFilterSelect';
import { axe } from 'jest-axe';
it('delegates a selected learning filter and dismisses uncommitted choices with Escape', async () => { const user = userEvent.setup(); const onValueChange = vi.fn(); const { container } = render(<ElearningFilterSelect ariaLabel="Catégorie" options={[{ value: 'all', label: 'Toutes' }, { value: 'a', label: 'Accueil' }]} onValueChange={onValueChange} />); await user.click(screen.getByRole('button', { name: 'Catégorie' })); await user.click(screen.getByRole('option', { name: 'Accueil' })); expect(onValueChange).toHaveBeenCalledWith('a'); expect(screen.getByRole('button', { name: 'Catégorie' })).toHaveTextContent('Accueil'); await user.click(screen.getByRole('button', { name: 'Catégorie' })); await user.keyboard('{Escape}'); expect(screen.queryByRole('option')).not.toBeInTheDocument(); expect((await axe(container)).violations).toEqual([]); });
