import type { ElearningCourseChapter, ElearningCourseContentItem, ElearningCourseProgressSummary } from '@/components/ElearningModule/components/ElearningCatalog/course-types';

const clampProgress = (value: number) => Math.min(100, Math.max(0, value));

/** The active chapter, else the first unfinished one, else the first. */
export const getInitialChapter = (chapters: ElearningCourseChapter[]) =>
  chapters.find((chapter) => chapter.active) ?? chapters.find((chapter) => !chapter.completed) ?? chapters[0];

export const getChapterContents = (chapter: ElearningCourseChapter): ElearningCourseContentItem[] =>
  chapter.contents ?? [];

/** Contents are required unless explicitly marked optional. */
export const isRequiredContent = (content: ElearningCourseContentItem) => content.required !== false;

/** A chapter is done when all its required contents are; without any, its own flag decides. */
export const getChapterCompleted = (chapter: ElearningCourseChapter, contents: ElearningCourseContentItem[]) => {
  const requiredContents = contents.filter(isRequiredContent);

  if (requiredContents.length === 0) return Boolean(chapter.completed);

  return requiredContents.every((content) => content.completed);
};

/** Contents inherit the chapter's completion and default to required. */
export const normalizeChaptersForProgress = (chapters: ElearningCourseChapter[]) =>
  chapters.map((chapter) => {
    const contents = getChapterContents(chapter).map((content) => ({
      ...content,
      completed: content.completed ?? chapter.completed ?? false,
      required: content.required ?? true,
    }));
    const completed = getChapterCompleted(chapter, contents);

    return {
      ...chapter,
      completed,
      active: completed ? false : chapter.active,
      contents,
    };
  });

export const getElearningCourseProgressSummary = (
  chapters: ElearningCourseChapter[]
): ElearningCourseProgressSummary => {
  const requiredContents = chapters.flatMap((chapter) => getChapterContents(chapter).filter(isRequiredContent));
  const completedRequiredContents = requiredContents.filter((content) => content.completed).length;
  const totalRequiredContents = requiredContents.length;
  const progress =
    totalRequiredContents === 0 ? 0 : Math.round((completedRequiredContents / totalRequiredContents) * 100);
  const completedChapters = chapters.filter((chapter) => getChapterCompleted(chapter, getChapterContents(chapter))).length;

  return {
    progress,
    completedRequiredContents,
    totalRequiredContents,
    completedChapters,
    totalChapters: chapters.length,
    completed: totalRequiredContents > 0 && completedRequiredContents === totalRequiredContents,
    chapters,
  };
};

/** The supplied progress wins; otherwise it is computed when there is something required to do. */
export const getDisplayedProgress = (progress: number | undefined, chapters: ElearningCourseChapter[]) => {
  if (typeof progress === 'number') return clampProgress(progress);
  if (!chapters.some((chapter) => getChapterContents(chapter).some(isRequiredContent))) return undefined;
  return getElearningCourseProgressSummary(chapters).progress;
};

export const isCourseCompleted = (
  completed: boolean | undefined,
  normalizedProgress: number | undefined,
  chapters: ElearningCourseChapter[]
) => {
  if (completed !== undefined) return completed;

  return normalizedProgress === 100 || (chapters.length > 0 && chapters.every((chapter) => chapter.completed));
};

/** Key that changes when any chapter or content completion changes. */
export const chaptersStateKey = (chapters: ElearningCourseChapter[]) =>
  chapters
    .map((chapter) =>
      [
        chapter.id,
        chapter.completed ? 'completed' : 'pending',
        getChapterContents(chapter)
          .map((content) => `${content.id}:${content.completed ? 'completed' : 'pending'}:${content.required === false ? 'optional' : 'required'}`)
          .join(','),
      ].join(':')
    )
    .join('|');

export interface ContentCompletion {
  chapters: ElearningCourseChapter[];
  chapter?: ElearningCourseChapter;
  content?: ElearningCourseContentItem;
  wasAlreadyCompleted: boolean;
}

/** Mark one content done and recompute its chapter. */
export const completeContent = (chapters: ElearningCourseChapter[], chapterId: string, contentId: string): ContentCompletion => {
  let completedChapter: ElearningCourseChapter | undefined;
  let completedContent: ElearningCourseContentItem | undefined;
  let wasAlreadyCompleted = false;

  const nextChapters = chapters.map((chapter) => {
    if (chapter.id !== chapterId) return chapter;

    const contents = getChapterContents(chapter).map((content) => {
      if (content.id !== contentId) return content;
      wasAlreadyCompleted = Boolean(content.completed);
      completedContent = { ...content, completed: true };
      return completedContent;
    });
    const chapterCompleted = getChapterCompleted(chapter, contents);

    completedChapter = {
      ...chapter,
      active: chapterCompleted ? false : chapter.active,
      completed: chapterCompleted,
      contents,
    };

    return completedChapter;
  });

  return { chapters: nextChapters, chapter: completedChapter, content: completedContent, wasAlreadyCompleted };
};
