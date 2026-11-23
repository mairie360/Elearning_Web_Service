import { Alert, DataState, RetryButton } from "@mairie360/lib-components/primitives";

export interface CatalogReadErrorProps {
  /** With a catalogue on screen the last confirmed data stay displayed under the alert. */
  hasCatalog: boolean;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

/** MAIR-913: the catalogue read failed. Warning alert, then the retry (DataState) when nothing can be shown. */
export const CatalogReadError = ({ hasCatalog, loading, error, onRetry }: CatalogReadErrorProps) => {
  if (!error) return null;
  return (
    <div data-elearning-read-error className="flex flex-col gap-4">
      <Alert
        role="alert"
        tone="warning"
        title="Service de formation indisponible"
        description={hasCatalog ? `${error} Les dernières données confirmées restent affichées.` : error}
      />
      {hasCatalog ? (
        <div><RetryButton size="s" loading={loading} onClick={onRetry} /></div>
      ) : (
        <DataState
          state="error"
          title="Impossible de charger les formations"
          description="Vérifiez votre connexion puis réessayez."
          action={<RetryButton loading={loading} onClick={onRetry} />}
        />
      )}
    </div>
  );
};
