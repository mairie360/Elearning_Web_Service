import { CreateButton } from '@mairie360/lib-components/primitives';

export interface CatalogHeaderProps {
  title: string;
  subtitle: string;
  onCreate?: () => void;
}

/** Catalogue title with the administrator's "Nouvelle formation" action. */
export const CatalogHeader = ({ title, subtitle, onCreate }: CatalogHeaderProps) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h2 className="text-2xl font-bold leading-8">{title}</h2>
      <p className="text-base leading-6 text-[var(--mairie-muted)]">{subtitle}</p>
    </div>
    {onCreate ? <CreateButton label="Nouvelle formation" onClick={onCreate} /> : null}
  </div>
);
