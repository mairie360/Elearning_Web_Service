import { Skeleton } from "@mairie360/lib-components/primitives";

import { COURSE_MANAGEMENT_UNAVAILABLE_MESSAGE } from "../bffCapabilities";

export const LogoutErrorNotice = ({ message, onBackToLogin }: { message: string; onBackToLogin: () => void }) => (
  <section role="alert" className="mx-auto my-4 w-full max-w-[1130px] space-y-2 rounded border border-red-200 bg-white p-4 text-red-700">
    <p>{message}</p>
    <button type="button" className="rounded border px-4 py-2 text-sm font-medium" onClick={onBackToLogin}>Retour à la connexion</button>
  </section>
);

export const CatalogLoading = () => (
  <div className="mx-auto my-10 max-w-[1130px] rounded-lg border border-[#d8d2ca] bg-white p-8 text-center text-sm text-[#5f6470]" role="status">
    Chargement des formations…
    <Skeleton shape="block" size="l" className="mt-4 !h-64" />
  </div>
);

/** Administrators are told why the author actions are missing. */
export const CourseManagementNotice = () => (
  <p data-elearning-capability-notice className="mx-auto mt-6 max-w-[1130px] rounded-md border border-[#d8d2ca] bg-white px-4 py-3 text-sm text-[#5f6470]" role="note">
    {COURSE_MANAGEMENT_UNAVAILABLE_MESSAGE}
  </p>
);

/** A deep link to a course the catalogue no longer holds. */
export const MissingCourseNotice = ({ onShowCatalog }: { onShowCatalog: () => void }) => (
  <div className="mx-auto mt-6 max-w-[1130px] rounded-md border border-[#efb9bd] bg-white px-4 py-3 text-sm text-[#a4232c]" role="alert">
    Cette formation n’est plus disponible. Vous pouvez consulter les autres formations.
    <button className="ml-3 font-semibold underline" onClick={onShowCatalog} type="button">Voir le catalogue</button>
  </div>
);
