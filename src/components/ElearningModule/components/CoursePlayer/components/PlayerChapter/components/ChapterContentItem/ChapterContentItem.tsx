import { CircleCheck, ExternalLink } from 'lucide-react';
import { Button, Icon, Text } from '@mairie360/lib-components/primitives';

import {
  contentTypeIcons,
  contentTypeLabels,
  isRequiredContent,
  isStoredFileContent,
  safeContentLink,
  type ElearningCourseContentItem,
} from '../../../../../ElearningCatalog';

export interface ChapterContentItemProps {
  content: ElearningCourseContentItem;
  busy: boolean;
  /** Opens a stored file through the BFF (MAIR-817); a link keeps its own safe « Ouvrir » link. */
  onDownload?: (content: ElearningCourseContentItem) => void;
  downloading?: boolean;
  /** Undefined hides the completion button. */
  onComplete?: (content: ElearningCourseContentItem) => void;
  canComplete: boolean;
}

/** One content of a chapter: type, duration, optional flag, download or safe link (MAIR-703), completion. */
export const ChapterContentItem = ({ content, busy, onDownload, downloading = false, onComplete, canComplete }: ChapterContentItemProps) => {
  const completed = Boolean(content.completed);
  // A link resource is always a link (MAIR-703); the service only opens stored files (no file for a quiz or `other`).
  const download = isStoredFileContent(content) ? onDownload : undefined;
  const link = content.type === 'link' ? safeContentLink(content.href) : undefined;
  return (
    <li className={`flex items-start gap-3 rounded-[var(--mairie-radius-m)] border p-3 ${completed ? 'border-[var(--mairie-success-text)]' : 'border-[var(--mairie-border)]'}`}>
      <Icon icon={completed ? CircleCheck : contentTypeIcons[content.type]} size="l"
        className={completed ? 'text-[var(--mairie-success-text)]' : 'text-[var(--mairie-accent)]'} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Text weight="semibold" className="break-words">{content.title}</Text>
        <Text size="xs" tone="muted">
          {contentTypeLabels[content.type]}{content.duration ? ` - ${content.duration}` : ''}{isRequiredContent(content) ? '' : ' · Optionnel'}
        </Text>
        {content.description ? <Text size="s" tone="muted" className="break-words">{content.description}</Text> : null}
        {content.fileName ? <Text size="xs" tone="muted" className="break-words">{content.fileName}</Text> : null}
        {content.type === 'link' && content.href && !link ? <Text size="xs" tone="warning">Lien non sécurisé : il n’est pas proposé.</Text> : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {download ? <Button size="s" variant="outline" icon={ExternalLink} label="Ouvrir le support" aria-label={`Ouvrir le support ${content.title} dans un nouvel onglet`} loading={downloading} disabled={busy && !downloading} onClick={() => download(content)} /> : null}
        {link ? (
          <a href={link.href} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-[var(--mairie-radius-s)] px-2 py-1 text-sm font-semibold text-[var(--mairie-accent)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--mairie-accent)]">
            Ouvrir{link.host ? ` (${link.host})` : ''}
            <ExternalLink aria-hidden="true" className="size-3.5" />
            <span className="sr-only"> dans un nouvel onglet</span>
          </a>
        ) : null}
        {onComplete ? (
          <Button size="s" variant="outline" tone={completed ? 'success' : 'neutral'}
            aria-label={completed ? `${content.title} terminé` : `Marquer ${content.title} comme terminé`}
            label={completed ? 'Terminé' : 'Marquer comme terminé'}
            disabled={completed || busy || !canComplete}
            onClick={() => onComplete(content)} />
        ) : null}
      </div>
    </li>
  );
};
