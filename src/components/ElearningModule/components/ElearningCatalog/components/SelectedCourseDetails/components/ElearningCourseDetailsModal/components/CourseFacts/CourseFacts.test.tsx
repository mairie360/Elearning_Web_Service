import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

import { CourseFacts } from './CourseFacts';

describe('CourseFacts', () => {
  it('lists only the known facts', () => {
    const { rerender } = render(<CourseFacts description="Présentation" instructor="DRH" duration="1 h" rating={4.5} ratingLabel="(2 notes)" />);
    expect(screen.getByText('Présentation')).toBeVisible(); expect(screen.getByText('DRH')).toBeVisible(); expect(screen.getByText('4.5 (2 notes)')).toBeVisible();
    rerender(<CourseFacts description="Présentation" />);
    expect(screen.queryByText('Instructeur')).toBeNull(); expect(screen.queryByText('Note')).toBeNull();
  });
});
