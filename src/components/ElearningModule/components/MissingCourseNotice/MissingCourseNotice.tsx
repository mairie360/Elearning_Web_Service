/** A deep link to a course the catalogue no longer holds. */
export const MissingCourseNotice = ({ onShowCatalog }: { onShowCatalog: () => void }) => (
  <div className="mx-auto mt-6 max-w-[1130px] rounded-md border border-[#efb9bd] bg-white px-4 py-3 text-sm text-[#a4232c]" role="alert">
    Cette formation n’est plus disponible. Vous pouvez consulter les autres formations.
    <button className="ml-3 font-semibold underline" onClick={onShowCatalog} type="button">Voir le catalogue</button>
  </div>
);
