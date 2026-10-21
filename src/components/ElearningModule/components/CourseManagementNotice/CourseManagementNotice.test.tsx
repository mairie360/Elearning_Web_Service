import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

import { CourseManagementNotice } from './CourseManagementNotice';

describe('CourseManagementNotice', () => {
  it('tells administrators why the author actions are missing', () => {
    render(<CourseManagementNotice />);
    expect(screen.getByRole('note')).toBeVisible();
  });
});
