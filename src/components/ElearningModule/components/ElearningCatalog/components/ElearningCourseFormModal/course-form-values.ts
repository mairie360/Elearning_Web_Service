import type {
  ElearningCourseChapter,
  ElearningCourseContentItem,
  ElearningCourseContentType,
} from '../../course-types';

export type ElearningCourseRequirement = 'none' | 'mandatory' | 'recommended';
export type ElearningCourseLevel = 'none' | 'beginner' | 'intermediate' | 'advanced';

export interface ElearningCourseChapterFormValues extends Omit<ElearningCourseChapter, 'contents'> {
  description?: string;
  contents: ElearningCourseContentItem[];
}

export interface ElearningCourseFormValues {
  title: string;
  subtitle: string;
  description: string;
  category: string;
  statusValue: string;
  instructor: string;
  duration: string;
  deadline: string;
  requirement: ElearningCourseRequirement;
  level: ElearningCourseLevel;
  chapters: ElearningCourseChapterFormValues[];
}

/** Label of a draft status the catalogue filters do not offer. */
export const currentStatusLabel = (statusValue: string) => {
  switch (statusValue) {
    case 'not-started': return 'Non commencé (statut actuel)';
    case 'in-progress': return 'En cours (statut actuel)';
    case 'completed': return 'Terminé (statut actuel)';
    default: return statusValue.trim() ? `Statut actuel : ${statusValue}` : 'Statut non renseigné';
  }
};

export const contentTypeOptions: Array<{ label: string; value: ElearningCourseContentType }> = [
  { label: 'Vidéo', value: 'video' },
  { label: 'PDF', value: 'pdf' },
  { label: 'Document', value: 'document' },
  { label: 'Lien', value: 'link' },
  { label: 'Quiz', value: 'quiz' },
  { label: 'Audio', value: 'audio' },
  { label: 'Autre', value: 'other' },
];

export const requirementOptions: Array<{ label: string; value: ElearningCourseRequirement }> = [
  { label: 'Standard', value: 'none' },
  { label: 'Obligatoire', value: 'mandatory' },
  { label: 'Recommandé', value: 'recommended' },
];

export const levelOptions: Array<{ label: string; value: ElearningCourseLevel }> = [
  { label: 'Non renseigné', value: 'none' },
  { label: 'Débutant', value: 'beginner' },
  { label: 'Intermédiaire', value: 'intermediate' },
  { label: 'Avancé', value: 'advanced' },
];

const createId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const createEmptyCourseContent = (): ElearningCourseContentItem => ({
  id: createId('content'),
  title: '',
  type: 'video',
  description: '',
  duration: '',
  required: true,
});

export const createEmptyCourseChapter = (): ElearningCourseChapterFormValues => ({
  id: createId('chapter'),
  title: '',
  description: '',
  duration: '',
  contents: [createEmptyCourseContent()],
});

/** Trimmed values; empty resource fields are dropped. */
export const normalizeCourseFormValues = (values: ElearningCourseFormValues): ElearningCourseFormValues => ({
  ...values,
  title: values.title.trim(),
  subtitle: values.subtitle.trim(),
  description: values.description.trim(),
  category: values.category.trim(),
  instructor: values.instructor.trim(),
  duration: values.duration.trim(),
  deadline: values.deadline.trim(),
  chapters: values.chapters.map((chapter) => ({
    ...chapter,
    title: chapter.title.trim(),
    description: chapter.description?.trim(),
    duration: chapter.duration.trim(),
    contents: chapter.contents.map((content) => ({
      ...content,
      title: content.title.trim(),
      description: content.description?.trim(),
      duration: content.duration?.trim(),
      fileName: content.fileName?.trim() || undefined,
      href: content.href?.trim() || undefined,
    })),
  })),
});

type Chapters = ElearningCourseChapterFormValues[];

export const patchChapter = (chapters: Chapters, chapterId: string, patch: Partial<ElearningCourseChapterFormValues>): Chapters =>
  chapters.map((chapter) => (chapter.id === chapterId ? { ...chapter, ...patch } : chapter));

export const patchContent = (chapters: Chapters, chapterId: string, contentId: string, patch: Partial<ElearningCourseContentItem>): Chapters =>
  chapters.map((chapter) =>
    chapter.id === chapterId
      ? { ...chapter, contents: chapter.contents.map((content) => (content.id === contentId ? { ...content, ...patch } : content)) }
      : chapter);

export const removeChapter = (chapters: Chapters, chapterId: string): Chapters =>
  chapters.filter((chapter) => chapter.id !== chapterId);

export const removeContent = (chapters: Chapters, chapterId: string, contentId: string): Chapters =>
  chapters.map((chapter) =>
    chapter.id === chapterId ? { ...chapter, contents: chapter.contents.filter((content) => content.id !== contentId) } : chapter);

/** A link keeps an address; any other type keeps a file name. */
export const resourcePatch = (type: ElearningCourseContentType, value: string): Partial<ElearningCourseContentItem> =>
  type === 'link' ? { href: value, fileName: undefined } : { fileName: value, href: undefined };

/** MAIR-932 / MAIR-703: what the administrator must fix before the course is sent. */
export interface CourseFormErrors {
  title?: string;
  description?: string;
  duration?: string;
  /** Unsafe address of a link resource, by content id. */
  links: Record<string, string>;
}

const SAFE_PATH = /^\/(?!\/)[^\\]*$/;

/** A link resource must be an `https:` address or a path of this site (MAIR-703). */
export const linkError = (content: ElearningCourseContentItem) => {
  if (content.type !== 'link') return undefined;
  const href = content.href?.trim();
  if (!href) return undefined;
  if (SAFE_PATH.test(href)) return undefined;
  try {
    const url = new URL(href);
    return url.protocol === 'https:' && url.hostname ? undefined : 'Saisissez une adresse sécurisée commençant par https://.';
  } catch {
    return 'Saisissez une adresse sécurisée commençant par https://.';
  }
};

export const validateCourseForm = (values: ElearningCourseFormValues): CourseFormErrors => {
  const links: Record<string, string> = {};
  for (const chapter of values.chapters) {
    for (const content of chapter.contents) {
      const error = linkError(content);
      if (error) links[content.id] = error;
    }
  }
  return {
    title: values.title.trim() ? undefined : 'Saisissez le titre de la formation.',
    description: values.description.trim() ? undefined : 'Saisissez la description de la formation.',
    duration: values.duration.trim() ? undefined : 'Saisissez la durée totale de la formation.',
    links,
  };
};

export const hasCourseFormErrors = (errors: CourseFormErrors) =>
  Boolean(errors.title || errors.description || errors.duration || Object.keys(errors.links).length);

/** Id of the first field to fix, in the order of the form. */
export const firstErrorFieldId = (errors: CourseFormErrors) => {
  if (errors.title) return 'elearning-course-title';
  if (errors.description) return 'elearning-course-description';
  if (errors.duration) return 'elearning-course-duration';
  const content = Object.keys(errors.links)[0];
  return content ? `content-resource-${content}` : undefined;
};
