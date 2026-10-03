import type { ElearningCatalogResponse } from "@/lib/elearning-api";

type Categories = ElearningCatalogResponse["catalog"]["categories"];
type Statuses = ElearningCatalogResponse["catalog"]["statuses"];

/** `all` is a UI reset, not a business option supplied by the service. */
function withFilterReset(supplied: Categories, label: string): Categories {
  // Keep the shared catalog's defaults when no options were supplied.
  if (supplied === undefined) return undefined;

  let hasReset = false;
  const options = supplied.filter((option) => {
    if (option.value !== "all") return true;
    if (hasReset) return false;
    hasReset = true;
    return true;
  }).map((option) => option.value === "all" && option.disabled
    ? { ...option, disabled: false }
    : option);

  return hasReset
    ? options
    : [{ label, value: "all" }, ...options];
}

export function withCategoryReset(categories: Categories): Categories {
  return withFilterReset(categories, "Toutes les catégories");
}

export function withStatusReset(statuses: Statuses | undefined): Statuses | undefined {
  return withFilterReset(statuses, "Tous les statuts");
}
