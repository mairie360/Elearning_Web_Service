import { ClipboardCheck, FileDown, FileText, Link as LinkIcon, Play, Volume2, type LucideIcon } from 'lucide-react';

import type { ElearningCourseContentType } from './course-types';

export const contentTypeLabels: Record<ElearningCourseContentType, string> = {
  video: 'Vidéo',
  pdf: 'PDF',
  document: 'Document',
  link: 'Lien',
  quiz: 'Quiz',
  audio: 'Audio',
  other: 'Ressource',
};

export const contentTypeIcons: Record<ElearningCourseContentType, LucideIcon> = {
  video: Play,
  pdf: FileDown,
  document: FileText,
  link: LinkIcon,
  quiz: ClipboardCheck,
  audio: Volume2,
  other: FileText,
};

export const contentCountLabel = (count: number) => `${count} contenu${count > 1 ? 's' : ''}`;

/** MAIR-817: the types the E-learning API stores as a file (opened through a signed URL); a link, a quiz or `other` has none. */
export const STORED_FILE_TYPES: ReadonlySet<ElearningCourseContentType> = new Set(['video', 'pdf', 'document', 'audio']);
export const isStoredFileContent = (content: { type: ElearningCourseContentType }) => STORED_FILE_TYPES.has(content.type);
