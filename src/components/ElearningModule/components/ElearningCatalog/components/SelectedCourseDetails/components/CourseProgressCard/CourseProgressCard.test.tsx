import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CourseProgressCard } from './CourseProgressCard';

describe('CourseProgressCard', () => {
  it('shows the status, the chapters done and the deadline of a course in progress', () => {
    render(<CourseProgressCard statusValue="in-progress" progress={40} deadline="30 juin 2026" unrated={false}
      chapters={[{ id: 'a', title: 'A', duration: '', completed: true }, { id: 'b', title: 'B', duration: '' }]}
      next={{ id: 'b', title: 'B', duration: '' }} />);
    expect(screen.getByText('En cours')).toBeVisible();
    expect(screen.getByText('1 / 2 chapitres')).toBeVisible();
    expect(screen.getByText('À terminer avant le 30 juin 2026')).toBeVisible();
  });

  it('tells a finished course is not rated yet', () => {
    render(<CourseProgressCard statusValue="completed" progress={100} unrated chapters={[]} />);
    expect(screen.getByText('Formation terminée')).toBeVisible();
    expect(screen.getByText('Formation non notée')).toBeVisible();
  });
});
