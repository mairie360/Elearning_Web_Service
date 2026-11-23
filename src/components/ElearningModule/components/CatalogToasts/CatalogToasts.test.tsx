import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ToastProvider } from '@mairie360/lib-components/primitives';

import { CatalogToasts } from './CatalogToasts';

describe('CatalogToasts', () => {
  it('turns every action outcome into one toast and reports it shown', () => {
    const onShown = vi.fn();
    render(
      <ToastProvider regionLabel="Notifications de la formation">
        <CatalogToasts
          feedback={[
            { id: 1, tone: 'success', title: 'Formation commencée', message: '« RGPD » est ouverte.' },
            { id: 2, tone: 'danger', title: 'Impossible de commencer', message: 'Service indisponible' },
          ]}
          onShown={onShown}
        />
      </ToastProvider>,
    );
    const region = screen.getByRole('region', { name: 'Notifications de la formation' });
    expect(region).toHaveTextContent('Formation commencée');
    expect(region).toHaveTextContent('Impossible de commencer');
    expect(onShown.mock.calls.map(([id]) => id)).toEqual([1, 2]);
  });
});
