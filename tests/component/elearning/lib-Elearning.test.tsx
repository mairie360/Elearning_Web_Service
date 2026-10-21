import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ElearningCatalog, type ElearningCourse } from '@/components/elearning/ElearningCatalog';
import { ElearningCourseCard } from '@/components/elearning/ElearningCourseCard';
import { ElearningCourseDetailsModal } from '@/components/elearning/ElearningCourseDetailsModal';
import { ElearningCourseRating } from '@/components/elearning/ElearningCourseRating';
import { ElearningFilterSelect } from '@/components/elearning/ElearningFilterSelect';

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
  it('opens the filter menu and emits the selected value', () => {
    const handleChange = vi.fn();

    render(
      <ElearningFilterSelect
        defaultValue="all"
        onValueChange={handleChange}
        options={[
          { label: 'Tous les statuts', value: 'all' },
          { label: 'En cours', value: 'in-progress' },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('option', { name: 'En cours' }));
    expect(handleChange).toHaveBeenCalledWith('in-progress');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('renders a course card and calls its action', () => {
    const handleAction = vi.fn();

    render(
      <ElearningCourseCard
        title="Comptabilité publique"
        description="Perfectionnement en comptabilité publique."
        instructor="Pierre Bertrand"
        duration="4h 20min"
        chapters={12}
        learners={45}
        actionLabel="Continuer"
        onAction={handleAction}
      />
    );

    expect(screen.getByRole('heading', { name: 'Comptabilité publique' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('opens the same course from its poster by pointer or keyboard', async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();

    render(
      <ElearningCourseCard
        title="Comptabilité publique"
        description="Perfectionnement en comptabilité publique."
        onAction={handleAction}
      />
    );

    const poster = screen.getByRole('button', { name: 'Ouvrir la formation Comptabilité publique' });
    await user.click(poster);
    expect(handleAction).toHaveBeenCalledTimes(1);

    poster.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(handleAction).toHaveBeenCalledTimes(3);

    await user.click(screen.getByRole('button', { name: 'Continuer' }));
    expect(handleAction).toHaveBeenCalledTimes(4);
  });

  it('keeps the poster decorative when no course action is available', () => {
    render(<ElearningCourseCard title="Formation sans action" description="Présentation du cours." />);

    expect(screen.queryByRole('button', { name: 'Ouvrir la formation Formation sans action' })).not.toBeInTheDocument();
  });

  it('updates the course card action label from progress', () => {
    const { rerender } = render(
      <ElearningCourseCard title="Formation progressive" description="Suivi de progression." progress={0} />
    );

    expect(screen.getByRole('button', { name: 'Commencer' })).toBeInTheDocument();

    rerender(<ElearningCourseCard title="Formation progressive" description="Suivi de progression." progress={50} />);
    expect(screen.getByRole('button', { name: 'Continuer' })).toBeInTheDocument();

    rerender(<ElearningCourseCard title="Formation progressive" description="Suivi de progression." progress={100} />);
    expect(screen.getByRole('button', { name: 'Revoir' })).toBeInTheDocument();
  });

  it('renders readable course details with long chapter titles', () => {
    render(
      <ElearningCourseDetailsModal
        open
        title="Comptabilité publique - Niveau avancé"
        description="Perfectionnement en comptabilité publique et gestion budgétaire"
        instructor="Pierre Bertrand"
        duration="4h 20min"
        rating={4.6}
        ratingLabel="(45 étudiants)"
        progress={25}
        chapters={[
          {
            id: 'intro',
            title: 'Introduction à la comptabilité publique et aux grands principes budgétaires',
            duration: '15min',
            completed: true,
          },
        ]}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getAllByText('Introduction à la comptabilité publique et aux grands principes budgétaires').length
    ).toBeGreaterThan(0);
    expect(screen.getByText('Progression totale')).toBeInTheDocument();
  });

  it('closes course details when clicking outside the dialog', () => {
    const handleClose = vi.fn();

    render(
      <ElearningCourseDetailsModal
        open
        onClose={handleClose}
        title="Cours consultable"
        description="Détail de formation."
        chapters={[
          {
            id: 'intro',
            title: 'Introduction',
            duration: '15min',
          },
        ]}
      />
    );

    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.parentElement as HTMLElement;

    fireEvent.mouseDown(dialog);
    expect(handleClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('switches chapters and renders the selected chapter contents', () => {
    render(
      <ElearningCourseDetailsModal
        open
        title="Cours multi-contenus"
        description="Un cours avec plusieurs chapitres et ressources."
        chapters={[
          {
            id: 'chapter-video',
            title: 'Chapitre vidéo',
            duration: '15min',
            active: true,
            contents: [
              {
                id: 'chapter-video-main',
                title: 'Vidéo principale du chapitre',
                type: 'video',
                duration: '15min',
              },
              {
                id: 'chapter-video-support',
                title: 'Support PDF du chapitre vidéo',
                type: 'pdf',
              },
            ],
          },
          {
            id: 'chapter-documents',
            title: 'Chapitre documents',
            duration: '20min',
            contents: [
              {
                id: 'chapter-documents-guide',
                title: 'Guide documentaire à lire',
                type: 'document',
              },
            ],
          },
        ]}
      />
    );

    expect(screen.getAllByText('Vidéo principale du chapitre').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Chapitre documents/ }));

    expect(screen.getAllByText('Guide documentaire à lire').length).toBeGreaterThan(0);
    expect(screen.queryByText('Support PDF du chapitre vidéo')).not.toBeInTheDocument();
  });

  it('updates progress and emits onContentComplete when completing course contents', () => {
    const handleContentComplete = vi.fn();

    render(
      <ElearningCourseDetailsModal
        open
        title="Cours avec progression"
        description="Un cours dont la progression se met à jour."
        progress={0}
        onContentComplete={handleContentComplete}
        chapters={[
          {
            id: 'progress-chapter',
            title: 'Chapitre à compléter',
            duration: '30min',
            active: true,
            contents: [
              {
                id: 'progress-video',
                title: 'Vidéo de progression',
                type: 'video',
              },
              {
                id: 'progress-document',
                title: 'Document de progression',
                type: 'pdf',
              },
            ],
          },
        ]}
      />
    );

    expect(screen.getByText('0%')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Marquer Vidéo de progression comme terminé' }));

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(handleContentComplete).toHaveBeenLastCalledWith(
      expect.objectContaining({
        progress: 50,
        completed: false,
        completedRequiredContents: 1,
        totalRequiredContents: 2,
        content: expect.objectContaining({ id: 'progress-video', completed: true }),
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Marquer Document de progression comme terminé' }));

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(handleContentComplete).toHaveBeenLastCalledWith(
      expect.objectContaining({
        progress: 100,
        completed: true,
        completedRequiredContents: 2,
        totalRequiredContents: 2,
        chapter: expect.objectContaining({ id: 'progress-chapter', completed: true }),
      })
    );
  });

  it('lets users rate a completed course', () => {
    const handleSubmit = vi.fn();

    render(<ElearningCourseRating onSubmit={handleSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Donner la note 5 sur 5' }));
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la note' }));

    expect(handleSubmit).toHaveBeenCalledWith(5);
    expect(screen.getByText('Merci, votre note a bien été enregistrée.')).toBeInTheDocument();
  });

  it('shows course rating only when course details are completed', () => {
    const { rerender } = render(
      <ElearningCourseDetailsModal
        open
        title="Cours en cours"
        description="Formation pas encore terminée."
        progress={75}
        completionRating={{ onSubmit: vi.fn() }}
        chapters={[
          {
            id: 'chapter-active',
            title: 'Chapitre actif',
            duration: '15min',
            active: true,
          },
        ]}
      />
    );

    expect(screen.queryByText('Noter cette formation')).not.toBeInTheDocument();

    rerender(
      <ElearningCourseDetailsModal
        open
        title="Cours terminé"
        description="Formation terminée."
        progress={100}
        completionRating={{ onSubmit: vi.fn() }}
        chapters={[
          {
            id: 'chapter-completed',
            title: 'Chapitre terminé',
            duration: '15min',
            completed: true,
          },
        ]}
      />
    );

    expect(screen.getByText('Noter cette formation')).toBeInTheDocument();
  });

  it('updates the displayed course rating after submitting a rating', () => {
    render(
      <ElearningCourseDetailsModal
        open
        title="Cours terminé"
        description="Formation terminée."
        rating={3}
        ratingLabel="(12 apprenants)"
        ratingDistribution={{ 1: 0, 2: 0, 3: 12, 4: 0, 5: 0 }}
        progress={100}
        completionRating={{ onSubmit: vi.fn() }}
        chapters={[
          {
            id: 'chapter-completed',
            title: 'Chapitre terminé',
            duration: '15min',
            completed: true,
          },
        ]}
      />
    );

    expect(screen.getByText('3 (12 notes)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Donner la note 5 sur 5' }));
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la note' }));

    expect(screen.getByText('3.2 (13 notes)')).toBeInTheDocument();
    expect(screen.queryByText('3 (12 notes)')).not.toBeInTheDocument();
  });

  it('keeps the server rating until updated course props arrive', () => {
    const handleCourseRatingSubmit = vi.fn();
    const course = {
      ...courses[1],
      rating: 2.5,
      ratingDistribution: { 1: 0, 2: 1, 3: 1, 4: 0, 5: 0 },
      progress: 100,
      actionLabel: 'Revoir',
    };

    const { rerender } = render(
      <ElearningCatalog
        courses={[course]}
        onCourseRatingSubmit={handleCourseRatingSubmit}
      />
    );

    expect(within(screen.getByRole('article')).getByText('2.5')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Revoir' }));
    fireEvent.click(screen.getByRole('button', { name: 'Donner la note 4 sur 5' }));
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer la note' }));
    expect(screen.queryByText('Merci, votre note a bien été enregistrée.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Fermer le détail du cours'));

    expect(handleCourseRatingSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'archives' }),
      4,
      expect.objectContaining({ rating: 3, ratingCount: 3 })
    );
    expect(within(screen.getByRole('article')).getByText('2.5')).toBeInTheDocument();

    rerender(
      <ElearningCatalog
        courses={[{ ...course, rating: 3, ratingDistribution: { 1: 0, 2: 1, 3: 1, 4: 1, 5: 0 } }]}
        onCourseRatingSubmit={handleCourseRatingSubmit}
      />
    );
    expect(within(screen.getByRole('article')).getByText('3')).toBeInTheDocument();
  });

  it('keeps server progress until updated course props arrive', () => {
    const handleCourseContentComplete = vi.fn();
    const course = {
      ...courses[0],
      progress: 0,
      chapters: 1,
      details: {
        title: 'Sécurité au travail',
        description: 'Formation sur les règles de sécurité.',
        progress: 0,
        chapters: [{
          id: 'safety',
          title: 'Règles de sécurité',
          duration: '20 min',
          contents: [
            { id: 'safety-video', title: 'Vidéo de sécurité', type: 'video' as const },
            { id: 'safety-guide', title: 'Guide de sécurité', type: 'pdf' as const },
          ],
        }],
      },
    };

    const { rerender } = render(
      <ElearningCatalog
        courses={[course]}
        onCourseContentComplete={handleCourseContentComplete}
      />
    );

    expect(within(screen.getByRole('article')).getByText('0%')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Commencer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Marquer Vidéo de sécurité comme terminé' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('0%');
    fireEvent.click(screen.getByLabelText('Fermer le détail du cours'));

    expect(handleCourseContentComplete).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'security' }),
      expect.objectContaining({ progress: 50 })
    );
    expect(within(screen.getByRole('article')).getByText('0%')).toBeInTheDocument();

    rerender(
      <ElearningCatalog
        courses={[{
          ...course,
          progress: 50,
          details: {
            ...course.details,
            progress: 50,
            chapters: [{
              ...course.details.chapters[0],
              contents: [{ ...course.details.chapters[0].contents[0], completed: true }, course.details.chapters[0].contents[1]],
            }],
          },
        }]}
        onCourseContentComplete={handleCourseContentComplete}
      />
    );
    expect(within(screen.getByRole('article')).getByText('50%')).toBeInTheDocument();
  });

  it('opens course details from catalog when a course provides details', () => {
    render(
      <ElearningCatalog
        courses={[
          {
            ...courses[0],
            details: {
              title: 'Sécurité au travail',
              description: 'Formation sur les règles de sécurité.',
              instructor: 'Catherine Moreau',
              duration: '2h 30min',
              progress: 72,
              chapters: [
                {
                  id: 'safety',
                  title: 'Règles de sécurité à respecter dans les bâtiments municipaux',
                  duration: '15min',
                  completed: true,
                },
              ],
            },
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Règles de sécurité à respecter dans les bâtiments municipaux');
  });

  it('opens an initial catalog course without starting it and follows a keyed navigation', () => {
    const handleAction = vi.fn();
    const handleClose = vi.fn();
    const { rerender } = render(
      <ElearningCatalog
        key="archives"
        courses={courses}
        initialCourseId="archives"
        onCourseAction={handleAction}
        onCourseClose={handleClose}
      />
    );

    expect(screen.getByRole('dialog')).toHaveTextContent('Gestion des archives numériques');
    expect(handleAction).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Fermer le détail du cours' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(handleClose).toHaveBeenCalledTimes(1);

    rerender(
      <ElearningCatalog
        key="security"
        courses={courses}
        initialCourseId="security"
        onCourseAction={handleAction}
        onCourseClose={handleClose}
      />
    );
    expect(screen.getByRole('dialog')).toHaveTextContent('Sécurité au travail');
    expect(handleAction).not.toHaveBeenCalled();
  });

  it('does not fabricate a course for an unknown initial ID', () => {
    render(<ElearningCatalog courses={courses} initialCourseId="unknown" />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sécurité au travail' })).toBeInTheDocument();
  });

  it('shows only course information when chapter details are unavailable', () => {
    render(<ElearningCatalog courses={[courses[1]]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('Gestion des archives numériques');
    expect(screen.getByRole('dialog')).toHaveTextContent('Aucun chapitre disponible.');
    expect(screen.getByRole('dialog')).toHaveTextContent('Aucun contenu disponible pour cette formation.');
    expect(screen.queryByText('Chapitre 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Noter cette formation')).not.toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).queryByText('0%')).not.toBeInTheDocument();
  });

  it('does not invent a video for a chapter without resources', () => {
    render(
      <ElearningCourseDetailsModal
        open
        title="Formation sans ressource"
        description="Contenu à venir."
        chapters={[{ id: 'intro', title: 'Introduction', duration: '15 min' }]}
      />
    );

    expect(screen.getByRole('dialog')).toHaveTextContent('Aucun contenu disponible pour cette formation.');
    expect(screen.queryByRole('button', { name: /Marquer Introduction comme terminé/ })).not.toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('filters catalog courses by category and search', () => {
    render(<ElearningCatalog courses={courses} certificationCount={3} />);

    expect(screen.queryByText('3 certifications obtenues')).not.toBeInTheDocument();
    expect(screen.getByText('Sécurité au travail')).toBeInTheDocument();
    expect(screen.getByText('Gestion des archives numériques')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Toutes les catégories' }));
    fireEvent.click(screen.getByRole('option', { name: 'Sécurité' }));

    expect(screen.getByText('Sécurité au travail')).toBeInTheDocument();
    expect(screen.queryByText('Gestion des archives numériques')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Rechercher une formation...'), {
      target: { value: 'archives' },
    });

    expect(screen.getByText('Aucune formation ne correspond aux filtres.')).toBeInTheDocument();
  });

  it('hides formation management actions from standard users', () => {
    render(<ElearningCatalog courses={courses} />);

    expect(screen.queryByRole('button', { name: 'Nouvelle formation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Statistiques des formations' })).not.toBeInTheDocument();
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
        onCreateCourse={handleCreateCourse}
        onUpdateCourse={handleUpdateCourse}
        onDeleteCourse={handleDeleteCourse}
      />
    );

    expect(screen.getByRole('heading', { name: 'Statistiques des formations' })).toBeInTheDocument();
    expect(screen.getByText('Apprenants inscrits')).toBeInTheDocument();

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
    fireEvent.change(within(dialog).getByLabelText('Lien ou fichier'), {
      target: { value: 'alarme-incendie.mp4' },
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
        onCreateCourse={handleCreateCourse}
        onUpdateCourse={handleUpdateCourse}
        onDeleteCourse={handleDeleteCourse}
      />
    );
    expect(screen.queryByText('Prévention incendie actualisée')).not.toBeInTheDocument();
  });

  it('updates training statistics only from supplied course progress', () => {
    const course = {
      ...courses[0],
      statusValue: 'not-started',
      statusBadge: { label: 'Non commencé', variant: 'notStarted' as const },
      progress: 0,
      chapters: 1,
    };
    const { rerender } = render(
      <ElearningCatalog
        courses={[course]}
      />
    );

    expect(within(screen.getByText('Participation').parentElement as HTMLElement).getByText('0%')).toBeInTheDocument();
    expect(within(screen.getByText('Complétion').parentElement as HTMLElement).getByText('0%')).toBeInTheDocument();

    rerender(<ElearningCatalog courses={[{ ...course, statusValue: 'in-progress', progress: 50 }]} />);

    expect(within(screen.getByText('Participation').parentElement as HTMLElement).getByText('100%')).toBeInTheDocument();
    expect(within(screen.getByText('Complétion').parentElement as HTMLElement).getByText('50%')).toBeInTheDocument();
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
