import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CourseLearnersDrawer, type CourseLearnersPort } from './CourseLearnersDrawer';

const learner = (userId: string, firstName: string, lastName: string, fields: object = {}) => ({
  userId, name: `${firstName} ${lastName}`, firstName, lastName, status: 'not-started' as const, progress: 0,
  startedAt: null, completedAt: null, lastActivityAt: null, lastReminderAt: null, ...fields,
});

const course = { id: '4', title: 'RGPD' };

function port(overrides: Partial<CourseLearnersPort> = {}): CourseLearnersPort {
  return {
    loadLearners: vi.fn(async () => ({
      items: [
        learner('42', 'Alice', 'Martin', { status: 'in-progress', progress: 50, lastActivityAt: '2026-10-02T08:00:00' }),
        learner('43', 'Bruno', 'Petit', { lastReminderAt: '2026-10-05T08:00:00' }),
      ],
      total: 2,
      nextOffset: null,
    })),
    searchAgents: vi.fn(async () => ({ items: [{ userId: '50', name: 'Chloé Durand', firstName: 'Chloé', lastName: 'Durand' }], nextOffset: null })),
    enrol: vi.fn(async () => true),
    remove: vi.fn(async () => true),
    ...overrides,
  };
}

describe('CourseLearnersDrawer', () => {
  it('lists the learners with their status, progress, activity and reminder', async () => {
    const enrolment = port();
    render(<CourseLearnersDrawer course={course} port={enrolment} onClose={vi.fn()} />);
    const drawer = screen.getByRole('dialog', { name: 'Agents inscrits à « RGPD »' });
    expect(await within(drawer).findByText('Alice Martin')).toBeVisible();
    expect(within(drawer).getByText('2 agents inscrits')).toBeVisible();
    expect(within(drawer).getByText('En cours')).toBeVisible();
    expect(within(drawer).getByText('50 %')).toBeVisible();
    expect(within(drawer).getByText('2 octobre 2026')).toBeVisible();
    expect(within(drawer).getByText('5 octobre 2026')).toBeVisible();
    expect(enrolment.loadLearners).toHaveBeenCalledWith('4', 0, expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('enrols the agents picked in the search, then reads the learners again', async () => {
    const enrolment = port();
    const onChanged = vi.fn();
    render(<CourseLearnersDrawer course={course} port={enrolment} onClose={vi.fn()} onChanged={onChanged} />);
    await screen.findByText('Alice Martin');
    await userEvent.click(screen.getByRole('button', { name: 'Inscrire des agents' }));
    expect(screen.getByRole('dialog', { name: 'Inscrire des agents à « RGPD »' })).toBeVisible();
    const enrol = screen.getByRole('button', { name: 'Inscrire l’agent' });
    expect(enrol).toBeDisabled();
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Chloé Durand' }));
    expect(screen.getByText('1 agent sélectionné')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Inscrire l’agent' }));
    expect(enrolment.enrol).toHaveBeenCalledWith('4', ['50']);
    expect(await screen.findByRole('dialog', { name: 'Agents inscrits à « RGPD »' })).toBeVisible();
    expect(onChanged).toHaveBeenCalled();
    expect(enrolment.loadLearners).toHaveBeenCalledTimes(2);
  });

  it('searches the agents by name after a pause and offers more', async () => {
    const searchAgents = vi.fn(async (_courseId: string, search: string, offset = 0) => ({
      items: [{ userId: String(60 + offset), name: `Agent ${search} ${offset}`, firstName: 'Agent', lastName: `${search} ${offset}` }],
      nextOffset: offset ? null : 1,
    }));
    render(<CourseLearnersDrawer course={course} port={port({ searchAgents })} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Inscrire des agents' }));
    await screen.findByRole('checkbox', { name: 'Agent 0' });
    await userEvent.type(screen.getByRole('searchbox', { name: 'Rechercher un agent' }), 'mar');
    await screen.findByRole('checkbox', { name: 'Agent mar 0' }, { timeout: 2000 });
    expect(searchAgents).toHaveBeenLastCalledWith('4', 'mar', 0, expect.anything());
    await userEvent.click(screen.getByRole('button', { name: 'Afficher plus d’agents' }));
    expect(await screen.findByRole('checkbox', { name: 'Agent mar 1' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Afficher plus d’agents' })).not.toBeInTheDocument();
  });

  it('asks before unenrolling a learner', async () => {
    const enrolment = port();
    render(<CourseLearnersDrawer course={course} port={enrolment} onClose={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Désinscrire Bruno Petit' }));
    const confirm = screen.getByRole('dialog', { name: 'Désinscrire l’agent ?' });
    expect(within(confirm).getByText(/Bruno Petit ne verra plus « RGPD »/)).toBeVisible();
    await userEvent.click(within(confirm).getByRole('button', { name: 'Désinscrire' }));
    expect(enrolment.remove).toHaveBeenCalledWith('4', expect.objectContaining({ userId: '43' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Désinscrire l’agent ?' })).not.toBeInTheDocument());
  });

  it('says when nobody follows the course, and when the learners cannot be read', async () => {
    const loadLearners = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ items: [], total: 0, nextOffset: null });
    const onClose = vi.fn();
    render(<CourseLearnersDrawer course={course} port={port({ loadLearners })} onClose={onClose} />);
    expect(await screen.findByText('Les agents inscrits n’ont pas pu être chargés.')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: /Réessayer/ }));
    expect(await screen.findByText('Aucun agent ne suit encore cette formation.')).toBeVisible();
    expect(screen.getByText('Aucun agent inscrit')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Fermer la liste des agents inscrits' }));
    expect(onClose).toHaveBeenCalled();
  });
});
