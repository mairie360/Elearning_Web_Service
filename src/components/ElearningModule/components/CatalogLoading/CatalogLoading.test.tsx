import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CatalogLoading } from './CatalogLoading';

describe('CatalogLoading', () => {
  it('announces the catalogue read with a skeleton', () => {
    render(<CatalogLoading />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement des formations…'); expect(document.querySelector('.mairie-skeleton')).not.toBeNull();
  });
});
