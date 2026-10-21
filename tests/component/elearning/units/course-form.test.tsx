import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChapterContentEditor } from '@/components/elearning/course-form/ChapterContentEditor';
import { CourseChapterEditor } from '@/components/elearning/course-form/CourseChapterEditor';
import { CourseGeneralSection } from '@/components/elearning/course-form/CourseGeneralSection';
import { CoursePresentationSection, authorStatusOptions } from '@/components/elearning/course-form/CoursePresentationSection';
import { CourseProgramSection } from '@/components/elearning/course-form/CourseProgramSection';
import { TextAreaField } from '@/components/elearning/course-form/TextAreaField';
import type { ElearningCourseFormValues } from '@/components/elearning/course-form/course-form-values';

const content = { id: 'r1', title: 'Vidéo', type: 'video' as const, required: true };
const chapter = { id: 'c1', title: 'Chapitre', duration: '10 min', description: '', contents: [content] };
const values: ElearningCourseFormValues = {
  title: 'Accueil', subtitle: '', description: 'Présentation', category: 'RH', statusValue: 'not-started',
  instructor: '', duration: '1 h', deadline: '', requirement: 'none', level: 'none', chapters: [chapter],
};

describe('MAIR-608 course form sub-components', () => {
  it('TextAreaField labels a required text area', async () => {
    const onChange = vi.fn();
    render(<TextAreaField id="t" label="Description" value="" required onChange={onChange} />);
    const field = screen.getByRole('textbox', { name: /Description/ });
    expect(field).toBeRequired();
    await userEvent.type(field, 'A');
    expect(onChange).toHaveBeenCalledWith('A');
  });

  it('CourseGeneralSection keeps the field ids and reports each change', () => {
    const onChange = vi.fn();
    render(<CourseGeneralSection values={values} onChange={onChange} />);
    expect(screen.getByRole('heading', { name: 'Informations générales' })).toBeVisible();
    fireEvent.change(document.getElementById('elearning-course-title')!, { target: { value: 'Nouveau' } });
    fireEvent.change(document.getElementById('elearning-course-deadline')!, { target: { value: '30 juin' } });
    fireEvent.change(document.getElementById('elearning-course-description')!, { target: { value: 'Texte' } });
    expect(onChange.mock.calls).toEqual([['title', 'Nouveau'], ['deadline', '30 juin'], ['description', 'Texte']]);
    expect(document.getElementById('elearning-course-category')).toBeRequired();
  });

  it('authorStatusOptions drops "all" and shows an unknown draft status disabled first', () => {
    expect(authorStatusOptions([{ value: 'all', label: 'Tous' }, { value: 'in-progress', label: 'En cours' }], 'in-progress'))
      .toEqual([{ value: 'in-progress', label: 'En cours', disabled: undefined }]);
    expect(authorStatusOptions([], 'completed')).toEqual([{ value: 'completed', label: 'Terminé (statut actuel)', disabled: true }]);
  });

  it('CoursePresentationSection reports status, requirement and level', () => {
    const handlers = { onStatusChange: vi.fn(), onRequirementChange: vi.fn(), onLevelChange: vi.fn() };
    render(<CoursePresentationSection values={values} statusOptions={[{ value: 'not-started', label: 'Non commencé' }, { value: 'completed', label: 'Terminé' }]} {...handlers} />);
    fireEvent.change(screen.getByLabelText('Statut'), { target: { value: 'completed' } });
    fireEvent.change(screen.getByLabelText('Type de parcours'), { target: { value: 'mandatory' } });
    fireEvent.change(screen.getByLabelText('Niveau'), { target: { value: 'advanced' } });
    expect(handlers.onStatusChange).toHaveBeenCalledWith('completed');
    expect(handlers.onRequirementChange).toHaveBeenCalledWith('mandatory');
    expect(handlers.onLevelChange).toHaveBeenCalledWith('advanced');
  });

  it('ChapterContentEditor stores a link as href, a file as fileName, and toggles the required flag', async () => {
    const onChange = vi.fn(); const onRemove = vi.fn();
    const { rerender } = render(<ChapterContentEditor content={content} contentIndex={0} chapterIndex={0} removable={false} onChange={onChange} onRemove={onRemove} />);
    expect(screen.getByRole('button', { name: 'Supprimer la ressource 1 du chapitre 1' })).toBeDisabled();
    fireEvent.change(document.getElementById('content-resource-r1')!, { target: { value: 'cours.pdf' } });
    expect(onChange).toHaveBeenLastCalledWith({ fileName: 'cours.pdf', href: undefined });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Ressource obligatoire pour terminer la formation' }));
    expect(onChange).toHaveBeenLastCalledWith({ required: false });
    rerender(<ChapterContentEditor content={{ ...content, type: 'link' }} contentIndex={1} chapterIndex={0} removable onChange={onChange} onRemove={onRemove} />);
    fireEvent.change(document.getElementById('content-resource-r1')!, { target: { value: 'https://x.test' } });
    expect(onChange).toHaveBeenLastCalledWith({ href: 'https://x.test', fileName: undefined });
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer la ressource 2 du chapitre 1' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('CourseChapterEditor edits its fields and adds a resource', async () => {
    const props = { onChange: vi.fn(), onRemove: vi.fn(), onAddContent: vi.fn(), onContentChange: vi.fn(), onContentRemove: vi.fn() };
    render(<CourseChapterEditor chapter={chapter} chapterIndex={1} removable {...props} />);
    expect(screen.getByRole('heading', { name: 'Chapitre 2' })).toBeVisible();
    fireEvent.change(document.getElementById('chapter-duration-c1')!, { target: { value: '20 min' } });
    expect(props.onChange).toHaveBeenCalledWith({ duration: '20 min' });
    fireEvent.change(document.getElementById('content-title-r1')!, { target: { value: 'Nouveau titre' } });
    expect(props.onContentChange).toHaveBeenCalledWith('r1', { title: 'Nouveau titre' });
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter une ressource' }));
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer le chapitre 2' }));
    expect(props.onAddContent).toHaveBeenCalledTimes(1);
    expect(props.onRemove).toHaveBeenCalledTimes(1);
  });

  it('CourseProgramSection keeps the last chapter and adds chapters', async () => {
    const props = { onAddChapter: vi.fn(), onChapterChange: vi.fn(), onChapterRemove: vi.fn(), onAddContent: vi.fn(), onContentChange: vi.fn(), onContentRemove: vi.fn() };
    render(<CourseProgramSection chapters={[chapter]} {...props} />);
    expect(screen.getByRole('button', { name: 'Supprimer le chapitre 1' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter un chapitre' }));
    expect(props.onAddChapter).toHaveBeenCalledTimes(1);
  });
});
