import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

import { CourseProgress } from './CourseProgress';

describe('CourseProgress', () => {
  it('shows the total percentage', () => {
    const { container } = render(<CourseProgress value={40} />);
    expect(screen.getByText('40%')).toBeVisible(); expect(container.querySelector('[style]')).toHaveStyle({ width: '40%' });
  });
});
