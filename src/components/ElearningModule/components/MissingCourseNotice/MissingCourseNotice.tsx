import { Alert } from '@mairie360/lib-components/primitives';

/** MAIR-934: a deep link to a course the catalogue no longer holds (not a service failure). */
export const MissingCourseNotice = ({ onShowCatalog }: { onShowCatalog: () => void }) => (
  <Alert role="alert" tone="warning" title="Formation introuvable"
    description="Cette formation n’est plus disponible. Vous pouvez consulter les autres formations."
    actionLabel="Voir le catalogue" onAction={onShowCatalog} />
);
