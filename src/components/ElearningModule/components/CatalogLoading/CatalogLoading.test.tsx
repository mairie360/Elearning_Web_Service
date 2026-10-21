import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

import { CatalogLoading } from './CatalogLoading';

describe('CatalogLoading', () => {
  it('announces the catalogue read with a skeleton', () => {
    render(<CatalogLoading />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement des formations…'); expect(document.querySelector('.mairie-skeleton')).not.toBeNull();
  });
});
