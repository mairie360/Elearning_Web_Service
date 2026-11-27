import { CreateButton, PageHeader } from '@mairie360/lib-components/primitives';

export interface CatalogHeaderProps {
  title: string;
  subtitle: string;
  onCreate?: () => void;
}

/**
 * The lib PageHeader, with the administrator's « Nouvelle formation ». Agents are enrolled from a course
 * (« Agents inscrits » of its tile or sheet), never from the page header.
 */
export const CatalogHeader = ({ title, subtitle, onCreate }: CatalogHeaderProps) => (
  <PageHeader title={title} subtitle={subtitle} actions={onCreate ? <CreateButton label="Nouvelle formation" onClick={onCreate} /> : undefined} />
);
