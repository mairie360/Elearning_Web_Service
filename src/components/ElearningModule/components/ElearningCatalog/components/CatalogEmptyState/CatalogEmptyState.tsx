import { Button, DataState } from '@mairie360/lib-components/primitives';

export interface CatalogEmptyStateProps {
  label: string;
  /** Shown when a filter is active, to clear them all. */
  onResetFilters?: () => void;
}

export const CatalogEmptyState = ({ label, onResetFilters }: CatalogEmptyStateProps) => (
  <DataState state="empty" className="mt-6" title={label} description={null}
    action={onResetFilters ? <Button label="Réinitialiser les filtres" onClick={onResetFilters} /> : undefined} />
);
