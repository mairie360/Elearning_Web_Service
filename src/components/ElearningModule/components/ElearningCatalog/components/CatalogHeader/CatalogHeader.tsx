import { CreateButton, PageHeader } from '@mairie360/lib-components/primitives';

export interface CatalogHeaderProps {
  title: string;
  subtitle: string;
  onCreate?: () => void;
}

/** MAIR-882 / MAIR-1142: the lib PageHeader, with the administrator's « Nouvelle formation » action. */
export const CatalogHeader = ({ title, subtitle, onCreate }: CatalogHeaderProps) => (
  <PageHeader title={title} subtitle={subtitle} actions={onCreate ? <CreateButton label="Nouvelle formation" onClick={onCreate} /> : undefined} />
);
