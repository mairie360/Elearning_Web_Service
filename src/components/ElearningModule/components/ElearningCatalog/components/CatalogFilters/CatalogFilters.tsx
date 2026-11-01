import { Filter } from 'lucide-react';

import { ElearningFilterSelect, type ElearningFilterOption } from '../ElearningFilterSelect';
import { ElearningSearchInput } from './components/ElearningSearchInput';

export interface CatalogFiltersProps {
  search: string;
  category: string;
  status: string;
  categories: ElearningFilterOption[];
  statuses: ElearningFilterOption[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export const CatalogFilters = ({ search, category, status, categories, statuses, onSearchChange, onCategoryChange, onStatusChange }: CatalogFiltersProps) => (
  <div className="mt-7 grid gap-4 md:grid-cols-[minmax(300px,1fr)_minmax(240px,0.8fr)_minmax(220px,0.7fr)] xl:grid-cols-[320px_260px_240px]">
    <ElearningSearchInput value={search} onValueChange={onSearchChange} />
    <ElearningFilterSelect value={category} onValueChange={onCategoryChange} options={categories} leadingIcon={Filter} placeholder="Toutes les catégories" />
    <ElearningFilterSelect value={status} onValueChange={onStatusChange} options={statuses} placeholder="Tous les statuts" />
  </div>
);
