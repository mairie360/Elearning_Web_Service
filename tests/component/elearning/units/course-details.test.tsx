import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChapterContentItem } from '@/components/elearning/course-details/ChapterContentItem';
import { ChapterList } from '@/components/elearning/course-details/ChapterList';
import { CourseFacts } from '@/components/elearning/course-details/CourseFacts';
import { CourseMediaPreview } from '@/components/elearning/course-details/CourseMediaPreview';
import { CourseProgress } from '@/components/elearning/course-details/CourseProgress';
import { SelectedChapter } from '@/components/elearning/course-details/SelectedChapter';

const video = { id: 'v', title: 'Introduction', type: 'video' as const, duration: '5 min' };
const pdf = { id: 'p', title: 'Support', type: 'pdf' as const, required: false, href: 'https://example.test/support.pdf', fileName: 'support.pdf' };

describe('MAIR-608 course details sub-components', () => {
  it('CourseMediaPreview names the main content or says there is none', () => {
    const { rerender } = render(<CourseMediaPreview content={video} />);
    expect(screen.getByText('Vidéo')).toBeVisible();
    expect(screen.getByText('Introduction')).toBeVisible();
    rerender(<CourseMediaPreview />);
    expect(screen.getByText('Aucun contenu disponible pour cette formation.')).toBeVisible();
  });

  it('ChapterContentItem labels optional contents, opens links and completes once allowed', async () => {
    const onComplete = vi.fn();
    const { rerender } = render(<ChapterContentItem content={pdf} busy={false} canComplete onComplete={onComplete} />);
    expect(screen.getByText('Optionnel')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Ouvrir' })).toHaveAttribute('href', pdf.href);
    expect(screen.getByText('support.pdf')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Marquer Support comme terminé' }));
    expect(onComplete).toHaveBeenCalledWith(pdf);
    rerender(<ChapterContentItem content={{ ...pdf, completed: true }} busy={false} canComplete onComplete={onComplete} />);
    expect(screen.getByRole('button', { name: 'Support terminé' })).toBeDisabled();
    rerender(<ChapterContentItem content={video} busy={false} canComplete={false} onComplete={onComplete} />);
    expect(screen.getByRole('button', { name: 'Marquer Introduction comme terminé' })).toBeDisabled();
  });

  it('ChapterContentItem downloads through the host and shows the pending label', async () => {
    const onDownload = vi.fn();
    const { rerender } = render(<ChapterContentItem content={pdf} busy={false} canComplete onDownload={onDownload} />);
    expect(screen.queryByRole('link')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Télécharger le support' }));
    expect(onDownload).toHaveBeenCalledWith(pdf);
    rerender(<ChapterContentItem content={pdf} busy canComplete onDownload={onDownload} />);
    expect(screen.getByRole('button', { name: 'Téléchargement…' })).toBeDisabled();
  });

  it('SelectedChapter counts its contents and completes one in its chapter', async () => {
    const onComplete = vi.fn();
    const chapter = { id: 'c1', title: 'Chapitre 1', duration: '10 min', contents: [video, pdf] };
    render(<SelectedChapter chapter={chapter} busy={false} onComplete={onComplete} canCompleteContent={(content) => content.id === 'v'} />);
    expect(screen.getByRole('heading', { name: 'Chapitre 1' })).toBeVisible();
    expect(screen.getByText('2 contenus')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Marquer Support comme terminé' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Marquer Introduction comme terminé' }));
    expect(onComplete).toHaveBeenCalledWith(chapter, video);
  });

  it('CourseFacts lists only the known facts', () => {
    const { rerender } = render(<CourseFacts description="Présentation" instructor="DRH" duration="1 h" rating={4.5} ratingLabel="(2 notes)" />);
    expect(screen.getByText('Présentation')).toBeVisible();
    expect(screen.getByText('DRH')).toBeVisible();
    expect(screen.getByText('4.5 (2 notes)')).toBeVisible();
    rerender(<CourseFacts description="Présentation" />);
    expect(screen.queryByText('Instructeur')).toBeNull();
    expect(screen.queryByText('Note')).toBeNull();
  });

  it('ChapterList presses the selected chapter and selects another', async () => {
    const onSelect = vi.fn();
    const { rerender } = render(<ChapterList chapters={[{ id: 'a', title: 'A', duration: '5 min', contents: [video] }, { id: 'b', title: 'B', duration: '', completed: true }]} selectedId="a" onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: /A/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 contenu')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: /B/ }));
    expect(onSelect).toHaveBeenCalledWith('b');
    rerender(<ChapterList chapters={[]} onSelect={onSelect} />);
    expect(screen.getByText('Aucun chapitre disponible.')).toBeVisible();
  });

  it('CourseProgress shows the total percentage', () => {
    const { container } = render(<CourseProgress value={40} />);
    expect(screen.getByText('40%')).toBeVisible();
    expect(container.querySelector('[style]')).toHaveStyle({ width: '40%' });
  });
});
