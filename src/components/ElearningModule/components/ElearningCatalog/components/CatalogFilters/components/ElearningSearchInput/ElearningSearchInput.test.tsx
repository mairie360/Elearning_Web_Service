import { it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ElearningSearchInput } from './ElearningSearchInput';
import { axe } from 'jest-axe';
it('supports both uncontrolled and owner-controlled searches without replacing a controlled value', async () => { const onValueChange = vi.fn(); const { container, rerender } = render(<ElearningSearchInput aria-label="Rechercher une formation" onValueChange={onValueChange} />); fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Accueil' } }); expect(screen.getByRole('searchbox')).toHaveValue('Accueil'); expect(onValueChange).toHaveBeenCalledWith('Accueil'); rerender(<ElearningSearchInput aria-label="Rechercher une formation" value="Confirmé" onValueChange={onValueChange} />); fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Autre' } }); expect(screen.getByRole('searchbox')).toHaveValue('Confirmé'); expect((await axe(container)).violations).toEqual([]); });
