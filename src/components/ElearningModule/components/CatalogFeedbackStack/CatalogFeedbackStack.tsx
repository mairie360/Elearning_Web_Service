import { Toast } from "@mairie360/lib-components/primitives";

export interface CatalogFeedbackStackProps {
  /** With a catalogue on screen the stack floats over it; without, it replaces it. */
  hasCatalog: boolean;
  loading: boolean;
  error: string | null;
  mutationError: string | null;
  mutationSuccess: string | null;
  onRetry: () => void;
  onDismissError: () => void;
  onDismissSuccess: () => void;
}

/** Save confirmations, save errors and the catalogue read error with its retry. */
export const CatalogFeedbackStack = ({ hasCatalog, loading, error, mutationError, mutationSuccess, onRetry, onDismissError, onDismissSuccess }: CatalogFeedbackStackProps) => {
  if (!error && !mutationError && !mutationSuccess) return null;
  return (
    <div
      data-elearning-feedback-stack
      className={hasCatalog
        ? "fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-h-[calc(100dvh-2rem)] max-w-[640px] flex-col gap-3 overflow-y-auto"
        : "mx-auto my-10 max-w-[1130px] space-y-3"}
    >
      {mutationSuccess && <Toast data-elearning-catalog-feedback message={mutationSuccess} variant="success"
        aria-label="Confirmation de la formation" closeLabel="Fermer la confirmation" onClose={onDismissSuccess} />}
      {mutationError && <Toast data-elearning-catalog-feedback message={mutationError} variant="error"
        closeLabel="Masquer l’erreur de la formation" onClose={onDismissError} />}
      {error && (
        <div data-elearning-catalog-feedback className="rounded-lg border border-[#efb9bd] bg-white px-4 py-3 text-center shadow-lg" role="alert">
          <p className="text-sm font-semibold text-[#a4232c]">{error}</p>
          {hasCatalog && (
            <p className="mt-2 text-sm text-[#5f6470]">
              Les dernières données confirmées restent affichées. Réessayez pour actualiser les formations.
            </p>
          )}
          {loading && hasCatalog && <p className="mt-2 text-sm text-[#5f6470]" role="status">Actualisation des formations…</p>}
          <button
            className="mt-4 rounded-md bg-[#1256a6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={loading}
            aria-busy={loading}
            onClick={onRetry}
            type="button"
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
};
