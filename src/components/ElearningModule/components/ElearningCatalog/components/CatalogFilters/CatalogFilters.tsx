import { FilterSelect, Text, TextField } from '@mairie360/lib-components/primitives';

import type { ElearningFilterOption } from '../../catalog-types';

export interface CatalogFiltersProps {
  search: string;
  category: string;
  status: string;
  requirement: string;
  categories: ElearningFilterOption[];
  statuses: ElearningFilterOption[];
  requirements: ElearningFilterOption[];
  /** MAIR-1150: « Origine » (internal / platform), administrators only; absent hides the filter. */
  source?: string;
  sources?: ElearningFilterOption[];
  onSourceChange?: (value: string) => void;
  /** « 2 formations en cours »: announced to screen readers when it changes. */
  resultLabel: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRequirementChange: (value: string) => void;
}

/** The lib filter has '' for « no filter »; the catalogue keeps its historical `all`. */
const toFilter = (value: string) => (value === 'all' ? '' : value);
const fromFilter = (value: string) => (value === '' ? 'all' : value);
const choices = (options: ElearningFilterOption[]) => options.filter(option => option.value !== 'all');
/**
 * MAIR-1257: the « no filter » choice always reads the artifact's French wording (« Toutes les catégories »):
 * the label received with the options may lack its accents.
 */
const allLabel = (_options: ElearningFilterOption[], label: string) => label;
/**
 * The mockup shows « Toutes les catégories » while no value is chosen and « Catégorie : Numérique » once one is:
 * the visible text is also the accessible name of the filter button.
 */
const filterLabel = (name: string, value: string, all: string) => (value === 'all' ? all : name);

/**
 * MAIR-897 / MAIR-1145: search and filters on the lib TextField and FilterSelect (menu mode), applied in place.
 * MAIR-1257 (artifact order): search, Catégorie, Statut, Origine (administrators), Caractère, then the count on
 * the right of the same row; the filters are plain selects (no funnel icon, lib 2.9.0 `icon={false}`).
 * Every change goes up through a callback: nothing reads the DOM of a component.
 */
export const CatalogFilters = ({
  search, category, status, requirement, categories, statuses, requirements, resultLabel,
  onSearchChange, onCategoryChange, onStatusChange, onRequirementChange, source = 'all', sources, onSourceChange,
}: CatalogFiltersProps) => (
  <div className="flex flex-wrap items-end gap-3">
    <TextField
      type="search"
      label={<span className="sr-only">Rechercher une formation</span>}
      placeholder="Rechercher une formation…"
      value={search}
      onChange={event => onSearchChange(event.target.value)}
      onClear={() => onSearchChange('')}
      className="w-full sm:w-[360px]"
    />
    <FilterSelect mode="menu" icon={false} label={filterLabel('Catégorie', category, allLabel(categories, 'Toutes les catégories'))} allLabel={allLabel(categories, 'Toutes les catégories')} options={choices(categories)}
      value={toFilter(category)} onChange={value => onCategoryChange(fromFilter(value))} />
    <FilterSelect mode="menu" icon={false} label={filterLabel('Statut', status, allLabel(statuses, 'Tous les statuts'))} allLabel={allLabel(statuses, 'Tous les statuts')} options={choices(statuses)}
      value={toFilter(status)} onChange={value => onStatusChange(fromFilter(value))} />
    {sources && onSourceChange ? (
      <FilterSelect mode="menu" icon={false} label={filterLabel('Origine', source, 'Toutes les origines')} allLabel="Toutes les origines" options={choices(sources)}
        value={toFilter(source)} onChange={value => onSourceChange(fromFilter(value))} />
    ) : null}
    <FilterSelect mode="menu" icon={false} label={filterLabel('Caractère', requirement, 'Obligatoires et facultatives')} allLabel="Obligatoires et facultatives" options={choices(requirements)}
      value={toFilter(requirement)} onChange={value => onRequirementChange(fromFilter(value))} />
    <Text tone="muted" size="s" aria-live="polite" data-catalog-count="" className="ml-auto self-center">{resultLabel}</Text>
  </div>
);
