import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

import { CatalogLoading } from './CatalogLoading';

describe('CatalogLoading', () => {
  it('announces the catalogue read under the page header with three skeleton tiles', () => {
    render(<CatalogLoading subtitle="Développez vos compétences à votre rythme." />);
    expect(screen.getByRole('heading', { level: 1, name: 'E-learning' })).toBeVisible();
    expect(screen.getByRole('status', { name: 'Chargement des formations…' })).toBeVisible();
    expect(document.querySelectorAll('[role="status"] .mairie-skeleton').length).toBeGreaterThanOrEqual(3);
  });
});
