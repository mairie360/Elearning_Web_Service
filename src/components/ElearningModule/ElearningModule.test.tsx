import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/features/elearning/catalogActions', () => ({ createCatalogActions: () => ({ loadCatalog: vi.fn(), completeContent: vi.fn(), startCourse: vi.fn(), rateCourse: vi.fn(), createCourse: vi.fn(), updateCourse: vi.fn(), deleteCourse: vi.fn() }) }));
vi.mock('@/lib/auth-session', () => ({ logout: vi.fn(), navigateToLogin: vi.fn() }));

import { ElearningModule } from './ElearningModule';

describe('ElearningModule', () => {
  it('renders the shell and the loading state until the catalogue is read', () => {
    render(<ElearningModule />);
    expect(screen.getByRole('status', { name: 'Chargement des formations…' })).toBeVisible();
  });

  it('MAIR-1230 wires the global search of the shared header to the same-origin GET /search', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json({
      groups: [{ module: 'elearning', items: [{ kind: 'course', id: 4, title: 'Sécurité incendie', excerpt: null, parent_id: null, updated_at: '2026-11-20T10:00:00Z' }] }],
      unavailable: [],
    }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      render(<ElearningModule />);
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'sécu' } });
      expect(await screen.findByRole('option', { name: /Sécurité incendie/ })).toHaveAttribute('data-href', expect.stringMatching(/[?&]course=4(&|$)/));
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
      expect(fetchMock.mock.calls[0][0]).toBe('/search?q=s%C3%A9cu');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
