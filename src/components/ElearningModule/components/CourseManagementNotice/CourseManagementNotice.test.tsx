import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CourseManagementNotice } from './CourseManagementNotice';

describe('CourseManagementNotice', () => {
  it('tells administrators why the author actions are missing', () => {
    render(<CourseManagementNotice />);
    expect(screen.getByRole('note')).toBeVisible();
  });
});
