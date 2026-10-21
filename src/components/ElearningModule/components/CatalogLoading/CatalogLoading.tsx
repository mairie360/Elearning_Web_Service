import { Skeleton } from "@mairie360/lib-components/primitives";

export const CatalogLoading = () => (
  <div className="mx-auto my-10 max-w-[1130px] rounded-lg border border-[#d8d2ca] bg-white p-8 text-center text-sm text-[#5f6470]" role="status">
    Chargement des formations…
    <Skeleton shape="block" size="l" className="mt-4 !h-64" />
  </div>
);
