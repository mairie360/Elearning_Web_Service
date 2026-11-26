import { Users } from 'lucide-react';
import { Button, CreateButton, PageHeader } from '@mairie360/lib-components/primitives';

export interface CatalogHeaderProps {
  title: string;
  subtitle: string;
  onCreate?: () => void;
  /** « Inscrire des agents »: opens the enrolment drawer, where the course is chosen first. */
  onEnrol?: () => void;
  /** No course to enrol agents in yet: the button stays visible but disabled. */
  enrolDisabled?: boolean;
}

/** MAIR-882 / MAIR-1142: the lib PageHeader, with the administrator's « Inscrire des agents » and « Nouvelle formation ». */
export const CatalogHeader = ({ title, subtitle, onCreate, onEnrol, enrolDisabled = false }: CatalogHeaderProps) => {
  const actions = onCreate || onEnrol ? (
    <div className="flex flex-wrap gap-2">
      {onEnrol ? <Button variant="outline" tone="neutral" icon={Users} label="Inscrire des agents" disabled={enrolDisabled} onClick={onEnrol} /> : null}
      {onCreate ? <CreateButton label="Nouvelle formation" onClick={onCreate} /> : null}
    </div>
  ) : undefined;
  return <PageHeader title={title} subtitle={subtitle} actions={actions} />;
};
