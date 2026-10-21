import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CatalogFeedbackStack } from './CatalogFeedbackStack';

const stack = { loading: false, error: null, mutationError: null, mutationSuccess: null, onRetry: vi.fn(), onDismissError: vi.fn(), onDismissSuccess: vi.fn() };

describe('CatalogFeedbackStack', () => {
  it('renders nothing without feedback, floats over a loaded catalogue and retries the read', async () => {
    const onRetry = vi.fn();
    const { container, rerender } = render(<CatalogFeedbackStack hasCatalog {...stack} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<CatalogFeedbackStack hasCatalog {...stack} error="Lecture impossible" onRetry={onRetry} />);
    expect(container.firstElementChild).toHaveClass('fixed'); expect(screen.getByRole('alert')).toHaveTextContent('Les dernières données confirmées restent affichées');
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' })); expect(onRetry).toHaveBeenCalledTimes(1);
    rerender(<CatalogFeedbackStack hasCatalog {...stack} loading error="Lecture impossible" onRetry={onRetry} />);
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeDisabled(); expect(screen.getByText('Actualisation des formations…')).toBeVisible();
    rerender(<CatalogFeedbackStack hasCatalog={false} {...stack} error="Lecture impossible" />);
    expect(container.firstElementChild).not.toHaveClass('fixed');
  });
  it('shows save confirmations and errors as dismissible toasts', async () => {
    const onDismissSuccess = vi.fn(); const onDismissError = vi.fn();
    render(<CatalogFeedbackStack hasCatalog {...stack} mutationSuccess="Formation créée" mutationError="Suppression refusée" onDismissSuccess={onDismissSuccess} onDismissError={onDismissError} />);
    await userEvent.click(screen.getByRole('button', { name: 'Fermer la confirmation' })); await userEvent.click(screen.getByRole('button', { name: 'Masquer l’erreur de la formation' }));
    expect(onDismissSuccess).toHaveBeenCalledTimes(1); expect(onDismissError).toHaveBeenCalledTimes(1);
  });
});
