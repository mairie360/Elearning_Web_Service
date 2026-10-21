import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CourseProgress } from './CourseProgress';

describe('CourseProgress', () => {
  it('shows the total percentage', () => {
    const { container } = render(<CourseProgress value={40} />);
    expect(screen.getByText('40%')).toBeVisible(); expect(container.querySelector('[style]')).toHaveStyle({ width: '40%' });
  });
});
