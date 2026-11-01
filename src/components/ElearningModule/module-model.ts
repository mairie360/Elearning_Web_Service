'use client';

import type { ComponentProps } from "react";

import type { ElearningCatalog } from './components/ElearningCatalog';
import type { ElearningCatalogResponse } from '../../lib/elearning-api';
import { parseFrontUrl } from '../../lib/front-url';
import { frontUrl } from '../../lib/front-urls';
import { settingsProfileUrl } from '../../lib/settings-profile';
import { withCategoryReset, withStatusReset } from '../../features/elearning/catalogFilters';

type CatalogProps = ComponentProps<typeof ElearningCatalog>;
export type CatalogCourse = CatalogProps["courses"][number];
export type ContentCompletePayload = Parameters<NonNullable<CatalogProps["onCourseContentComplete"]>>[1];
type Catalog = ElearningCatalogResponse["catalog"];
interface FilterOption { value: string; label: string; disabled?: boolean }

/** The BFF no longer requires `chapters[].duration`; the reader shows an empty one instead. */
export function withChapterDurations(courses: Catalog["courses"]): CatalogCourse[] {
  return courses.map((course) =>
    course.details
      ? {
          ...course,
          details: {
            ...course.details,
            chapters: course.details.chapters.map((chapter) => ({ ...chapter, duration: chapter.duration ?? "" })),
          },
        }
      : course,
  ) as CatalogCourse[];
}

const distinctOptions = (values: Array<string | undefined>): FilterOption[] =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value)))).map(value => ({ value, label: value }));

/** The BFF categories with "all", else the categories of the loaded courses. */
export const categoryOptionsFor = (catalog: Catalog | undefined, courses: CatalogCourse[]): FilterOption[] =>
  withCategoryReset(catalog?.categories) ?? [{ value: 'all', label: 'Toutes les catégories' }, ...distinctOptions(courses.map(course => course.category))];

/** The BFF statuses with "all", else the statuses of the loaded courses. */
export const statusOptionsFor = (catalog: Catalog | undefined, courses: CatalogCourse[]): FilterOption[] =>
  withStatusReset(catalog?.statuses) ?? [{ value: 'all', label: 'Tous les statuts' }, ...distinctOptions(courses.map(course => course.statusValue))];

/** A filter from the URL counts only when it is an enabled option; otherwise "all". */
export const offeredFilter = (options: FilterOption[], value: string) =>
  options.some(option => option.value === value && !option.disabled) ? value : 'all';

/** Shell links to the other fronts, from the build-time URLs. */
export const elearningShellHrefs = () => {
  const configuredUrl = (key: Parameters<typeof frontUrl>[0]) => parseFrontUrl(frontUrl(key))?.href;
  const settingsUrl = settingsProfileUrl(frontUrl("SETTINGS_FRONT_URL"));
  return {
    dashboard: configuredUrl("DASHBOARD_FRONT_URL"),
    projects: configuredUrl("PROJECT_FRONT_URL"),
    messages: configuredUrl("MESSAGE_FRONT_URL"),
    training: configuredUrl("ELEARNING_FRONT_URL") ?? "/",
    calendar: configuredUrl("CALENDAR_FRONT_URL"),
    admin: configuredUrl("ADMINISTRATION_FRONT_URL"),
    profile: settingsUrl,
    settings: settingsUrl,
  };
};
