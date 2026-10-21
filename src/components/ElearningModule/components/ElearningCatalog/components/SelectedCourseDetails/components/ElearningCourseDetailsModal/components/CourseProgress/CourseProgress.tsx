/** Total progression of the required contents. */
export const CourseProgress = ({ value }: { value: number }) => (
  <div className="mt-4">
    <div className="mb-2 flex items-start justify-between gap-4 text-sm leading-5 text-[var(--mairie-text)]">
      <span>Progression totale</span>
      <span className="shrink-0">{value}%</span>
    </div>
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--mairie-surface-raised)]">
      <div className="h-full rounded-full bg-[var(--mairie-action-background)] transition-[width]" style={{ width: `${value}%` }} />
    </div>
  </div>
);
