import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ElearningCatalog, type ElearningCourse } from '@/components/elearning/ElearningCatalog';
import { ElearningCourseDetailsModal } from '@/components/elearning/ElearningCourseDetailsModal';
import { ElearningCourseRating } from '@/components/elearning/ElearningCourseRating';

const deferred = () => {
  let resolve!: (value: boolean) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<boolean>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
};

const course: ElearningCourse = {
  id: 'course', title: 'Parcours apprenant', description: 'Description du serveur', progress: 0,
  details: {
    title: 'Parcours apprenant', description: 'Description du serveur', progress: 0,
    chapters: [{ id: 'chapter', title: 'Chapitre serveur', duration: '5 min', contents: [
      { id: 'content', title: 'Ressource serveur', type: 'document', completed: false },
    ] }],
  },
};

it('locks both card actions and the reader until the start promise settles, then permits retry', async () => {
  const request = deferred();
  const start = vi.fn().mockReturnValueOnce(request.promise).mockReturnValue(true);
  render(<ElearningCatalog courses={[course]} onCourseAction={start} onCourseContentComplete={() => true} />);
  const poster = screen.getByRole('button', { name: 'Ouvrir la formation Parcours apprenant' });
  fireEvent.click(poster);
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveAttribute('aria-busy', 'true');
  expect(poster).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Commencer' })).toBeDisabled();
  expect(within(dialog).getByRole('button', { name: 'Marquer Ressource serveur comme terminé' })).toBeDisabled();
  expect(within(dialog).getByRole('button', { name: 'Fermer le détail du cours' })).toBeDisabled();
  fireEvent.click(poster);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(start).toHaveBeenCalledTimes(1);
  expect(dialog).toBeInTheDocument();
  await act(async () => request.resolve(false));
  expect(within(dialog).getByRole('alert')).toHaveTextContent('n’a pas pu être démarrée');
  expect(dialog).toHaveAttribute('aria-busy', 'false');
  fireEvent.keyDown(document, { key: 'Escape' });
  fireEvent.click(poster);
  expect(start).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it.each(['false', 'rejection'] as const)('retains confirmed progress after a pending completion %s, and retries once', async (failure) => {
  const request = deferred();
  const complete = vi.fn().mockReturnValueOnce(request.promise).mockReturnValue(true);
  const { rerender } = render(<ElearningCatalog courses={[course]} initialCourseId="course" onCourseContentComplete={complete} />);
  const dialog = screen.getByRole('dialog');
  const mark = within(dialog).getByRole('button', { name: 'Marquer Ressource serveur comme terminé' });
  fireEvent.click(mark);
  expect(dialog).toHaveAttribute('aria-busy', 'true');
  expect(mark).toBeDisabled();
  expect(within(dialog).getByText('0%')).toBeInTheDocument();
  fireEvent.click(mark);
  fireEvent.keyDown(document, { key: 'Escape' });
  fireEvent.mouseDown(dialog.parentElement!);
  expect(complete).toHaveBeenCalledTimes(1);
  expect(dialog).toBeInTheDocument();
  await act(async () => {
    if (failure === 'false') request.resolve(false);
    else request.reject(new Error('Refused'));
  });
  expect(within(dialog).getByRole('alert')).toHaveTextContent('progression est conservée');
  expect(within(dialog).getByText('0%')).toBeInTheDocument();
  expect(mark).toBeEnabled();
  fireEvent.click(mark);
  expect(complete).toHaveBeenCalledTimes(2);
  expect(complete.mock.calls[1]).toEqual(complete.mock.calls[0]);
  const confirmed: ElearningCourse = { ...course, progress: 100, details: {
    ...course.details!, progress: 100, completed: true, chapters: [{
      ...course.details!.chapters[0], completed: true,
      contents: [{ ...course.details!.chapters[0].contents![0], completed: true }],
    }],
  } };
  rerender(<ElearningCatalog courses={[confirmed]} initialCourseId="course" onCourseContentComplete={complete} />);
  expect(within(dialog).getByText('100%')).toBeInTheDocument();
  expect(within(dialog).getByRole('button', { name: 'Ressource serveur terminé' })).toBeDisabled();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('never applies optimistic completion before an asynchronous server confirmation', async () => {
  const request = deferred();
  render(<ElearningCourseDetailsModal open {...course.details!} onContentComplete={() => request.promise} />);
  fireEvent.click(screen.getByRole('button', { name: 'Marquer Ressource serveur comme terminé' }));
  expect(screen.getByText('0%')).toBeInTheDocument();
  await act(async () => request.resolve(true));
  expect(screen.getByText('100%')).toBeInTheDocument();
});

it.each(['false', 'rejection'] as const)('freezes rating selection and preserves it after %s until a confirmed retry', async (failure) => {
  const request = deferred();
  const rate = vi.fn().mockReturnValueOnce(request.promise).mockResolvedValue(true);
  const completed: ElearningCourse = { ...course, progress: 100, details: { ...course.details!, progress: 100, completed: true } };
  render(<ElearningCatalog courses={[completed]} initialCourseId="course" onCourseRatingSubmit={rate} />);
  const dialog = screen.getByRole('dialog');
  const star = within(dialog).getByRole('button', { name: 'Donner la note 5 sur 5' });
  fireEvent.click(star);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Envoyer la note' }));
  const pending = within(dialog).getByRole('button', { name: 'Enregistrement…' });
  expect(pending).toBeDisabled();
  expect(star).toBeDisabled();
  expect(star).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(pending);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(rate).toHaveBeenCalledTimes(1);
  expect(dialog).toBeInTheDocument();
  await act(async () => {
    if (failure === 'false') request.resolve(false);
    else request.reject(new Error('Refused'));
  });
  expect(star).toHaveAttribute('aria-pressed', 'true');
  expect(star).toBeEnabled();
  expect(within(dialog).getByText('Envoyer la note')).toBeEnabled();
  await act(async () => fireEvent.click(within(dialog).getByRole('button', { name: 'Envoyer la note' })));
  expect(rate).toHaveBeenCalledTimes(2);
  expect(rate.mock.calls[1][1]).toBe(5);
  expect(within(dialog).getByRole('button', { name: 'Note envoyée' })).toBeDisabled();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('supports a synchronous rating host without a pending state or duplicate confirmation', () => {
  const rate = vi.fn();
  render(<ElearningCourseRating onSubmit={rate} />);
  fireEvent.click(screen.getByRole('button', { name: 'Donner la note 4 sur 5' }));
  fireEvent.click(screen.getByRole('button', { name: 'Envoyer la note' }));
  expect(screen.getByRole('button', { name: 'Note envoyée' })).toBeDisabled();
  expect(rate).toHaveBeenCalledTimes(1);
});

it('explicitly edits a confirmed rating and cancels without posting or losing its value', () => {
  const rate = vi.fn();
  render(<ElearningCourseRating {...{ allowEditingSubmitted: true }} initialValue={4} submitted onSubmit={rate} />);
  expect(screen.getByRole('button', { name: 'Donner la note 4 sur 5' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Modifier ma note' }));
  fireEvent.click(screen.getByRole('button', { name: 'Donner la note 2 sur 5' }));
  expect(screen.getByRole('button', { name: 'Donner la note 2 sur 5' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Annuler la modification' }));
  expect(screen.getByRole('button', { name: 'Donner la note 4 sur 5' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Note envoyée' })).toBeDisabled();
  expect(rate).not.toHaveBeenCalled();
});

it.each(['false', 'rejection'] as const)('retains an edited rating after %s, locks repeats, and confirms only a successful retry', async (failure) => {
  const request = deferred();
  const rate = vi.fn().mockReturnValueOnce(request.promise).mockResolvedValue(true);
  render(<ElearningCourseRating {...{ allowEditingSubmitted: true }} initialValue={4} submitted onSubmit={rate} />);
  fireEvent.click(screen.getByRole('button', { name: 'Modifier ma note' }));
  const star = screen.getByRole('button', { name: 'Donner la note 5 sur 5' });
  fireEvent.click(star);
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer ma note' }));
  const pending = screen.getByRole('button', { name: 'Enregistrement…' });
  expect(pending).toBeDisabled();
  expect(star).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Annuler la modification' })).toBeDisabled();
  fireEvent.click(pending);
  expect(rate).toHaveBeenCalledTimes(1);
  await act(async () => {
    if (failure === 'false') request.resolve(false);
    else request.reject(new Error('Refused'));
  });
  expect(screen.getByRole('alert')).toHaveTextContent('n’a pas été enregistrée');
  expect(star).toHaveAttribute('aria-pressed', 'true');
  expect(star).toBeEnabled();
  expect(screen.queryByText('Merci, votre note a bien été enregistrée.')).not.toBeInTheDocument();
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer ma note' })));
  expect(rate).toHaveBeenCalledTimes(2);
  expect(rate.mock.calls).toEqual([[5], [5]]);
  expect(screen.getByRole('button', { name: 'Note envoyée' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Modifier ma note' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Modifier ma note' }));
  fireEvent.click(screen.getByRole('button', { name: 'Donner la note 3 sur 5' }));
  fireEvent.click(screen.getByRole('button', { name: 'Annuler la modification' }));
  expect(star).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('does not offer editing by default and respects the host disabled flag when enabled', () => {
  const { rerender } = render(<ElearningCourseRating initialValue={4} submitted />);
  expect(screen.queryByRole('button', { name: 'Modifier ma note' })).not.toBeInTheDocument();
  rerender(<ElearningCourseRating {...{ allowEditingSubmitted: true }} initialValue={4} submitted disabled />);
  expect(screen.getByRole('button', { name: 'Modifier ma note' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Donner la note 4 sur 5' })).toBeDisabled();
});

it('opts the catalogue into editing without optimistically changing the server rating distribution', async () => {
  const rate = vi.fn().mockResolvedValue(true);
  const completed: ElearningCourse = { ...course, progress: 100, ratingDistribution: { 4: 3 }, details: {
    ...course.details!, progress: 100, completed: true,
    completionRating: { initialValue: 4, submitted: true },
  } };
  render(<ElearningCatalog {...{ allowRatingEdits: true }} courses={[completed]} initialCourseId="course" onCourseRatingSubmit={rate} />);
  const dialog = screen.getByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Modifier ma note' }));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Donner la note 5 sur 5' }));
  await act(async () => fireEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer ma note' })));
  expect(rate).toHaveBeenCalledTimes(1);
  expect(rate.mock.calls[0][1]).toBe(5);
  expect(within(dialog).getByText('4 (3 notes)')).toBeInTheDocument();
  expect(within(dialog).getByRole('button', { name: 'Note envoyée' })).toBeDisabled();
});

it('downloads by confirmed resource identity without completing it or requiring a public URL', async () => {
  const download=vi.fn().mockRejectedValueOnce(new Error('Support indisponible')).mockResolvedValueOnce(true);
  const complete=vi.fn();
  render(<ElearningCourseDetailsModal open {...course.details!} onContentDownload={download} onContentComplete={complete} canCompleteContent={() => false} />);
  const mark=screen.getByRole('button',{ name:'Marquer Ressource serveur comme terminé' });
  expect(mark).toBeDisabled(); fireEvent.click(mark); expect(complete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{ name:'Télécharger le support' }));
  await screen.findByText('Support indisponible'); expect(screen.getByText('0%')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{ name:'Télécharger le support' }));
  await waitFor(() => expect(download).toHaveBeenCalledTimes(2));
  expect(complete).not.toHaveBeenCalled(); expect(download.mock.calls[0][0].id).toBe('content');
});
