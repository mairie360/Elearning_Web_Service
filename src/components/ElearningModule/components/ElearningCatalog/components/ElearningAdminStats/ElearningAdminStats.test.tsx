import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ElearningAdminStats } from './ElearningAdminStats';
it('renders the received learning metrics with their appropriate units', () => { render(<ElearningAdminStats stats={{ totalCourses: 12, totalLearners: 45, mandatoryCourses: 3, totalContents: 25, averageRating: 4.5, completionRate: 80 }} />); expect(screen.getByText('12')).toBeVisible(); expect(screen.getByText('45')).toBeVisible(); expect(screen.getByText('4.5/5')).toBeVisible(); expect(screen.getByText('80%')).toBeVisible(); });
