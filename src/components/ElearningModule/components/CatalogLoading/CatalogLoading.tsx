import { PageHeader, Skeleton } from "@mairie360/lib-components/primitives";

/** MAIR-913: the page header, then three skeleton tiles while the catalogue is read. */
export const CatalogLoading = ({ subtitle }: { subtitle?: string }) => (
  <div className="flex flex-col gap-6">
    <PageHeader size="l" title="E-learning" subtitle={subtitle} />
    <div role="status" aria-label="Chargement des formations…" className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <span className="sr-only">Chargement des formations…</span>
      <Skeleton.Card />
      <Skeleton.Card />
      <Skeleton.Card />
    </div>
  </div>
);
