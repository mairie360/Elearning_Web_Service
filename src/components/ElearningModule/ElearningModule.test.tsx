import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('@/features/elearning/catalogActions', () => ({ createCatalogActions: () => ({ loadCatalog: vi.fn(), completeContent: vi.fn(), startCourse: vi.fn(), rateCourse: vi.fn(), createCourse: vi.fn(), updateCourse: vi.fn(), deleteCourse: vi.fn() }) }));
vi.mock('@/lib/auth-session', () => ({ logout: vi.fn(), navigateToLogin: vi.fn() }));

import { ElearningModule } from './ElearningModule';

describe('ElearningModule', () => {
  it('renders the shell and the loading state until the catalogue is read', () => {
    render(<ElearningModule />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement des formations…');
  });
});
