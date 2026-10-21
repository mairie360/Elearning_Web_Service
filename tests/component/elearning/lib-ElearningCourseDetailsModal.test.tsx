import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ElearningCourseDetailsModal } from '@/components/elearning/ElearningCourseDetailsModal';
import { axe } from 'jest-axe';
it('shows received course details without inventing learning content and allows explicit closing', async () => { const onClose = vi.fn(); const { container } = render(<ElearningCourseDetailsModal open title="Accueil des agents" description="Découverte de la mairie" chapters={[]} onClose={onClose} />); expect(screen.getByText('Aucun chapitre disponible.')).toBeVisible(); await userEvent.click(screen.getByRole('button', { name: 'Fermer le détail du cours' })); expect(onClose).toHaveBeenCalledTimes(1); expect((await axe(container)).violations).toEqual([]); });
