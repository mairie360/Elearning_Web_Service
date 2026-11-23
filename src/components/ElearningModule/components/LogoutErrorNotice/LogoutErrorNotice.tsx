import { Alert } from '@mairie360/lib-components/primitives';

/** MAIR-934: the logout could not be confirmed. */
export const LogoutErrorNotice = ({ message, onBackToLogin }: { message: string; onBackToLogin: () => void }) => (
  <Alert tone="danger" title="Déconnexion non confirmée" description={message} actionLabel="Retour à la connexion" onAction={onBackToLogin} />
);
