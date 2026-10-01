import type { ElearningCatalogResponse } from "@/lib/elearning-api";

type Categories = ElearningCatalogResponse["catalog"]["categories"];

/** `all` is a UI reset, not a business category supplied by the service. */
export function withCategoryReset(categories: Categories): Categories {
  // Keep the shared catalog's course-derived options when none were supplied.
  if (categories === undefined) return undefined;

  let hasReset = false;
  const options = categories.filter((option) => {
    if (option.value !== "all") return true;
    if (hasReset) return false;
    hasReset = true;
    return true;
  }).map((option) => option.value === "all" && option.disabled
    ? { ...option, disabled: false }
    : option);

  return hasReset
    ? options
    : [{ label: "Toutes les catégories", value: "all" }, ...options];
}
