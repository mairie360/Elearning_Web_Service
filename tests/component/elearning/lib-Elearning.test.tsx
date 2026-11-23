import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ElearningCatalog, type ElearningCourse } from '@/components/ElearningModule/components/ElearningCatalog';
import type { ElearningAdminStatsData } from '@/components/ElearningModule/components/ElearningCatalog/components/ElearningAdminStats';
import { adminStatsResponse } from '@tests/support/elearning-fixtures';

const adminStats = adminStatsResponse() as ElearningAdminStatsData;

const courses: ElearningCourse[] = [
  {
    id: 'security',
    category: 'Sécurité',
    statusValue: 'in-progress',
    title: 'Sécurité au travail',
    description: 'Formation sur les règles de sécurité.',
    instructor: 'Catherine Moreau',
    duration: '2h 30min',
    chapters: 8,
    learners: 156,
    statusBadge: { label: 'En cours', variant: 'inProgress' },
  },
  {
    id: 'archives',
    category: 'Administration',
    statusValue: 'completed',
    title: 'Gestion des archives numériques',
    description: 'Organiser les documents numériques.',
    instructor: 'Marc Dubois',
    duration: '1h 45min',
    chapters: 6,
    learners: 89,
    statusBadge: { label: 'Terminé', variant: 'completed' },
  },
];

describe('Elearning components', () => {
  it('opens the course sheet from its tile and starts the course from « Commencer »', async () => {
    const start = vi.fn().mockResolvedValue(true);
    const play = vi.fn();
    render(<ElearningCatalog courses={[{ ...courses[0], statusValue: 'not-started' }]} onCourseAction={start} onPlayCourse={play} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sécurité au travail' }));
    expect(screen.getByRole('dialog', { name: 'Sécurité au travail' })).toHaveTextContent('Catherine Moreau');
    expect(start).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Commencer' }));
    await waitFor(() => expect(play).toHaveBeenCalledWith(expect.objectContaining({ id: 'security' })));
    expect(start).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the sheet open with an alert when the start is refused, and continues a started course without a request', async () => {
    const start = vi.fn().mockResolvedValue(false);
    const play = vi.fn();
    const { rerender } = render(<ElearningCatalog courses={[{ ...courses[0], statusValue: 'not-started' }]} onCourseAction={start} onPlayCourse={play} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sécurité au travail' }));
    fireEvent.click(screen.getByRole('button', { name: 'Commencer' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('n’a pas pu être démarrée'));
    expect(play).not.toHaveBeenCalled();
    rerender(<ElearningCatalog courses={courses} onCourseAction={start} onPlayCourse={play} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sécurité au travail' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
    expect(play).toHaveBeenCalledWith(expect.objectContaining({ id: 'security' }));
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('opens an initial catalog course without starting it and does not fabricate an unknown one', () => {
    const start = vi.fn();
    const { rerender } = render(<ElearningCatalog courses={courses} initialCourseId="archives" onCourseAction={start} />);
    expect(screen.getByRole('dialog', { name: 'Gestion des archives numériques' })).toBeVisible();
    expect(start).not.toHaveBeenCalled();
    rerender(<ElearningCatalog key="unknown" courses={courses} initialCourseId="unknown" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('filters catalog courses by category and search', async () => {
    const user = userEvent.setup();
    render(<ElearningCatalog courses={courses} />);

    expect(screen.getByRole('button', { name: 'Sécurité au travail' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gestion des archives numériques' })).toBeInTheDocument();
    expect(screen.getByText('2 formations')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Catégorie/ }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Sécurité' }));

    expect(screen.getByRole('button', { name: 'Sécurité au travail' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Gestion des archives numériques' })).not.toBeInTheDocument();
    expect(screen.getByText('1 formation correspond à votre recherche')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Rechercher une formation'), { target: { value: 'archives' } });

    expect(screen.getByText('Aucune formation ne correspond à votre recherche.')).toBeInTheDocument();
  });
  it('hides formation management actions from standard users', () => {
    render(<ElearningCatalog courses={courses} />);

    expect(screen.queryByRole('button', { name: 'Nouvelle formation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Indicateurs du centre de formation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Modifier Sécurité au travail/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Supprimer Sécurité au travail/ })).not.toBeInTheDocument();
  });

  it('delegates administration changes and waits for updated course props', () => {
    const handleCreateCourse = vi.fn();
    const handleUpdateCourse = vi.fn();
    const handleDeleteCourse = vi.fn();

    const { rerender } = render(
      <ElearningCatalog
        courses={courses}
        currentUserRole="administrator"
        adminStats={adminStats}
        onCreateCourse={handleCreateCourse}
        onUpdateCourse={handleUpdateCourse}
        onDeleteCourse={handleDeleteCourse}
      />
    );

    expect(screen.getByRole('heading', { name: 'Indicateurs du centre de formation' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle formation' }));
    let dialog = screen.getByRole('dialog', { name: 'Nouvelle formation' });

    fireEvent.change(within(dialog).getByLabelText('Titre', { selector: '#elearning-course-title' }), {
      target: { value: 'Prévention incendie' },
    });
    fireEvent.change(within(dialog).getByLabelText('Sous-titre'), {
      target: { value: 'Les bons réflexes en mairie' },
    });
    fireEvent.change(within(dialog).getByLabelText('Description', { selector: '#elearning-course-description' }), {
      target: { value: 'Identifier les risques et appliquer les consignes d’évacuation.' },
    });
    fireEvent.change(within(dialog).getByLabelText('Catégorie'), {
      target: { value: 'Sécurité' },
    });
    fireEvent.change(within(dialog).getByLabelText('Instructeur'), {
      target: { value: 'Anne Leroy' },
    });
    fireEvent.change(within(dialog).getByLabelText('Durée totale'), {
      target: { value: '1h 15min' },
    });
    fireEvent.change(within(dialog).getByLabelText('Échéance'), {
      target: { value: '30 juin 2026' },
    });
    fireEvent.change(within(dialog).getByLabelText('Type de parcours'), {
      target: { value: 'mandatory' },
    });
    fireEvent.change(within(dialog).getByLabelText('Niveau'), {
      target: { value: 'beginner' },
    });
    fireEvent.change(within(dialog).getByLabelText('Titre du chapitre'), {
      target: { value: 'Prévenir et donner l’alerte' },
    });
    fireEvent.change(within(dialog).getByLabelText('Durée', { selector: 'input[id^="chapter-duration-"]' }), {
      target: { value: '35 min' },
    });
    fireEvent.change(within(dialog).getByLabelText('Description du chapitre'), {
      target: { value: 'Reconnaître les risques et connaître la procédure.' },
    });
    fireEvent.change(within(dialog).getByLabelText('Titre', { selector: 'input[id^="content-title-"]' }), {
      target: { value: 'Vidéo : déclencher l’alarme' },
    });
    // MAIR-817: there is no upload, a new resource is a link (absolute https://, MAIR-703).
    fireEvent.change(within(dialog).getByLabelText('Lien ou fichier'), {
      target: { value: 'https://videos.example.fr/alarme-incendie' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Créer' }));

    expect(handleCreateCourse).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Prévention incendie',
        category: 'Sécurité',
        instructor: 'Anne Leroy',
        deadline: '30 juin 2026',
        titleBadge: expect.objectContaining({ label: 'Obligatoire' }),
        levelBadge: expect.objectContaining({ label: 'Débutant' }),
        details: expect.objectContaining({
          subtitle: 'Les bons réflexes en mairie',
          chapters: [
            expect.objectContaining({
              title: 'Prévenir et donner l’alerte',
              contents: [expect.objectContaining({ title: 'Vidéo : déclencher l’alarme' })],
            }),
          ],
        }),
      }),
      expect.objectContaining({
        title: 'Prévention incendie',
      })
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText('Prévention incendie')).not.toBeInTheDocument();

    const createdCourse = handleCreateCourse.mock.calls[0][0] as ElearningCourse;
    rerender(
      <ElearningCatalog
        courses={[...courses, createdCourse]}
        currentUserRole="administrator"
        adminStats={adminStats}
        onCreateCourse={handleCreateCourse}
        onUpdateCourse={handleUpdateCourse}
        onDeleteCourse={handleDeleteCourse}
      />
    );
    expect(screen.getByText('Prévention incendie')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Modifier Prévention incendie' }));
    dialog = screen.getByRole('dialog', { name: 'Modifier la formation' });
    fireEvent.change(within(dialog).getByLabelText('Titre', { selector: '#elearning-course-title' }), {
      target: { value: 'Prévention incendie actualisée' },
    });
    fireEvent.change(within(dialog).getByLabelText('Niveau'), {
      target: { value: 'intermediate' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));

    expect(handleUpdateCourse).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Prévention incendie actualisée',
        progress: undefined,
        levelBadge: expect.objectContaining({ label: 'Intermédiaire' }),
      }),
      expect.objectContaining({
        level: 'intermediate',
      })
    );
    expect(screen.getByText('Prévention incendie')).toBeInTheDocument();
    expect(screen.queryByText('Prévention incendie actualisée')).not.toBeInTheDocument();

    const updatedCourse = handleUpdateCourse.mock.calls[0][0] as ElearningCourse;
    rerender(
      <ElearningCatalog
        courses={[...courses, updatedCourse]}
        currentUserRole="administrator"
        adminStats={adminStats}
        onCreateCourse={handleCreateCourse}
        onUpdateCourse={handleUpdateCourse}
        onDeleteCourse={handleDeleteCourse}
      />
    );
    expect(screen.getByText('Prévention incendie actualisée')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer Prévention incendie actualisée' }));

    expect(handleDeleteCourse).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Prévention incendie actualisée',
      })
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('Prévention incendie actualisée')).toBeInTheDocument();

    rerender(
      <ElearningCatalog
        courses={courses}
        currentUserRole="administrator"
        adminStats={adminStats}
        onCreateCourse={handleCreateCourse}
        onUpdateCourse={handleUpdateCourse}
        onDeleteCourse={handleDeleteCourse}
      />
    );
    expect(screen.queryByText('Prévention incendie actualisée')).not.toBeInTheDocument();
  });

  it('does not offer management actions without matching callbacks', () => {
    render(<ElearningCatalog courses={courses} currentUserRole="administrator" />);

    expect(screen.queryByRole('button', { name: 'Nouvelle formation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Modifier Sécurité au travail/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Supprimer Sécurité au travail/ })).not.toBeInTheDocument();
  });

  it('provides an empty editable chapter when a server course has no details', () => {
    render(
      <ElearningCatalog courses={courses} currentUserRole="administrator" onUpdateCourse={vi.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Modifier Sécurité au travail' }));
    const dialog = screen.getByRole('dialog', { name: 'Modifier la formation' });
    expect(within(dialog).getByLabelText('Titre du chapitre')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Titre', { selector: 'input[id^="content-title-"]' })).toBeInTheDocument();
  });
});
