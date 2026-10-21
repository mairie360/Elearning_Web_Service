import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ElearningBadge } from './ElearningBadge';
it('keeps its supplied learning status readable as the status changes', () => { const { rerender } = render(<ElearningBadge label="Débutant" variant="beginner" />); expect(screen.getByText('Débutant')).toBeVisible(); rerender(<ElearningBadge label="Terminé" variant="completed" />); expect(screen.queryByText('Débutant')).not.toBeInTheDocument(); expect(screen.getByText('Terminé')).toBeVisible(); });
