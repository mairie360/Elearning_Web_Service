import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BookOpen } from 'lucide-react';
import { ElearningStatCard } from './ElearningStatCard';
it('keeps the supplied statistic label and value available without requiring a decorative icon', () => { const { rerender } = render(<ElearningStatCard label="Formations suivies" value={8} icon={BookOpen} />); expect(screen.getByText('Formations suivies')).toBeVisible(); expect(screen.getByText('8')).toBeVisible(); rerender(<ElearningStatCard label="Formations suivies" value={9} />); expect(screen.getByText('9')).toBeVisible(); });
