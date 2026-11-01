import { ClipboardCheck, FileDown, FileText, Link as LinkIcon, Play, Volume2, type LucideIcon } from 'lucide-react';

import type { ElearningCourseContentType } from '@/components/ElearningModule/components/ElearningCatalog/course-types';

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
