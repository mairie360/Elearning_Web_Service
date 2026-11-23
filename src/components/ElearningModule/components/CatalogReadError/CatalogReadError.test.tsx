import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CatalogReadError } from './CatalogReadError';

describe('CatalogReadError', () => {
  it('renders nothing without a read error', () => {
    const { container } = render(<CatalogReadError hasCatalog loading={false} error={null} onRetry={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the last catalogue on screen under a warning and retries the read', async () => {
    const onRetry = vi.fn();
    render(<CatalogReadError hasCatalog loading={false} error="Lecture impossible" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Service de formation indisponible');
    expect(screen.getByRole('alert')).toHaveTextContent('Les dernières données confirmées restent affichées.');
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows the error state with a pending retry when nothing could be read', () => {
    render(<CatalogReadError hasCatalog={false} loading error="Lecture impossible" onRetry={vi.fn()} />);
    expect(screen.getByText('Impossible de charger les formations')).toBeVisible();
    expect(screen.getByRole('button', { name: /Réessayer/ })).toHaveAttribute('aria-busy', 'true');
  });
});
